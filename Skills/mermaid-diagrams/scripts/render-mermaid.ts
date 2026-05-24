#!/usr/bin/env bun
/**
 * render-mermaid.ts — Renderiza diagramas Mermaid para PNG ou SVG
 *
 * Uso:
 *   bun run render-mermaid.ts <arquivo.mmd|"código"> [opções]
 *   bun run render-mermaid.ts *.mmd --output-dir ./diagramas  (batch)
 *
 * Opções:
 *   --output <path>      Caminho de saída (default: <input>.png)
 *   --output-dir <dir>   Diretório de saída para modo batch
 *   --theme <theme>      Tema: default, dark, forest, neutral, base
 *   --format <format>    Formato: png, svg (default: png)
 *   --width <px>         Largura do viewport (default: 800)
 *   --scale <n>          Escala para HiDPI (default: 2)
 *   --background <cor>   Cor de fundo (ex: white, transparent, #f0f0f0)
 *   --layout <dir>       Direção: vertical (TD) ou horizontal (LR)
 *   --css <arquivo>      Arquivo CSS customizado para estilos
 *   --no-responsive      Desativa SVG responsivo
 *   --help, -h           Mostra ajuda
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { resolve, basename, extname, dirname } from "node:path";
import { spawnSync } from "node:child_process";

function runCmd(cmd: string, args: string[]): { exitCode: number; stdout: string; stderr: string } {
  const result = spawnSync(cmd, args, { encoding: "utf-8", timeout: 120000 });
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

// ========== HELP ==========
const helpText = `Uso: bun run render-mermaid.ts <arquivo.mmd|"código mermaid"> [opções]

Renderiza diagramas Mermaid em PNG ou SVG.

ARGS:
  <arquivo>         Arquivo .mmd ou .mermaid para renderizar
  <"código">        Código Mermaid inline entre aspas
  *.mmd             Glob de arquivos (modo batch)

OPÇÕES:
  --output <path>       Caminho do arquivo de saída
  --output-dir <dir>    Diretório de saída (modo batch)
  --theme <theme>       Tema: default, dark, forest, neutral, base
  --format <fmt>        Formato: png, svg (default: png)
  --width <px>          Largura do viewport (default: 800)
  --scale <n>           Escala para retina/HiDPI (default: 2)
  --background <cor>    Cor de fundo: white, transparent, #hex
  --layout <dir>        Força direção: vertical (TD) ou horizontal (LR)
  --css <arquivo>       Arquivo CSS para estilização customizada
  --no-responsive       Desativa correção de SVG responsivo
  --help, -h            Mostra esta ajuda

EXEMPLOS:
  bun run render-mermaid.ts diagrama.mmd
  bun run render-mermaid.ts diagrama.mmd --output ./saida.png --theme dark
  bun run render-mermaid.ts "graph TD; A-->B" --output ./teste.png
  bun run render-mermaid.ts *.mmd --output-dir ./diagramas --theme forest
  bun run render-mermaid.ts fluxo.mmd --layout vertical
  bun run render-mermaid.ts fluxo.mmd --format svg --background transparent`;

// ========== PARSE ==========
const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(helpText);
  process.exit(0);
}

// Check mmdc
const check = runCmd("which", ["mmdc"]);
if (check.exitCode !== 0) {
  console.error("❌ mmdc (mermaid-cli) não encontrado. Instale com:");
  console.error("   npm install -g @mermaid-js/mermaid-cli");
  process.exit(1);
}

// Glob expansion
let inputs: string[] = [];
let rawInputs: string[] = [];
let isBatch = false;

for (const arg of args) {
  if (arg.startsWith("--")) break;
  rawInputs.push(arg);
}

for (const raw of rawInputs) {
  if (existsSync(raw)) {
    inputs.push(resolve(raw));
  } else if (raw.includes("*")) {
    // Glob — expand with shell
    const globResult = runCmd("bash", ["-c", `ls ${raw} 2>/dev/null`]);
    const files = globResult.stdout.split("\n").filter(Boolean).map(f => resolve(f.trim()));
    if (files.length === 0) {
      console.error(`⚠️  Nenhum arquivo encontrado para: ${raw}`);
    } else {
      inputs.push(...files);
      isBatch = true;
    }
  }
}

// If no files found by glob, treat remaining raw inputs as inline code
if (inputs.length === 0) {
  // first non-option arg is inline code
  const inlineCode = rawInputs.find(r => !existsSync(r) && !r.includes("*"));
  if (inlineCode) {
    inputs = [];
  } else {
    console.error("❌ Nenhum arquivo válido encontrado.");
    process.exit(1);
  }
}

// Parse options
let outputDir = "";
let theme = "default";
let format = "png";
let width = "800";
let scale = "2";
let background = "white";
let layout: string | null = null;
let cssFile: string | null = null;
let responsiveSvg = true;

for (let i = 1; i < args.length; i++) {
  switch (args[i]) {
    case "--output":    outputDir = args[++i]; break;
    case "--output-dir": outputDir = args[++i]; break;
    case "--theme":     theme = args[++i]; break;
    case "--format":    format = args[++i]; break;
    case "--width":     width = args[++i]; break;
    case "--scale":     scale = args[++i]; break;
    case "--background": background = args[++i]; break;
    case "--layout":    layout = args[++i]; break;
    case "--vertical":  layout = "vertical"; break;
    case "--css":       cssFile = args[++i]; break;
    case "--no-responsive": responsiveSvg = false; break;
  }
}

// Se tem inputs (arquivos), usa eles. Senão, é código inline.
const isInline = inputs.length === 0;

// ========== RENDER ==========
function renderSingle(inputCode: string, outputPath: string, batchIndex?: number): boolean {
  let inputFile: string;
  let tempFile: string | null = null;

  if (existsSync(inputCode)) {
    inputFile = inputCode;
  } else {
    tempFile = `/tmp/mermaid_in_${Date.now()}_${batchIndex ?? 0}.mmd`;
    writeFileSync(tempFile, inputCode, "utf-8");
    inputFile = tempFile;
  }

  // Apply layout
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
    const layoutFile = `/tmp/mermaid_layout_${Date.now()}_${batchIndex ?? 0}.mmd`;
    writeFileSync(layoutFile, code, "utf-8");
    if (tempFile) { try { unlinkSync(tempFile); } catch {} }
    tempFile = layoutFile;
    inputFile = layoutFile;
  }

  // Theme config
  let configObj: Record<string, any> = {};
  if (theme === "dark") configObj = { theme: "dark" };
  else if (theme === "forest") configObj = { theme: "forest" };
  else if (theme === "neutral") configObj = { theme: "neutral" };
  else if (theme === "base") configObj = {
    theme: "base",
    themeVariables: {
      background: "#1a1a2e",
      primaryColor: "#0f3460",
      secondaryColor: "#16213e",
      tertiaryColor: "#1a1a2e",
      primaryBorderColor: "#e94560",
      secondaryBorderColor: "#533483",
      lineColor: "#e94560",
      textColor: "#eee",
      fontSize: "14px",
    }
  };

  // Custom CSS
  if (cssFile && existsSync(cssFile)) {
    const css = readFileSync(cssFile, "utf-8");
    configObj.css = css;
  }

  const configStr = JSON.stringify(configObj);
  const configPath = `/tmp/mermaid_cfg_${Date.now()}_${batchIndex ?? 0}.json`;
  writeFileSync(configPath, configStr, "utf-8");

  const puppeteerConfigPath = resolve(import.meta.dirname, "puppeteer-config.json");
  const mmdcArgs = [
    "-i", inputFile,
    "-o", outputPath,
    "-c", configPath,
    "-b", background,
    "-w", width,
    "-s", scale,
    "-p", puppeteerConfigPath,
  ];

  const result = runCmd("mmdc", mmdcArgs);

  // Cleanup
  try { if (tempFile) unlinkSync(tempFile); } catch {}
  try { unlinkSync(configPath); } catch {}

  if (result.exitCode !== 0) {
    console.error(`❌ Erro ao renderizar: ${inputCode}`);
    console.error(result.stderr);
    return false;
  }

  // Make SVG responsive
  if (format === "svg" && responsiveSvg && existsSync(outputPath)) {
    try {
      let svgText = readFileSync(outputPath, "utf-8");
      if (!svgText.includes("viewBox")) {
        const wMatch = svgText.match(/width="(\d+)"/);
        const hMatch = svgText.match(/height="(\d+)"/);
        if (wMatch && hMatch) {
          svgText = svgText.includes("viewBox=\"")
            ? svgText
            : svgText.replace("<svg ", `<svg viewBox="0 0 ${wMatch[1]} ${hMatch[1]}" `);
        }
      }
      svgText = svgText.replace("<svg ", `<svg style="max-width:100%;height:auto" `);
      writeFileSync(outputPath, svgText, "utf-8");
    } catch { /* SVG post-process safe to ignore */ }
  }

  return true;
}

// ========== EXECUTION ==========
if (isInline) {
  // Código inline
  const inlineCode = rawInputs[0];
  const outputPath = outputDir
    ? resolve(outputDir, `diagrama.${format}`)
    : resolve(`/home/workspace/Images/diagrama_mermaid_${Date.now()}.${format}`);

  // Ensure output directory exists
  const outDir = dirname(outputPath);
  if (!existsSync(outDir)) {
    runCmd("mkdir", ["-p", outDir]);
  }

  const ok = renderSingle(inlineCode, outputPath, 0);
  if (ok) console.log(`✅ Diagrama salvo em: ${outputPath}`);
  else process.exit(1);

} else if (isBatch && inputs.length > 1) {
  // Batch mode
  const outDir = outputDir ? resolve(outputDir) : dirname(inputs[0]);
  if (!existsSync(outDir)) runCmd("mkdir", ["-p", outDir]);

  let success = 0;
  let fail = 0;

  for (let i = 0; i < inputs.length; i++) {
    const file = inputs[i];
    const base = basename(file, extname(file));
    const outPath = resolve(outDir, `${base}.${format}`);
    process.stdout.write(`  [${i + 1}/${inputs.length}] ${base}... `);
    const ok = renderSingle(file, outPath, i);
    if (ok) { success++; console.log("✅"); }
    else { fail++; console.log("❌"); }
  }

  console.log(`\n📊 Resultado: ${success} ok, ${fail} falha(s)`);
  if (fail > 0) process.exit(1);

} else {
  // Single file
  const file = inputs[0];
  let outputPath: string;

  if (outputDir) {
    const base = basename(file, extname(file));
    outputPath = resolve(outputDir, `${base}.${format}`);
  } else {
    const outArg = (() => {
      for (let i = 1; i < args.length; i++) {
        if (args[i] === "--output" && args[i + 1]) return args[i + 1];
      }
      return null;
    })();
    outputPath = outArg ?? file.replace(/\.mmd$|\.mermaid$/, "") + `.${format}`;
  }

  const outDir = dirname(outputPath);
  if (!existsSync(outDir)) runCmd("mkdir", ["-p", outDir]);

  const ok = renderSingle(file, outputPath, 0);
  if (ok) console.log(`✅ Diagrama salvo em: ${outputPath}`);
  else process.exit(1);
}
