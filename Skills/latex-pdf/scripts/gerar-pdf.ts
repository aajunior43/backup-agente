#!/usr/bin/env bun
/**
 * gerar-pdf.ts — Compila arquivos .tex para PDF usando lualatex
 *
 * Uso:
 *   bun gerar-pdf.ts <caminho/arquivo.tex> [--clean] [--open]
 *
 *   --clean  Remove arquivos auxiliares (.aux, .log, .out) após compilar
 *   --open   Abre o PDF no visualizador padrão (se disponível)
 *
 * Exemplos:
 *   bun gerar-pdf.ts /home/workspace/Prefeitura/oficio.tex
 *   bun gerar-pdf.ts /home/workspace/Prefeitura/oficio.tex --clean
 */

const args = process.argv.slice(2);
const texPath = args.find((a) => !a.startsWith("--"));
const clean = args.includes("--clean");
const openPdf = args.includes("--open");

if (!texPath) {
  console.error("❌ Uso: bun gerar-pdf.ts <arquivo.tex> [--clean] [--open]");
  process.exit(1);
}

const path = require("path");
const fs = require("fs");

const fullPath = path.resolve(texPath);

if (!fs.existsSync(fullPath)) {
  console.error(`❌ Arquivo não encontrado: ${fullPath}`);
  process.exit(1);
}

if (!fullPath.endsWith(".tex")) {
  console.error(`❌ O arquivo precisa ter extensão .tex`);
  process.exit(1);
}

const dir = path.dirname(fullPath);
const baseName = path.basename(fullPath, ".tex");
const pdfPath = path.join(dir, `${baseName}.pdf`);

console.log(`📄 Compilando: ${fullPath}`);
console.log(`📁 Diretório: ${dir}`);

// Primeira compilação
const { execSync } = require("child_process");

try {
  execSync(`lualatex -interaction=nonstopmode "${baseName}.tex"`, {
    cwd: dir,
    stdio: "pipe",
    encoding: "utf-8",
  });
  console.log("✅ Primeira compilação concluída");
} catch (e) {
  // lualatex retorna exit code > 0 mesmo com warnings, então ignoramos
}

// Segunda compilação (para acertar referências, sumário, numeração)
try {
  execSync(`lualatex -interaction=nonstopmode "${baseName}.tex"`, {
    cwd: dir,
    stdio: "pipe",
    encoding: "utf-8",
  });
  console.log("✅ Segunda compilação concluída");
} catch (e) {
  // Ignoramos exit code
}

// Verificar se o PDF foi gerado
if (!fs.existsSync(pdfPath)) {
  console.error(`❌ Falha ao gerar PDF. Verifique o log:`);
  const logPath = path.join(dir, `${baseName}.log`);
  if (fs.existsSync(logPath)) {
    const logTail = fs
      .readFileSync(logPath, "utf-8")
      .split("\n")
      .slice(-30)
      .join("\n");
    console.error(logTail);
  }
  process.exit(1);
}

const stats = fs.statSync(pdfPath);
const sizeKb = (stats.size / 1024).toFixed(1);
console.log(`✅ PDF gerado com sucesso: ${pdfPath} (${sizeKb} KB)`);

// Limpar arquivos auxiliares
if (clean) {
  const auxExts = [".aux", ".log", ".out", ".toc", ".lof", ".lot", ".fls", ".fdb_latexmk", ".synctex.gz"];
  for (const ext of auxExts) {
    const auxPath = path.join(dir, `${baseName}${ext}`);
    if (fs.existsSync(auxPath)) {
      fs.unlinkSync(auxPath);
    }
  }
  console.log("🧹 Arquivos auxiliares removidos");
}

// Abrir PDF
if (openPdf) {
  try {
    execSync(`xdg-open "${pdfPath}"`, { stdio: "ignore" });
    console.log("📂 PDF aberto");
  } catch {
    console.warn("⚠️  Não foi possível abrir o PDF automaticamente");
  }
}

console.log("\n" + "=".repeat(50));
console.log(`📄 Caminho relativo: ${path.relative("/home/workspace", pdfPath)}`);
console.log("=".repeat(50));
