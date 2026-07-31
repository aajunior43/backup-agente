#!/usr/bin/env bun
/**
 * organizar.ts — Organiza arquivos soltos na raiz do workspace.
 *
 * Uso:
 *   bun organizar.ts            # dry-run: mostra o plano sem mover nada (padrão)
 *   bun organizar.ts --apply    # aplica as mudanças de fato
 *
 * Conservador: só move arquivos com classificação confiável. Nunca apaga,
 * nunca toca em AGENTS.md/SOUL.md, ocultos ou pastas.
 */

import { readdirSync, statSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = "/home/workspace";
const APPLY = process.argv.includes("--apply");

// Arquivos que devem permanecer na raiz (índices/instruções do workspace)
const PROTEGIDOS = new Set(["agents.md", "soul.md", "readme.md"]);

// Extensões que jamais movemos automaticamente (config/projeto)
const NAO_MEXER_EXT = new Set([".json", ".lock", ".toml", ".yml", ".yaml"]);

const MUNICIPAL = /prefeitura|inaja|inajá|municipal|oficio|ofício|contrato|aditivo|empenho|nota.?fiscal|licita|pregao|pregão|decreto|portaria|folha|servidor|orcament|orçament|orçamento|dotacao|dotação|tce|camara|câmara|secretaria|receita.?fed|diario.?oficial|balancete|balanço/;
const SAUDE = /glicos|saude|saúde|pressa[oã]o|pressao|pressão|insulina|pulso|medic[oõ]es|medi[çc][oõ]es|registro_saude|exame|consulta|hipertens|diabet/;
const FINANCEIRO = /credencia|bancari|bancário|bancaria|financeiro|financeira|fpm|conta|tesouraria|caixa|aplicac|investimento/;
const LIVRO = /^livro-cuscuz/i;
const TRANSCRICAO = /^converted.*\.(txt|text)$/i;

function destinoPara(nome: string): string | null {
  const ext = extname(nome).toLowerCase();
  const base = nome.toLowerCase();

  if (LIVRO.test(nome)) return "livro-cuscuz";
  if (TRANSCRICAO.test(nome)) return "saude/transcricoes-audio";

  // Por conteúdo do nome (prioridade)
  if (MUNICIPAL.test(base)) return "Prefeitura";
  if (SAUDE.test(base)) return "saude";
  if (FINANCEIRO.test(base)) return "financeiro";

  // Por extensão (fallback com destino padrão)
  switch (ext) {
    case ".pdf":
      return "Articles";
    case ".md":
      return "Articles";
    case ".html":
    case ".htm":
      return "projetos";
    case ".png":
    case ".jpg":
    case ".jpeg":
    case ".gif":
    case ".webp":
    case ".svg":
    case ".bmp":
      return "Images";
    case ".tex":
      return "livro-cuscuz";
    default:
      return null; // incerto
  }
}

function main() {
  const movidos: Array<[string, string]> = [];
  const protegidos: string[] = [];
  const incertos: string[] = [];

  for (const nome of readdirSync(ROOT).sort()) {
    if (nome.startsWith(".")) continue;
    const caminho = join(ROOT, nome);
    if (!statSync(caminho).isFile()) continue;

    if (PROTEGIDOS.has(nome.toLowerCase())) {
      protegidos.push(nome);
      continue;
    }
    if (NAO_MEXER_EXT.has(extname(nome).toLowerCase())) {
      incertos.push(`${nome}  (arquivo de configuração — não movido)`);
      continue;
    }

    const destino = destinoPara(nome);
    if (!destino) {
      incertos.push(`${nome}  (sem classificação confiável)`);
      continue;
    }

    const pastaDestino = join(ROOT, destino);
    const alvo = join(pastaDestino, nome);
    if (existsSync(alvo)) {
      incertos.push(`${nome}  (já existe em ${destino}/ — conflito)`);
      continue;
    }

    if (APPLY) {
      if (!existsSync(pastaDestino)) mkdirSync(pastaDestino, { recursive: true });
      renameSync(caminho, alvo);
    }
    movidos.push([nome, destino]);
  }

  console.log(APPLY ? "✅ MODO APLICAÇÃO — arquivos movidos:\n" : "🔍 MODO DRY-RUN — plano (nada foi movido):\n");

  if (movidos.length) {
    console.log("── MOVIDOS " + (APPLY ? "" : "(serão movidos) ") + "──────────────────────");
    for (const [nome, destino] of movidos) console.log(`  ${nome}  →  ${destino}/`);
  } else {
    console.log("── Nenhum arquivo para mover. Raiz já está limpa. 🎉");
  }

  if (protegidos.length) {
    console.log("\n── PROTEGIDOS (permanecem na raiz) ─────────────");
    for (const n of protegidos) console.log(`  ${n}`);
  }

  if (incertos.length) {
    console.log("\n── INCERTOS (decisão manual — nada movido) ─────");
    for (const n of incertos) console.log(`  ⚠️  ${n}`);
  }

  console.log(`\nResumo: ${movidos.length} movido(s), ${protegidos.length} protegido(s), ${incertos.length} incerto(s).`);
  if (!APPLY && movidos.length) console.log("👉 Rode com --apply para executar de fato.");
}

main();
