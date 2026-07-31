#!/usr/bin/env bun
/**
 * backup.ts — Commita e envia alterações do workspace para o GitHub
 *
 * Uso:
 *   bun backup.ts              → commit + push
 *   bun backup.ts --status     → mostra alterações (sem commitar)
 *   bun backup.ts --schedule   → instruções de agendamento
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
  statSync,
  unlinkSync,
} from "node:fs";

const WORKSPACE = "/home/workspace";
const BACKUP_DIR = "/home/.backups/backup-agente";
const REPO = "backup-agente";
const BRANCH = "main";
const LOCK_FILE = "/tmp/zo-backup.lock";
const WARN_FILE_MB = 50; // aviso do GitHub
const MAX_FILE_MB = 100; // limite duro do GitHub
const SKILL_DIR = `${WORKSPACE}/Skills/backup-github/scripts`;

function run(cmd: string[], cwd = WORKSPACE): { code: number; out: string } {
  const r = Bun.spawnSync(cmd, { cwd, stderr: "pipe", stdout: "pipe" });
  const out = r.stdout ? new TextDecoder().decode(r.stdout) : "";
  const err = r.stderr ? new TextDecoder().decode(r.stderr) : "";
  return { code: r.exitCode ?? 1, out: out || err };
}

function processAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function acquireLock(): boolean {
  if (existsSync(LOCK_FILE)) {
    const pid = parseInt(readFileSync(LOCK_FILE, "utf8").trim(), 10);
    if (pid && processAlive(pid)) {
      console.warn(`⚠️ Outro backup já está rodando (PID ${pid}). Abortando.`);
      return false;
    }
    console.warn("🔓 Lock órfão detectado, sobrescrevendo...");
  }
  writeFileSync(LOCK_FILE, String(process.pid));
  return true;
}

function releaseLock(): void {
  try {
    if (existsSync(LOCK_FILE)) unlinkSync(LOCK_FILE);
  } catch {
    /* best-effort */
  }
}

/** Notifica o Aleksandro por Telegram quando o backup falha (best-effort). */
async function notifyFailure(reason: string): Promise<void> {
  const token = process.env.ZO_CLIENT_IDENTITY_TOKEN;
  if (!token) return;
  try {
    const payload: Record<string, string> = {
      input:
        `Envie uma mensagem de Telegram para Aleksandro (use send_telegram_message, ` +
        `começando com o nome dele) avisando que o backup automático do workspace ` +
        `FALHOU. Motivo: ${reason}. Seja breve e direto.`,
    };
    const model = process.env.ZO_BACKUP_MODEL;
    if (model) payload.model_name = model;
    await fetch("https://api.zo.computer/zo/ask", {
      method: "POST",
      headers: {
        authorization: token,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    /* notificação é best-effort; nunca deve derrubar o script */
  }
}

/** Carrega padrões de exclusão do arquivo de configuração. */
function loadExclusions(): string[] {
  const path = `${SKILL_DIR}/exclusions.txt`;
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

function ensureRepo(): boolean {
  const gitDir = `${BACKUP_DIR}/.git`;
  const check = run(["test", "-d", gitDir]);
  if (check.code === 0) {
    const pull = run(["git", "pull", "--rebase"], BACKUP_DIR);
    if (pull.code !== 0) {
      // Conflito de rebase — aborta e reseta para a origem.
      // Como o backup é regenerado do workspace via rsync a cada run,
      // perder um commit local não-pushe é seguro.
      console.warn("⚠️ Pull --rebase falhou. Abortando rebase e resetando para origem...");
      run(["git", "rebase", "--abort"], BACKUP_DIR);
      run(["git", "fetch", "origin"], BACKUP_DIR);
      run(["git", "reset", "--hard", `origin/${BRANCH}`], BACKUP_DIR);
    }
    return true;
  }

  console.log("🔄 Clonando repositório...");
  const clone = run(["gh", "repo", "clone", `aajunior43/${REPO}`, BACKUP_DIR]);
  if (clone.code !== 0) {
    console.log("📦 Criando novo repositório...");
    const create = run(["gh", "repo", "create", REPO, "--public", "--clone"]);
    if (create.code !== 0) {
      console.error("❌ Falha ao criar repositório:", create.out);
      return false;
    }
    const clone2 = run(["gh", "repo", "clone", `aajunior43/${REPO}`, BACKUP_DIR]);
    if (clone2.code !== 0) return false;
  }

  run(["git", "config", "user.email", "aajunior43@gmail.com"], BACKUP_DIR);
  run(["git", "config", "user.name", "Zo Backup"], BACKUP_DIR);
  return true;
}

function syncWorkspace(): boolean {
  run(["mkdir", "-p", `${BACKUP_DIR}/zo`]);

  const excludeArgs = loadExclusions().flatMap((p) => ["--exclude", p]);

  const rsync = run([
    "rsync", "-a", "--delete",
    ...excludeArgs,
    `${WORKSPACE}/`,
    `${BACKUP_DIR}/zo/`,
  ]);

  if (rsync.code !== 0) {
    console.error("❌ Erro no rsync:", rsync.out);
    return false;
  }

  return true;
}

/** Detecta arquivos grandes. Remove os >100MB (limite do GitHub) e avisa sobre os >50MB. */
function handleLargeFiles(): void {
  const find = run(["find", `${BACKUP_DIR}/zo`, "-type", "f", "-size", `+${WARN_FILE_MB}M`]);
  if (find.code !== 0 || !find.out.trim()) return;

  for (const f of find.out.split("\n").filter(Boolean)) {
    const size = statSync(f).size;
    const mb = (size / 1024 / 1024).toFixed(1);
    const rel = f.replace(`${BACKUP_DIR}/zo/`, "");
    if (size > MAX_FILE_MB * 1024 * 1024) {
      console.warn(`⚠️ >100MB, ignorando (limite do GitHub): ${rel} (${mb}MB)`);
      try {
        unlinkSync(f);
      } catch {
        /* ignore */
      }
    } else {
      console.warn(`⚠️ Arquivo grande (>50MB): ${rel} (${mb}MB)`);
    }
  }
}

/** Confirma que o commit local está presente no remote após o push. */
function verifyRemote(): boolean {
  const local = run(["git", "rev-parse", "HEAD"], BACKUP_DIR);
  const remote = run(["git", "ls-remote", "origin", `refs/heads/${BRANCH}`], BACKUP_DIR);
  if (remote.code !== 0) return false;
  const remoteSha = remote.out.trim().split(/\s+/)[0];
  return remoteSha === local.out.trim();
}

function getStatus(): { modified: number; new: number; deleted: number } {
  const status = run(["git", "status", "--porcelain"], BACKUP_DIR);
  const lines = status.out.split("\n").filter(Boolean);
  let modified = 0;
  let newFiles = 0;
  let deleted = 0;
  for (const l of lines) {
    if (l.startsWith("??")) newFiles++;
    else if (l.startsWith(" D") || l.startsWith("D ")) deleted++;
    else modified++;
  }
  return { modified, new: newFiles, deleted };
}

function buildCommitMsg(s: { modified: number; new: number; deleted: number }): string {
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const parts: string[] = [];
  if (s.modified > 0) parts.push(`📝 ${s.modified} alterados`);
  if (s.new > 0) parts.push(`✨ ${s.new} novos`);
  if (s.deleted > 0) parts.push(`🗑️ ${s.deleted} removidos`);
  return `🔄 Backup Zo — ${parts.join(", ")}\n\n📅 ${now}`;
}

async function main() {
  const mode = process.argv[2];

  if (mode === "--schedule") {
    console.log(`📅 Agendamento do Backup GitHub

O backup roda automaticamente via Automation do Zo Computer.

🔄 Agendamento atual: Diariamente às 00:00 (Inajá/PR)

Para verificar automações:
  Peça ao Zo: "Liste minhas automações"

Para alterar frequência:
  Peça ao Zo: "Mude o backup para rodar a cada 12 horas"
`);
    return;
  }

  if (!acquireLock()) {
    await notifyFailure("outro backup já estava em execução (lock ativo)");
    process.exit(1);
  }
  process.on("exit", releaseLock);

  console.log("🔄 Backup GitHub — Workspace Zo\n");

  try {
    if (!ensureRepo()) {
      await notifyFailure("falha ao garantir/clonar o repositório");
      process.exit(1);
    }

    if (!syncWorkspace()) {
      await notifyFailure("falha no rsync do workspace");
      process.exit(1);
    }

    handleLargeFiles();

    if (mode === "--status") {
      const s = getStatus();
      const total = s.modified + s.new + s.deleted;

      console.log("📊 Alterações detectadas:");
      console.log(`   📝 Modificados: ${s.modified}`);
      console.log(`   ✨ Novos:       ${s.new}`);
      console.log(`   🗑️  Removidos:  ${s.deleted}`);
      console.log(`   📦 Total:       ${total}`);

      if (total > 0) {
        console.log("\n📁 Detalhes:");
        const diff = run(["git", "status", "--short"], BACKUP_DIR);
        console.log(diff.out);
      } else {
        console.log("\n✅ Nenhuma alteração para commitar.");
      }

      const du = run(["du", "-sh", `${BACKUP_DIR}/zo`]);
      const lastCommit = run(["git", "log", "-1", "--format=%ci — %s"], BACKUP_DIR);
      console.log(`\n📦 Tamanho do backup: ${du.out.split("\t")[0] || "?"}`);
      console.log(`🕐 Último commit: ${lastCommit.out.trim()}`);
      return;
    }

    const s = getStatus();
    const total = s.modified + s.new + s.deleted;

    if (total === 0) {
      console.log("✅ Nenhuma alteração para commitar.");
      return;
    }

    console.log(`📝 ${s.modified} alterados | ✨ ${s.new} novos | 🗑️ ${s.deleted} removidos`);

    run(["git", "add", "-A"], BACKUP_DIR);
    const commit = run(["git", "commit", "-m", buildCommitMsg(s)], BACKUP_DIR);

    if (commit.code !== 0 && !commit.out.includes("nothing to commit")) {
      console.error("❌ Erro no commit:", commit.out);
      await notifyFailure(`erro no commit (${commit.out.slice(0, 120)})`);
      process.exit(1);
    }

    console.log("📤 Enviando para GitHub...");
    const push = run(["git", "push", "origin", BRANCH], BACKUP_DIR);

    if (push.code !== 0) {
      console.error("❌ Erro no push:", push.out);
      await notifyFailure(`erro no push (${push.out.slice(0, 120)})`);
      process.exit(1);
    }

    if (!verifyRemote()) {
      console.error("❌ Push concluído mas o commit não foi confirmado no remote.");
      await notifyFailure("push não confirmado no remote");
      process.exit(1);
    }

    console.log("✅ Enviado com sucesso!");
    const log = run(["git", "log", "-1", "--oneline"], BACKUP_DIR);
    console.log(`   Commit: ${log.out.trim()}`);
  } finally {
    releaseLock();
  }
}

main().catch(async (e) => {
  console.error("❌ Erro inesperado:", e);
  await notifyFailure(String(e).slice(0, 160));
  releaseLock();
  process.exit(1);
});
