#!/usr/bin/env python3
"""Gerencia repositórios GitHub via gh CLI.

Uso:
    python3 repo-manager.py list [--limit 20]
    python3 repo-manager.py create nome [--private] [--desc "descrição"]
    python3 repo-manager.py delete nome [--force]
    python3 repo-manager.py info nome
    python3 repo-manager.py --help
"""

import argparse
import json
import subprocess
import sys


def run(cmd, capture=True):
    result = subprocess.run(cmd, shell=True, capture_output=capture, text=True)
    if result.returncode != 0:
        print(f"❌ Erro: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    return result.stdout


def get_user():
    return run("gh api user --jq '.login'").strip()


def list_repos(limit=20):
    user = get_user()
    data = run(f"gh repo list --limit {limit} --json name,visibility,updatedAt,description")
    repos = json.loads(data)
    print(f"📦 Repositórios de {user} ({len(repos)}):")
    for r in repos:
        vis = "🔒" if r["visibility"] == "PRIVATE" else "🌐"
        desc = f" • {r['description']}" if r.get("description") else ""
        print(f"  {vis} {r['name']}{desc}")
    return repos


def create_repo(name, private=False, desc=""):
    user = get_user()
    flags = ""
    if private:
        flags += " --private"
    else:
        flags += " --public"
    if desc:
        flags += f' --description "{desc}"'
    try:
        output = run(f"gh repo create {user}/{name}{flags}")
        print(f"✅ Repositório criado: https://github.com/{user}/{name}")
    except:
        # Pode já existir
        pass


def delete_repo(name, force=False):
    user = get_user()
    if not force:
        confirm = input(f"⚠️  Deletar {user}/{name} permanentemente? [s/N] ")
        if confirm.lower() != "s":
            print("Cancelado.")
            return
    run(f"gh repo delete {user}/{name} --yes")
    print(f"🗑️  Repositório {user}/{name} deletado.")


def repo_info(name):
    user = get_user()
    try:
        data = run(f"gh repo view {user}/{name} --json name,description,visibility,url,createdAt,updatedAt,defaultBranchRef,stargazerCount,forkCount,issues")
        r = json.loads(data)
        print(f"📦 {r['name']}")
        print(f"   URL: {r['url']}")
        print(f"   Descrição: {r.get('description', '—')}")
        print(f"   Visibilidade: {r['visibility']}")
        print(f"   Branch: {r.get('defaultBranchRef', {}).get('name', '—')}")
        print(f"   ⭐ {r.get('stargazerCount', 0)} | 🍴 {r.get('forkCount', 0)} | 🐛 {len(r.get('issues', []))} issues open")
        print(f"   Criado: {r.get('createdAt', '—')} | Atualizado: {r.get('updatedAt', '—')}")
    except:
        print(f"❌ Repositório {user}/{name} não encontrado.", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Gerencia repositórios GitHub")
    sub = parser.add_subparsers(dest="command")

    list_p = sub.add_parser("list", help="Lista repositórios")
    list_p.add_argument("--limit", type=int, default=20)

    create_p = sub.add_parser("create", help="Cria repositório")
    create_p.add_argument("name")
    create_p.add_argument("--private", action="store_true")
    create_p.add_argument("--desc", default="")

    del_p = sub.add_parser("delete", help="Deleta repositório")
    del_p.add_argument("name")
    del_p.add_argument("--force", action="store_true")

    info_p = sub.add_parser("info", help="Detalhes do repositório")
    info_p.add_argument("name")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    if args.command == "list":
        list_repos(args.limit)
    elif args.command == "create":
        create_repo(args.name, args.private, args.desc)
    elif args.command == "delete":
        delete_repo(args.name, args.force)
    elif args.command == "info":
        repo_info(args.name)


if __name__ == "__main__":
    main()
