#!/usr/bin/env bun

/**
 * Polymarket Intelligence — coleta dados ao vivo da Gamma API
 * e gera um resumo estruturado para análise de tendências.
 *
 * Uso:
 *   bun polymarket-analysis.ts
 *   bun polymarket-analysis.ts --category politics --limit 20
 *   bun polymarket-analysis.ts --help
 */

const GAMMA_API = "https://gamma-api.polymarket.com";

interface Market {
  conditionId: string;
  question: string;
  description?: string;
  outcomes?: string;
  outcomePrices?: string;
  volume: string;
  volume24hr: string;
  liquidity?: string;
  startDate?: string;
  endDate?: string;
  closed?: boolean;
  slug?: string;
  tag?: string;
  negRisk?: boolean;
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(`Polymarket Intelligence — Coleta de Dados

Uso:
  bun polymarket-analysis.ts                     — Top mercados globais
  bun polymarket-analysis.ts --category politics  — Filtrar por categoria
  bun polymarket-analysis.ts --limit 20           — Limitar resultados
  bun polymarket-analysis.ts --help               — Ajuda

Categorias comuns: politics, crypto, sports, economics, geopolitics, science`);
    process.exit(0);
  }

  let category = "";
  let limit = 15;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--category" && i + 1 < args.length) {
      category = args[++i];
    } else if (args[i] === "--limit" && i + 1 < args.length) {
      limit = parseInt(args[++i], 10);
    }
  }

  return { category, limit };
}

async function fetchJSON(url: string): Promise<any> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ao buscar ${url}`);
  }
  return response.json();
}

function parsePrices(outcomePrices: string | undefined): number[] {
  if (!outcomePrices) return [];
  try {
    const parsed = JSON.parse(outcomePrices);
    return parsed.map((p: string) => Math.round(parseFloat(p) * 10000) / 100);
  } catch {
    return [];
  }
}

function parseOutcomes(outcomes: string | undefined): string[] {
  if (!outcomes) return [];
  try {
    const parsed = JSON.parse(outcomes);
    return parsed.map((o: any) => (typeof o === "string" ? o : o.name || ""));
  } catch {
    return [];
  }
}

function formatVolume(v: string | undefined): string {
  if (!v) return "$0";
  const n = parseFloat(v);
  if (isNaN(n)) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function volatilityLabel(prices: number[], vol24hr: string): string {
  const vol = parseFloat(vol24hr) || 0;
  if (prices.length < 2) return "Baixo";

  const spread = Math.abs(prices[0] - (prices[1] || 0));
  if (spread > 30 || vol > 500_000) return "Alto";
  if (spread > 10 || vol > 100_000) return "Médio";
  return "Baixo";
}

async function main() {
  const { category, limit } = parseArgs();

  console.log("═".repeat(72));
  console.log("  POLYMARKET INTELLIGENCE — Relatório de Mercado");
  console.log(`  ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC`);
  if (category) console.log(`  Categoria: ${category}`);
  console.log("═".repeat(72));
  console.log();

  // 1. Buscar mercados ativos ordenados por volume 24h
  const params = new URLSearchParams({
    closed: "false",
    order: "volume24hr",
    ascending: "false",
    limit: String(limit),
  });
  if (category) params.set("tag_slug", category);

  console.log("📡 Buscando mercados...\n");

  let markets: Market[];
  try {
    markets = await fetchJSON(`${GAMMA_API}/markets?${params.toString()}`);
  } catch (err) {
    console.error("❌ Erro ao conectar com a Gamma API do Polymarket.");
    console.error(`   ${err}`);
    console.error("\n   Verifique sua conexão ou tente novamente mais tarde.");
    process.exit(1);
  }

  if (!markets || markets.length === 0) {
    console.log("Nenhum mercado encontrado.");
    if (category) {
      console.log(`Tente remover o filtro --category "${category}" ou usar outra categoria.`);
    }
    process.exit(0);
  }

  console.log(`📊 ${markets.length} mercados mais líquidos encontrados:\n`);

  for (let i = 0; i < markets.length; i++) {
    const m = markets[i];
    const prices = parsePrices(m.outcomePrices);
    const outcomes = parseOutcomes(m.outcomes);
    const volLabel = formatVolume(m.volume24hr);
    const volTotal = formatVolume(m.volume);
    const risk = volatilityLabel(prices, m.volume24hr);
    const probYes = prices.length > 0 ? `${prices[0]}%` : "N/A";

    console.log(`  ${String(i + 1).padEnd(2)}. ${m.question}`);
    console.log(`     └─ Probabilidade (Yes): ${probYes.padEnd(6)}  Vol 24h: ${volLabel.padEnd(10)}  Vol Total: ${volTotal}`);
    if (outcomes.length > 0) {
      console.log(`     └─ Outcomes: ${outcomes.join(" | ")}`);
    }
    console.log(`     └─ Risco: ${risk}  |  Slug: ${m.slug || "—"}  |  Tag: ${m.tag || "—"}`);
    if (m.endDate) {
      const end = new Date(m.endDate);
      console.log(`     └─ Resolução: ${end.toISOString().replace("T", " ").slice(0, 16)} UTC`);
    }
    console.log();
  }

  // 2. Agrupar por categoria (tag)
  const tagGroups: Record<string, Market[]> = {};
  for (const m of markets) {
    const tag = m.tag || "outros";
    if (!tagGroups[tag]) tagGroups[tag] = [];
    tagGroups[tag].push(m);
  }

  const tagKeys = Object.keys(tagGroups).sort();
  if (tagKeys.length > 1) {
    console.log("📂 Distribuição por categoria:\n");
    for (const tag of tagKeys) {
      const group = tagGroups[tag];
      const totalVol = group.reduce((s, m) => s + (parseFloat(m.volume24hr) || 0), 0);
      console.log(`  • ${tag}: ${group.length} mercados, ${formatVolume(String(totalVol))} volume 24h`);
    }
    console.log();
  }

  // 3. Detectar oscilações — mercados com probabilidade mais no limite (35-65%)
  const competitive = markets.filter((m) => {
    const prices = parsePrices(m.outcomePrices);
    return prices.length > 0 && prices[0] > 35 && prices[0] < 65;
  });

  if (competitive.length > 0) {
    console.log("⚡ Mercados competitivos (probabilidade entre 35%-65%):\n");
    for (const m of competitive.slice(0, 5)) {
      const prices = parsePrices(m.outcomePrices);
      const risk = volatilityLabel(prices, m.volume24hr);
      console.log(`  • ${m.question}`);
      console.log(`    Yes: ${prices[0]}%  |  No: ${prices.length > 1 ? prices[1] + "%" : "—"}  |  Risco: ${risk}`);
    }
    console.log();
  }

  // 4. Salva JSON para consumo programático
  const summary = {
    fetchedAt: new Date().toISOString(),
    category: category || "all",
    totalMarkets: markets.length,
    topMarkets: markets.map((m) => ({
      question: m.question,
      slug: m.slug,
      tag: m.tag,
      probYes: parsePrices(m.outcomePrices)[0] ?? null,
      volume24hr: parseFloat(m.volume24hr) || 0,
      volume: parseFloat(m.volume) || 0,
      risk: volatilityLabel(parsePrices(m.outcomePrices), m.volume24hr),
      endDate: m.endDate,
    })),
    tagDistribution: tagKeys.map((t) => ({
      tag: t,
      count: tagGroups[t].length,
      volume24hr: tagGroups[t].reduce((s, m) => s + (parseFloat(m.volume24hr) || 0), 0),
    })),
    competitiveMarkets: competitive.slice(0, 5).map((m) => ({
      question: m.question,
      prices: parsePrices(m.outcomePrices),
    })),
  };

  const fs = await import("fs");
  const outputPath = "/home/workspace/Skills/polymarket-intelligence/assets/latest-data.json";
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));

  console.log("─".repeat(72));
  console.log("✅ Relatório concluído.");
  console.log(`📁 Dados brutos salvos em: Skills/polymarket-intelligence/assets/latest-data.json`);
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
