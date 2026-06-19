---
name: web-research
description: General-purpose web research for facts, current events, pop culture, trivia, exchange rates, and topics not covered by specialized research skills.
---

# Web Research

## Trigger
User asks about general knowledge, current events, pop culture, sports, entertainment, exchange rates, scientific trivia, or any topic requiring live web lookup that is not covered by a specialized skill (arxiv, youtube-content, polymarket, blogwatcher, llm-wiki, etc.).

## Procedure

### 1. Check specialized skills first
Before doing raw web scraping, check if a domain-specific skill exists and fits:
- Academic papers → `arxiv`
- YouTube content → `youtube-content`
- Prediction markets → `polymarket`
- Blog/RSS monitoring → `blogwatcher`
- LLM knowledge base → `llm-wiki`

### 2. Try browser automation
If no specialized skill fits, attempt `browser_navigate` to an authoritative source (Wikipedia, official sites, news outlets).

### 3. Fallback to curl + Python scraping
If browser automation fails (e.g., "Chrome not found" in Docker/root environments), use a Python one-liner to fetch and clean HTML:

```python3 -c "
import urllib.request, re
url = 'https://example.com/page'
req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
clean = re.sub(r'<[^>]+>', ' ', html)
clean = re.sub(r'\s+', ' ', clean)
print(clean[:4000])
"
```

Or query APIs directly when available (e.g., exchangerate-api for currency).

### 4. Extract and synthesize
Pull key facts, dates, names, and figures. Cite the source when possible. Present clearly and concisely.

## Pitfalls
- **Browser unavailable**: In Docker or minimal environments, Chrome may not be installed. Always be ready to fallback to curl + Python regex extraction.
- **Fragile scraping**: DuckDuckGo HTML results and similar pages change structure frequently. Prefer direct URLs to authoritative sites (Wikipedia, official broadcaster pages, government APIs).
- **Rate limits**: Be respectful with rapid successive requests.
- **Portuguese sources**: When the user communicates in Portuguese, prefer Brazilian/Portuguese sources (G1, Globo, Wikipédia pt) for better relevance.

## Examples
- "What is the exchange rate of USD to BRL?" → Query `https://api.exchangerate-api.com/v4/latest/USD` or BCB API.
- "Tell me about soap opera X" → Scrape Wikipédia pt or official broadcaster page.
- "How many hearts does an octopus have?" → Wikipédia + scientific sources.
- "What is the blood pressure of an octopus?" → Search academic excerpts via web scraping.

## References
- `references/scraping-patterns.md` — Common Python one-liners for HTML extraction and API calls.
