#!/usr/bin/env bun
// CLI do Mural de Tarefas — Prefeitura Municipal de Inajá (via MCP).
// Uso: bun run mural.ts <comando> [opções]. Rode com --help para detalhes.

import { parseArgs } from "node:util";

const MCP_URL = process.env.MURAL_MCP_URL || "http://173.208.155.210:8001/mcp";
const KEY = process.env.MURAL_MCP_KEY || "";

let sessionId: string | null = null;
let reqId = 0;

function fail(msg: string): never {
  console.error("ERRO: " + msg);
  process.exit(1);
}

function parseMcp(text: string): any {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  for (const line of trimmed.split("\n")) {
    if (line.startsWith("data:")) {
      const data = line.slice(5).trim();
      if (data && data !== "[DONE]") return JSON.parse(data);
    }
  }
  throw new Error("Resposta MCP inesperada: " + trimmed.slice(0, 300));
}

function unwrap(result: any): any {
  const content = result?.content;
  if (Array.isArray(content)) {
    for (const c of content) {
      if (c?.type === "text") {
        try {
          return JSON.parse(c.text);
        } catch {
          return c.text;
        }
      }
    }
  }
  return result;
}

async function mcpCall(method: string, params: any): Promise<any> {
  if (!KEY) {
    fail("MURAL_MCP_KEY não definida. Salve a chave em Configurações → Avançado (secret MURAL_MCP_KEY).");
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${KEY}`,
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;

  const res = await fetch(MCP_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: ++reqId, method, params }),
  });

  const sid = res.headers.get("mcp-session-id");
  if (sid) sessionId = sid;

  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} — ${text.slice(0, 300)}`);
  const parsed = parseMcp(text);
  if (parsed.error) throw new Error(`Erro MCP ${parsed.error.code}: ${parsed.error.message}`);
  return parsed.result;
}

async function ensureSession() {
  // Servidor pode ser stateless; falha de handshake não deve interromper.
  try {
    await mcpCall("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "zo-sistema-prefeitura", version: "1.0" },
    });
  } catch {
    // segue sem sessão
  }
}

async function callTool(name: string, args: Record<string, any>) {
  await ensureSession();
  const result = await mcpCall("tools/call", { name, arguments: args });
  const data = unwrap(result);
  console.log(typeof data === "string" ? data : JSON.stringify(data, null, 2));
}

const STATUS = ["todo", "doing", "done"];
const PRIORIDADE = ["baixa", "media", "alta"];
const PRAZO_RE = /^\d{4}-\d{2}-\d{2}$/;

function pick(vals: any, allowed: string[], field: string): string | undefined {
  if (vals[field] === undefined) return undefined;
  const v = String(vals[field]);
  if (!allowed.includes(v)) fail(`${field} inválido: "${v}". Use: ${allowed.join(", ")}`);
  return v;
}

function pickDate(vals: any): string | undefined {
  if (vals.prazo === undefined) return undefined;
  const v = String(vals.prazo);
  if (!PRAZO_RE.test(v)) fail(`prazo inválido: "${v}". Use o formato YYYY-MM-DD.`);
  return v;
}

const HELP = `Mural de Tarefas — Prefeitura de Inajá (MCP)

Uso: bun run mural.ts <comando> [opções]

Comandos:
  ferramentas                                   Lista as ferramentas MCP do servidor
  listar [--status S] [--responsavel NOME]      Lista tarefas
  criar --titulo T [--descricao D] [--responsavel NOME]
        [--prioridade baixa|media|alta] [--status todo|doing|done] [--prazo YYYY-MM-DD]
  editar --id ID [--titulo] [--descricao] [--responsavel] [--prioridade]
         [--prazo YYYY-MM-DD] [--limpar-descricao] [--limpar-responsavel] [--limpar-prazo]
  mover --id ID --status todo|doing|done
  remover --id ID --confirmacao REMOVER
  backup                                        Cópia local do banco + uploads (admin)
  backup-github                                 Backup + envio à branch backups (admin)

Env:
  MURAL_MCP_KEY   (obrigatório) Chave MCP — secret em Configurações → Avançado
  MURAL_MCP_URL   (opcional) Endpoint MCP. Padrão: ${MCP_URL}`;

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  if (!cmd || cmd === "--help" || cmd === "-h" || cmd === "help") {
    console.log(HELP);
    return;
  }
  const rest = argv.slice(1);
  const { values } = parseArgs({
    args: rest,
    options: {
      titulo: { type: "string" },
      descricao: { type: "string" },
      responsavel: { type: "string" },
      prioridade: { type: "string" },
      status: { type: "string" },
      prazo: { type: "string" },
      id: { type: "string" },
      confirmacao: { type: "string" },
      "limpar-descricao": { type: "boolean", default: false },
      "limpar-responsavel": { type: "boolean", default: false },
      "limpar-prazo": { type: "boolean", default: false },
    },
    strict: true,
    allowPositionals: false,
  });

  switch (cmd) {
    case "ferramentas": {
      await ensureSession();
      const res = await mcpCall("tools/list", {});
      const tools = (res?.tools || []).map((t: any) => `${t.name} — ${t.description || ""}`);
      console.log(tools.join("\n"));
      return;
    }
    case "listar": {
      const args: any = {};
      const st = pick(values, STATUS, "status");
      if (st) args.status = st;
      if (values.responsavel) args.responsavel = values.responsavel;
      await callTool("listar_tarefas", args);
      return;
    }
    case "criar": {
      if (!values.titulo) fail("--titulo é obrigatório.");
      const args: any = { titulo: values.titulo };
      if (values.descricao) args.descricao = values.descricao;
      if (values.responsavel) args.responsavel = values.responsavel;
      const pr = pick(values, PRIORIDADE, "prioridade");
      if (pr) args.prioridade = pr;
      const st = pick(values, STATUS, "status");
      if (st) args.status = st;
      const prazo = pickDate(values);
      if (prazo) args.prazo = prazo;
      await callTool("criar_tarefa", args);
      return;
    }
    case "editar": {
      if (!values.id) fail("--id é obrigatório.");
      const args: any = { id: values.id };
      if (values.titulo) args.titulo = values.titulo;
      if (values.responsavel) args.responsavel = values.responsavel;
      const pr = pick(values, PRIORIDADE, "prioridade");
      if (pr) args.prioridade = pr;
      const prazo = pickDate(values);
      if (prazo) args.prazo = prazo;
      if (values.descricao) args.descricao = values.descricao;
      if (values["limpar-descricao"]) args.descricao = null;
      if (values["limpar-responsavel"]) args.responsavel = null;
      if (values["limpar-prazo"]) args.prazo = null;
      await callTool("editar_tarefa", args);
      return;
    }
    case "mover": {
      if (!values.id) fail("--id é obrigatório.");
      const st = pick(values, STATUS, "status");
      if (!st) fail("--status é obrigatório (todo|doing|done).");
      await callTool("mover_tarefa", { id: values.id, status: st });
      return;
    }
    case "remover": {
      if (!values.id) fail("--id é obrigatório.");
      if (values.confirmacao !== "REMOVER") fail('--confirmacao deve ser exatamente "REMOVER".');
      await callTool("remover_tarefa", { id: values.id, confirmacao: "REMOVER" });
      return;
    }
    case "backup":
      await callTool("criar_backup", {});
      return;
    case "backup-github":
      await callTool("enviar_backup_github", {});
      return;
    default:
      fail(`Comando desconhecido: "${cmd}". Use --help.`);
  }
}

main().catch((e) => fail(e?.message || String(e)));
