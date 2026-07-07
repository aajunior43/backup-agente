---
name: tavily
description: AI-optimized web search via Tavily API. Returns concise, relevant results for AI agents.
homepage: https://tavily.com
metadata: {"clawdbot":{"emoji":"🔍","requires":{"bins":["node"],"env":["TAVILY_API_KEY"]},"primaryEnv":"TAVILY_API_KEY"}}
---

# Tavily Search

AI-optimized web search using Tavily API. Designed for AI agents - returns clean, relevant content.

## Search

```bash
node {baseDir}/scripts/search.mjs "query"
node {baseDir}/scripts/search.mjs "query" -n 10
node {baseDir}/scripts/search.mjs "query" --deep
node {baseDir}/scripts/search.mjs "query" --topic news --days 3
node {baseDir}/scripts/search.mjs "query" --include-domains "bbc.com,reuters.com"
node {baseDir}/scripts/search.mjs "query" --exclude-domains "reddit.com"
node {baseDir}/scripts/search.mjs "query" --snippet 600
node {baseDir}/scripts/search.mjs "query" --no-answer
node {baseDir}/scripts/search.mjs "query" --format json
```

## Search Options

- `-n <count>`: Number of results (default: 5, max: 20)
- `--deep`: Advanced search - slower, more comprehensive
- `--topic <topic>`: `general` (default) or `news`
- `--days <n>`: For news: limit to last n days
- `--snippet <n>`: Snippet length in chars (default: 300)
- `--include-domains <d>`: Comma-separated domains to include
- `--exclude-domains <d>`: Comma-separated domains to exclude
- `--no-answer`: Skip the AI-generated answer
- `--format json`: Output as JSON for programmatic use

## Extract content from URL

```bash
node {baseDir}/scripts/extract.mjs "https://example.com/article"
node {baseDir}/scripts/extract.mjs "https://url1.com" "https://url2.com"
node {baseDir}/scripts/extract.mjs "https://example.com" --limit 5000
node {baseDir}/scripts/extract.mjs "https://example.com" --format json
```

## Extract Options

- `--limit <n>`: Truncate content to n chars per URL
- `--format json`: Output as JSON for programmatic use

## Notes

- Needs `TAVILY_API_KEY` from https://tavily.com
- Tavily is optimized for AI - returns clean, relevant snippets
- Use `--deep` for complex research questions
- Use `--topic news` for current events
- Use `--format json` when feeding results into another skill or script
