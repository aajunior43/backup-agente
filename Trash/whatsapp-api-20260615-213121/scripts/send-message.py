#!/usr/bin/env python3
"""Envia mensagem via WhatsApp usando a API do Alisson.

Uso:
    python3 send-message.py "5544991842415" "Olá, tudo bem?"
    python3 send-message.py --search "mãe" "Oi mãe, tudo bem?"
    python3 send-message.py --help
"""

import argparse
import json
import re
import sys
import os
from datetime import datetime
from pathlib import Path

import requests

BASE_URL = "https://api-whatsapp.api-alisson.com.br/api/v1"
TOKEN = "4h8g8JO7vtQbXSvJW61WtdAemw6PaQ5m"
UUID = "7481d0ad-26b1-4c86-ba64-2cedfb8b100b"
CONTACTS_FILE = Path("/home/workspace/contatos/contatos.json")
LOG_DIR = Path("/home/workspace/Skills/whatsapp-api/logs")


def load_contacts():
    if not CONTACTS_FILE.exists():
        return None
    with open(CONTACTS_FILE) as f:
        return json.load(f)


def search_contact(name: str):
    contacts = load_contacts()
    if not contacts:
        return None
    name_lower = name.lower()
    results = [c for c in contacts if name_lower in c["nome"].lower()]
    if len(results) == 1:
        return results[0]["numero"]
    elif len(results) > 1:
        print(f"Múltiplos contatos encontrados para '{name}':")
        for c in results:
            print(f"  - {c['nome']}: {c['numero']}")
        return None
    return None


def validate_number(number: str) -> str:
    """Remove tudo que não é dígito e valida formato."""
    number = re.sub(r"\D", "", number)
    if not re.match(r"^\d{11,13}$", number):
        print(f"❌ Número inválido: '{number}' (esperado DDI+DDD+NUMERO, 11-13 dígitos)", file=sys.stderr)
        sys.exit(1)
    return number


def log_message(number: str, msg_type: str, content: str, result: dict):
    """Registra envio em arquivo de log."""
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_file = LOG_DIR / "messages.log"
    entry = {
        "timestamp": datetime.now().isoformat(),
        "number": number,
        "type": msg_type,
        "content": content[:200] + ("..." if len(content) > 200 else ""),
        "status": result.get("status", "unknown"),
        "message_id": result.get("data", {}).get("message_id", ""),
    }
    with open(log_file, "a") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def send_text(number: str, content: str) -> dict:
    resp = requests.post(
        f"{BASE_URL}/message/send-text?token={TOKEN}",
        json={"uuid": UUID, "number": number, "content": content},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def send_media(number: str, media_type: str, media_url: str, caption: str = "") -> dict:
    mime_map = {
        "image": "image/png",
        "video": "video/mp4",
        "document": "application/pdf",
        "audio": "audio/mpeg",
    }
    resp = requests.post(
        f"{BASE_URL}/message/send-media?token={TOKEN}",
        json={
            "uuid": UUID,
            "number": number,
            "mediatype": media_type,
            "mimetype": mime_map.get(media_type, "application/octet-stream"),
            "media": media_url,
            "caption": caption,
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def send_audio(number: str, audio_url: str) -> dict:
    resp = requests.post(
        f"{BASE_URL}/message/send-audio?token={TOKEN}",
        json={"uuid": UUID, "number": number, "audio": audio_url},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def main():
    parser = argparse.ArgumentParser(description="Envia mensagem via WhatsApp (API Alisson)")
    parser.add_argument("number", help="Número com DDI+DDD ou nome do contato")
    parser.add_argument("message", help="Texto da mensagem")
    parser.add_argument("--type", choices=["text", "media", "audio"], default="text")
    parser.add_argument("--media-url", help="URL da mídia (para --type=media ou audio)")
    parser.add_argument("--media-type", choices=["image", "video", "document"], default="image")
    parser.add_argument("--caption", default="", help="Legenda para mídia")
    parser.add_argument("--no-log", action="store_true", help="Não registrar no log")
    args = parser.parse_args()

    # Tenta buscar como contato primeiro
    number = search_contact(args.number)
    if number is None:
        # Não é contato, valida como número
        number = validate_number(args.number)

    if args.type == "text" and not args.message:
        print("ERRO: mensagem é obrigatória para envio de texto", file=sys.stderr)
        sys.exit(1)

    try:
        if args.type == "text":
            result = send_text(number, args.message)
        elif args.type == "media":
            if not args.media_url:
                print("ERRO: --media-url é obrigatório para mídia", file=sys.stderr)
                sys.exit(1)
            result = send_media(number, args.media_type, args.media_url, args.caption)
        elif args.type == "audio":
            if not args.media_url:
                print("ERRO: --media-url é obrigatório para áudio", file=sys.stderr)
                sys.exit(1)
            result = send_audio(number, args.media_url)

        if not args.no_log:
            content = args.message or args.media_url or ""
            log_message(number, args.type, content, result)

        if result.get("status") == "success":
            msg_id = result["data"]["message_id"]
            print(f"✅ Mensagem enviada para {number}")
            print(f"   ID: {msg_id}")
        else:
            print(f"❌ Falha: {result}", file=sys.stderr)
            sys.exit(1)

    except requests.RequestException as e:
        print(f"❌ Erro de rede: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
