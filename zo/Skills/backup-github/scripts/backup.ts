#!/usr/bin/env bun
/**
 * backup.ts — Commita e envia alterações do workspace para o GitHub
 *
 * O workspace é síncrono para a pasta zo/ do repositório backup-agente.
 * Cada agente (openclaw, hermes, odysseu) gerencia sua própria pasta.
 *
 * Uso:
 *   bun backup.ts              → commit + push
 *   bun backup.ts --status     → mostra status sem commitar
 *   bun backup.ts --schedule   → mostra instruções para agendar
 */

const WORKSPACE = "/home/workspace";
const BACKUP_DIR = "/home/.backups/backup-agente";
const REPO = "backup-agente";
const BRANCH = "main";
const GIT_USER = "aajunior43@gmail.com";
const GIT_NAME = "Aleksandro Backup";

function run(cmd: string[], cwd = WORKSPACE): { out: string; err: string; code: number } {
  const proc = Bun.spawnSync(cmd, { cwd, env: { ...process.env } });
  return {
    out: proc.stdout.toString().trim(),
    err: proc.stderr.toString().trim(),
    code: proc.exitCode,
  };
}

function ensureRepo(): boolean {
  // Verifica se o clone já existe
  const gitDir = `${BACKUP_DIR}/.git`;
  const check = run(["test", "-d", gitDir]);
  if (check.code === 0) {
    // Já existe — só dar pull
    run(["git", "pull", "--rebase"], BACKUP_DIR);
    return true;
  }

  // Primeira vez — clonar
  console.log("🔄 Clonando repositório pela primeira vez...");
  const userResult = run(["gh", "auth", "status"]);
  const match = userResult.out.match(/account\s+(\S+)/);
  const user = match ? match[1] : "aajunior43";

  run(["mkdir", "-p", BACKUP_DIR]);
  const clone = run([
    "git", "clone", `https://github.com/${user}/${REPO}.git`, BACKUP_DIR,
  ]);
  if (clone.code !== 0) {
    console.error(`❌ Erro ao clonar repositório: ${clone.err}`);
    return false;
  }
  return true;
}

function getTipoArquivo(path: string): string {
  if (path.startsWith("Prefeitura/")) return "📋 ";
  if (path.startsWith("financeiro/")) return "💰 ";
  if (path.startsWith("saude/")) return "💊 ";
  if (path.startsWith("Refeicoes/")) return "🍽️ ";
  if (path.startsWith("Skills/")) return "🛠️ ";
  if (path.startsWith("projetos/")) return "📁 ";
  if (path.startsWith("Images/")) return "🖼️ ";
  if (path.startsWith("Documentos/")) return "📄 ";
  if (path.startsWith("Veiculo/")) return "🚗 ";
  return "📄 ";
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--schedule")) {
    console.log(`
══════════════════════════════════════════
  Para AGENDAR o backup automático:
══════════════════════════════════════════

Use o painel de Automações do Zo Computer:

  cria uma automação que executa
  "bun /home/workspace/Skills/backup-github/scripts/backup.ts"
  todo dia às 00:00 (horário de Inajá)

Rrule: RRULE:FREQ=DAILY;BYHOUR=0;BYMINUTE=0
    `);
    return;
  }

  // Garantir que o clone existe
  if (!ensureRepo()) {
    process.exit(1);
  }

  // Sincronizar workspace para a pasta zo/ do repositório
  console.log("🔄 Sincronizando workspace para zo/...");

  // Rsync: preserva permissões, exclui .git e pastas desnecessárias
  const rsync = run([
    "rsync", "-a", "--delete",
    "--exclude=.git",
    "--exclude=node_modules",
    "--exclude=.env",
    "--exclude=__pycache__",
    "--exclude=*.pyc",
    "--exclude=.parcel-cache",
    "--exclude=Trash",
    `${WORKSPACE}/`, `${BACKUP_DIR}/zo/`,
  ]);
  if (rsync.code !== 0) {
    console.error(`❌ Erro no rsync: ${rsync.err}`);
    process.exit(1);
  }

  // Verificar se há alterações
  const status = run(["git", "status", "--porcelain"], BACKUP_DIR);
  if (!status.out.trim()) {
    console.log("✅ Nada para commitar — workspace limpo");
    return;
  }

  if (args.includes("--status")) {
    console.log("📊 Status do workspace:\n");
    for (const line of status.out.split("\n")) {
      if (!line.trim()) continue;
      const flag = line.slice(0, 2).trim();
      const file = line.slice(3);
      const icon = file.startsWith("zo/") ? getTipoArquivo(file.slice(3)) : "📄 ";
      const flagLabel =
        flag === "M" ? "modificado" :
        flag === "?" ? "novo" :
        flag === "D" ? "removido" :
        flag === "A" ? "adicionado" : flag;
      console.log(`  ${icon} ${file} (${flagLabel})`);
    }
    return;
  }

  // Commit + push
  console.log("📦 Preparando commit...\n");

  const changedLines = status.out.split("\n").filter(Boolean);
  const tipos = new Set(changedLines.map(l => {
    const f = l.slice(3);
    return f.startsWith("zo/") ? getTipoArquivo(f.slice(3)) : "📄 ";
  }));
  const emojiTema = [...tipos].join("");

  // Add tudo
  run(["git", "add", "."], BACKUP_DIR);

  // Criar mensagem de commit
  const modified = changedLines.filter(l => l.startsWith(" M") || l.startsWith("M ") || l.startsWith(" MM")).length;
  const added = changedLines.filter(l => l.startsWith("??")).length;
  const deleted = changedLines.filter(l => l.startsWith(" D") || l.startsWith("D ")).length;

  const partes: string[] = [];
  if (modified) partes.push(`📝 ${modified} alterados`);
  if (added) partes.push(`✨ ${added} novos`);
  if (deleted) partes.push(`🗑️ ${deleted} removidos`);

  const msg = `${emojiTema} Backup Zo — ${partes.join(", ")}`;

  const commit = run(["git", "commit", "-m", msg], BACKUP_DIR);
  if (commit.err && commit.err.includes("nothing to commit")) {
    console.log("✅ Nada para commitar");
    return;
  }

  console.log(`📝 ${msg}`);
  const push = run(["git", "push", "-u", "origin", BRANCH], BACKUP_DIR);
  if (push.code === 0) {
    console.log(`📤 Enviado para GitHub`);
    console.log(`\n✅ Backup concluído em ${new Date().toLocaleString("pt-BR")}`);
  } else {
    // Recuperação: pack corrompido local às vezes falha no unpack remoto.
    // Repack com gc e tenta de novo com --no-thin (sem delta compression).
    console.warn(`⚠️ Push falhou (${push.err.slice(0, 120)}...). Repack + retry --no-thin...`);
    run(["git", "gc", "--prune=now"], BACKUP_DIR);
    const retry = run(["git", "push", "-u", "origin", BRANCH, "--no-thin"], BACKUP_DIR);
    if (retry.code === 0) {
      console.log(`📤 Enviado para GitHub (após gc + --no-thin)`);
      console.log(`\n✅ Backup concluído em ${new Date().toLocaleString("pt-BR")}`);
    } else {
      console.error(`❌ Erro no push (retry): ${retry.err}`);
      process.exit(1);
    }
  }
}

main();
