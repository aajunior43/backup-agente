#!/usr/bin/env bun
/**
 * Registro de Saúde — CLI para registrar e exportar medições
 *
 * Uso:
 *   bun run saude/scripts/registro-saude.ts registrar --glicose=95 --sistolica=12 --diastolica=8 --pulso=72
 *   bun run saude/scripts/registro-saude.ts export
 */

import { readFileSync, writeFileSync, existsSync } from "fs";

const SAUDE_FILE = "/home/workspace/saude/registro_saude.md";
const EXPORT_FILE = "/home/workspace/saude/registro_saude.txt";

function help() {
  console.log(`
📋 Registro de Saúde — CLI

Comandos:
  registrar   Adiciona medição ao registro
  export      Exporta registro como TXT
  help        Mostra esta ajuda

Opções (registrar):
  --glicose=N       Glicemia em mg/dL
  --sistolica=N      Pressão sistólica
  --diastolica=N     Pressão diastólica
  --pulso=N          Batimentos por minuto
  --data=YYYY-MM-DD  Data (opcional, padrão: hoje)
  --obs="texto"      Observação (opcional)

Exemplos:
  bun run $0 registrar --glicose=95 --sistolica=12 --diastolica=8 --pulso=72
  bun run $0 export
`);
}

function nowBR() {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function registrar(args: Record<string, string>) {
  const glicose = parseFloat(args["--glicose"]);
  const sistolica = parseFloat(args["--sistolica"]);
  const diastolica = parseFloat(args["--diastolica"]);
  const pulso = parseInt(args["--pulso"]);

  if (isNaN(glicose) || isNaN(sistolica) || isNaN(diastolica) || isNaN(pulso)) {
    console.error("❌ Uso: --glicose=N --sistolica=N --diastolica=N --pulso=N");
    process.exit(1);
  }

  const data = args["--data"] || nowBR();
  const obs = args["--obs"] ? ` _(${args["--obs"]})_` : "";
  const linha = `| ${data} | ${glicose} | ${sistolica} × ${diastolica} | ${pulso} |${obs}`;

  const cabecalho = [
    "---",
    `# 📋 Registro de Saúde — ${data}`,
    "",
    "| Data | Glicose (mg/dL) | Pressão (sist × dias) | Pulso (bpm) | Obs |",
    "|------|----------------:|:----------------------:|:-----------:|-----|",
  ];

  if (existsSync(SAUDE_FILE)) {
    const content = readFileSync(SAUDE_FILE, "utf-8");
    writeFileSync(SAUDE_FILE, content.trimEnd() + "\n" + linha + "\n");
  } else {
    writeFileSync(SAUDE_FILE, cabecalho.join("\n") + "\n" + linha + "\n");
  }

  console.log(`✅ Registrado: glicose=${glicose} pressão=${sistolica}x${diastolica} pulso=${pulso}`);
  console.log(`   Arquivo: ${SAUDE_FILE}`);
}

function exportar() {
  if (!existsSync(SAUDE_FILE)) {
    console.error("❌ Arquivo de saúde não encontrado:", SAUDE_FILE);
    process.exit(1);
  }
  const content = readFileSync(SAUDE_FILE, "utf-8");
  writeFileSync(EXPORT_FILE, content);
  console.log(`✅ Exportado: ${EXPORT_FILE}`);
}

const cmd = process.argv[2];
const args: Record<string, string> = {};

for (let i = 3; i < process.argv.length; i++) {
  const arg = process.argv[i];
  const match = arg.match(/^--([^=]+)=(.+)$/);
  if (match) args[`--${match[1]}`] = match[2];
}

switch (cmd) {
  case "registrar": registrar(args); break;
  case "export": exportar(); break;
  default: help();
}
