# Web Scraping Patterns

## Python one-liner: fetch and clean HTML

Use when `browser_navigate` fails or Chrome is unavailable.

```bash
python3 -c "
import urllib.request, re
url = 'https://pt.wikipedia.org/wiki/Tr%C3%AAs_Gra%C3%A7as_(telenovela)'
req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
clean = re.sub(r'<[^>]+>', ' ', html)
clean = re.sub(r'\s+', ' ', clean)
idx = clean.find('Sinopse')
if idx == -1:
    idx = clean.find('Enredo')
print(clean[idx:idx+4000])
"
```

## Currency API call (USD/BRL)

```bash
curl -s "https://api.exchangerate-api.com/v4/latest/USD" | \
python3 -c "import sys,json; d=json.load(sys.stdin); print(f'USD/BRL: R$ {d[\"rates\"][\"BRL\"]:,.2f}')"
```

Fallback to Banco Central do Brasil:
```bash
curl -s "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/1?formato=json" | \
python3 -c "import sys,json; d=json.load(sys.stdin); print(f'USD/BRL: R$ {d[0][\"valor\"].replace(\",\", \".\")}')"
```

## DuckDuckGo search results (HTML)

```bash
curl -s "https://html.duckduckgo.com/html/?q=QUERY" -A "Mozilla/5.0" | \
grep -oP '(?<=<a rel=\"nofollow\" class=\"result__a\" href=\").*?(?=\")' | head -5
```

## Tips
- Always set `User-Agent: Mozilla/5.0` to avoid blocks.
- Use `urllib.request` over `requests` if the latter is not installed.
- For Wikipedia, search for section anchors like `Enredo`, `Sinopse`, `Plot`.
- `re.sub(r'<[^>]+>', ' ', html)` is a quick-and-dirty HTML stripper; for complex pages prefer `html.parser`.
