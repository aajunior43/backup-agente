#!/usr/bin/env python3
"""
Monitor de Edição do Jornal Regional
Busca a edição mais recente de terça e quinta no site O Regional Jornal
"""

import sys
import os
import re
import json
from datetime import datetime, date
import requests

# Configurações
URL_EDICOES = "https://www.oregionaljornal.com.br/edicoes/"
DOWNLOAD_DIR = "/home/administrator/.openclaw/workspace/data/jornal_edicoes"
STATE_FILE = "/home/administrator/.openclaw/workspace/data/jornal_state.json"
USER_AGENT = "Mozilla/5.0 (compatible; OpenClaw-Bot/1.0)"

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    return {"last_downloaded": None, "last_check": None}

def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)

def fetch_page(url):
    headers = {"User-Agent": USER_AGENT}
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.text

def extract_pdf_links(html):
    # Encontrar todos os links de PDF (href terminando com .pdf)
    pattern = r'href="([^"]+\.pdf)"'
    matches = re.findall(pattern, html, re.IGNORECASE)
    links = []
    for href in matches:
        # Extrair data do nome do arquivo
        # Ex: Jornal-O-Regional-26-02-2026.pdf
        filename = href.split("/")[-1]
        date_match = re.search(r'(\d{2})-(\d{2})-(\d{4})\.pdf', filename)
        if date_match:
            day, month, year = date_match.groups()
            try:
                pdf_date = datetime.strptime(f"{year}-{month}-{day}", "%Y-%m-%d").date()
                links.append({
                    "url": href,
                    "date": pdf_date,
                    "filename": f"O-Regional-{year}-{month}-{day}.pdf"
                })
            except ValueError:
                continue
    return links

def download_pdf(url, dest_path):
    headers = {"User-Agent": USER_AGENT}
    with requests.get(url, headers=headers, stream=True, timeout=60) as r:
        r.raise_for_status()
        with open(dest_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    return os.path.getsize(dest_path)

def send_telegram(message):
    """Envia notificação via Telegram (usa o canal configurado)."""
    # Usar o sistema de mensagens do OpenClaw
    try:
        # Isso será substituído pela调用 do sistema
        print(f"[TELEGRAM] {message}")
        return True
    except Exception as e:
        print(f"Erro ao enviar Telegram: {e}")
        return False

def main():
    ensure_dir(DOWNLOAD_DIR)
    state = load_state()
    today = date.today()

    # Verificar se hoje é domingo (6), terça (1) ou quinta (3)
    if today.weekday() not in [6, 1, 3]:
        msg = f"⚠️ Hoje não é domingo, terça ou quinta ({today.strftime('%A')}). Nenhuma ação tomada."
        msg = f"⚠️ Hoje não é terça ou quinta ({today.strftime('%A')}). Nenhuma ação tomada."
        print(msg)
        # Não enviar notificação, apenas log
        sys.exit(0)

    print(f"🔍 Buscando edição do jornal para {today.strftime('%A')}, {today}...")
    try:
        html = fetch_page(URL_EDICOES)
        pdf_links = extract_pdf_links(html)
        if not pdf_links:
            msg = "❌ Nenhum PDF encontrado na página."
            print(msg)
            send_telegram(f"📰 Jornal Regional: {msg}")
            sys.exit(1)

        # Pegar a edição mais recente
        latest = max(pdf_links, key=lambda x: x["date"])
        print(f"📄 Última edição encontrada: {latest['date']} ({latest['filename']})")

        # Verificar se já Baixamos essa edição
        dest = os.path.join(DOWNLOAD_DIR, latest["filename"])
        if os.path.exists(dest):
            msg = f"✅ Edição já baixada anteriormente: {latest['filename']}"
            print(msg)
            # Enviar confirmação se ainda não enviou hoje
            if state.get("last_downloaded") != latest["filename"]:
                send_telegram(f"📰 Jornal Regional: {msg}")
                state["last_downloaded"] = latest["filename"]
                state["last_check"] = today.isoformat()
                save_state(state)
        else:
            # Baixar nova edição
            print(f"⬇️  Baixando de: {latest['url']}")
            size = download_pdf(latest["url"], dest)
            msg = f"✅ Edição baixada: {latest['filename']} ({size:,} bytes)"
            print(msg)
            send_telegram(f"📰 Jornal Regional: Nova edição disponível!\n{latest['filename']}\nTamanho: {size:,} bytes")
            state["last_downloaded"] = latest["filename"]
            state["last_check"] = today.isoformat()
            save_state(state)

    except Exception as e:
        msg = f"❌ Erro ao processar: {e}"
        print(msg)
        send_telegram(f"📰 Jornal Regional: {msg}")
        sys.exit(1)

if __name__ == "__main__":
    main()