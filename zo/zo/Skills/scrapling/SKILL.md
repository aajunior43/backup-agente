---
name: scrapling
description: >-
  Framework adaptivo de Web Scraping em Python. Usa Scrapling com seletores
  CSS/XPath, extração BS4-style, suporte a sessões HTTP com fingerprint TLS,
  e modo adaptativo que reencontra elementos mesmo após mudanças no DOM.
  Ideal para extrair dados de sites, monitorar preços/páginas, crawlers.
compatibility: Created for Zo Computer — requer Python 3.10+ e `pip install scrapling` (ou `scrapling[fetchers]` para HTTP)
metadata:
  author: aleksandro.zo.computer
---

# Scrapling Skill

Skill para Web Scraping com [Scrapling](https://github.com/D4Vinci/Scrapling).

## Instalação

```bash
pip install scrapling          # só parser
pip install scrapling[fetchers] # parser + HTTP (curl_cffi)
```

## Como usar

### 1. Parser (`Selector`)

```python
from scrapling.parser import Selector

page = Selector(html_str)

# CSS Selector (::text / ::attr())
page.css("h1::text").get()                        # → str ("Título")
page.css("span.preco::text").getall()              # → ["R$ 50", "R$ 100"]
page.css("a::attr(href)").getall()                 # → ["/link1", "/link2"]
# Iteração direta → Selector objects (com .tag, .attrib, .next etc.)
for el in page.css(".produto"):
    nome = el.css("h2::text").get()
    preco = el.css(".preco::text").get()
    print(f"{nome} - {preco}")
# Index access: list(page.css(".produto"))[0]

# XPath
page.xpath("//div[@class='produto']")

# BS4-style
page.find_all("div", class_="produto")       # Selectors objects
page.find("body")                             # Selector | None
page.find_by_text("rodapé", tag="p")          # Selector | None
page.find_by_regex(r"R\$\s\d+")

# Extração
page.css("div")[0].tag                        # → "div"
el.attrib                                     # → {"class": "produto", ...}
el.has_class("destaque")                      # → True / False
el.html_content                               # → HTML string
el.prettify()                                 # → HTML indentado
el.get_all_text()                             # → texto completo
el.text                                       # → apenas texto direto
page.text                                     # → texto da página toda
page.re(r"\w+@\w+\.\w+")                     # → ["email@..."]
page.re_first(r"\w+@\w+\.\w+")               # → "email@..." | None

# Navegação DOM (via iteração direta)
el.next                                       # próximo irmão
el.previous                                   # irmão anterior
el.parent                                     # elemento pai
list(el.siblings)                             # todos os irmãos
list(el.children)                             # filhos diretos
find_ancestor(el, lambda e: e.tag == "div")   # sobe na árvore
el.generate_css_selector                      # → "#container > div"
el.generate_xpath_selector                    # → "//*[@id='container']/div"

# Similaridade
similares = list(el.find_similar())           # busca elementos similares
```

### 2. Fetcher HTTP

```python
from scrapling.fetchers import Fetcher

# GET com fingerprint TLS (evita bloqueios)
resp = Fetcher.get("https://exemplo.com")
resp.status                                   # → 200
resp.html_content                             # → HTML string
resp.css("h1::text").get()                    # já parseado!
resp.json()                                   # → dict (se JSON response)

# Impersonate (navegador falso)
Fetcher.get("https://exemplo.com", impersonate="chrome")   # ou firefox, safari, edge

# Sessão persistente (cookies, headers)
from scrapling.fetchers import FetcherSession

with FetcherSession() as s:
    r1 = s.get("https://exemplo.com/page1")
    r2 = s.get("https://exemplo.com/page2")
```

### 3. Modo Adaptativo (autorreparável)

```python
from scrapling.parser import Selector

page = Selector(html, adaptive=True)

# CSS salva automaticamente assinatura dos elementos
quotes = page.css(".quote", auto_save=True)

# Se o HTML mudar, find_similar reencontra
page2 = Selector(novo_html, adaptive=True)
page2.find_similar(saved_signature)  # reencontra mesmo com DOM alterado
```

## Scripts

### `scripts/scrapling-fetch.py`

CLI completa:

```bash
# Extrair textos
python3 scrapling-fetch.py https://exemplo.com --css 'h1::text'

# Extrair todos os links
python3 scrapling-fetch.py https://exemplo.com --css 'a::attr(href)' --all

# Extrair com XPath
python3 scrapling-fetch.py https://exemplo.com --xpath '//div[@class="produto"]'

# Extrair com fingerprint Chrome
python3 scrapling-fetch.py https://exemplo.com --css 'h1::text' --impersonate chrome

# Listar estrutura da página
python3 scrapling-fetch.py https://exemplo.com --list

# Salvar em JSON
python3 scrapling-fetch.py https://exemplo.com --css '.author::text' --all --output autores.json

# Verboso
python3 scrapling-fetch.py https://exemplo.com --css 'h1::text' -v

# Modo adaptativo
python3 scrapling-fetch.py https://exemplo.com --css '.quote' --all -v --adaptive
```

## API de navegação (diferenças do BeautifulSoup)

| Funcionalidade | Scrapling | BS4 |
|---|---|---|
| Tag | `el.tag` | `el.name` |
| Atributos | `el.attrib["class"]` | `el["class"]` |
| Classes | `el.has_class("foo")`, `el.attrib.get("class","")` | `el.has_attr("class")` |
| Próximo irmão | `el.next` | `el.next_sibling` |
| Irmão anterior | `el.previous` | `el.previous_sibling` |
| Iteração CSS | `for el in page.css(".class")` | `for el in soup.select(".class")` |
| Texto do elemento | `el.get_all_text()` | `el.get_text()` |
| Listar estrutura | `page.css("body")[0].prettify()` | `soup.prettify()` |
| find_all class_ | `class_` só aceita string (não lista) | aceita string, lista, regex |

## Limitações conhecidas

- `.get()` e `.getall()` retornam `TextHandler` (só texto, sem .tag/.attrib/.next)
- Para navegação DOM: use **iteração direta** (`for el in page.css(...)`) ou `list(result)[n]`
- `find_all()` com `class_=` aceita apenas string (não lista ou regex)
- `Selector.save()` precisa de um `identifier` (caminho de arquivo)
- `FetcherSession` é context manager: `with FetcherSession() as s: s.get()`
