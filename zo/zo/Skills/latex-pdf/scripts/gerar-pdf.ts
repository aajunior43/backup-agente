#!/usr/bin/env bun
/**
 * gerar-pdf.ts — Gera PDFs bonitos a partir de HTML ou Markdown
 *
 * Uso:
 *   bun gerar-pdf.ts <arquivo.html|md> [--theme modern|classic|elegant|corporate] [--output caminho] [--css arquivo]
 *
 * Exemplos:
 *   bun gerar-pdf.ts doc.md
 *   bun gerar-pdf.ts doc.md --theme elegant --output relatorio.pdf
 *   bun gerar-pdf.ts doc.html --css custom.css
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, extname, basename, join } from "path";
import { spawnSync } from "child_process";

// ─── Args ───────────────────────────────────────────────

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(`
� Gerador de PDF — HTML/Markdown → PDF com estilo

Uso:
  bun gerar-pdf.ts <arquivo.html|md> [opções]

Opções:
  --theme <nome>      modern (padrão) | classic | elegant | corporate
  --output <caminho>  PDF de saída (padrão: mesmo dir/nome com .pdf)
  --css <caminho>     CSS customizado (sobrescreve tema)
  --title <texto>     Título do documento <title>

Exemplos:
  bun gerar-pdf.ts documento.md
  bun gerar-pdf.ts pagina.html --theme corporate --output relatorio.pdf
  bun gerar-pdf.ts doc.md --css meu-estilo.css
`);
  process.exit(0);
}

const inputPath = resolve(args[0]);
let theme = "modern";
let outputPath = "";
let customCss = "";
let docTitle = "";

for (let i = 1; i < args.length; i++) {
  if (args[i] === "--theme") theme = args[++i];
  if (args[i] === "--output") outputPath = resolve(args[++i]);
  if (args[i] === "--css") customCss = resolve(args[++i]);
  if (args[i] === "--title") docTitle = args[++i];
}

if (!existsSync(inputPath)) {
  console.error(`❌ Arquivo não encontrado: ${inputPath}`);
  process.exit(1);
}

if (!outputPath) {
  outputPath = inputPath.replace(/\.(html|md|markdown)$/i, "") + ".pdf";
}

const skillDir = resolve(import.meta.dir, "..");
const themesDir = join(skillDir, "themes");
const ext = extname(inputPath).toLowerCase();

// ─── Selecionar CSS ─────────────────────────────────────

let themeCss: string;
if (customCss && existsSync(customCss)) {
  themeCss = readFileSync(customCss, "utf-8");
  console.log(`� CSS customizado: ${basename(customCss)}`);
} else {
  const themeFile = join(themesDir, `${theme}.css`);
  if (!existsSync(themeFile)) {
    console.error(`❌ Tema "${theme}" não encontrado. Temas disponíveis: modern, classic, elegant, corporate`);
    process.exit(1);
  }
  themeCss = readFileSync(themeFile, "utf-8");
  console.log(`🎨 Tema: ${theme}`);
}

// ─── Converter input para HTML se necessário ─────────────

let htmlContent: string;

if (ext === ".md" || ext === ".markdown") {
  // Usa pandoc para converter MD → HTML
  console.log(`📝 Convertendo Markdown → HTML...`);
  const result = spawnSync("pandoc", [
    inputPath,
    "--standalone",
    "--from", "markdown+smart",
    "--to", "html",
    "--wrap=none",
  ], { encoding: "utf-8" });

  if (result.status !== 0) {
    console.error(`❌ Erro no pandoc: ${result.stderr}`);
    process.exit(1);
  }
  htmlContent = result.stdout;
} else {
  htmlContent = readFileSync(inputPath, "utf-8");
}

// Se não tem <html>, envolver em template básico
const isFragment = !htmlContent.includes("<html") && !htmlContent.includes("<!DOCTYPE");

if (isFragment) {
  // Extrair título do primeiro h1 se não fornecido
  if (!docTitle) {
    const titleMatch = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (titleMatch) docTitle = titleMatch[1].replace(/<[^>]+>/g, "");
    else docTitle = basename(inputPath, ext);
  }

  htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
</head>
<body>
${htmlContent}
</body>
</html>`;
}

// ─── Injetar CSS inline (weasyprint precisa de <style>) ──

// Remover <link rel="stylesheet"> se existir ( vamos injetar inline)
htmlContent = htmlContent.replace(/<link[^>]*stylesheet[^>]*>/gi, "");

// Injetar CSS no <head> ou criar <head> se não existir
if (htmlContent.includes("</head>")) {
  htmlContent = htmlContent.replace("</head>", `<style>\n${themeCss}\n</style>\n</head>`);
} else if (htmlContent.includes("<body")) {
  htmlContent = htmlContent.replace("<body>", `<head><style>\n${themeCss}\n</style></head>\n<body`);
} else {
  htmlContent = `<html><head><style>\n${themeCss}\n</style></head><body>${htmlContent}</body></html>`;
}

// ─── Escrever HTML temporário e converter ───────────────

const tmpHtml = join(skillDir, ".tmp-pdf-gen.html");
writeFileSync(tmpHtml, htmlContent);

console.log(`� Gerando PDF com weasyprint...`);

const result = spawnSync("weasyprint", [
  tmpHtml,
  outputPath,
  "--encoding", "utf-8",
], { encoding: "utf-8" });

// Limpar tmp
try { require("fs").unlinkSync(tmpHtml); } catch { /* ignore */ }

if (result.status !== 0) {
  console.error(`❌ Erro ao gerar PDF:\n${result.stderr}`);
  // Salvar HTML debug
  const debugPath = outputPath.replace(/\.pdf$/, ".debug.html");
  writeFileSync(debugPath, htmlContent);
  console.log(`   HTML de debug salvo em: ${debugPath}`);
  process.exit(1);
}

const stats = require("fs").statSync(outputPath);
const sizeKB = Math.round(stats.size / 1024);

console.log(`\n✅ PDF gerado com sucesso!`);
console.log(`📄 ${outputPath}`);
console.log(`   📏 ${sizeKB} KB`);