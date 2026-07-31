#!/usr/bin/env bun
/**
 * Registro de Gastos — CLI para registrar, consultar e exportar gastos
 *
 * Uso:
 *   bun run Skills/gastos/scripts/registro-gastos.ts adicionar --descricao "Almoço" --valor 50
 *   bun run Skills/gastos/scripts/registro-gastos.ts historico --mes 07
 *   bun run Skills/gastos/scripts/registro-gastos.ts totais
 *   bun run Skills/gastos/scripts/registro-gastos.ts export
 */

import { readFileSync, writeFileSync, existsSync } from "fs";

const GASTOS_FILE = "/home/workspace/financeiro/gastos_detalhados.md";
const EXPORT_FILE = "/home/workspace/financeiro/gastos_detalhados.txt";

const MOEDAS = ["BRL", "USD", "EUR", "GBP", "ARS", "JPY"] as const;
type Moeda = (typeof MOEDAS)[number];

interface Gasto {
  data: string; // DD/MM
  descricao: string;
  categoria: string;
  valor: number;
  moeda: Moeda;
  pagamento: string;
  obs: string;
}

interface Arquivo {
  intro: string;
  header: string[];
  rows: Gasto[];
  totais: string;
}

function help() {
  console.log(`
💸 Registro de Gastos — CLI

Comandos:
  adicionar     Registra um novo gasto
  historico     Lista gastos (filtros: --mes, --categoria, --moeda, --limite)
  totais        Mostra totais por mês e por categoria
  export        Gera gastos_detalhados.txt
  help          Mostra esta ajuda

Opções (adicionar):
  --data=DD/MM          Data (padrão: hoje, fuso America/Sao_Paulo)
  --descricao="texto"   Descrição do gasto (obrigatório)
  --valor=N             Valor (obrigatório)
  --moeda=XXX           BRL | USD | EUR | GBP | ARS | JPY (padrão: BRL)
  --categoria="texto"   Categoria (padrão: Outros)
  --pagamento="texto"   Forma de pagamento (padrão: —)
  --obs="texto"         Observação livre

Exemplos:
  bun run $0 adicionar --descricao "Upgrade Qwen Cloud" --valor 11 --moeda USD
  bun run $0 adicionar --data 25/07 --descricao "VPS" --valor 100 --categoria "Assinatura/Serviço" --pagamento "Nubank"
  bun run $0 historico --mes 07
  bun run $0 totais
  bun run $0 export
`);
}

function nowBR() {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}`;
}

function fmtValor(valor: number, moeda: Moeda): string {
  const valorStr = valor.toFixed(2).replace(".", ",");
  if (moeda === "BRL") return `R$ ${valorStr}`;
  return `${moeda} ${valorStr}`;
}

function parseValor(str: string): { valor: number; moeda: Moeda } {
  str = str.trim();
  for (const m of MOEDAS) {
    const re = new RegExp(`^${m}\\s*([\\d.,]+)$`, "i");
    const match = str.match(re);
    if (match) {
      return { valor: parseFloat(match[1].replace(/\./g, "").replace(",", ".")), moeda: m };
    }
  }
  const re = /^R\$\s*([\d.,]+)$/;
  const match = str.match(re);
  if (match) {
    return { valor: parseFloat(match[1].replace(/\./g, "").replace(",", ".")), moeda: "BRL" };
  }
  return { valor: parseFloat(str.replace(/\./g, "").replace(",", ".")), moeda: "BRL" };
}

function parseTabela(content: string): Arquivo {
  const lines = content.split("\n");
  const intro: string[] = [];
  const header: string[] = [];
  const rows: Gasto[] = [];
  let totais = "";
  let mode: "intro" | "table" | "totais" = "intro";

  for (const line of lines) {
    if (line.startsWith("| Data |") && line.includes("Descrição")) {
      mode = "table";
      header.push(line);
      continue;
    }
    if (line.startsWith("|------") || line.startsWith("| ---")) {
      if (mode === "table") {
        header.push(line);
        continue;
      }
    }
    if (line.startsWith("## Totais por mês")) {
      mode = "totais";
      totais = line + "\n";
      continue;
    }
    if (mode === "intro") {
      intro.push(line);
    } else if (mode === "table") {
      if (line.startsWith("|")) {
        const cells = line
          .split("|")
          .map((c) => c.trim())
          .filter((c) => c !== "");
        if (cells.length >= 6 && /^\d{2}\/\d{2}$/.test(cells[0])) {
          const { valor, moeda } = parseValor(cells[3]);
          rows.push({
            data: cells[0],
            descricao: cells[1],
            categoria: cells[2],
            valor,
            moeda,
            pagamento: cells[4],
            obs: cells[5],
          });
        }
      } else if (line.trim() === "") {
        // skip empty lines within table section
      } else {
        mode = "totais";
        if (line.trim()) totais += line + "\n";
      }
    } else if (mode === "totais") {
      if (line.trim()) totais += line + "\n";
    }
  }

  return { intro: intro.join("\n"), header, rows, totais: totais.trimEnd() };
}

function renderTabela(arquivo: Arquivo): string {
  const intro = arquivo.intro.replace(/\n+$/, "");
  const header =
    arquivo.header.length > 0
      ? arquivo.header
      : [
          "| Data | Descrição | Categoria | Valor | Pagamento | Obs |",
          "|------|-----------|-----------|------:|-----------|-----|",
        ];

  const rows = arquivo.rows.map((r) => {
    return `| ${r.data} | ${r.descricao} | ${r.categoria} | ${fmtValor(r.valor, r.moeda)} | ${r.pagamento} | ${r.obs} |`;
  });

  return [
    intro,
    "",
    ...header,
    ...rows,
    "",
    arquivo.totais,
    "",
  ].join("\n");
}

function calcTotais(rows: Gasto[]): string {
  const meses = new Map<string, Map<Moeda, number>>();
  const categorias = new Map<string, Map<Moeda, number>>();

  for (const r of rows) {
    const [dd, mm] = r.data.split("/");
    const mesKey = `${mm}/2026`;
    if (!meses.has(mesKey)) meses.set(mesKey, new Map());
    const mesMap = meses.get(mesKey)!;
    mesMap.set(r.moeda, (mesMap.get(r.moeda) || 0) + r.valor);

    if (!categorias.has(r.categoria)) categorias.set(r.categoria, new Map());
    const catMap = categorias.get(r.categoria)!;
    catMap.set(r.moeda, (catMap.get(r.moeda) || 0) + r.valor);
  }

  const mesNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const totaisLinhas: string[] = ["## Totais por mês", ""];
  const sortedMeses = Array.from(meses.keys()).sort();
  for (const mes of sortedMeses) {
    const [mm] = mes.split("/");
    const mesNome = mesNames[parseInt(mm) - 1];
    const totaisPorMoeda = Array.from(meses.get(mes)!.entries())
      .map(([moeda, valor]) => fmtValor(valor, moeda))
      .join(" + ");
    totaisLinhas.push(`- **${mesNome}/2026:** ${totaisPorMoeda}`);
  }

  if (categorias.size > 0) {
    totaisLinhas.push("", "### Por categoria", "");
    for (const [cat, mapa] of Array.from(categorias.entries()).sort()) {
      const totaisPorMoeda = Array.from(mapa.entries())
        .map(([moeda, valor]) => fmtValor(valor, moeda))
        .join(" + ");
      totaisLinhas.push(`- **${cat}:** ${totaisPorMoeda}`);
    }
  }

  totaisLinhas.push("", "> Vou adicionando aqui cada gasto que fizer e você pode me perguntar o histórico quando quiser.");
  return totaisLinhas.join("\n");
}

function adicionar(args: Record<string, string>) {
  const descricao = args["--descricao"];
  const valorStr = args["--valor"];
  if (!descricao || !valorStr) {
    console.error("❌ Uso: --descricao=\"...\" --valor=N");
    console.error("   Exemplo: adicionar --descricao \"Upgrade Qwen Cloud\" --valor 11 --moeda USD");
    process.exit(1);
  }

  const moeda = ((args["--moeda"] || "BRL").toUpperCase() as Moeda);
  if (!MOEDAS.includes(moeda)) {
    console.error(`❌ Moeda inválida: ${moeda}. Use uma de: ${MOEDAS.join(", ")}`);
    process.exit(1);
  }

  const valor = parseFloat(valorStr.replace(",", "."));
  if (isNaN(valor) || valor <= 0) {
    console.error(`❌ Valor inválido: ${valorStr}`);
    process.exit(1);
  }

  const data = args["--data"] || nowBR();
  if (!/^\d{2}\/\d{2}$/.test(data)) {
    console.error(`❌ Data inválida: ${data}. Use formato DD/MM (ex: 26/07)`);
    process.exit(1);
  }

  const categoria = args["--categoria"] || "Outros";
  const pagamento = args["--pagamento"] || "—";
  const obs = args["--obs"] || "—";

  const novoGasto: Gasto = { data, descricao, categoria, valor, moeda, pagamento, obs };

  let arquivo: Arquivo;
  if (existsSync(GASTOS_FILE)) {
    arquivo = parseTabela(readFileSync(GASTOS_FILE, "utf-8"));
  } else {
    arquivo = {
      intro: "# Registro de Gastos Detalhados\n\n> Aqui vou anotando tudo que comprei, dia a dia.",
      header: [],
      rows: [],
      totais: "",
    };
  }

  // Inserir no topo (mais recente primeiro)
  arquivo.rows.unshift(novoGasto);
  arquivo.totais = calcTotais(arquivo.rows);

  writeFileSync(GASTOS_FILE, renderTabela(arquivo) + "\n");
  console.log(`✅ Registrado: ${descricao} — ${fmtValor(valor, moeda)} (${data})`);
  console.log(`   Categoria: ${categoria} | Pagamento: ${pagamento}`);
  console.log(`   Arquivo: ${GASTOS_FILE}`);
}

function historico(args: Record<string, string>) {
  if (!existsSync(GASTOS_FILE)) {
    console.error("❌ Arquivo de gastos não encontrado:", GASTOS_FILE);
    process.exit(1);
  }

  const arquivo = parseTabela(readFileSync(GASTOS_FILE, "utf-8"));
  let rows = arquivo.rows;

  if (args["--mes"]) {
    const mes = args["--mes"].padStart(2, "0");
    rows = rows.filter((r) => r.data.endsWith(`/${mes}`));
  }
  if (args["--categoria"]) {
    const cat = args["--categoria"];
    rows = rows.filter((r) => r.categoria.toLowerCase().includes(cat.toLowerCase()));
  }
  if (args["--moeda"]) {
    const m = args["--moeda"].toUpperCase() as Moeda;
    rows = rows.filter((r) => r.moeda === m);
  }
  if (args["--limite"]) {
    rows = rows.slice(0, parseInt(args["--limite"]));
  }

  if (rows.length === 0) {
    console.log("📭 Nenhum gasto encontrado com os filtros aplicados.");
    return;
  }

  console.log(`\n📋 Histórico (${rows.length} ${rows.length === 1 ? "gasto" : "gastos"})\n`);
  console.log("| Data | Descrição | Categoria | Valor | Pagamento |");
  console.log("|------|-----------|-----------|-------|-----------|");
  for (const r of rows) {
    console.log(`| ${r.data} | ${r.descricao} | ${r.categoria} | ${fmtValor(r.valor, r.moeda)} | ${r.pagamento} |`);
  }
  console.log("");
}

function totais() {
  if (!existsSync(GASTOS_FILE)) {
    console.error("❌ Arquivo de gastos não encontrado:", GASTOS_FILE);
    process.exit(1);
  }

  const arquivo = parseTabela(readFileSync(GASTOS_FILE, "utf-8"));
  if (arquivo.rows.length === 0) {
    console.log("📭 Nenhum gasto registrado ainda.");
    return;
  }

  console.log(calcTotais(arquivo.rows));
}

function exportar() {
  if (!existsSync(GASTOS_FILE)) {
    console.error("❌ Arquivo de gastos não encontrado:", GASTOS_FILE);
    process.exit(1);
  }
  const content = readFileSync(GASTOS_FILE, "utf-8");
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
  case "adicionar":
  case "add":
    adicionar(args);
    break;
  case "historico":
  case "listar":
  case "list":
    historico(args);
    break;
  case "totais":
  case "total":
    totais();
    break;
  case "export":
  case "exportar":
    exportar();
    break;
  case "help":
  default:
    help();
    break;
}
