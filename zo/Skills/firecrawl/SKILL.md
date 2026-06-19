---
name: firecrawl
description: Web scraping e crawling via Firecrawl API. Converte qualquer site em markdown limpo, faz crawl completo e extrai dados estruturados.
homepage: https://firecrawl.dev
metadata: {"clawdbot":{"emoji":"🕷️","requires":{"bins":["node"],"env":["FIRECRAWL_API_KEY"]},"primaryEnv":"FIRECRAWL_API_KEY"}}
---

# Firecrawl

Web scraping e crawling via Firecrawl API. Converte sites em markdown limpo, inclusive sites com JavaScript dinâmico.

## Scrape (uma URL)

```bash
node {baseDir}/scripts/scrape.mjs "https://example.com"
node {baseDir}/scripts/scrape.mjs "https://example.com" --format json
node {baseDir}/scripts/scrape.mjs "https://example.com" --limit 5000
node {baseDir}/scripts/scrape.mjs "https://example.com" --only-main
```

## Scrape Options

- `--format json`: Output como JSON
- `--limit <n>`: Truncar conteudo em n caracteres
- `--only-main`: Extrair apenas conteudo principal (sem header/footer/nav)

## Crawl (site inteiro)

```bash
node {baseDir}/scripts/crawl.mjs "https://example.com" --max 10
node {baseDir}/scripts/crawl.mjs "https://example.com" --max 50 --format json
node {baseDir}/scripts/crawl.mjs "https://example.com" --max 5 --include "/blog/*"
node {baseDir}/scripts/crawl.mjs "https://example.com" --max 10 --exclude "/admin/*"
```

## Crawl Options

- `--max <n>`: Maximo de paginas (default: 10)
- `--format json`: Output como JSON
- `--include <pattern>`: Apenas URLs que casam com o pattern (glob)
- `--exclude <pattern>`: Excluir URLs que casam com o pattern (glob)

## Extract (dados estruturados)

```bash
node {baseDir}/scripts/extract.mjs "https://example.com/products" --schema '{"name":"string","price":"number"}'
node {baseDir}/scripts/extract.mjs "https://example.com/products" --prompt "Extraia todos os produtos com nome e preco"
```

## Extract Options

- `--schema <json>`: Schema JSON dos campos a extrair
- `--prompt <text>`: Descricao em linguagem natural do que extrair

## Browser (navegador na nuvem)

Abre um navegador real na nuvem. Permite clicar, digitar, scroll, executar JS e tirar screenshots.

```bash
node {baseDir}/scripts/browser.mjs "https://example.com" --screenshot
node {baseDir}/scripts/browser.mjs "https://example.com" --wait 2000 --screenshot
node {baseDir}/scripts/browser.mjs "https://site.com" --scroll down --wait 1000 --screenshot
node {baseDir}/scripts/browser.mjs "https://site.com/login" --type "#email" "user@mail.com" --type "#senha" "123" --click "#entrar" --wait 3000 --screenshot
node {baseDir}/scripts/browser.mjs "https://site.com" --js "return document.title"
node {baseDir}/scripts/browser.mjs "https://site.com" --click ".btn-load-more" --wait 2000 --screenshot --format json
```

## Browser Actions

- `--wait <ms>`: Esperar N milissegundos
- `--click <selector>`: Clicar em elemento CSS
- `--type <selector> <text>`: Digitar texto em campo
- `--scroll <direction>`: Scroll (down, up, left, right)
- `--screenshot`: Tirar screenshot (retorna URL da imagem)
- `--js <code>`: Executar JavaScript na pagina
- `--only-main`: Extrair apenas conteudo principal
- `--format json`: Output como JSON
- `--limit <n>`: Truncar conteudo

As acoes sao executadas em sequencia. Sem acoes, faz wait 2s + screenshot automaticamente.

## Notes

- Precisa de `FIRECRAWL_API_KEY` de https://firecrawl.dev
- Funciona com sites dinamicos (JavaScript rendering)
- Anti-bot bypass integrado
- Browser na nuvem real (Chromium) — nao e headless simulado
- Ideal para monitorar portais governamentais, editais, precos, login em sites
