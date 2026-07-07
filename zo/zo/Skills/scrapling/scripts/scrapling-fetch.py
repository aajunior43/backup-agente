#!/usr/bin/env python3
"""
scrapling-fetch.py — Extrai dados estruturados de qualquer URL usando Scrapling.

Uso:
  python3 scrapling-fetch.py <url> [opções]

Opções de seleção:
  --css <seletor>       Seletor CSS para extrair (ex: '.produto h2::text')
  --xpath <expressão>   Expressão XPath (ex: '//span[@class="preco"]/text()')
  --all                 Retorna todos os matches (--getall)
  --attr <atributo>     Atributo específico (href, src, class, data-id)
  --find <tag>          Busca por tag HTML (BS4-style, ex: --find div)
  --find-text <texto>   Busca elemento pelo texto contido

Opções de requisição:
  --impersonate <nav>   Fingerprint: chrome, firefox, safari, edge (padrão: chrome)
  --session             Usa sessão persistente (mais rápido em múltiplas requisições)
  --list                Lista estrutura de tags/classes da página

Opções de saída:
  --output <arquivo>    Salva resultado em JSON
  --pretty              Print bonito/identado
  --json                Saída em JSON
  -v, --verbose         Modo verboso

Exemplos:
  python3 scrapling-fetch.py https://site.com --css 'h1'
  python3 scrapling-fetch.py https://site.com --css '.preco::text' --all
  python3 scrapling-fetch.py https://site.com --css 'a::attr(href)' --all
  python3 scrapling-fetch.py https://site.com --css '.produto' --all --json
  python3 scrapling-fetch.py https://site.com --list
  python3 scrapling-fetch.py https://site.com --find div --all
  python3 scrapling-fetch.py https://site.com --xpath '//h2/text()' --all
"""

from scrapling.parser import Selector
from scrapling.fetchers import Fetcher, FetcherSession
import json, sys, re, argparse


def fetch_page(url, impersonate="chrome", use_session=False, verbose=False):
    """Faz a requisição HTTP e retorna um Selector."""
    if verbose:
        print(f"🕷️  Fetching: {url}", file=sys.stderr)
    
    if use_session:
        with FetcherSession() as s:
            config = {"impersonate": impersonate}
            resp = s.get(url, **config)
    else:
        resp = Fetcher.get(url, impersonate=impersonate)
    
    if verbose:
        print(f"  → Status: {resp.status}", file=sys.stderr)
    
    if resp.status != 200:
        print(f"❌ Erro HTTP {resp.status}", file=sys.stderr)
        sys.exit(1)
    
    return Selector(resp.html_content)


def list_structure(page, verbose=False):
    """Lista a estrutura de tags da página."""
    from collections import Counter
    tags_info = {}
    
    def walk(element, depth=0):
        if depth > 6:
            return
        children = list(element.children) if hasattr(element, 'children') else []
        for child in children:
            tag = getattr(child, 'tag', '')
            if not tag or tag in ('html', 'head', 'body', '#comment'):
                walk(child, depth + 1)
                continue
            
            key = tag
            classes = []
            if hasattr(child, 'attrib') and child.attrib:
                cls = child.attrib.get('class', '')
                classes = cls.split() if cls else []
                if classes:
                    key = f"{tag}.{' '.join(classes)}"
            
            if key not in tags_info:
                tags_info[key] = {'tag': tag, 'classes': classes, 'count': 0, 'sample': ''}
            tags_info[key]['count'] += 1
            
            if not tags_info[key]['sample']:
                try:
                    t = child.css("::text").get()
                    if t and t.strip():
                        tags_info[key]['sample'] = t.strip()[:60]
                except Exception:
                    pass
            
            walk(child, depth + 1)
    
    body = page.find('body') or page
    walk(body)
    
    for key, info in sorted(tags_info.items(), key=lambda x: -x[1]['count']):
        parts = [f"<{info['tag']}"]
        if info['classes']:
            parts.append(f".{' .'.join(sorted(info['classes']))}")
        parts.append(">")
        line = ''.join(parts)
        line += f" ({info['count']}x)"
        if info['sample']:
            line += f" → \"{info['sample']}\""
        print(line)
    
    if verbose:
        body_tag = page.find('body') or page
        total = len(list(body_tag.find_all('*'))) if hasattr(body_tag, 'find_all') else 0
        print(f"\nTotal de elementos: {total}")


def extract_data(page, css=None, xpath=None, get_all=False, attr=None, find_tag=None, find_text=None, verbose=False):
    """Extrai dados da página usando diferentes métodos."""
    results = []
    
    if css:
        if verbose:
            print(f"  🔍 CSS: {css}", file=sys.stderr)
        if attr:
            selector = f"{css}::attr({attr})"
            raw = page.css(selector)
        else:
            raw = page.css(css)
        
        if get_all:
            results = raw.getall()
        else:
            r = raw.get()
            results = [r] if r is not None else []
    
    elif xpath:
        if verbose:
            print(f"  🔍 XPath: {xpath}", file=sys.stderr)
        raw = page.xpath(xpath)
        if get_all:
            results = raw.getall()
        else:
            r = raw.get()
            results = [r] if r is not None else []
    
    elif find_tag:
        if verbose:
            print(f"  🔍 Tag: {find_tag}", file=sys.stderr)
        found = page.find_all(find_tag)
        if get_all:
            results = [el.html_content for el in found]
        else:
            for el in found:
                results.append(el.html_content)
                break
    
    elif find_text:
        if verbose:
            print(f"  🔍 Text: {find_text}", file=sys.stderr)
        el = page.find_by_text(find_text)
        if el is not None:
            results = [el.html_content]
        else:
            results = []
    
    return results


def main():
    parser = argparse.ArgumentParser(
        description="Scrapling Fetch — Extraia dados de qualquer URL",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  python3 scrapling-fetch.py https://site.com --css 'h1::text'
  python3 scrapling-fetch.py https://site.com --css 'a::attr(href)' --all
  python3 scrapling-fetch.py https://site.com --list
  python3 scrapling-fetch.py https://quotes.toscrape.com --css '.text::text' --all
  python3 scrapling-fetch.py https://quotes.toscrape.com --css '.quote' --all --json
        """
    )
    
    parser.add_argument("url", help="URL da página a ser raspada")
    parser.add_argument("--css", help="Seletor CSS")
    parser.add_argument("--xpath", help="Expressão XPath")
    parser.add_argument("--all", "--getall", dest="get_all", action="store_true",
                        help="Retornar todos os matches")
    parser.add_argument("--attr", help="Atributo a extrair (href, src, class, data-id)")
    parser.add_argument("--find", dest="find_tag", help="Buscar por tag HTML (ex: div, h2)")
    parser.add_argument("--find-text", dest="find_text", help="Buscar elemento pelo texto")
    parser.add_argument("--list", dest="list_structure", action="store_true",
                        help="Listar estrutura da página")
    parser.add_argument("--impersonate", default="chrome",
                        choices=["chrome", "firefox", "safari", "edge"],
                        help="Fingerprint do navegador (padrão: chrome)")
    parser.add_argument("--session", action="store_true",
                        help="Usar sessão persistente")
    parser.add_argument("--output", help="Salvar resultado em arquivo JSON")
    parser.add_argument("--pretty", action="store_true", help="Print bonito")
    parser.add_argument("--json", dest="json_output", action="store_true",
                        help="Saída em JSON")
    parser.add_argument("-v", "--verbose", action="store_true", help="Modo verboso")
    
    args = parser.parse_args()
    
    # Validação
    if not any([args.css, args.xpath, args.find_tag, args.find_text, args.list_structure]):
        parser.error("Use ao menos uma opção de seleção (--css, --xpath, --find, --find-text, --list)")
    
    # Fetch
    page = fetch_page(args.url, args.impersonate, args.session, args.verbose)
    
    # List ou extrair
    if args.list_structure:
        list_structure(page, args.verbose)
        return
    
    results = extract_data(
        page, css=args.css, xpath=args.xpath,
        get_all=args.get_all, attr=args.attr,
        find_tag=args.find_tag, find_text=args.find_text,
        verbose=args.verbose
    )
    
    # Saída
    if args.json_output:
        print(json.dumps(results, ensure_ascii=False, indent=2 if args.pretty else None))
    elif args.pretty:
        for i, r in enumerate(results, 1):
            print(f"{i}. {r}")
    else:
        for r in results:
            print(r)
    
    # Salvar
    if args.output:
        with open(args.output, "w") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        if args.verbose:
            print(f"\n💾 Salvo em: {args.output}", file=sys.stderr)


if __name__ == "__main__":
    main()
