#!/usr/bin/env node

function usage() {
  console.error(`Usage: search.mjs "query" [options]

Options:
  -n <count>              Number of results (default: 5, max: 20)
  --deep                  Advanced search (slower, more comprehensive)
  --topic <topic>         general (default) or news
  --days <n>              For news: limit to last n days
  --snippet <n>           Snippet length in chars (default: 300)
  --include-domains <d>   Comma-separated domains to include (e.g. "bbc.com,reuters.com")
  --exclude-domains <d>   Comma-separated domains to exclude
  --no-answer             Skip the AI-generated answer
  --format json           Output as JSON instead of markdown
`);
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0 || args[0] === "-h" || args[0] === "--help") usage();

const query = args[0];
let n = 5;
let searchDepth = "basic";
let topic = "general";
let days = null;
let snippetLen = 300;
let includeDomains = [];
let excludeDomains = [];
let noAnswer = false;
let format = "markdown";

for (let i = 1; i < args.length; i++) {
  const a = args[i];
  if (a === "-n") {
    n = Number.parseInt(args[++i] ?? "5", 10);
  } else if (a === "--deep") {
    searchDepth = "advanced";
  } else if (a === "--topic") {
    topic = args[++i] ?? "general";
  } else if (a === "--days") {
    days = Number.parseInt(args[++i] ?? "7", 10);
  } else if (a === "--snippet") {
    snippetLen = Number.parseInt(args[++i] ?? "300", 10);
  } else if (a === "--include-domains") {
    includeDomains = (args[++i] ?? "").split(",").map(d => d.trim()).filter(Boolean);
  } else if (a === "--exclude-domains") {
    excludeDomains = (args[++i] ?? "").split(",").map(d => d.trim()).filter(Boolean);
  } else if (a === "--no-answer") {
    noAnswer = true;
  } else if (a === "--format") {
    format = args[++i] ?? "markdown";
  } else {
    console.error(`Unknown arg: ${a}`);
    usage();
  }
}

const apiKey = (process.env.TAVILY_API_KEY ?? "").trim();
if (!apiKey) {
  console.error("Missing TAVILY_API_KEY");
  process.exit(1);
}

const body = {
  api_key: apiKey,
  query,
  search_depth: searchDepth,
  topic,
  max_results: Math.max(1, Math.min(n, 20)),
  include_answer: !noAnswer,
  include_raw_content: false,
};

if (topic === "news" && days) body.days = days;
if (includeDomains.length > 0) body.include_domains = includeDomains;
if (excludeDomains.length > 0) body.exclude_domains = excludeDomains;

const resp = await fetch("https://api.tavily.com/search", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

if (!resp.ok) {
  const text = await resp.text().catch(() => "");
  throw new Error(`Tavily Search failed (${resp.status}): ${text}`);
}

const data = await resp.json();
const results = (data.results ?? []).slice(0, n);

if (format === "json") {
  console.log(JSON.stringify({
    query,
    answer: noAnswer ? null : (data.answer ?? null),
    results: results.map(r => ({
      title: r.title ?? "",
      url: r.url ?? "",
      content: r.content ?? "",
      score: r.score ?? null,
      published_date: r.published_date ?? null,
    })),
  }, null, 2));
  process.exit(0);
}

// Markdown output
if (!noAnswer && data.answer) {
  console.log("## Answer\n");
  console.log(data.answer);
  console.log("\n---\n");
}

console.log("## Sources\n");

for (const r of results) {
  const title = String(r?.title ?? "").trim();
  const url = String(r?.url ?? "").trim();
  const content = String(r?.content ?? "").trim();
  const score = r?.score ? ` (relevance: ${(r.score * 100).toFixed(0)}%)` : "";
  const date = r?.published_date ? ` · ${r.published_date}` : "";

  if (!title || !url) continue;
  console.log(`- **${title}**${score}${date}`);
  console.log(`  ${url}`);
  if (content) {
    console.log(`  ${content.slice(0, snippetLen)}${content.length > snippetLen ? "..." : ""}`);
  }
  console.log();
}
