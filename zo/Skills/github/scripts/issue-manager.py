#!/usr/bin/env python3
"""Gerencia issues GitHub via gh CLI.

Uso:
    python3 issue-manager.py list owner/repo [--limit 10] [--state open|closed|all]
    python3 issue-manager.py create owner/repo --title "título" [--body "descrição"] [--label bug]
    python3 issue-manager.py close owner/repo NUMERO
    python3 issue-manager.py view owner/repo NUMERO
    python3 issue-manager.py --help
"""

import argparse
import json
import subprocess
import sys


def run(cmd, capture=True):
    # cmd é uma lista de args (sem shell=True) para evitar injeção de shell
    # e quebrar com aspas no título/corpo.
    result = subprocess.run(cmd, capture_output=capture, text=True)
    if result.returncode != 0:
        print(f"❌ Erro: {result.stderr.strip()}", file=sys.stderr)
        sys.exit(1)
    return result.stdout


def list_issues(repo, limit=10, state="open"):
    data = run(["gh", "issue", "list", "--repo", repo, "--limit", str(limit),
                "--state", state,
                "--json", "number,title,state,labels,createdAt,url"])
    issues = json.loads(data)
    state_emoji = {"OPEN": "🟢", "CLOSED": "⚫"}

    if not issues:
        print(f"Nenhuma issue {state} em {repo}")
        return

    print(f"📋 Issues ({state}) de {repo}")
    for i in issues:
        labels = " ".join(f"[{l['name']}]" for l in i.get("labels", []))
        emoji = state_emoji.get(i["state"], "")
        print(f"  {emoji} #{i['number']:>4} {i['title']} {labels}")
    return issues


def create_issue(repo, title, body="", labels=None):
    cmd = ["gh", "issue", "create", "--repo", repo, "--title", title]
    if body:
        cmd += ["--body", body]
    if labels:
        for label in labels:
            cmd += ["--label", label]

    output = run(cmd)
    print(f"✅ Issue criada em {repo}")
    print(output)


def close_issue(repo, number, reason=""):
    cmd = ["gh", "issue", "close", str(number), "--repo", repo]
    if reason:
        cmd += ["--reason", reason]
    run(cmd)
    print(f"✅ Issue #{number} fechada em {repo}")


def view_issue(repo, number):
    data = run(["gh", "issue", "view", str(number), "--repo", repo,
                "--json", "number,title,body,state,labels,assignees,createdAt,closedAt,url,comments"])
    issue = json.loads(data)

    state_map = {"OPEN": "🟢 Aberta", "CLOSED": "⚫ Fechada"}
    state = state_map.get(issue["state"], issue["state"])

    print(f"🐛 #{issue['number']} {issue['title']}")
    print(f"   Estado: {state}")
    print(f"   URL: {issue['url']}")
    print(f"   Criada: {issue['createdAt']}")
    if issue.get("closedAt"):
        print(f"   Fechada: {issue['closedAt']}")

    labels = issue.get("labels", [])
    if labels:
        print(f"   Labels: {', '.join(l['name'] for l in labels)}")

    assignees = issue.get("assignees", [])
    if assignees:
        print(f"   Atribuída: {', '.join(a['login'] for a in assignees)}")

    if issue.get("body"):
        print(f"\n---\n{issue['body']}\n---")

    comments = issue.get("comments", [])
    if comments:
        print(f"\n💬 {len(comments)} comentários")


def main():
    parser = argparse.ArgumentParser(description="Gerencia issues GitHub")
    sub = parser.add_subparsers(dest="command")

    list_p = sub.add_parser("list", help="Lista issues")
    list_p.add_argument("repo")
    list_p.add_argument("--limit", type=int, default=10)
    list_p.add_argument("--state", default="open", choices=["open", "closed", "all"])

    create_p = sub.add_parser("create", help="Cria issue")
    create_p.add_argument("repo")
    create_p.add_argument("--title", required=True)
    create_p.add_argument("--body", default="")
    create_p.add_argument("--label", nargs="*", default=[])

    close_p = sub.add_parser("close", help="Fecha issue")
    close_p.add_argument("repo")
    close_p.add_argument("number", type=int)
    close_p.add_argument("--reason", default="completed",
                         choices=["completed", "not_planned"])

    view_p = sub.add_parser("view", help="Visualiza issue")
    view_p.add_argument("repo")
    view_p.add_argument("number", type=int)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    if args.command == "list":
        list_issues(args.repo, args.limit, args.state)
    elif args.command == "create":
        create_issue(args.repo, args.title, args.body, args.label)
    elif args.command == "close":
        close_issue(args.repo, args.number, args.reason if args.reason else "")
    elif args.command == "view":
        view_issue(args.repo, args.number)


if __name__ == "__main__":
    main()