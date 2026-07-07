#!/usr/bin/env node

function usage() {
  console.error(`Usage: crawl.mjs "url" [options]

Options:
  --max <n>           Max pages to crawl (default: 10)
  --format json       Output as JSON instead of markdown
  --include <pattern> Only crawl URLs matching this glob
  --exclude <pattern> Skip URLs matching this glob
`);
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0 || args[0] === "-h" || args[0] === "--help") usage();

let url = null;
let maxPages = 10;
let format = "markdown";
let includePaths = [];
let excludePaths = [];

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--max") {
    maxPages = Number.parseInt(args[++i] ?? "10", 10);
  } else if (a === "--format") {
    format = args[++i] ?? "markdown";
  } else if (a === "--include") {
    includePaths.push(args[++i] ?? "");
  } else if (a === "--exclude") {
    excludePaths.push(args[++i] ?? "");
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
  limit: maxPages,
  scrapeOptions: { formats: ["markdown"] },
};
if (includePaths.length) body.includePaths = includePaths;
if (excludePaths.length) body.excludePaths = excludePaths;

try {
  // Start crawl
  const startResp = await fetch("https://api.firecrawl.dev/v1/crawl", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!startResp.ok) {
    const text = await startResp.text().catch(() => "");
    console.error(`Firecrawl crawl failed (${startResp.status}): ${text}`);
    process.exit(1);
  }

  const startData = await startResp.json();
  if (!startData.success) {
    console.error("Firecrawl error:", startData.error || "unknown");
    process.exit(1);
  }

  const crawlId = startData.id;
  console.error(`Crawl started: ${crawlId} — polling...`);

  // Poll for results
  let results = [];
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 2000));
    attempts++;

    const pollResp = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });

    if (!pollResp.ok) continue;

    const pollData = await pollResp.json();
    const status = pollData.status;

    if (status === "completed") {
      results = pollData.data ?? [];
      console.error(`Crawl complete: ${results.length} pages`);
      break;
    } else if (status === "failed") {
      console.error("Crawl failed:", pollData.error || "unknown");
      process.exit(1);
    }

    console.error(`  Status: ${status} (${pollData.completed ?? 0}/${pollData.total ?? '?'} pages)`);
  }

  if (attempts >= maxAttempts) {
    console.error("Crawl timed out after 2 minutes");
    process.exit(1);
  }

  if (format === "json") {
    console.log(JSON.stringify({
      url,
      pages: results.map(r => ({
        url: r.metadata?.sourceURL ?? "",
        title: r.metadata?.title ?? "",
        content: r.markdown ?? "",
      })),
    }, null, 2));
  } else {
    for (const r of results) {
      const pageUrl = r.metadata?.sourceURL ?? "";
      const title = r.metadata?.title ?? "";
      const md = r.markdown ?? "";
      console.log(`# ${title || pageUrl}`);
      if (title) console.log(`> ${pageUrl}`);
      console.log();
      console.log(md || "(no content)");
      console.log("\n---\n");
    }
  }
} catch (e) {
  console.error("Error:", e.message);
  process.exit(1);
}
