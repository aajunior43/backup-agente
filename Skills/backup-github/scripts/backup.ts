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

function run(cmd: string[], cwd = WORKSPACE): { out: string; err: string; code: number } {
  const proc = Bun.spawnSync(cmd, { cwd, env: { ...process.env } });
  return {
    out: proc.stdout.toString().trim(),
    err: proc.stderr.toString().trim(),
    code: proc.exitCode,
  };
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

Use o comando abaixo ou o painel de
Automações do Zo Computer:

  cria uma automação que executa
  "bun /home/workspace/Skills/backup-github/scripts/backup.ts"
  todo dia às 00:00 (horário de Inajá)

Rrule: RRULE:FREQ=DAILY;BYHOUR=0;BYMINUTE=0
    `);
    return;
  }

  // Verificar se há alterações
  const status = run(["git", "status", "--porcelain"]);
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
      const icon = getTipoArquivo(file);
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
  console.log("🔄 Fazendo backup do workspace...\n");

  const changedLines = status.out.split("\n").filter(Boolean);
  const tipos = new Set(changedLines.map(l => getTipoArquivo(l.slice(3))));
  const emojiTema = [...tipos].join("");

  // Add tudo
  run(["git", "add", "."]);

  // Criar mensagem de commit
  const modified = changedLines.filter(l => l.startsWith(" M") || l.startsWith("M ")).length;
  const added = changedLines.filter(l => l.startsWith("??")).length;
  const deleted = changedLines.filter(l => l.startsWith(" D") || l.startsWith("D ")).length;

  const partes = [];
  if (modified) partes.push(`📝 ${modified} alterados`);
  if (added) partes.push(`✨ ${added} novos`);
  if (deleted) partes.push(`🗑️ ${deleted} removidos`);

  const msg = `${emojiTema} Backup automático — ${partes.join(", ")}`;

  const commit = run(["git", "commit", "-m", msg]);
  if (commit.err && commit.err.includes("nothing to commit")) {
    console.log("✅ Nada para commitar");
    return;
  }

  console.log(`📝 ${msg}`);
  const push = run(["git", "push", "-u", "origin", BRANCH]);
  if (push.code === 0) {
    console.log(`📤 Enviado para GitHub`);
    console.log(`\n✅ Backup concluído em ${new Date().toLocaleString("pt-BR")}`);
  } else {
    console.error(`❌ Erro no push: ${push.err}`);
    process.exit(1);
  }
}

main();
