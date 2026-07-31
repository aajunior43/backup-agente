#!/usr/bin/env bun
/**
 * subagent.ts — CLI para spawnar subagentes via /zo/ask
 *
 * Uso:
 *   bun run subagent.ts run <prompt>                  # um subagente
 *   bun run subagent.ts run --model <id> <prompt>      # modelo específico
 *   bun run subagent.ts parallel <p1> <p2> ...         # paralelo
 *   bun run subagent.ts batch -f <arquivo>             # lote de arquivo
 *   bun run subagent.ts batch -f <arquivo> --model <id>
 */

const API_URL = "https://api.zo.computer/zo/ask";
const DEFAULT_MODEL = "byok:d7cd99aa-c33a-4045-9d5a-7ec005150a42";

function token(): string {
  const t = process.env.ZO_CLIENT_IDENTITY_TOKEN;
  if (!t) {
    console.error("Erro: ZO_CLIENT_IDENTITY_TOKEN não definido no ambiente.");
    process.exit(1);
  }
  return t;
}

async function ask(prompt: string, model: string): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      authorization: token(),
      "content-type": "application/json",
    },
    body: JSON.stringify({ input: prompt, model_name: model }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API erro ${res.status}: ${text.slice(0, 500)}`);
  }
  const data = (await res.json()) as { output: string };
  return data.output;
}

async function cmdRun(args: string[]) {
  let model = DEFAULT_MODEL;
  let promptArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--model" && i + 1 < args.length) {
      model = args[++i];
    } else {
      promptArgs.push(args[i]);
    }
  }

  if (promptArgs.length === 0) {
    console.error("Uso: subagent.ts run [--model <id>] <prompt>");
    process.exit(1);
  }

  const prompt = promptArgs.join(" ");
  const result = await ask(prompt, model);
  console.log(result);
}

async function cmdParallel(args: string[]) {
  let model = DEFAULT_MODEL;
  const prompts: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--model" && i + 1 < args.length) {
      model = args[++i];
    } else {
      prompts.push(args[i]);
    }
  }

  if (prompts.length === 0) {
    console.error("Uso: subagent.ts parallel [--model <id>] <prompt1> <prompt2> ...");
    process.exit(1);
  }

  const results = await Promise.all(prompts.map((p) => ask(p, model)));

  for (let i = 0; i < prompts.length; i++) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`SUBMISSÃO ${i + 1}/${prompts.length}`);
    console.log(`Prompt: ${prompts[i].slice(0, 120)}${prompts[i].length > 120 ? "..." : ""}`);
    console.log(`${"=".repeat(60)}`);
    console.log(results[i]);
  }
}

async function cmdBatch(args: string[]) {
  let model = DEFAULT_MODEL;
  let filePath = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--model" && i + 1 < args.length) {
      model = args[++i];
    } else if (args[i] === "-f" && i + 1 < args.length) {
      filePath = args[++i];
    }
  }

  if (!filePath) {
    console.error("Uso: subagent.ts batch -f <arquivo> [--model <id>]");
    process.exit(1);
  }

  const content = await Bun.file(filePath).text();
  const prompts = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (prompts.length === 0) {
    console.error("Nenhum prompt encontrado no arquivo.");
    process.exit(1);
  }

  console.log(`Lendo ${prompts.length} prompt(s) de ${filePath}...\n`);

  const results = await Promise.all(prompts.map((p) => ask(p, model)));

  for (let i = 0; i < prompts.length; i++) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`LINHA ${i + 1}/${prompts.length}`);
    console.log(`Prompt: ${prompts[i].slice(0, 120)}${prompts[i].length > 120 ? "..." : ""}`);
    console.log(`${"=".repeat(60)}`);
    console.log(results[i]);
  }
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);

  switch (cmd) {
    case "run":
      await cmdRun(rest);
      break;
    case "parallel":
      await cmdParallel(rest);
      break;
    case "batch":
      await cmdBatch(rest);
      break;
    case "--help":
    case "-h":
    case undefined:
      console.log(`subagent.ts — Spawna subagentes via /zo/ask

Uso:
  subagent.ts run <prompt>                       Um subagente
  subagent.ts run --model <id> <prompt>          Modelo específico
  subagent.ts parallel <p1> <p2> ...            Paralelo (vários prompts)
  subagent.ts parallel --model <id> <p1> <p2>   Paralelo com modelo custom
  subagent.ts batch -f <arquivo>                Lote de um arquivo
  subagent.ts batch -f <arquivo> --model <id>   Lote com modelo custom
  subagent.ts --help                             Esta ajuda
`);
      break;
    default:
      console.error(`Comando desconhecido: ${cmd}`);
      console.error("Use: subagent.ts --help");
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});
