#!/usr/bin/env bun
/**
 * 📦 Rastreamento de Pedidos — CLI
 *
 * Uso:
 *   bun run Skills/rastreamento/scripts/rastreamento.ts adicionar --codigo=AP... --descricao="..."
 *   bun run Skills/rastreamento/scripts/rastreamento.ts listar [--entregues]
 *   bun run Skills/rastreamento/scripts/rastreamento.ts checar --codigo=AP...
 *   bun run Skills/rastreamento/scripts/rastreamento.ts entregar --codigo=AP...
 *   bun run Skills/rastreamento/scripts/rastreamento.ts remover --codigo=AP...
 *   bun run Skills/rastreamento/scripts/rastreamento.ts resumo
 *   bun run Skills/rastreamento/scripts/rastreamento.ts checar-todos
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "fs";
import { dirname } from "path";

const PEDIDOS_DIR = "/home/workspace/pedidos";
const PEDIDOS_JSON = `${PEDIDOS_DIR}/rastreamento.json`;
const PEDIDOS_MD = `${PEDIDOS_DIR}/rastreamento.md`;
const HISTORICO = `${PEDIDOS_DIR}/historico.jsonl`;

interface Evento {
  data: string; // DD/MM/YYYY HH:MM
  local?: string;
  status: string;
}

interface Pedido {
  codigo: string;
  descricao: string;
  transportadora: string;
  url_loja?: string;
  adicionado_em: string; // ISO
  ultima_atualizacao?: string; // ISO
  status_atual?: string;
  previsao_entrega?: string; // DD/MM/YYYY
  ultima_posicao?: string;
  historico: Evento[];
  entregue: boolean;
  entregue_em?: string;
}

interface DB {
  pedidos: Pedido[];
}

function ensureDirs() {
  if (!existsSync(PEDIDOS_DIR)) mkdirSync(PEDIDOS_DIR, { recursive: true });
}

function load(): DB {
  ensureDirs();
  if (!existsSync(PEDIDOS_JSON)) {
    return { pedidos: [] };
  }
  const raw = readFileSync(PEDIDOS_JSON, "utf-8");
  try {
    return JSON.parse(raw) as DB;
  } catch (e) {
    console.error(`❌ Erro ao ler ${PEDIDOS_JSON}: ${(e as Error).message}`);
    return { pedidos: [] };
  }
}

function save(db: DB) {
  ensureDirs();
  writeFileSync(PEDIDOS_JSON, JSON.stringify(db, null, 2) + "\n");
  renderMd(db);
  // Garantir que o diretório do histórico existe
  if (!existsSync(dirname(HISTORICO))) mkdirSync(dirname(HISTORICO), { recursive: true });
}

function appendHistorico(pedido: Pedido, evento: { tipo: string; status?: string; posicao?: string }) {
  const entry = {
    timestamp: new Date().toISOString(),
    codigo: pedido.codigo,
    ...evento,
  };
  appendFileSync(HISTORICO, JSON.stringify(entry) + "\n");
}

function normalizarCodigo(c: string): string {
  return c.replace(/\s+/g, "").toUpperCase();
}

function detectarTransportadora(codigo: string): string {
  const c = codigo.toUpperCase();
  if (/^AP\d{9}BR$/.test(c)) return "correios-pac";
  if (/^AA\d{9}BR$/.test(c)) return "correios-sedex";
  if (/^LB\d{9}BR$/.test(c)) return "correios-logistica-reversa";
  if (/^RA\d{9}BR$/.test(c)) return "correios-registrado";
  if (/^ME\d{9}BR$/.test(c)) return "mercado-envios";
  return "generico";
}

function nomeTransportadora(slug: string): string {
  const map: Record<string, string> = {
    "correios-pac": "Correios PAC",
    "correios-sedex": "Correios SEDEX",
    "correios-logistica-reversa": "Correios (logística reversa)",
    "correios-registrado": "Correios Registrado",
    "mercado-envios": "Mercado Envios",
    "generico": "Genérico",
  };
  return map[slug] || slug;
}

function nowISO(): string {
  return new Date().toISOString();
}

function help() {
  console.log(`
📦 Rastreamento de Pedidos — CLI

Comandos:
  adicionar       Adiciona um novo pedido
  listar          Lista pedidos ativos (ou todos com --entregues)
  checar          Checa o status de um pedido (tenta API direta)
  checar-todos    Tenta checar todos os pedidos ativos
  entregar        Marca um pedido como entregue
  remover         Remove um pedido do registro
  resumo          Mostra resumo formatado para Telegram
  help            Mostra esta ajuda

Opções (adicionar):
  --codigo=XXX            Código de rastreio (obrigatório)
  --descricao="texto"     Descrição do produto (obrigatório)
  --transportadora=XXX    Override da detecção automática
  --url="..."             URL da loja/origem

Opções (checar / entregar / remover):
  --codigo=XXX            Código de rastreio (obrigatório)

Opções (listar):
  --entregues             Inclui pedidos já entregues
  --ativos                Só pedidos ativos (padrão)

Exemplos:
  bun run $0 adicionar --codigo=AP272328771BR --descricao="Tênis Nike"
  bun run $0 listar
  bun run $0 checar --codigo=AP272328771BR
  bun run $0 entregar --codigo=AP272328771BR
  bun run $0 resumo
`);
}

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    const m = arg.match(/^--([^=]+)=(.+)$/);
    if (m) args[`--${m[1]}`] = m[2];
  }
  return args;
}

const SEU_RASTREIO_API_BASE = "https://seurastreio.com.br/api/public/rastreio";
const SEU_RASTREIO_API_KEY = process.env.SEURASTREIO_API_KEY || process.env.SEU_RASTREIO_API_KEY;

async function consultarApiSeuRastreio(codigo: string) {
  if (!SEU_RASTREIO_API_KEY) {
    return null;
  }

  try {
    const url = `${SEU_RASTREIO_API_BASE}/${encodeURIComponent(codigo)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${SEU_RASTREIO_API_KEY}` },
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>;
    if (!data || !data.success) {
      return null;
    }

    const eventoMaisRecente = data.eventoMaisRecente as Record<string, unknown> | undefined;
    if (!eventoMaisRecente) {
      return null;
    }

    const descricao = typeof eventoMaisRecente.descricao === "string" ? eventoMaisRecente.descricao : "";
    const detalhe = typeof eventoMaisRecente.detalhe === "string" ? eventoMaisRecente.detalhe : "";
    const dataStr = typeof eventoMaisRecente.data === "string" ? eventoMaisRecente.data : "";
    const local = typeof eventoMaisRecente.local === "string" ? eventoMaisRecente.local : "";
    const destino = typeof eventoMaisRecente.destino === "string" ? eventoMaisRecente.destino : null;
    const linkDetalhesCompletos = typeof data.linkDetalhesCompletos === "string" ? data.linkDetalhesCompletos : `https://seurastreio.com.br/objetos/${encodeURIComponent(codigo)}`;

    let dataFormatada = "";
    if (dataStr) {
      const dataObj = new Date(dataStr);
      if (!Number.isNaN(dataObj.getTime())) {
        dataFormatada = dataObj.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      }
    }

    return {
      descricao,
      detalhe,
      data: dataFormatada,
      local,
      destino,
      linkDetalhesCompletos,
    };
  } catch (error) {
    return null;
  }
}

function adicionar(args: Record<string, string>) {
  const codigoRaw = args["--codigo"];
  const descricao = args["--descricao"];
  if (!codigoRaw || !descricao) {
    console.error("❌ Uso: --codigo=XXX --descricao=\"...\"");
    process.exit(1);
  }
  const codigo = normalizarCodigo(codigoRaw);
  const db = load();
  if (db.pedidos.find((p) => p.codigo === codigo)) {
    console.error(`❌ Pedido com código ${codigo} já existe. Use 'atualizar' ou 'remover'.`);
    process.exit(1);
  }
  const transportadora = args["--transportadora"] || detectarTransportadora(codigo);
  const pedido: Pedido = {
    codigo,
    descricao,
    transportadora,
    url_loja: args["--url"],
    adicionado_em: nowISO(),
    historico: [],
    entregue: false,
  };
  db.pedidos.push(pedido);
  save(db);
  appendHistorico(pedido, { tipo: "adicionado" });
  console.log(`✅ Pedido adicionado: ${codigo} — ${descricao}`);
  console.log(`   Transportadora detectada: ${nomeTransportadora(transportadora)}`);
  console.log(`   Arquivo: ${PEDIDOS_JSON}`);
}

function listar(args: Record<string, string>) {
  const db = load();
  if (db.pedidos.length === 0) {
    console.log("📭 Nenhum pedido registrado. Use 'adicionar' para começar.");
    return;
  }
  const mostrarEntregues = args["--entregues"] === "true" || args["--entregues"] === "1";
  const ativos = db.pedidos.filter((p) => !p.entregue);
  const entregues = db.pedidos.filter((p) => p.entregue);
  const lista = mostrarEntregues ? db.pedidos : ativos;

  console.log(`\n📦 Pedidos${mostrarEntregues ? " (todos)" : " ativos"} — ${lista.length}\n`);
  console.log("| Código | Descrição | Transportadora | Status atual | Última atualização |");
  console.log("|--------|-----------|----------------|--------------|--------------------|");
  for (const p of lista) {
    const status = p.entregue ? "✅ Entregue" : (p.status_atual || "—");
    const ultima = p.ultima_atualizacao
      ? new Date(p.ultima_atualizacao).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
      : "—";
    console.log(`| ${p.codigo} | ${p.descricao} | ${nomeTransportadora(p.transportadora)} | ${status} | ${ultima} |`);
  }
  if (entregues.length > 0 && !mostrarEntregues) {
    console.log(`\n💡 ${entregues.length} pedido(s) já entregue(s). Use --entregues para ver.`);
  }
  console.log("");
}

function renderMd(db: DB) {
  const ativos = db.pedidos.filter((p) => !p.entregue);
  const entregues = db.pedidos.filter((p) => p.entregue);
  const dataHoje = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const linhas: string[] = [];
  linhas.push("# 📦 Rastreamento de Pedidos");
  linhas.push("");
  linhas.push(`> Atualizado em ${dataHoje}`);
  linhas.push("");
  linhas.push(`**Total ativo:** ${ativos.length} | **Entregues:** ${entregues.length}`);
  linhas.push("");
  if (ativos.length > 0) {
    linhas.push("## Ativos");
    linhas.push("");
    for (const p of ativos) {
      linhas.push(`### ${p.codigo} — ${p.descricao}`);
      linhas.push(`- **Transportadora:** ${nomeTransportadora(p.transportadora)}`);
      if (p.status_atual) linhas.push(`- **Status:** ${p.status_atual}`);
      if (p.ultima_posicao) linhas.push(`- **Última posição:** ${p.ultima_posicao}`);
      if (p.previsao_entrega) linhas.push(`- **Previsão de entrega:** ${p.previsao_entrega}`);
      if (p.ultima_atualizacao) {
        const data = new Date(p.ultima_atualizacao).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        linhas.push(`- **Última checagem:** ${data}`);
      }
      if (p.url_loja) linhas.push(`- **Loja:** ${p.url_loja}`);
      linhas.push("");
    }
  }
  if (entregues.length > 0) {
    linhas.push("## Entregues");
    linhas.push("");
    for (const p of entregues.slice(-20)) {
      linhas.push(`- ✅ **${p.codigo}** — ${p.descricao} (${p.entregue_em ? new Date(p.entregue_em).toLocaleDateString("pt-BR") : "—"})`);
    }
    linhas.push("");
  }
  writeFileSync(PEDIDOS_MD, linhas.join("\n"));
}

async function consultarApiSeuRastreio(codigo: string) {
  const apiKey = process.env.SEU_RASTREIO_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://seurastreio.com.br/api/public/rastreio/${encodeURIComponent(codigo)}`;
    const resposta = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!resposta.ok) return null;
    const dados = await resposta.json();

    const evento = dados.eventoMaisRecente || {};
    const status = (dados.status || evento.codigo || "").toString().trim();
    if (!status) return null;

    return {
      descricao: evento.descricao || status,
      detalhe: evento.detalhe || dados.mensagem || "",
      data: evento.data || dados.data || dados.atualizado || "",
      local: evento.local || dados.local || dados.cidade || "",
      destino: evento.destino || dados.destino || dados.proximo || "",
      linkDetalhesCompletos: `https://seurastreio.com.br/rastreio/${encodeURIComponent(codigo)}`,
    };
  } catch {
    return null;
  }
}

async function checar(args: Record<string, string>) {
  const codigoRaw = args["--codigo"];
  if (!codigoRaw) {
    console.error("❌ Uso: --codigo=XXX");
    process.exit(1);
  }
  const codigo = normalizarCodigo(codigoRaw);
  const db = load();
  const pedido = db.pedidos.find((p) => p.codigo === codigo);
  if (!pedido) {
    console.error(`❌ Pedido ${codigo} não encontrado. Adicione primeiro.`);
    process.exit(1);
  }

  console.log(`🔍 Consultando ${codigo} (${nomeTransportadora(pedido.transportadora)})…`);

  const resultadoApi = await consultarApiSeuRastreio(codigo);
  if (resultadoApi) {
    console.log(`✅ API Seu Rastreio
`);
    console.log(`📦 Status: ${resultadoApi.descricao}`);
    if (resultadoApi.detalhe) {
      console.log(`📝 Detalhe: ${resultadoApi.detalhe}`);
    }
    if (resultadoApi.data) {
      console.log(`📅 Atualização: ${resultadoApi.data}`);
    }
    if (resultadoApi.local) {
      console.log(`📍 Local: ${resultadoApi.local}`);
    }
    if (resultadoApi.destino) {
      console.log(`🎯 Destino: ${resultadoApi.destino}`);
    }
    console.log(`🔗 ${resultadoApi.linkDetalhesCompletos}`);
    return;
  }

  console.log("ℹ️  API indisponível ou chave não configurada.");
  console.log("   Configure SEU_RASTREIO_API_KEY nas secrets para consulta automática sem browser.");
  console.log(`🔗 https://rastreamento.correios.com.br/app/index.php?objetos=${codigo}`);
}

async function checarTodos() {
  const db = load();
  const ativos = db.pedidos.filter((p) => !p.entregue);
  if (ativos.length === 0) {
    console.log("📭 Nenhum pedido ativo para checar.");
    return;
  }
  console.log(`📋 ${ativos.length} pedido(s) ativo(s):`);
  for (const p of ativos) {
    const ultima = p.ultima_atualizacao
      ? new Date(p.ultima_atualizacao).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
      : "nunca";
    console.log(`  • ${p.codigo} — ${p.descricao} | status: ${p.status_atual || "—"} | última: ${ultima}`);
  }
  console.log("");
  console.log("ℹ️  A automação 5x/dia atualiza esses status via open_webpage.");
}

function entregar(args: Record<string, string>) {
  const codigoRaw = args["--codigo"];
  if (!codigoRaw) {
    console.error("❌ Uso: --codigo=XXX");
    process.exit(1);
  }
  const codigo = normalizarCodigo(codigoRaw);
  const db = load();
  const pedido = db.pedidos.find((p) => p.codigo === codigo);
  if (!pedido) {
    console.error(`❌ Pedido ${codigo} não encontrado.`);
    process.exit(1);
  }
  if (pedido.entregue) {
    console.log(`ℹ️  ${codigo} já está marcado como entregue.`);
    return;
  }
  pedido.entregue = true;
  pedido.entregue_em = nowISO();
  pedido.ultima_atualizacao = nowISO();
  pedido.status_atual = "Objeto entregue ao destinatário";
  save(db);
  appendHistorico(pedido, { tipo: "entregue_manual" });
  console.log(`✅ ${codigo} marcado como entregue!`);
}

function remover(args: Record<string, string>) {
  const codigoRaw = args["--codigo"];
  if (!codigoRaw) {
    console.error("❌ Uso: --codigo=XXX");
    process.exit(1);
  }
  const codigo = normalizarCodigo(codigoRaw);
  const db = load();
  const idx = db.pedidos.findIndex((p) => p.codigo === codigo);
  if (idx < 0) {
    console.error(`❌ Pedido ${codigo} não encontrado.`);
    process.exit(1);
  }
  const removido = db.pedidos.splice(idx, 1)[0];
  save(db);
  appendHistorico(removido, { tipo: "removido" });
  console.log(`🗑️  Pedido ${codigo} removido do registro.`);
}

function resumo() {
  const db = load();
  const ativos = db.pedidos.filter((p) => !p.entregue);
  const dataHora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  if (ativos.length === 0) {
    console.log(`📦 Atualização de Pedidos — ${dataHora}`);
    console.log("");
    console.log("Nenhum pedido ativo no momento. ✅");
    return;
  }
  console.log(`📦 Atualização de Pedidos — ${dataHora}\n`);
  ativos.forEach((p, i) => {
    console.log(`${i + 1}. ${p.codigo} — ${p.descricao}`);
    const status = p.status_atual || "aguardando primeira checagem";
    console.log(`   ${status}`);
    if (p.ultima_posicao) console.log(`   📍 ${p.ultima_posicao}`);
    if (p.previsao_entrega) console.log(`   📅 Previsão: ${p.previsao_entrega}`);
    if (p.ultima_atualizacao) {
      const d = new Date(p.ultima_atualizacao).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      console.log(`   🕒 Última: ${d}`);
    }
    console.log("");
  });
}

const cmd = process.argv[2];
const args = parseArgs();

switch (cmd) {
  case "adicionar":
  case "add":
    adicionar(args);
    break;
  case "listar":
  case "list":
    listar(args);
    break;
  case "checar":
  case "check":
    checar(args);
    break;
  case "checar-todos":
  case "check-all":
    checarTodos();
    break;
  case "entregar":
  case "deliver":
    entregar(args);
    break;
  case "remover":
  case "remove":
    remover(args);
    break;
  case "resumo":
  case "summary":
    resumo();
    break;
  case "help":
  default:
    help();
    break;
}
