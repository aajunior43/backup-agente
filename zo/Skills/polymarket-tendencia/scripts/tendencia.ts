#!/usr/bin/env bun
/**
 * Polymarket Tendência
 * Busca os mercados mais apostados no momento e gera análise.
 *
 * Uso: bun run tendencia.ts              # saída no terminal
 *      bun run tendencia.ts --save       # salva em Relatorios/Polymarket/
 */

const GAMMA_API = "https://gamma-api.polymarket.com";
const TOP_N = 20;
const SAVE_FLAG = "--save";

interface Market {
  question: string;
  volume: string;
  volume24hr: number;
  volume1wk: number;
  lastTradePrice: number;
  liquidity: string;
  endDate: string;
  slug: string;
  outcomes: string;
  outcomePrices: string;
  closed: boolean;
  active: boolean;
  events?: Array<{ title: string; category?: string; subcategory?: string }>;
  tags?: Array<{ label: string; slug: string }>;
}

function categorize(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("trump") || q.includes("biden") || q.includes("harris") ||
      q.includes("election") || q.includes("president") || q.includes("democrat") ||
      q.includes("republican") || q.includes("congress") || q.includes("senate") ||
      q.includes("shapiro") || q.includes("newsom") || q.includes("buttigieg") ||
      q.includes("ocasio") || q.includes("aoc") || q.includes("moore") ||
      q.includes("smith") || q.includes("xi")) return "🇺🇸 Política";
  if (q.includes("bitcoin") || q.includes("crypto") || q.includes("eth") ||
      q.includes("btc") || q.includes("ethereum") || q.includes("sol") ||
      q.includes("altcoin")) return "₿ Criptomoedas";
  if (q.includes("china") || q.includes("taiwan") || q.includes("russia") ||
      q.includes("ukraine") || q.includes("war") || q.includes("ceasefire") ||
      q.includes("nato") || q.includes("iran") || q.includes("israel") ||
      q.includes("gaza") || q.includes("houthi") || q.includes("nuclear") ||
      q.includes("sanction")) return "🌍 Geopolítica";
  if (q.includes("ai") || q.includes("openai") || q.includes("gpt") ||
      q.includes("claude") || q.includes("gemini") || q.includes("llama") ||
      q.includes("agi") || q.includes("artificial intelligence") ||
      q.includes("nvidia") || q.includes("apple") || q.includes("meta") ||
      q.includes("google") || q.includes("tech")) return "🤖 Tecnologia & IA";
  if (q.includes("gta") || q.includes("music") || q.includes("album") ||
      q.includes("rihanna") || q.includes("carti") || q.includes("drake") ||
      q.includes("movie") || q.includes("oscar") || q.includes("grammy") ||
      q.includes("sport") || q.includes("nba") || q.includes("nfl") ||
      q.includes("soccer") || q.includes("world cup") || q.includes("ufc") ||
      q.includes("boxing")) return "🎬 Cultura & Entretenimento";
  if (q.includes("fed") || q.includes("interest rate") || q.includes("inflation") ||
      q.includes("recession") || q.includes("stock") || q.includes("sp500") ||
      q.includes("s&p") || q.includes("dow") || q.includes("nasdaq") ||
      q.includes("market") || q.includes("economy")) return "📈 Economia";
  if (q.includes("covid") || q.includes("vaccine") || q.includes("health") ||
      q.includes("drug") || q.includes("fda") || q.includes("cancer")) return "🔬 Saúde & Ciência";
  if (q.includes("jesus") || q.includes("religion") || q.includes("space") ||
      q.includes("nasa") || q.includes("mars") || q.includes("moon") ||
      q.includes("asteroid") || q.includes("climate") || q.includes("elon")) return "🔭 Outros";
  return "📊 Diversos";
}

function formatPrice(p: number): string {
  return `${(p * 100).toFixed(0)}%`;
}

function formatDollar(v: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

function daysUntil(d: string): string {
  const end = new Date(d);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Encerrado";
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  return `${diff} dias`;
}

async function fetchMarkets(): Promise<Market[]> {
  // Fetch from trending tag and other high-volume tags
  const urls = [
    `${GAMMA_API}/markets?limit=50&closed=false&tag=trending`,
    `${GAMMA_API}/markets?limit=50&closed=false&tag=popular`,
  ];

  const seen = new Set<string>();
  const all: Market[] = [];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      for (const m of data) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          all.push(m);
        }
      }
    } catch { /* ignore */ }
  }

  // Sort by 24h volume descending
  all.sort((a, b) => (b.volume24hr || 0) - (a.volume24hr || 0));
  return all.slice(0, TOP_N);
}

function generateAnalysis(markets: Market[]): string {
  const categories = new Map<string, Market[]>();
  for (const m of markets) {
    const cat = categorize(m.question);
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(m);
  }

  let lines: string[] = [];

  // --- MARKET TABLE ---
  lines.push("## 📊 Top Mercados por Volume (24h)\n");
  lines.push("| # | Mercado | Preço (SIM) | Vol 24h | Vol Total | Expira |");
  lines.push("|---|---------|:-----------:|:-------:|:---------:|:------:|");
  markets.forEach((m, i) => {
    const price = m.lastTradePrice ?? 0.5;
    lines.push(
      `| ${i + 1} | ${m.question} | ${formatPrice(price)} | ${formatDollar(m.volume24hr || 0)} | ${formatDollar(Number(m.volume) || 0)} | ${daysUntil(m.endDate)} |`
    );
  });

  lines.push("");

  // --- ANALYSIS BY CATEGORY ---
  lines.push("## 🌎 O Que o Mercado Está Prevendo\n");

  for (const [cat, ms] of categories) {
    lines.push(`### ${cat}\n`);
    for (const m of ms) {
      const price = m.lastTradePrice ?? 0.5;
      const prob = formatPrice(price);
      const vol24 = formatDollar(m.volume24hr || 0);
      const volTotal = formatDollar(Number(m.volume) || 0);
      const votes = price > 0.5 ? "SIM" : "NÃO";

      // Interpretation
      let interpretation = "";
      const pct = price * 100;
      if (pct >= 95) interpretation = "📌 Praticamente certo — mercado acredita que isso vai acontecer.";
      else if (pct >= 75) interpretation = "✅ Muito provável — forte consenso entre os apostadores.";
      else if (pct >= 55) interpretation = "📊 Levemente favorável — ligeira vantagem para o SIM.";
      else if (pct >= 45) interpretation = "⚖️ Empate técnico — mercado dividido, qualquer resultado é possível.";
      else if (pct >= 25) interpretation = "❌ Improvável — mercado acredita que NÃO vai acontecer.";
      else if (pct >= 5) interpretation = "🚫 Muito improvável — forte consenso pelo NÃO.";
      else interpretation = "🧊 Quase descartado — chance mínima segundo o mercado.";

      lines.push(`**${m.question}**`);
      lines.push(`- Probabilidade: **${prob}** (apostando **${votes}**)`);
      lines.push(`- Volume 24h: ${vol24} · Volume total: ${volTotal}`);
      lines.push(`- Expira em: ${daysUntil(m.endDate)}`);
      lines.push(`- ${interpretation}`);
      lines.push("");
    }
  }

  // --- WORLD PREDICTIONS SUMMARY ---
  lines.push("---\n");
  lines.push("## 🔮 Resumo: Possíveis Acontecimentos Mundiais\n");
  lines.push("Baseado no que os apostadores do Polymarket estão financiando agora:\n");

  const highConfidence = markets.filter(m => (m.lastTradePrice ?? 0.5) >= 0.75);
  const mediumConfidence = markets.filter(m => {
    const p = m.lastTradePrice ?? 0.5;
    return p >= 0.45 && p < 0.75;
  });
  const lowConfidence = markets.filter(m => (m.lastTradePrice ?? 0.5) < 0.45);

  if (highConfidence.length > 0) {
    lines.push("### ✅ Cenários Mais Prováveis\n");
    for (const m of highConfidence) {
      const pct = ((m.lastTradePrice ?? 0.5) * 100).toFixed(0);
      lines.push(`- **${pct}%** → ${m.question}`);
    }
    lines.push("");
  }

  if (mediumConfidence.length > 0) {
    lines.push("### ⚖️ Cenários Incertos (Divididos)\n");
    for (const m of mediumConfidence) {
      const pct = ((m.lastTradePrice ?? 0.5) * 100).toFixed(0);
      lines.push(`- **${pct}%** → ${m.question}`);
    }
    lines.push("");
  }

  if (lowConfidence.length > 0) {
    lines.push("### ❌ Cenários Improváveis\n");
    for (const m of lowConfidence) {
      const pct = ((m.lastTradePrice ?? 0.5) * 100).toFixed(0);
      lines.push(`- **${pct}%** → ${m.question}`);
    }
    lines.push("");
  }

  // Overall pulse
  const politics = markets.filter(m => categorize(m.question).includes("Política")).length;
  const geo = markets.filter(m => categorize(m.question).includes("Geopolítica")).length;
  const cryptoMarkets = markets.filter(m => categorize(m.question).includes("Cripto")).length;
  const tech = markets.filter(m => categorize(m.question).includes("Tecnologia")).length;
  const culture = markets.filter(m => categorize(m.question).includes("Cultura")).length;

  lines.push("### 📡 Pulso do Momento\n");
  lines.push(`**Política:** ${politics} mercados · **Geopolítica:** ${geo} · **Cripto:** ${cryptoMarkets} · **Tecnologia:** ${tech} · **Cultura/Entretenimento:** ${culture}`);
  lines.push("");
  lines.push(`📅 Gerado em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} via Gamma API do Polymarket.`);

  return lines.join("\n");
}

async function main() {
  const saveToFile = process.argv.includes(SAVE_FLAG);

  console.log("🔍 Buscando mercados mais apostados no Polymarket...\n");

  const markets = await fetchMarkets();

  if (markets.length === 0) {
    console.error("Nenhum mercado encontrado.");
    process.exit(1);
  }

  const report = generateAnalysis(markets);

  if (saveToFile) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const dir = "/home/workspace/Relatorios/Polymarket";
    const filePath = `${dir}/polymarket-tendencia-${dateStr}.md`;

    await Bun.write(filePath, `# Polymarket — Tendências ${dateStr}\n\n${report}`);
    console.log(`✅ Relatório salvo em: ${filePath}`);
  } else {
    console.log(report);
  }
}

main().catch(console.error);
