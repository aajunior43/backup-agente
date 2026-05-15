#!/usr/bin/env bun
/**
 * setup.ts — Configura o repositório GitHub para backup do workspace
 *
 * 1. Verifica se o gh CLI está autenticado
 * 2. Cria o repositório 'workspace-backup' no GitHub (se não existir)
 * 3. Inicializa git em /home/workspace
 * 4. Configura user.email e user.name
 * 5. Cria .gitignore
 * 6. Dá o primeiro commit + push
 */

const REPO = "workspace-backup";
const WORKSPACE = "/home/workspace";
const GIT_EMAIL = "aajunior43@gmail.com";
const GIT_NAME = "Aleksandro Backup";

async function run(cmd: string, cwd = WORKSPACE): Promise<string> {
  const proc = Bun.spawnSync(cmd.split(" "), { cwd });
  if (proc.exitCode !== 0) {
    const err = proc.stderr.toString().trim();
    if (!err.includes("already exists") && !err.includes("nothing to commit")) {
      console.error(`⚠️  Comando falhou: ${cmd}\n${err}`);
    }
    return err;
  }
  return proc.stdout.toString().trim();
}

async function main() {
  console.log("🔄 Configurando backup automático do workspace...\n");

  // 1. Verifica autenticação gh
  const auth = await run("gh auth status");
  if (auth.includes("not logged in")) {
    console.error("❌ GitHub CLI não autenticado. Rode 'gh auth login' primeiro.");
    process.exit(1);
  }
  console.log("✅ GitHub autenticado como: aajunior43");

  // 2. Cria repositório no GitHub
  console.log(`📦 Criando repositório '${REPO}' (se não existir)...`);
  await run(`gh repo create ${REPO} --public --description "Backup automático do workspace Zo Computer" --push`);
  console.log("✅ Repositório criado/verificado");

  // 3. Inicializa git
  const gitDir = `${WORKSPACE}/.git`;
  const dir = Bun.spawnSync(["test", "-d", gitDir]);
  if (dir.exitCode !== 0) {
    console.log("🔧 Inicializando git no workspace...");
    await run("git init");
    await run(`git remote add origin https://github.com/aajunior43/${REPO}.git`);
    await run("git checkout -b main");
    console.log("✅ Git inicializado");
  } else {
    console.log("✅ Git já inicializado");
    // Garante que a remote existe
    const remotes = await run("git remote -v");
    if (!remotes.includes("origin")) {
      await run(`git remote add origin https://github.com/aajunior43/${REPO}.git`);
    }
    await run("git checkout -b main 2>/dev/null || true");
  }

  // 4. Configura user
  await run(`git config user.email "${GIT_EMAIL}"`);
  await run(`git config user.name "${GIT_NAME}"`);
  console.log("✅ Git configurado");

  // 5. Cria .gitignore
  const gitignore = `${WORKSPACE}/.gitignore`;
  const hasGitignore = Bun.spawnSync(["test", "-f", gitignore]).exitCode === 0;
  if (!hasGitignore) {
    const content = `# === Zo Computer Workspace Backup ===
# Exclusões de segurança e desempenho

# Dependências
node_modules/
.pnp
.pnp.js

# Lixo do sistema
.DS_Store
Thumbs.db
*.swp
*.swo
*~

# Ambiente e segredos
.env
.env.local
.env.*.local
*.pem
*.key

# Arquivos grandes (>10MB PDFs, >5MB imagens)
*.pdf
!**/*.pdf
*.png
!**/*.png
*.jpg
!**/*.jpg
*.jpeg
!**/*.jpeg
# Nota: PDFs e imagens pequenos serão incluídos normalmente
# Apenas arquivos muito grandes são ignorados

# Cache e logs do Zo
/home/.z/
Trash/

# Conteúdo temporário
**/tmp/
**/temp/

# Build artifacts
dist/
build/
*.tsbuildinfo
`;
    await Bun.write(gitignore, content);
    console.log("✅ .gitignore criado");
  } else {
    console.log("✅ .gitignore já existe");
  }

  // 6. Primeiro commit + push
  console.log("\n📤 Enviando arquivos para o GitHub...");
  await run("git add -A");
  const status = await run("git status --porcelain");
  if (status.length > 0) {
    await run('git commit -m "📦 Primeiro backup do workspace"');
    try {
      await run("git push -u origin main --force");
      console.log("\n✅ Backup inicial concluído!");
      console.log(`🔗 https://github.com/aajunior43/${REPO}`);
    } catch (e) {
      // Tenta com force se o histórico for diferente
      await run("git push -u origin main --force");
      console.log("\n✅ Backup inicial concluído (force push)!");
      console.log(`🔗 https://github.com/aajunior43/${REPO}`);
    }
  } else {
    console.log("ℹ️  Nada novo para commitar — workspace já sincronizado");
    await run("git push -u origin main --force");
    console.log(`🔗 https://github.com/aajunior43/${REPO}`);
  }

  // Conta arquivos
  const count = await run("git ls-files | wc -l");
  console.log(`📁 ${count.trim()} arquivos rastreados`);
}

main().catch((e) => {
  console.error("❌ Erro:", e.message);
  process.exit(1);
});
