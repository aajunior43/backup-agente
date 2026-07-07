#!/usr/bin/env python3
"""Verifica o status da instância WhatsApp.

Uso:
    python3 check-status.py
    python3 check-status.py --help
"""

import sys
import requests

BASE_URL = "https://api-whatsapp.api-alisson.com.br/api/v1"
TOKEN = "4h8g8JO7vtQbXSvJW61WtdAemw6PaQ5m"
UUID = "7481d0ad-26b1-4c86-ba64-2cedfb8b100b"

STATUS_MAP = {
    "open": "🟢 Conectada e pronta",
    "qr_code": "🟡 Aguardando QR code (usuário precisa escanear)",
    "close": "🔴 Desconectada",
}


def main():
    try:
        resp = requests.get(
            f"{BASE_URL}/instance/list?token={TOKEN}",
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        
        # Formato: {"status": "success", "data": [...]}
        instances = data.get("data", [])
        
        if not instances:
            print("❌ Nenhuma instância encontrada")
            sys.exit(1)

        for inst in instances:
            uid = inst.get("uuid", "?")
            name = inst.get("name", "?")
            status = inst.get("status", "unknown")
            label = STATUS_MAP.get(status, f"⚪ {status}")
            print(f"📱 Instância: {name}")
            print(f"   UUID: {uid}")
            print(f"   Status: {label}")

    except requests.RequestException as e:
        print(f"❌ Erro ao verificar status: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
