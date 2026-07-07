#!/usr/bin/env node

function usage() {
  console.error(`Usage: extract.mjs "url1" ["url2" ...] [options]

Options:
  --limit <n>     Truncate content to n chars per URL (default: no limit)
  --format json   Output as JSON instead of markdown
`);
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0 || args[0] === "-h" || args[0] === "--help") usage();

const urls = [];
let limit = null;
let format = "markdown";

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--limit") {
    limit = Number.parseInt(args[++i] ?? "0", 10);
  } else if (a === "--format") {
    format = args[++i] ?? "markdown";
  } else if (a.startsWith("http://") || a.startsWith("https://")) {
    urls.push(a);
  } else {
    console.error(`Unknown arg or invalid URL: ${a}`);
    usage();
  }
}

if (urls.length === 0) {
  console.error("No URLs provided");
  usage();
}

const apiKey = (process.env.TAVILY_API_KEY ?? "").trim();
if (!apiKey) {
  console.error("Missing TAVILY_API_KEY");
  process.exit(1);
}

const resp = await fetch("https://api.tavily.com/extract", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ api_key: apiKey, urls }),
});

if (!resp.ok) {
  const text = await resp.text().catch(() => "");
  throw new Error(`Tavily Extract failed (${resp.status}): ${text}`);
}

const data = await resp.json();
const results = data.results ?? [];
const failed = data.failed_results ?? [];

if (format === "json") {
  console.log(JSON.stringify({
    results: results.map(r => ({
      url: r.url ?? "",
      title: r.title ?? null,
      content: limit ? (r.raw_content ?? "").slice(0, limit) : (r.raw_content ?? ""),
    })),
    failed: failed.map(f => ({ url: f.url, error: f.error })),
  }, null, 2));
  process.exit(0);
}

for (const r of results) {
  const url = String(r?.url ?? "").trim();
  const title = String(r?.title ?? "").trim();
  let content = String(r?.raw_content ?? "").trim();
  if (limit && content.length > limit) content = content.slice(0, limit) + "...";

  console.log(`# ${title || url}`);
  if (title) console.log(`> ${url}`);
  console.log();
  console.log(content || "(no content extracted)");
  console.log("\n---\n");
}

if (failed.length > 0) {
  console.log("## Failed URLs\n");
  for (const f of failed) {
    console.log(`- ${f.url}: ${f.error}`);
  }
}
