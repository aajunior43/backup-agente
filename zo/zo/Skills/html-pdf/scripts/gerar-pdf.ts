#!/usr/bin/env bun
/**
 * gerar-pdf.ts — Gera PDFs bonitos a partir de HTML ou Markdown
 *
 * Suporta:
 * - Markdown (.md) → converte via pandoc
 * - HTML (.html) → usa diretamente
 * - Imagens: caminhos relativos resolvidos automaticamente para file://
 * - URLs, data URIs e caminhos absolutos são preservados
 * - Múltiplos CSS: tema + custom (combinados)
 * - Temas CSS: modern, classic, elegant, corporate
 *
 * Uso:
 *   bun gerar-pdf.ts <arquivo.html|md> [--theme nome] [--output caminho] [--css arquivo] [--title texto] [--open]
 *
 * Exemplos:
 *   bun gerar-pdf.ts doc.md
 *   bun gerar-pdf.ts doc.md --theme elegant --output relatorio.pdf
 *   bun gerar-pdf.ts pagina.html --css custom.css --open
 */

import { readFileSync, writeFileSync, existsSync, statSync } from "fs";
import { resolve, extname, basename, dirname, join, isAbsolute } from "path";
import { spawnSync } from "child_process";

// ─── Args ───────────────────────────────────────────────

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(`
📄 Gerador de PDF — HTML/Markdown → PDF com estilo

Uso:
  bun gerar-pdf.ts <arquivo.html|md> [opções]

Opções:
  --theme <nome>      modern (padrão) | classic | elegant | corporate
  --output <caminho>  PDF de saída (padrão: mesmo dir/nome com .pdf)
  --css <caminho>     CSS customizado (combinado com tema)
  --title <texto>     Título do documento <title>
  --open              Abre o PDF após gerar

Exemplos:
  bun gerar-pdf.ts documento.md
  bun gerar-pdf.ts pagina.html --theme corporate --output relatorio.pdf
  bun gerar-pdf.ts doc.md --css custom.css --open
`);
  process.exit(0);
}

const inputPath = resolve(args[0]);
let theme = "modern";
let outputPath = "";
let customCss = "";
let docTitle = "";
let openPdf = false;

for (let i = 1; i < args.length; i++) {
  if (args[i] === "--theme") theme = args[++i];
  if (args[i] === "--output") outputPath = resolve(args[++i]);
  if (args[i] === "--css") customCss = resolve(args[++i]);
  if (args[i] === "--title") docTitle = args[++i];
  if (args[i] === "--open") openPdf = true;
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
const inputDir = dirname(inputPath);

// ─── Montar CSS final (tema + custom) ─────────────────────

let finalCss = "";

// Carregar tema
const themeFile = join(themesDir, `${theme}.css`);
if (!existsSync(themeFile)) {
  console.error(`❌ Tema "${theme}" não encontrado. Temas: modern, classic, elegant, corporate`);
  process.exit(1);
}
finalCss = readFileSync(themeFile, "utf-8");
console.log(`🎨 Tema: ${theme}`);

// Adicionar CSS customizado (se fornecido)
if (customCss) {
  if (!existsSync(customCss)) {
    console.error(`❌ CSS customizado não encontrado: ${customCss}`);
    process.exit(1);
  }
  finalCss += "\n\n/* ─── CSS Customizado ─── */\n" + readFileSync(customCss, "utf-8");
  console.log(`📎 CSS custom: ${basename(customCss)}`);
}

// ─── Converter input para HTML ───────────────────────────

let htmlContent: string;

if (ext === ".md" || ext === ".markdown") {
  console.log(`📝 Convertendo Markdown → HTML...`);
  const result = spawnSync("pandoc", [
    inputPath,
    "--standalone",
    "--from", "markdown+smart+implicit_figures+pipe_tables",
    "--to", "html",
    "--wrap=none",
  ], { encoding: "utf-8" });

  if (result.status !== 0) {
    console.error(`❌ Erro no pandoc: ${result.stderr}`);
    process.exit(1);
  }
  htmlContent = result.stdout;
} else if (ext === ".html" || ext === ".htm") {
  htmlContent = readFileSync(inputPath, "utf-8");
} else {
  console.error(`❌ Formato não suportado: ${ext} (use .html, .htm, .md)`);
  process.exit(1);
}

// ─── Resolver caminhos de imagem ─────────────────────────

/**
 * Converte caminhos relativos em URLs file:// absolutos.
 * Preserva: http://, https://, data:, file://, caminhos já absolutos.
 * Avisa se a imagem não foi encontrada.
 */
function resolveImagePaths(html: string, baseDir: string): string {
  const resolved = html.replace(
    /<img([^>]+)src=["']([^"':]+)["']([^>]*)>/gi,
    (match, before, src, after) => {
      // Se já é URL ou data URI, mantém
      if (/^(https?:|data:|file:)/i.test(src)) {
        return match;
      }

      const resolved = isAbsolute(src) ? src : resolve(baseDir, src);

      // Avisar se arquivo não existe
      if (!existsSync(resolved)) {
        console.warn(`   ⚠️  Imagem não encontrada: ${src}`);
      }

      return `<img${before}src="file://${resolved}"${after}>`;
    }
  );
  return resolved;
}

htmlContent = resolveImagePaths(htmlContent, inputDir);

// ─── Envolver em template se for fragmento ────────────────

const isFragment = !htmlContent.includes("<html") && !htmlContent.includes("<!DOCTYPE");

if (isFragment) {
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

// ─── Injetar CSS inline ──────────────────────────────────

// Remover <link rel="stylesheet"> se existir
htmlContent = htmlContent.replace(/<link[^>]*stylesheet[^>]*>/gi, "");

// Injetar CSS no <head> ou criar <head> se não existir
if (htmlContent.includes("</head>")) {
  htmlContent = htmlContent.replace("</head>", `<style>\n${finalCss}\n</style>\n</head>`);
} else if (htmlContent.includes("<body")) {
  htmlContent = htmlContent.replace("<body>", `<head><style>\n${finalCss}\n</style></head>\n<body`);
} else {
  htmlContent = `<html><head><style>\n${finalCss}\n</style></head><body>${htmlContent}</body></html>`;
}

// ─── Gerar PDF com weasyprint ────────────────────────────

const tmpHtml = join(skillDir, ".tmp-pdf-gen.html");
writeFileSync(tmpHtml, htmlContent);

console.log(`🖨️  Gerando PDF com weasyprint...`);

const result = spawnSync("weasyprint", [
  tmpHtml,
  outputPath,
  "--encoding", "utf-8",
], { encoding: "utf-8" });

// Limpar tmp
try { require("fs").unlinkSync(tmpHtml); } catch { /* ignore */ }

if (result.status !== 0) {
  console.error(`❌ Erro ao gerar PDF:\n${result.stderr}`);
  const debugPath = outputPath.replace(/\.pdf$/, ".debug.html");
  writeFileSync(debugPath, htmlContent);
  console.log(`   HTML de debug salvo em: ${debugPath}`);
  process.exit(1);
}

if (!existsSync(outputPath)) {
  console.error("❌ PDF não foi gerado");
  process.exit(1);
}

const sizeKB = Math.round(statSync(outputPath).size / 1024);

console.log(`\n✅ PDF gerado com sucesso!`);
console.log(`📄 ${outputPath}`);
console.log(`   📏 ${sizeKB} KB`);

// Abrir PDF se solicitado
if (openPdf) {
  try {
    spawnSync("xdg-open", [outputPath], { stdio: "ignore" });
    console.log(`📂 PDF aberto`);
  } catch {
    console.warn(`⚠️  Não foi possível abrir o PDF automaticamente`);
  }
}
