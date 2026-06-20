#!/usr/bin/env bun
/**
 * setup.ts — Configura o repositório GitHub para backup do workspace
 *
 * Cria o repositório backup-agente no GitHub, clona em /home/.backups/
 * e sincroniza o workspace para a pasta zo/.
 *
 * Uso:
 *   bun setup.ts
 *
 * Pré-requisito: gh CLI autenticado (gh auth status)
 */

const REPO = "backup-agente";
const WORKSPACE = "/home/workspace";
const BACKUP_DIR = "/home/.backups/backup-agente";

async function run(cmd: string[], cwd = WORKSPACE): Promise<string> {
  const proc = Bun.spawnSync(cmd, { cwd, env: { ...process.env } });
  if (proc.exitCode !== 0) {
    const err = proc.stderr.toString().trim();
    if (
      err.includes("already exists") ||
      err.includes("nothing to commit") ||
      err.includes("Everything up-to-date")
    ) {
      return err;
    }
    console.error(`⚠️  Comando falhou: ${cmd.join(" ")}\n${err}`);
    return err;
  }
  return proc.stdout.toString().trim();
}

async function main() {
  console.log("🔄 Configurando backup automático do workspace...\n");

  // 1. Verificar autenticação
  const auth = await run(["gh", "auth", "status"]);
  const match = auth.match(/account\s+(\S+)/);
  const user = match ? match[1] : "desconhecido";
  console.log(`✅ GitHub autenticado como: ${user}`);

  // 2. Criar repositório (se não existir)
  console.log("📦 Garantindo repositório 'backup-agente'...");
  await run([
    "gh", "repo", "create", REPO,
    "--public",
    "--description", "Backup automático do workspace Zo Computer (compartilhado entre agentes)",
  ]);

  // 3. Clonar em /home/.backups/backup-agente
  console.log("📂 Clonando repositório...");
  await run(["mkdir", "-p", "/home/.backups"]);
  const cloneDir = `${BACKUP_DIR}`;
  await run(["rm", "-rf", cloneDir]);
  await run([
    "git", "clone", `https://github.com/${user}/${REPO}.git`, cloneDir,
  ]);

  // 4. Configurar git
  await run(["git", "config", "user.email", "aajunior43@gmail.com"], cloneDir);
  await run(["git", "config", "user.name", "Aleksandro Backup"], cloneDir);
  await run(["gh", "auth", "setup-git"]);

  // 5. Primeira sincronização
  console.log("📁 Sincronizando workspace para zo/...");
  await run([
    "rsync", "-a", "--delete",
    "--exclude=.git",
    "--exclude=node_modules",
    "--exclude=.env",
    "--exclude=__pycache__",
    "--exclude=*.pyc",
    "--exclude=Trash",
    `${WORKSPACE}/`, `${cloneDir}/zo/`,
  ]);

  // 6. Primeiro commit + push
  await run(["git", "add", "."], cloneDir);
  await run(["git", "commit", "-m", "📦 Primeiro backup do Zo Computer"], cloneDir);
  await run(["git", "push", "-u", "origin", "main", "--force"], cloneDir);

  console.log(`\n✅ Backup inicial concluído!`);
  console.log(`🔗 https://github.com/${user}/${REPO}\n`);

  const count = await run(["git", "ls-files"], cloneDir);
  const files = count.split("\n").filter(Boolean).length;
  console.log(`📁 ${files} arquivos rastreados`);
  console.log(`📂 Repositório em: ${cloneDir}`);
}

main();
