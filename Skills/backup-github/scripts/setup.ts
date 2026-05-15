#!/usr/bin/env bun
/**
 * setup.ts — Configura o repositório GitHub para backup do workspace
 *
 * Uso:
 *   bun setup.ts
 *
 * Pré-requisito: gh CLI autenticado (gh auth status)
 */

const REPO = "workspace-backup";
const WORKSPACE = "/home/workspace";

async function run(cmd: string[], cwd = WORKSPACE): Promise<string> {
  const proc = Bun.spawnSync(cmd, { cwd, env: { ...process.env } });
  if (proc.exitCode !== 0) {
    const err = proc.stderr.toString().trim();
    if (
      err.includes("already exists") ||
      err.includes("nothing to commit") ||
      err.includes("Everything up-to-date")
    ) {
      return err; // avisos esperados
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

  // 2. Criar repositório
  console.log("📦 Criando repositório 'workspace-backup'...");
  await run([
    "gh", "repo", "create", REPO,
    "--public",
    "--description", "Backup automático do workspace Zo Computer",
  ]);

  // 3. Inicializar git
  await run(["git", "init"]);
  await run(["git", "checkout", "-b", "main"]);
  console.log("✅ Git inicializado");

  // 4. Configurar git
  await run(["git", "config", "user.email", "aajunior43@gmail.com"]);
  await run(["git", "config", "user.name", "Aleksandro Backup"]);
  await run(["gh", "auth", "setup-git"]);

  // 5. Criar .gitignore se não existir
  const gitignore = `${WORKSPACE}/.gitignore`;
  const giProc = Bun.spawnSync(["test", "-f", gitignore]);
  if (giProc.exitCode !== 0) {
    const content = [
      "node_modules/",
      ".env",
      ".DS_Store",
      "Thumbs.db",
      "*.aux *.log *.out *.toc *.fls *.fdb_latexmk",
      "__pycache__/",
      "*.pyc",
      "venv/",
    ].join("\n");
    Bun.write(gitignore, content);
  }
  console.log("✅ .gitignore verificado");

  // 6. Remote
  const remoteUrl = `https://github.com/${user}/${REPO}.git`;
  await run(["git", "remote", "remove", "origin"]);
  await run(["git", "remote", "add", "origin", remoteUrl]);

  // 7. Primeiro commit + push
  await run(["git", "add", "."]);
  await run(["git", "commit", "-m", "📦 Primeiro backup do workspace"]);
  await run(["git", "push", "-u", "origin", "main", "--force"]);

  console.log(`\n✅ Backup inicial concluído!`);
  console.log(`🔗 https://github.com/${user}/${REPO}\n`);

  // 8. Contar arquivos
  const count = await run(["git", "ls-files"]);
  const files = count.split("\n").filter(Boolean).length;
  console.log(`📁 ${files} arquivos rastreados`);
}

main();
