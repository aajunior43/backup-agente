#!/usr/bin/env bun
/**
 * gerar-pdf.ts — Compila arquivos .tex para PDF usando lualatex
 *
 * Uso:
 *   bun gerar-pdf.ts <caminho/arquivo.tex> [--clean] [--open] [--engine lualatex|xelatex|pdflatex]
 *
 *   --engine  Compilador a usar (padrão: lualatex)
 *   --clean   Remove arquivos auxiliares (.aux, .log, .out) após compilar
 *   --open    Abre o PDF no visualizador padrão
 *   --check   Verifica dependências antes de compilar
 *
 * Exemplos:
 *   bun gerar-pdf.ts /home/workspace/Prefeitura/oficio.tex
 *   bun gerar-pdf.ts /home/workspace/Prefeitura/oficio.tex --clean
 *   bun gerar-pdf.ts /home/workspace/Prefeitura/oficio.tex --engine xelatex --clean
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(`
📄 LaTeX PDF Generator — Compila .tex para PDF

Uso:
  bun gerar-pdf.ts <arquivo.tex> [opções]

Opções:
  --engine <compilador>  lualatex (padrão) | xelatex | pdflatex
  --clean                Remove .aux, .log, .out após compilar
  --open                 Abre o PDF após gerar
  --check                Verifica dependências antes de compilar
  --help                 Mostra esta ajuda

Exemplos:
  bun gerar-pdf.ts oficio.tex
  bun gerar-pdf.ts oficio.tex --clean --open
  bun gerar-pdf.ts oficio.tex --engine xelatex
`);
  process.exit(0);
}

const texPath = args.find((a) => !a.startsWith("--"));
const clean = args.includes("--clean");
const openPdf = args.includes("--open");
const check = args.includes("--check");
const engineArg = args.findIndex((a) => a === "--engine");
const engine = engineArg >= 0 ? args[engineArg + 1] || "lualatex" : "lualatex";

if (!texPath) {
  console.error("❌ Especifique o caminho do arquivo .tex");
  process.exit(1);
}

const absPath = path.resolve(texPath);
if (!fs.existsSync(absPath)) {
  console.error(`❌ Arquivo não encontrado: ${absPath}`);
  process.exit(1);
}

if (!absPath.endsWith(".tex")) {
  console.error(`❌ Arquivo não é .tex: ${absPath}`);
  process.exit(1);
}

// Verificar dependências
if (check) {
  console.log("🔧 Verificando dependências...\n");
  try {
    execSync(`${engine} --version`, { stdio: "pipe" });
    console.log(`  ✅ ${engine} encontrado`);
  } catch {
    console.error(`  ❌ ${engine} não encontrado`);
    console.error(`     Instale com: sudo apt install texlive-full`);
    process.exit(1);
  }
  console.log("");
}

const dir = path.dirname(absPath);
const baseName = path.basename(absPath, ".tex");
const pdfPath = path.join(dir, `${baseName}.pdf`);

console.log(`📄 Compilando: ${path.relative("/home/workspace", absPath)}`);
console.log(`   Engine: ${engine}`);
console.log("");

// Primeira compilação
console.log("⏳ Primeira compilação...");
try {
  execSync(`${engine} -interaction=nonstopmode -output-directory="${dir}" "${absPath}"`, {
    stdio: "pipe",
    cwd: dir,
  });
  console.log("   ✅ Concluída");
} catch {
  // lualatex retorna exit code > 0 mesmo com warnings
  console.log("   ⚠️  Concluída (com warnings)");
}

// Segunda compilação (referências, sumário, numeração)
console.log("⏳ Segunda compilação (referências)...");
try {
  execSync(`${engine} -interaction=nonstopmode -output-directory="${dir}" "${absPath}"`, {
    stdio: "pipe",
    cwd: dir,
  });
  console.log("   ✅ Concluída");
} catch {
  console.log("   ⚠️  Concluída (com warnings)");
}

// Verificar se PDF foi gerado
if (!fs.existsSync(pdfPath)) {
  console.error("\n❌ PDF não foi gerado. Verifique erros no .log:");
  const logPath = path.join(dir, `${baseName}.log`);
  if (fs.existsSync(logPath)) {
    const log = fs.readFileSync(logPath, "utf-8");
    const errors = log
      .split("\n")
      .filter((l) => l.startsWith("!"))
      .slice(0, 10);
    for (const err of errors) {
      console.error(`   ${err}`);
    }
  }
  process.exit(1);
}

const sizeKB = Math.round(fs.statSync(pdfPath).size / 1024);
console.log(`\n✅ PDF gerado: ${sizeKB} KB`);

// Limpar auxiliares
if (clean) {
  const auxExts = [".aux", ".log", ".out", ".toc", ".lof", ".lot", ".bbl", ".blg", ".synctex.gz"];
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
