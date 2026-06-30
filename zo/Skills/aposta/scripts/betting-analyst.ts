#!/usr/bin/env bun
/**
 * Sports Betting Analyst — Análise completa de apostas esportivas
 * Busca odds, histórico, confrontos diretos e calcula value bets.
 */

import { writeFileSync } from "fs";

// ============ TIPOS ============

interface OddsEntry {
  house: string;
  home: number;
  draw: number;
  away: number;
  timestamp: string;
}

interface MatchStats {
  homeGoalsScored: number;
  homeGoalsConceded: number;
  awayGoalsScored: number;
  awayGoalsConceded: number;
  homeForm: string[];
  awayForm: string[];
  h2h: { home: number; draw: number; away: number };
}

interface BetRecommendation {
  market: string;
  pick: string;
  odds: number;
  house: string;
  confidence: number;
  reasoning: string;
  value: number; // expected value %
}

interface AnalysisResult {
  match: string;
  date: string;
  competition: string;
  venue: string;
  odds: OddsEntry[];
  stats: MatchStats | null;
  recommendations: BetRecommendation[];
  summary: string;
}

// ============ CONFIG ============

const ODDS_SOURCES = [
  { name: "bet365", url: "https://www.bet365.com/#/AC/B1/C1/D100/E9876543/F2/" },
  { name: "1xbet", url: "https://br.1xbet.com/line/Football/" },
  { name: "betano", url: "https://www.betano.com/esportes/futebol/copa-do-mundo/" },
  { name: "betclic", url: "https://www.betclic.com/br/futebol/copa-do-mundo" },
  { name: "betnacional", url: "https://www.betnacional.com/esportes/futebol/internacional" },
  { name: "kto", url: "https://www.kto.com/esportes/futebol/internacional" },
];

// ============ HELPERS ============

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function impliedProbability(odds: number): number {
  return 1 / odds;
}

function decimalToAmerican(odds: number): string {
  if (odds >= 2) return `+${Math.round((odds - 1) * 100)}`;
  return `${Math.round(-100 / (odds - 1))}`;
}

// ============ ANÁLISE DE VALUE BET ============

function calculateValue(trueProb: number, odds: number): number {
  return (trueProb * odds - 1) * 100;
}

function calculateKelly(trueProb: number, odds: number): number {
  const b = odds - 1;
  const q = 1 - trueProb;
  return (b * trueProb - q) / b;
}

// ============ MODELO ESTATÍSTICO SIMPLIFICADO ============

function estimateTrueProbabilities(
  odds: OddsEntry[],
  stats: MatchStats | null
): { home: number; draw: number; away: number } {
  // Média das probabilidades implícitas das casas
  const avgHome = avg(odds.map((o) => impliedProbability(o.home)));
  const avgDraw = avg(odds.map((o) => impliedProbability(o.draw)));
  const avgAway = avg(odds.map((o) => impliedProbability(o.away)));

  // Margem da casa (overround)
  const overround = avgHome + avgDraw + avgAway;

  // Normalizar removendo margem
  let home = avgHome / overround;
  let draw = avgDraw / overround;
  let away = avgAway / overround;

  // Ajuste com estatísticas se disponíveis
  if (stats) {
    const homeStrength =
      (stats.homeGoalsScored / Math.max(stats.homeGoalsConceded, 1) +
        stats.h2h.home * 2) /
      3;
    const awayStrength =
      (stats.awayGoalsScored / Math.max(stats.awayGoalsConceded, 1) +
        stats.h2h.away * 2) /
      3;

    const formHome =
      stats.homeForm.filter((r) => r === "W").length / stats.homeForm.length;
    const formAway =
      stats.awayForm.filter((r) => r === "W").length / stats.awayForm.length;

    // Peso: 60% odds do mercado, 40% estatísticas
    home = home * 0.6 + (homeStrength / (homeStrength + awayStrength)) * 0.25 + formHome * 0.15;
    away = away * 0.6 + (awayStrength / (homeStrength + awayStrength)) * 0.25 + formAway * 0.15;
    draw = 1 - home - away;

    // Garantir que draw não seja negativo
    if (draw < 0.05) {
      draw = 0.05;
      const total = home + away;
      home = (home / total) * 0.95;
      away = (away / total) * 0.95;
    }
  }

  return { home, draw, away };
}

// ============ GERAÇÃO DE RECOMENDAÇÕES ============

function generateRecommendations(
  odds: OddsEntry[],
  probs: { home: number; draw: number; away: number },
  homeTeam: string,
  awayTeam: string
): BetRecommendation[] {
  const recs: BetRecommendation[] = [];

  // 1. Resultado Final
  const markets = [
    { name: "Vitória " + homeTeam, prob: probs.home, outcomes: odds.map((o) => ({ house: o.house, odds: o.home })) },
    { name: "Empate", prob: probs.draw, outcomes: odds.map((o) => ({ house: o.house, odds: o.draw })) },
    { name: "Vitória " + awayTeam, prob: probs.away, outcomes: odds.map((o) => ({ house: o.house, odds: o.away })) },
  ];

  for (const market of markets) {
    // Encontrar melhor odd para este mercado
    const best = market.outcomes.reduce((a, b) => (a.odds > b.odds ? a : b));
    const value = calculateValue(market.prob, best.odds);
    if (value > 0) {
      recs.push({
        market: "Resultado Final",
        pick: market.name,
        odds: best.odds,
        house: best.house,
        confidence: Math.round(market.prob * 100),
        reasoning: `Prob. estimada: ${(market.prob * 100).toFixed(1)}% | Value: +${value.toFixed(1)}%`,
        value,
      });
    }
  }

  // 2. Under/Over 2.5 gols (estimativa baseada em médias)
  const avgTotalGoals = probs.home * 1.5 + probs.away * 1.3 + probs.draw * 1.0;
  if (avgTotalGoals > 2.0) {
    const overOdds = 1.85;
    const overProb = Math.min(avgTotalGoals / 3, 0.7);
    const value = calculateValue(overProb, overOdds);
    if (value > -2) {
      recs.push({
        market: "Gols",
        pick: "Over 2.5 gols",
        odds: overOdds,
        house: "estimativa",
        confidence: Math.round(overProb * 100),
        reasoning: `Média estimada de gols: ${avgTotalGoals.toFixed(1)} | Value: ${value > 0 ? "+" : ""}${value.toFixed(1)}%`,
        value,
      });
    }
  } else {
    const underOdds = 1.75;
    const underProb = 1 - Math.min(avgTotalGoals / 3, 0.6);
    const value = calculateValue(underProb, underOdds);
    if (value > -2) {
      recs.push({
        market: "Gols",
        pick: "Under 2.5 gols",
        odds: underOdds,
        house: "estimativa",
        confidence: Math.round(underProb * 100),
        reasoning: `Média estimada de gols: ${avgTotalGoals.toFixed(1)} | Value: ${value > 0 ? "+" : ""}${value.toFixed(1)}%`,
        value,
      });
    }
  }

  // 3. Ambas Marcam
  const bttsYesProb = (probs.home * 0.6 + probs.away * 0.5) / 2 + 0.15;
  const bttsYesOdds = 2.0;
  const bttsValue = calculateValue(bttsYesProb, bttsYesOdds);
  if (bttsValue > -3) {
    recs.push({
      market: "Ambas Marcam",
      pick: "Sim",
      odds: bttsYesOdds,
      house: "estimativa",
      confidence: Math.round(bttsYesProb * 100),
      reasoning: `Prob. estimada BTTS: ${(bttsYesProb * 100).toFixed(1)}% | Value: ${bttsValue > 0 ? "+" : ""}${bttsValue.toFixed(1)}%`,
      value: bttsValue,
    });
  }

  // Ordenar por value (melhor primeiro)
  recs.sort((a, b) => b.value - a.value);

  return recs;
}

// ============ FORMATAÇÃO DO RELATÓRIO ============

function formatReport(
  match: string,
  date: string,
  competition: string,
  odds: OddsEntry[],
  probs: { home: number; draw: number; away: number },
  recs: BetRecommendation[],
  stats: MatchStats | null
): string {
  const lines: string[] = [];
  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push("  ⚽ SPORTS BETTING ANALYST — Relatório de Análise");
  lines.push(`  ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);
  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push("");
  lines.push(`📋 JOGO: ${match}`);
  lines.push(`📅 DATA: ${date}`);
  lines.push(`🏆 COMPETIÇÃO: ${competition}`);
  lines.push("");

  // Tabela de odds
  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("📊 ODDS — Resultado Final");
  lines.push("───────────────────────────────────────────────────────────────");
  lines.push(
    `${"Casa".padEnd(14)} ${"Casa".padStart(8)} ${"Empate".padStart(8)} ${"Fora".padStart(8)}`
  );
  lines.push("─".repeat(42));
  for (const o of odds) {
    lines.push(
      `${o.house.padEnd(14)} ${o.home.toFixed(2).padStart(8)} ${o.draw.toFixed(2).padStart(8)} ${o.away.toFixed(2).padStart(8)}`
    );
  }
  lines.push("");

  // Probabilidades estimadas
  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("🔮 PROBABILIDADES ESTIMADAS");
  lines.push("───────────────────────────────────────────────────────────────");
  const teams = match.split(" x ");
  lines.push(`  ${teams[0]?.trim() || "Casa"}: ${(probs.home * 100).toFixed(1)}%`);
  lines.push(`  Empate: ${(probs.draw * 100).toFixed(1)}%`);
  lines.push(`  ${teams[1]?.trim() || "Fora"}: ${(probs.away * 100).toFixed(1)}%`);
  lines.push("");

  // Estatísticas se disponíveis
  if (stats) {
    lines.push("───────────────────────────────────────────────────────────────");
    lines.push("📈 ESTATÍSTICAS");
    lines.push("───────────────────────────────────────────────────────────────");
    lines.push(`  ${teams[0]?.trim() || "Casa"}: ${stats.homeGoalsScored}G pró / ${stats.homeGoalsConceded}G contra`);
    lines.push(`  ${teams[1]?.trim() || "Fora"}: ${stats.awayGoalsScored}G pró / ${stats.awayGoalsConceded}G contra`);
    lines.push(`  Forma ${teams[0]?.trim() || "Casa"}: ${stats.homeForm.join(" ")}`);
    lines.push(`  Forma ${teams[1]?.trim() || "Fora"}: ${stats.awayForm.join(" ")}`);
    lines.push(`  H2H: ${stats.h2h.home}V / ${stats.h2h.draw}E / ${stats.h2h.away}D`);
    lines.push("");
  }

  // Recomendações
  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("✅ RECOMENDAÇÕES DE APOSTAS");
  lines.push("───────────────────────────────────────────────────────────────");

  if (recs.length === 0) {
    lines.push("  Nenhuma aposta com value positivo identificada.");
    lines.push("  Recomendação: NÃO APOSTAR neste jogo.");
  } else {
    for (let i = 0; i < recs.length; i++) {
      const r = recs[i];
      const stars = r.value > 5 ? "★★★" : r.value > 2 ? "★★☆" : "★☆☆";
      lines.push("");
      lines.push(`  ${i + 1}. ${stars} ${r.market} — ${r.pick}`);
      lines.push(`     Odd: ${r.odds.toFixed(2)} (${r.house}) | Confiança: ${r.confidence}%`);
      lines.push(`     ${r.reasoning}`);
    }
  }

  lines.push("");
  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("⚠️  DISCLAIMER: Apostas envolvem risco. Nenhuma análise garante");
  lines.push("    resultado. Aposte com responsabilidade.");
  lines.push("═══════════════════════════════════════════════════════════════");

  return lines.join("\n");
}

// ============ CLI ============

function printHelp() {
  console.log(`
Sports Betting Analyst — Análise completa de apostas esportivas

Uso:
  bun run betting-analyst.ts [opções]

Opções:
  --match "Time A x Time B"    Nome do jogo (obrigatório)
  --date "DD/MM/AAAA HH:MM"    Data e hora do jogo
  --competition "Copa 2026"    Nome da competição
  --odds-file <path>           JSON com odds pré-coletadas
  --stats-file <path>          JSON com estatísticas pré-coletadas
  --output <path>              Arquivo de saída (padrão: stdout)
  --help                       Mostra esta ajuda

Exemplo:
  bun run betting-analyst.ts --match "Brasil x Argentina" --date "28/06/2026 16:00" --competition "Copa do Mundo 2026"

Formato do --odds-file (JSON):
  [{ "house": "bet365", "home": 1.85, "draw": 3.40, "away": 4.50 }, ...]

Formato do --stats-file (JSON):
  {
    "homeGoalsScored": 12, "homeGoalsConceded": 3,
    "awayGoalsScored": 8, "awayGoalsConceded": 5,
    "homeForm": ["W","W","D","L","W"],
    "awayForm": ["W","D","W","W","L"],
    "h2h": { "home": 3, "draw": 2, "away": 1 }
  }
`);
}

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "true";
      result[key] = val;
    }
  }
  return result;
}

// ============ MAIN ============

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.match) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const match = args.match;
  const date = args.date || "Não informada";
  const competition = args.competition || "Não informada";

  // Carregar odds do arquivo ou usar placeholder para preenchimento manual
  let odds: OddsEntry[] = [];
  if (args["odds-file"]) {
    try {
      const data = await Bun.file(args["odds-file"]).json();
      odds = data.map((o: any) => ({ ...o, timestamp: new Date().toISOString() }));
    } catch {
      console.error("Erro ao ler arquivo de odds:", args["odds-file"]);
    }
  }

  // Carregar stats do arquivo ou null
  let stats: MatchStats | null = null;
  if (args["stats-file"]) {
    try {
      stats = await Bun.file(args["stats-file"]).json();
    } catch {
      console.error("Erro ao ler arquivo de stats:", args["stats-file"]);
    }
  }

  // Calcular probabilidades
  const probs = estimateTrueProbabilities(odds, stats);

  // Gerar recomendações
  const teams = match.split(" x ");
  const recs = generateRecommendations(
    odds,
    probs,
    teams[0]?.trim() || "Casa",
    teams[1]?.trim() || "Fora"
  );

  // Gerar relatório
  const report = formatReport(match, date, competition, odds, probs, recs, stats);

  if (args.output) {
    writeFileSync(args.output, report);
    console.log(`Relatório salvo em: ${args.output}`);
  } else {
    console.log(report);
  }
}

main();
