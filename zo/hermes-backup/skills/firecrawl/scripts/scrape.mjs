#!/usr/bin/env node

function usage() {
  console.error(`Usage: scrape.mjs "url" [options]

Options:
  --format json     Output as JSON instead of markdown
  --limit <n>       Truncate content to n chars
  --only-main       Extract only main content (no nav/header/footer)
`);
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0 || args[0] === "-h" || args[0] === "--help") usage();

let url = null;
let format = "markdown";
let limit = null;
let onlyMain = false;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--format") {
    format = args[++i] ?? "markdown";
  } else if (a === "--limit") {
    limit = Number.parseInt(args[++i] ?? "0", 10);
  } else if (a === "--only-main") {
    onlyMain = true;
  } else if (a.startsWith("http://") || a.startsWith("https://")) {
    url = a;
  } else {
    console.error(`Unknown arg: ${a}`);
    usage();
  }
}

if (!url) {
  console.error("No URL provided");
  usage();
}

const apiKey = (process.env.FIRECRAWL_API_KEY ?? "").trim();
if (!apiKey) {
  console.error("Missing FIRECRAWL_API_KEY");
  process.exit(1);
}

const body = {
  url,
  formats: ["markdown"],
};
if (onlyMain) body.onlyMainContent = true;

try {
  const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    console.error(`Firecrawl scrape failed (${resp.status}): ${text}`);
    process.exit(1);
  }

  const data = await resp.json();

  if (!data.success) {
    console.error("Firecrawl error:", data.error || "unknown");
    process.exit(1);
  }

  const md = data.data?.markdown ?? "";
  const title = data.data?.metadata?.title ?? "";
  const content = limit ? md.slice(0, limit) : md;

  if (format === "json") {
    console.log(JSON.stringify({
      url,
      title,
      content,
      metadata: data.data?.metadata ?? {},
    }, null, 2));
  } else {
    if (title) console.log(`# ${title}\n> ${url}\n`);
    console.log(content || "(no content extracted)");
  }
} catch (e) {
  console.error("Error:", e.message);
  process.exit(1);
}
