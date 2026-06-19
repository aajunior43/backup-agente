#!/usr/bin/env node

function usage() {
  console.error(`Usage: browser.mjs "url" [actions...] [options]

Abre um navegador na nuvem via Firecrawl, executa acoes e retorna resultado.

Actions (em ordem):
  --wait <ms>                  Esperar N milissegundos
  --click <selector>           Clicar em um elemento CSS
  --type <selector> <text>     Digitar texto em um campo
  --scroll <direction>         Scroll: down, up, left, right
  --screenshot                 Tirar screenshot (retorna URL da imagem)
  --js <code>                  Executar JavaScript na pagina

Options:
  --format json                Output como JSON
  --limit <n>                  Truncar markdown em n chars
  --only-main                  Extrair apenas conteudo principal

Exemplos:
  browser.mjs "https://google.com" --screenshot
  browser.mjs "https://site.com" --wait 2000 --screenshot
  browser.mjs "https://site.com/login" --type "#email" "user@mail.com" --type "#pass" "123" --click "#login" --wait 3000 --screenshot
  browser.mjs "https://site.com" --scroll down --wait 1000 --screenshot
  browser.mjs "https://site.com" --js "return document.title"
`);
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0 || args[0] === "-h" || args[0] === "--help") usage();

let url = null;
let actions = [];
let format = "markdown";
let limit = null;
let onlyMain = false;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--wait") {
    actions.push({ type: "wait", milliseconds: Number.parseInt(args[++i] ?? "1000", 10) });
  } else if (a === "--click") {
    actions.push({ type: "click", selector: args[++i] ?? "" });
  } else if (a === "--type") {
    const selector = args[++i] ?? "";
    const text = args[++i] ?? "";
    actions.push({ type: "write", text, selector });
  } else if (a === "--scroll") {
    const dir = args[++i] ?? "down";
    actions.push({ type: "scroll", direction: dir });
  } else if (a === "--screenshot") {
    actions.push({ type: "screenshot" });
  } else if (a === "--js") {
    actions.push({ type: "executeJavascript", script: args[++i] ?? "" });
  } else if (a === "--format") {
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

// Se nao tem acoes, adiciona wait + screenshot padrao
if (actions.length === 0) {
  actions.push({ type: "wait", milliseconds: 2000 });
  actions.push({ type: "screenshot" });
}

const formats = ["markdown"];
const hasScreenshot = actions.some(a => a.type === "screenshot");
if (hasScreenshot) formats.push("screenshot");

const body = { url, actions, formats };
if (onlyMain) body.onlyMainContent = true;

try {
  console.error(`Abrindo navegador: ${url}`);
  console.error(`Acoes: ${actions.map(a => a.type).join(" → ")}`);

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
    console.error(`Firecrawl browser failed (${resp.status}): ${text}`);
    process.exit(1);
  }

  const data = await resp.json();

  if (!data.success) {
    console.error("Firecrawl error:", data.error || "unknown");
    process.exit(1);
  }

  const result = data.data ?? {};
  const md = result.markdown ?? "";
  const title = result.metadata?.title ?? "";
  const screenshotUrl = result.screenshot ?? "";
  const actionsResult = result.actions ?? {};
  const screenshots = actionsResult.screenshots ?? [];
  const jsReturns = actionsResult.javascriptReturns ?? [];
  const content = limit ? md.slice(0, limit) : md;

  if (format === "json") {
    console.log(JSON.stringify({
      url,
      title,
      content,
      screenshots: screenshots.length ? screenshots : (screenshotUrl ? [screenshotUrl] : []),
      javascriptReturns: jsReturns,
      metadata: result.metadata ?? {},
    }, null, 2));
  } else {
    if (title) console.log(`# ${title}\n> ${url}\n`);

    // Screenshots
    const allScreenshots = screenshots.length ? screenshots : (screenshotUrl ? [screenshotUrl] : []);
    if (allScreenshots.length) {
      console.log(`## Screenshots\n`);
      allScreenshots.forEach((s, i) => {
        console.log(`![Screenshot ${i + 1}](${s})`);
      });
      console.log();
    }

    // JS returns
    if (jsReturns.length) {
      console.log(`## JavaScript Returns\n`);
      jsReturns.forEach((r, i) => {
        console.log(`**[${i + 1}]:** ${typeof r === 'object' ? JSON.stringify(r) : r}`);
      });
      console.log();
    }

    // Content
    if (content) {
      console.log(`## Conteudo\n`);
      console.log(content);
    }
  }

  console.error(`\nNavegacao concluida.`);
  if (allScreenshots.length) {
    console.error(`Screenshots: ${allScreenshots.length}`);
  }

} catch (e) {
  console.error("Error:", e.message);
  process.exit(1);
}
