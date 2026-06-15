#!/usr/bin/env python3
"""Busca contato pelo nome no arquivo de contatos do WhatsApp.

Uso:
    python3 search-contact.py "mãe"
    python3 search-contact.py "Simone"
    python3 search-contact.py --list
    python3 search-contact.py --help
"""

import argparse
import json
import sys
import os
from pathlib import Path

CONTACTS_FILE = Path("/home/workspace/contatos/contatos.json")


def load_contacts():
    if not CONTACTS_FILE.exists():
        print(f"ERRO: Arquivo não encontrado: {CONTACTS_FILE}", file=sys.stderr)
        sys.exit(1)
    with open(CONTACTS_FILE) as f:
        return json.load(f)


def search(name: str):
    contacts = load_contacts()
    name_lower = name.lower()
    results = [c for c in contacts if name_lower in c["nome"].lower()]
    if not results:
        print(f"Nenhum contato encontrado para '{name}'")
        print("Contatos disponíveis:")
        for c in contacts:
            print(f"  - {c['nome']} ({c['numero']})")
        sys.exit(1)
    for c in results:
        print(f"{c['nome']}: {c['numero']}")
    sys.exit(0)


def list_all():
    contacts = load_contacts()
    print(f"Encontrados {len(contacts)} contatos:")
    for c in contacts:
        print(f"  - {c['nome']}: {c['numero']}")


def main():
    parser = argparse.ArgumentParser(description="Busca contato por nome")
    parser.add_argument("name", nargs="?", help="Nome ou parte do nome para buscar")
    parser.add_argument("--list", action="store_true", help="Lista todos os contatos")
    args = parser.parse_args()

    if args.list:
        list_all()
    elif args.name:
        search(args.name)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
