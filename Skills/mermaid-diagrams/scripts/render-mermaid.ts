#!/usr/bin/env bun
/**
 * render-mermaid.ts — Renderiza diagramas Mermaid para PNG ou SVG
 *
 * Uso:
 *   bun run render-mermaid.ts <input_file|"codigo"> [options]
 *
 * Opções:
 *   --output <path>      Caminho de saída (default: <input>.png)
 *   --theme <theme>      Tema: default, dark, forest, neutral
 *   --format <format>    Formato: png, svg (default: png)
 *   --width <px>         Largura do viewport (default: 800)
 *   --background <cor>   Cor de fundo (default: white)
 *   --layout <dir>       Layout: vertical, horizontal (força direção TD/LR)
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

function runCmd(cmd: string, args: string[]): { exitCode: number; stdout: string; stderr: string } {
  const result = spawnSync(cmd, args, { encoding: "utf-8", timeout: 60000 });
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

// Parse args
const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(`Uso: bun run render-mermaid.ts <arquivo.mmd|"codigo mermaid"> [opções]

Opções:
  --output <path>     Caminho de saída (default: <nome>.png)
  --theme <theme>     Tema: default, dark, forest, neutral
  --format <format>   Formato: png, svg
  --width <px>        Largura do viewport
  --background <cor>  Cor de fundo (ex: white, transparent, #f0f0f0)
  --layout <dir>      Direção do layout: vertical (TD) ou horizontal (LR)
  --help, -h          Mostra esta ajuda

Exemplos:
  bun run render-mermaid.ts diagrama.mmd
  bun run render-mermaid.ts diagrama.mmd --output ./saida.png --theme dark
  bun run render-mermaid.ts "graph TD; A-->B" --output ./teste.png
  bun run render-mermaid.ts diagrama.mmd --layout vertical`);
  process.exit(0);
}

const inputArg = args[0];
let output: string | null = null;
let theme = "default";
let format = "png";
let width = "800";
let background = "white";
let layout: string | null = null;

for (let i = 1; i < args.length; i++) {
  switch (args[i]) {
    case "--output":
      output = args[++i];
      break;
    case "--theme":
      theme = args[++i];
      break;
    case "--format":
      format = args[++i];
      break;
    case "--width":
      width = args[++i];
      break;
    case "--background":
      background = args[++i];
      break;
    case "--layout":
      layout = args[++i];
      break;
    case "--vertical":
      layout = "vertical";
      break;
  }
}

// Determine input source
let inputFile: string;
let tempFile: string | null = null;

if (existsSync(inputArg)) {
  inputFile = resolve(inputArg);
  if (!output) {
    output = inputArg.replace(/\.mmd$|\.mermaid$/, "") + `.${format}`;
  }
} else {
  tempFile = `/tmp/mermaid_input_${Date.now()}.mmd`;
  writeFileSync(tempFile, inputArg, "utf-8");
  inputFile = tempFile;
  if (!output) {
    output = `/tmp/mermaid_output_${Date.now()}.${format}`;
  }
}

// Apply layout transformation
if (layout) {
  let code = readFileSync(inputFile, "utf-8");
  if (layout === "vertical") {
    code = code
      .replace(/\bgraph\s+LR\b/g, "graph TD")
      .replace(/\bflowchart\s+LR\b/g, "flowchart TD")
      .replace(/\bgraph\s+RL\b/g, "graph TD")
      .replace(/\bflowchart\s+RL\b/g, "flowchart TD")
      .replace(/\bgraph\s+BT\b/g, "graph TD")
      .replace(/\bflowchart\s+BT\b/g, "flowchart TD");
  } else if (layout === "horizontal") {
    code = code
      .replace(/\bgraph\s+TD\b/g, "graph LR")
      .replace(/\bflowchart\s+TD\b/g, "flowchart LR")
      .replace(/\bgraph\s+BT\b/g, "graph LR")
      .replace(/\bflowchart\s+BT\b/g, "flowchart LR");
  }
  const layoutFile = `/tmp/mermaid_layout_${Date.now()}.mmd`;
  writeFileSync(layoutFile, code, "utf-8");
  if (tempFile && tempFile !== inputFile) {
    try { unlinkSync(tempFile); } catch {}
  }
  tempFile = layoutFile;
  inputFile = layoutFile;
}

output = resolve(output);

// Theme config
const themeConfig: Record<string, string> = {
  default: "{}",
  dark: JSON.stringify({ theme: "dark" }),
  forest: JSON.stringify({ theme: "forest" }),
  neutral: JSON.stringify({ theme: "neutral" }),
};
const configStr = themeConfig[theme] || "{}";
const configFile = `/tmp/mermaid_cfg_${Date.now()}.json`;
writeFileSync(configFile, configStr, "utf-8");

// Build mmdc args
const puppeteerConfigPath = resolve(__dirname, "puppeteer-config.json");
const mmdcArgs = [
  "-i", inputFile,
  "-o", output,
  "-c", configFile,
  "-b", background,
  "-w", width,
  "-s", "2",
  "-p", puppeteerConfigPath,
];

const result = runCmd("mmdc", mmdcArgs);

// Cleanup
try { if (tempFile) unlinkSync(tempFile); } catch {}
try { unlinkSync(configFile); } catch {}

if (result.exitCode !== 0) {
  console.error("Erro ao renderizar diagrama Mermaid:");
  console.error(result.stderr);
  process.exit(1);
}

// Make SVG responsive
if (format === "svg") {
  try {
    let svg = Bun.file(output);
    const text = await svg.text();
    if (!text.includes("viewBox") && text.includes('width="')) {
      const wMatch = text.match(/width="(\d+)"/);
      const hMatch = text.match(/height="(\d+)"/);
      if (wMatch && hMatch) {
        const viewBox = `viewBox="0 0 ${wMatch[1]} ${hMatch[1]}"`;
        let updated = text
          .replace(/width="\d+"/, "")
          .replace(/height="\d+"/, "")
          .replace("<svg ", `<svg ${viewBox} style="max-width:100%;height:auto" `);
        writeFileSync(output, updated, "utf-8");
      }
    }
  } catch { /* ignore SVG post-process errors */ }
}

console.log(`Diagrama salvo em: ${output}`);
