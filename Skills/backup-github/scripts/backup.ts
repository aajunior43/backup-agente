#!/usr/bin/env bun
/**
 * backup.ts — Commita e envia alterações do workspace para o GitHub
 *
 * Uso:
 *   bun backup.ts              → commit + push
 *   bun backup.ts --status     → mostra status sem commitar
 *   bun backup.ts --schedule   → mostra instruções para agendar
 */

const WORKSPACE = "/home/workspace";
const BRANCH = "main";

async function run(cmd: string): Promise<{ out: string; err: string; code: number }> {
  const proc = Bun.spawnSync(cmd.split(" "), { cwd: WORKSPACE });
  return {
    out: proc.stdout.toString().trim(),
    err: proc.stderr.toString().trim(),
    code: proc.exitCode,
  };
}

function now(): string {
  const d = new Date();
  return d.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

async function main() {
  const args = process.argv.slice(2);

  // ── Apenas status ──
  if (args.includes("--status")) {
    const { out } = await run("git status --short");
    if (out) {
      console.log("📋 Arquivos modificados:\n");
      console.log(out);
      const { out: count } = await run("git rev-list --count HEAD");
      console.log(`\n📦 Total de commits: ${count || 0}`);
    } else {
      console.log("✅ Workspace limpo — sem alterações desde o último backup.");
      const { out: count } = await run("git rev-list --count HEAD");
      console.log(`📦 Total de commits: ${count || 0}`);
    }
    return;
  }

  // ── Instruções de agendamento ──
  if (args.includes("--schedule")) {
    console.log(`
📅 Para agendar o backup automático:

Use o painel de Automations no Zo Computer (link: /?t=automations)
e crie um agente com:

  Instrução:
    Rode "bun /home/workspace/Skills/backup-github/scripts/backup.ts"
    e me informe se houve alterações enviadas para o GitHub.

  Frequência sugerida:
    Diariamente à meia-noite → RRULE: FREQ=DAILY;BYHOUR=0;BYMIN=0

Ou me peça aqui no chat que eu crio a automação pra você.
`);
    return;
  }

  // ── Backup normal ──
  console.log(`🔄 Backup — ${now()}\n`);

  // Verifica se é um repositório git
  const gitCheck = await run("git rev-parse --git-dir");
  if (gitCheck.err) {
    console.error("❌ Não é um repositório git. Rode o setup primeiro:");
    console.error("   bun /home/workspace/Skills/backup-github/scripts/setup.ts");
    process.exit(1);
  }

  // Verifica remote
  const remoteCheck = await run("git remote -v");
  if (!remoteCheck.out.includes("origin")) {
    console.error("❌ Remote 'origin' não configurado. Rode o setup primeiro.");
    process.exit(1);
  }

  // Add all
  console.log("📁 Verificando alterações...");
  await run("git add -A");

  const status = await run("git status --short");
  if (!status.out) {
    console.log("✅ Nada novo para commitar — workspace já sincronizado.");
    return;
  }

  const fileCount = status.out.split("\n").length;
  console.log(`📝 ${fileCount} arquivo(s) alterado(s):`);
  for (const line of status.out.split("\n").slice(0, 10)) {
    console.log(`   ${line}`);
  }
  if (fileCount > 10) {
    console.log(`   ... e mais ${fileCount - 10} arquivo(s)`);
  }

  // Commit
  const message = `📦 Backup automático — ${fileCount} arquivo(s) alterado(s)`;
  const commit = await run(`git commit -m "${message}"`);
  if (commit.err && !commit.err.includes("nothing to commit")) {
    console.error("⚠️  Aviso no commit:", commit.err);
  }
  console.log("✅ Commitado");

  // Push
  console.log("📤 Enviando para o GitHub...");
  const push = await run(`git push origin ${BRANCH}`);
  if (push.err && !push.err.includes("Everything up-to-date") && !push.err.includes("up-to-date")) {
    console.error("⚠️  Aviso no push:", push.err);
  }
  console.log("✅ Enviado com sucesso!");

  // Totais
  const { out: count } = await run("git rev-list --count HEAD");
  console.log(`\n📊 Total de commits: ${count || 0}`);
  console.log(`🔗 https://github.com/aajunior43/workspace-backup`);
}

main().catch((e) => {
  console.error("❌ Erro:", e.message);
  process.exit(1);
});
