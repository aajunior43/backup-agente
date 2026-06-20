#!/usr/bin/env python3
"""CLI do skill site (wrapper do MCP meus-links via Streamable HTTP).

Uso:
    python3 site.py <acao> [args]

Acoes:
    list-links [--search S] [--folder F] [--favorites] [--archived] [--trash] [--limit N] [--pretty]
    create-link --title T --url U [--description D] [--folder F] [--favorite]
    update-link <id> [--title T] [--url U] [--description D] [--folder F] [--favorite|--no-favorite] [--pinned|--no-pinned]
    delete-link <id> [--permanent]
    restore-link <id>
    list-folders [--pretty]
    create-folder --name N [--color C] [--icon I] [--parent P]
    update-folder <id> [--name N] [--color C] [--icon I]
    delete-folder <id>

Credenciais: MEUS_LINKS_TOKEN e MEUS_LINKS_ENDPOINT em /home/workspace/.env
"""
import argparse, json, os, sys, urllib.request, urllib.error
from pathlib import Path

ENV_PATH = Path("/home/workspace/.env")


def load_env() -> dict:
    env = {}
    if not ENV_PATH.exists():
        print("ERRO: /home/workspace/.env nao encontrado", file=sys.stderr)
        sys.exit(1)
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def call_mcp(method: str, arguments: dict) -> dict:
    env = load_env()
    token = env.get("MEUS_LINKS_TOKEN")
    endpoint = env.get("MEUS_LINKS_ENDPOINT")
    if not token or not endpoint:
        print("ERRO: MEUS_LINKS_TOKEN e MEUS_LINKS_ENDPOINT precisam estar no .env", file=sys.stderr)
        sys.exit(1)
    payload = {"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": method, "arguments": arguments}}
    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code}: {body}", file=sys.stderr)
        sys.exit(1)
    parsed = json.loads(body)
    result = parsed.get("result", {})
    content = result.get("content", [])
    if not content:
        return parsed
    text = content[0].get("text", "null")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return text


def pretty_table(links):
    if not links:
        print("(vazio)")
        return
    print(f"{'ID':<38} {'FAV':<4} {'TITLE':<40} URL")
    print("-" * 110)
    for l in links:
        fav = "Y" if l.get("is_favorite") else ""
        print(f"{l.get('id',''):<38} {fav:<4} {(l.get('title') or '')[:40]:<40} {l.get('url','')}")


def main():
    p = argparse.ArgumentParser(prog="site.py")
    sub = p.add_subparsers(dest="cmd", required=True)

    # list-links
    ll = sub.add_parser("list-links")
    ll.add_argument("--search")
    ll.add_argument("--folder")
    ll.add_argument("--favorites", action="store_true")
    ll.add_argument("--archived", action="store_true")
    ll.add_argument("--trash", action="store_true")
    ll.add_argument("--limit", type=int, default=50)
    ll.add_argument("--pretty", action="store_true")

    # create-link
    cl = sub.add_parser("create-link")
    cl.add_argument("--title", required=True)
    cl.add_argument("--url", required=True)
    cl.add_argument("--description")
    cl.add_argument("--folder")
    cl.add_argument("--favorite", action="store_true")

    # update-link
    ul = sub.add_parser("update-link")
    ul.add_argument("id")
    ul.add_argument("--title")
    ul.add_argument("--url")
    ul.add_argument("--description")
    ul.add_argument("--folder")
    favg = ul.add_mutually_exclusive_group()
    favg.add_argument("--favorite", action="store_true")
    favg.add_argument("--no-favorite", action="store_true")
    pin = ul.add_mutually_exclusive_group()
    pin.add_argument("--pinned", action="store_true")
    pin.add_argument("--no-pinned", action="store_true")

    # delete-link
    dl = sub.add_parser("delete-link")
    dl.add_argument("id")
    dl.add_argument("--permanent", action="store_true")

    # restore-link
    rl = sub.add_parser("restore-link")
    rl.add_argument("id")

    # list-folders
    lf = sub.add_parser("list-folders")
    lf.add_argument("--pretty", action="store_true")

    # create-folder
    cf = sub.add_parser("create-folder")
    cf.add_argument("--name", required=True)
    cf.add_argument("--color")
    cf.add_argument("--icon")
    cf.add_argument("--parent")

    # update-folder
    uf = sub.add_parser("update-folder")
    uf.add_argument("id")
    uf.add_argument("--name")
    uf.add_argument("--color")
    uf.add_argument("--icon")

    # delete-folder
    df = sub.add_parser("delete-folder")
    df.add_argument("id")

    args = p.parse_args()
    args = vars(args)
    cmd = args.pop("cmd")

    method = cmd.replace("-", "_")

    # Build arguments
    arguments = {}
    if cmd == "list-links":
        for k in ("search", "folder", "limit"):
            if args.get(k) is not None:
                arguments[k] = args[k]
        if args.get("favorites"):
            arguments["is_favorite"] = True
        if args.get("archived"):
            arguments["is_archived"] = True
        if args.get("trash"):
            arguments["in_trash"] = True
    elif cmd == "create-link":
        arguments["title"] = args["title"]
        arguments["url"] = args["url"]
        if args.get("description"):
            arguments["description"] = args["description"]
        if args.get("folder"):
            arguments["folder_id"] = args["folder"]
        if args.get("favorite"):
            arguments["is_favorite"] = True
    elif cmd == "update-link":
        arguments["id"] = args["id"]
        for k in ("title", "url", "description", "folder"):
            if args.get(k) is not None:
                arguments["id" if k == "folder" else k] = args[k] if k != "folder" else None
                if k == "folder":
                    arguments["folder_id"] = args[k]
        if args.get("favorite"):
            arguments["is_favorite"] = True
        if args.get("no_favorite"):
            arguments["is_favorite"] = False
        if args.get("pinned"):
            arguments["is_pinned"] = True
        if args.get("no_pinned"):
            arguments["is_pinned"] = False
        # remove accidental "id" duplication
        arguments = {k: v for k, v in arguments.items() if v is not None or k == "id"}
    elif cmd == "delete-link":
        arguments["id"] = args["id"]
        arguments["permanent"] = bool(args.get("permanent"))
    elif cmd == "restore-link":
        arguments["id"] = args["id"]
    elif cmd == "list-folders":
        pass
    elif cmd == "create-folder":
        arguments["name"] = args["name"]
        for k in ("color", "icon", "parent"):
            if args.get(k):
                arguments[k if k != "parent" else "parent_id"] = args[k]
    elif cmd == "update-folder":
        arguments["id"] = args["id"]
        for k in ("name", "color", "icon"):
            if args.get(k):
                arguments[k] = args[k]
        arguments = {k: v for k, v in arguments.items() if v is not None or k == "id"}
    elif cmd == "delete-folder":
        arguments["id"] = args["id"]

    result = call_mcp(method, arguments)

    if args.get("pretty") and cmd == "list-links" and isinstance(result, list):
        pretty_table(result)
    elif args.get("pretty") and cmd == "list-folders" and isinstance(result, list):
        for f in result:
            color = f.get("color", "")
            icon = f.get("icon", "")
            parent = f.get("parent_id") or "-"
            print(f"  {f.get('name'):<24}  (cor: {color}, icone: {icon})  parent: {parent}  id: {f.get('id')}")
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
