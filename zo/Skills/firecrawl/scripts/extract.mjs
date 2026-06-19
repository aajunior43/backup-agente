#!/usr/bin/env node

function usage() {
  console.error(`Usage: extract.mjs "url" [options]

Options:
  --schema <json>   JSON schema of fields to extract (e.g. '{"name":"string","price":"number"}')
  --prompt <text>   Natural language description of what to extract
  --format json     Output as JSON
`);
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0 || args[0] === "-h" || args[0] === "--help") usage();

let url = null;
let schema = null;
let prompt = null;
let format = "markdown";

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--schema") {
    try {
      schema = JSON.parse(args[++i] ?? "{}");
    } catch {
      console.error("Invalid JSON schema");
      process.exit(2);
    }
  } else if (a === "--prompt") {
    prompt = args[++i] ?? "";
  } else if (a === "--format") {
    format = args[++i] ?? "markdown";
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

if (!schema && !prompt) {
  console.error("Provide --schema or --prompt");
  usage();
}

const apiKey = (process.env.FIRECRAWL_API_KEY ?? "").trim();
if (!apiKey) {
  console.error("Missing FIRECRAWL_API_KEY");
  process.exit(1);
}

const body = {
  urls: [url],
};
if (prompt) body.prompt = prompt;
if (schema) body.schema = schema;

try {
  const resp = await fetch("https://api.firecrawl.dev/v1/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    console.error(`Firecrawl extract failed (${resp.status}): ${text}`);
    process.exit(1);
  }

  const data = await resp.json();

  if (!data.success) {
    console.error("Firecrawl error:", data.error || "unknown");
    process.exit(1);
  }

  const extracted = data.data ?? {};

  if (format === "json") {
    console.log(JSON.stringify({ url, data: extracted }, null, 2));
  } else {
    console.log(`# Dados extraidos de ${url}\n`);
    if (typeof extracted === "object") {
      for (const [key, value] of Object.entries(extracted)) {
        if (Array.isArray(value)) {
          console.log(`## ${key}\n`);
          for (const item of value) {
            if (typeof item === "object") {
              console.log("- " + Object.entries(item).map(([k, v]) => `**${k}:** ${v}`).join(" | "));
            } else {
              console.log(`- ${item}`);
            }
          }
          console.log();
        } else {
          console.log(`**${key}:** ${value}`);
        }
      }
    } else {
      console.log(String(extracted));
    }
  }
} catch (e) {
  console.error("Error:", e.message);
  process.exit(1);
}
