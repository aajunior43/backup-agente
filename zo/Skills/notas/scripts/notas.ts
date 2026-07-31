#!/usr/bin/env bun
/**
 * Skill: notas — CLI para gerenciar o cofre Obsidian
 * /home/workspace/cofre-obsidian/
 *
 * Comandos:
 *   criar      Cria nova nota com frontmatter
 *   listar     Lista notas (com filtro por tema)
 *   buscar     Busca por texto em título/tags/corpo
 *   atualizar  Atualiza frontmatter ou faz append de conteúdo
 *   indice     Atualiza a página Home com lista de últimas notas
 *   anexar     Move arquivo para anexos/ e retorna wikilink
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, copyFileSync, renameSync, rmSync } from "node:fs";
import { join, basename, extname, relative } from "node:path";

const COFRE = "/home/workspace/cofre-obsidian";
const TEMAS_VALIDOS = ["ideias", "pessoal", "trabalho", "estudos", "pesquisas", "receitas", "rascunhos"] as const;
type Tema = (typeof TEMAS_VALIDOS)[number];

// ============================================================================
// Utils
// ============================================================================

function slugify(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function hojeISO(): string {
  // America/Sao_Paulo
  const now = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function hojeBR(): string {
  const now = new Date();
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now);
}

function parseFrontmatter(content: string): { front: Record<string, unknown>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { front: {}, body: content };

  const front: Record<string, unknown> = {};
  const lines = match[1].split("\n");
  for (const line of lines) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val: unknown = m[2].trim();
    if (typeof val === "string") {
      if (val.startsWith("[") && val.endsWith("]")) {
        // array simples [a, b, c]
        val = val
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      } else if (val === "true") val = true;
      else if (val === "false") val = false;
      else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) val = val;
      else val = (val as string).replace(/^["']|["']$/g, "");
    }
    front[key] = val;
  }
  return { front, body: match[2].trim() };
}
function normalizeTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((t) => String(t).trim()).filter(Boolean);
  if (typeof v === "string") {
    return v.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}


function buildFrontmatter(fields: Record<string, unknown>): string {
  const lines = ["---"];
  for (const [key, val] of Object.entries(fields)) {
    if (Array.isArray(val)) {
      lines.push(`${key}: [${val.join(", ")}]`);
    } else if (typeof val === "string") {
      lines.push(`${key}: ${val}`);
    } else if (typeof val === "boolean" || typeof val === "number") {
      lines.push(`${key}: ${val}`);
    }
  }
  lines.push("---", "");
  return lines.join("\n");
}

function findFiles(dir: string, ext = ".md"): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (name === ".obsidian") continue;
      out.push(...findFiles(p, ext));
    } else if (name.endsWith(ext)) {
      out.push(p);
    }
  }
  return out;
}

function detectTema(content: string, hint?: string): Tema {
  if (hint && TEMAS_VALIDOS.includes(hint as Tema)) return hint as Tema;
  const lower = content.toLowerCase();
  if (/\b(receita|ingrediente|cozinhar|forno|molho|bolo|massa)\b/.test(lower)) return "receitas";
  if (/\b(prefeitura|prefeito|municipal|secretaria|licitação|dotação|ofício)\b/.test(lower)) return "trabalho";
  if (/\b(curso|livro|capítulo|estudo|aprender|aula|resumo)\b/.test(lower)) return "estudos";
  if (/\b(pesquisa|artigo|fonte|relatório|clipping)\b/.test(lower)) return "pesquisas";
  if (/\b(esposa|família|avó|filho|saúde|pessoal|diário)\b/.test(lower)) return "pessoal";
  if (/\b(rascunho|incompleto|em progresso)\b/.test(lower)) return "rascunhos";
  return "ideias";
}

function extractTitle(content: string, fallback: string): string {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

function extractTagsFromContent(content: string): string[] {
  const m = content.match(/#\w+/g);
  if (!m) return [];
  return m
    .map((t) => t.slice(1).toLowerCase())
    .filter((t, i, a) => a.indexOf(t) === i)
    .slice(0, 5);
}

// ============================================================================
// Comandos
// ============================================================================

function cmdCriar(args: string[]): void {
  const titulo = getArg(args, "--titulo") || getArg(args, "-t");
  if (!titulo) {
    console.error("Erro: --titulo é obrigatório");
    process.exit(1);
  }
  const temaInput = getArg(args, "--tema") || "auto";
  const tagsArg = getArg(args, "--tags") || "";
  const fonte = getArg(args, "--fonte");
  const status = getArg(args, "--status") || "rascunho";
  const anexosArg = getArg(args, "--anexos") || "";
  const contentArg = getArg(args, "--conteudo") || getArg(args, "-c");
  const stdinFlag = args.includes("--stdin");
  const dryRun = args.includes("--dry-run");

  let content = "";
  if (stdinFlag) {
    content = readFileSync(0, "utf-8").trim();
  } else if (contentArg) {
    if (existsSync(contentArg)) {
      content = readFileSync(contentArg, "utf-8").trim();
    } else {
      content = contentArg;
    }
  }

  const tema: Tema = temaInput === "auto" ? detectTema(content + " " + titulo) : (temaInput as Tema);
  if (!TEMAS_VALIDOS.includes(tema)) {
    console.error(`Erro: tema inválido "${tema}". Válidos: ${TEMAS_VALIDOS.join(", ")}`);
    process.exit(1);
  }

  const slug = slugify(titulo);
  const filePath = join(COFRE, tema, `${slug}.md`);

  if (existsSync(filePath) && !args.includes("--force")) {
    console.error(`Erro: já existe nota em ${filePath}`);
    console.error("Use --force para sobrescrever ou ajuste o título.");
    process.exit(1);
  }

  const tags = tagsArg
    ? tagsArg.split(",").map((s) => s.trim().toLowerCase().replace(/[^a-z0-9-]/g, "")).filter(Boolean)
    : extractTagsFromContent(content + " " + titulo);
  if (tags.length === 0) tags.push(tema);

  const titleInContent = extractTitle(content, titulo);
  const front: Record<string, unknown> = {
    title: titleInContent,
    tags,
    data: hojeISO(),
    tema,
    status,
  };
  if (fonte) front.fonte = fonte;
  if (anexosArg) front.anexos = anexosArg.split(",").map((s) => s.trim());

  const body = content ? (content.startsWith("#") ? content : `# ${titulo}\n\n${content}`) : `# ${titulo}\n`;
  const fullContent = buildFrontmatter(front) + body + "\n";

  if (dryRun) {
    console.log("--- DRY RUN ---");
    console.log(`Caminho: ${filePath}`);
    console.log("--- Conteúdo ---");
    console.log(fullContent);
    return;
  }

  mkdirSync(join(COFRE, tema), { recursive: true });
  writeFileSync(filePath, fullContent, "utf-8");
  console.log(`✓ Nota criada: ${filePath}`);
  console.log(`  Tema: ${tema} | Tags: ${tags.join(", ")} | Data: ${hojeISO()}`);

  // Sugestão de backlink
  const allFiles = findFiles(COFRE);
  const candidates: { path: string; matches: number }[] = [];
  for (const f of allFiles) {
    if (f === filePath) continue;
    const c = readFileSync(f, "utf-8");
    const words = (titulo.toLowerCase() + " " + content.toLowerCase()).split(/\s+/).filter((w) => w.length > 4);
    const matches = words.filter((w) => c.toLowerCase().includes(w)).length;
    if (matches >= 2) candidates.push({ path: f, matches });
  }
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.matches - a.matches);
    const rel = relative(COFRE, candidates[0].path).replace(/\.md$/, "");
    console.log(`💡 Possível backlink: [[${rel}]] (encontrado em ${candidates[0].path})`);
  }
}

function cmdListar(args: string[]): void {
  const temaFilter = getArg(args, "--tema");
  const limit = parseInt(getArg(args, "--limit") || "50", 10);

  const files = findFiles(COFRE)
    .filter((f) => !f.includes("/indice/"))
    .map((f) => {
      const c = readFileSync(f, "utf-8");
      const { front } = parseFrontmatter(c);
      return {
        path: f,
        rel: relative(COFRE, f),
        title: (front.title as string) || basename(f, ".md"),
        data: (front.data as string) || "????-??-??",
        tema: (front.tema as string) || "?",
        tags: normalizeTags(front.tags),
        status: (front.status as string) || "?",
      };
    })
    .filter((n) => !temaFilter || n.tema === temaFilter)
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, limit);

  if (files.length === 0) {
    console.log("(nenhuma nota encontrada)");
    return;
  }

  console.log(`\n📚 ${files.length} nota(s)${temaFilter ? ` em ${temaFilter}/` : ""}\n`);
  for (const f of files) {
    const statusIcon = f.status === "completo" ? "✓" : f.status === "revisado" ? "★" : "✎";
    console.log(`${statusIcon} ${f.data}  [${f.tema.padEnd(10)}]  ${f.title}`);
    console.log(`  ${f.rel}`);
    if (f.tags.length > 0) console.log(`  🏷  ${f.tags.join(", ")}`);
    console.log();
  }
}

function cmdBuscar(args: string[]): void {
  const query = args.find((a) => !a.startsWith("--"));
  if (!query) {
    console.error("Erro: termo de busca obrigatório");
    console.error("Uso: notas buscar <termo> [--tema X]");
    process.exit(1);
  }
  const temaFilter = getArg(args, "--tema");
  const lower = query.toLowerCase();
  const files = findFiles(COFRE).filter((f) => !f.includes("/indice/"));
  const matches: { path: string; rel: string; title: string; count: number }[] = [];

  for (const f of files) {
    if (temaFilter && !f.includes(`/${temaFilter}/`)) continue;
    const c = readFileSync(f, "utf-8");
    const { front } = parseFrontmatter(c);
    const titleStr = (front.title as string) || "";
    const tagsStr = (normalizeTags(front.tags)).join(" ");
    const haystack = (c + " " + titleStr + " " + tagsStr).toLowerCase();
    const count = (haystack.match(new RegExp(lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
    if (count > 0) {
      matches.push({ path: f, rel: relative(COFRE, f), title: titleStr, count });
    }
  }

  matches.sort((a, b) => b.count - a.count);
  if (matches.length === 0) {
    console.log(`(nenhum resultado para "${query}")`);
    return;
  }
  console.log(`\n🔍 ${matches.length} resultado(s) para "${query}"\n`);
  for (const m of matches) {
    console.log(`${m.count}×  ${m.title}`);
    console.log(`     ${m.rel}\n`);
  }
}

function cmdAtualizar(args: string[]): void {
  const slugOrTema = getArg(args, "--nota");
  if (!slugOrTema) {
    console.error("Erro: --nota <slug> ou --nota <tema/slug> é obrigatório");
    process.exit(1);
  }
  const filePath = slugOrTema.includes("/")
    ? join(COFRE, slugOrTema.endsWith(".md") ? slugOrTema : `${slugOrTema}.md`)
    : findFiles(COFRE).find((f) => basename(f, ".md") === slugOrTema);

  if (!filePath || !existsSync(filePath)) {
    console.error(`Erro: nota "${slugOrTema}" não encontrada`);
    process.exit(1);
  }

  const content = readFileSync(filePath, "utf-8");
  const { front, body } = parseFrontmatter(content);

  // Atualizar campos do frontmatter
  for (const field of ["title", "tema", "status", "fonte"]) {
    const v = getArg(args, `--${field}`);
    if (v) front[field] = v;
  }
  if (args.includes("--tags")) {
    const t = getArg(args, "--tags");
    front.tags = t.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  }

  // Append conteúdo
  const appendArg = getArg(args, "--append") || getArg(args, "-a");
  if (args.includes("--stdin")) {
    const stdin = readFileSync(0, "utf-8").trim();
    const newBody = body + "\n\n" + stdin;
    writeFileSync(filePath, buildFrontmatter(front) + newBody + "\n", "utf-8");
  } else if (appendArg) {
    const txt = existsSync(appendArg) ? readFileSync(appendArg, "utf-8").trim() : appendArg;
    const newBody = body + "\n\n" + txt;
    writeFileSync(filePath, buildFrontmatter(front) + newBody + "\n", "utf-8");
  } else {
    writeFileSync(filePath, buildFrontmatter(front) + body + "\n", "utf-8");
  }

  console.log(`✓ Nota atualizada: ${filePath}`);
}

function cmdIndice(_args: string[]): void {
  const homePath = join(COFRE, "indice", "Home.md");
  mkdirSync(join(COFRE, "indice"), { recursive: true });

  const files = findFiles(COFRE)
    .filter((f) => !f.includes("/indice/") && !f.includes("/anexos/"))
    .map((f) => {
      const c = readFileSync(f, "utf-8");
      const { front } = parseFrontmatter(c);
      return {
        rel: relative(COFRE, f).replace(/\.md$/, ""),
        title: (front.title as string) || basename(f, ".md"),
        data: (front.data as string) || "????-??-??",
        tema: (front.tema as string) || "?",
        tags: normalizeTags(front.tags),
      };
    })
    .sort((a, b) => b.data.localeCompare(a.data));

  const recentes = files.slice(0, 10);
  const porTema: Record<string, number> = {};
  for (const f of files) porTema[f.tema] = (porTema[f.tema] || 0) + 1;

  const recentesMd = recentes
    .map((f) => `- **${f.data}** — [[${f.rel}|${f.title}]] _(${f.tema})_`)
    .join("\n");

  const statsMd = Object.entries(porTema)
    .sort((a, b) => b[1] - a[1])
    .map(([t, n]) => `- **${t}**: ${n} nota(s)`)
    .join("\n");

  const conteudo = `---
title: Home — Cofre de Notas
data: ${hojeISO()}
tags: [home, indice]
status: completo
---

# 📝 Cofre de Notas

Bem-vindo ao cofre de notas do Aleksandro. Use a barra lateral para navegar por tema.

**Total:** ${files.length} notas  •  **Atualizado em:** ${hojeBR()}

## 🆕 Recentes

${recentesMd || "_Nenhuma nota ainda._"}

## 📊 Por tema

${statsMd || "_Nenhuma nota ainda._"}

## 💡 Por tema (índices)

- **Ideias** → [[ideias/Home]]
- **Pessoal** → [[pessoal/Home]]
- **Trabalho** → [[trabalho/Home]]
- **Estudos** → [[estudos/Home]]
- **Pesquisas** → [[pesquisas/Home]]
- **Receitas** → [[receitas/Home]]
- **Rascunhos** → [[rascunhos/Home]]
`;

  writeFileSync(homePath, conteudo, "utf-8");
  console.log(`✓ Índice atualizado: ${homePath}`);
  console.log(`  ${files.length} notas indexadas.`);
}

function cmdAnexar(args: string[]): void {
  const source = args.find((a) => !a.startsWith("--") && a !== "anexar");
  if (!source) {
    console.error("Erro: caminho do arquivo é obrigatório");
    console.error("Uso: notas anexar <arquivo> [--pasta X]");
    process.exit(1);
  }
  if (!existsSync(source)) {
    console.error(`Erro: arquivo não encontrado: ${source}`);
    process.exit(1);
  }

  const anexosDir = join(COFRE, "anexos");
  mkdirSync(anexosDir, { recursive: true });

  const filename = basename(source);
  const dest = join(anexosDir, filename);
  if (existsSync(dest)) {
    console.error(`Erro: já existe anexo em ${dest}`);
    process.exit(1);
  }

  copyFileSync(source, dest);
  const ext = extname(filename).toLowerCase();
  const isMedia = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".mp3", ".mp4", ".wav", ".pdf"].includes(ext);
  const wikilink = isMedia ? `![[anexos/${filename}]]` : `[[anexos/${filename}]]`;
  console.log(`✓ Anexo copiado: ${dest}`);
  console.log(`  Wikilink: ${wikilink}`);
}

// ============================================================================
// CLI main
// ============================================================================

function getArg(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1) return undefined;
  return args[i + 1];
}

function printHelp(): void {
  console.log(`📝 Skill: notas — Cofre Obsidian

Uso:
  bun run Skills/notas/scripts/notas.ts <comando> [opções]

Comandos:
  criar       Cria nova nota
  listar      Lista notas (--tema X --limit N)
  buscar      Busca por texto
  atualizar   Atualiza nota (--nota SLUG --append TEXTO)
  indice      Atualiza indice/Home.md
  anexar      Copia arquivo para anexos/

Opções comuns em 'criar':
  --titulo T         Título (obrigatório)
  --tema X           ideias|pessoal|trabalho|estudos|pesquisas|receitas|rascunhos|auto
  --tags t1,t2       Tags separadas por vírgula
  --fonte URL        Fonte da nota
  --status X         rascunho|completo|revisado
  --conteudo T       Conteúdo (texto direto OU caminho de arquivo)
  --stdin            Lê conteúdo do stdin
  --force            Sobrescreve se já existir
  --dry-run          Mostra o que seria feito sem salvar

Exemplos:
  bun run Skills/notas/scripts/notas.ts criar --titulo "Foco profundo" --tema ideias \\
    --tags "produtividade,foco" --conteudo "Sessões de 90min rendem 3x mais."

  bun run Skills/notas/scripts/notas.ts listar --tema trabalho

  bun run Skills/notas/scripts/notas.ts buscar "foco"

  bun run Skills/notas/scripts/notas.ts anexar /home/workspace/Images/grafico.png
`);
}

const [, , cmd, ...rest] = process.argv;

if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
  printHelp();
} else if (cmd === "criar") {
  cmdCriar(rest);
} else if (cmd === "listar" || cmd === "ls") {
  cmdListar(rest);
} else if (cmd === "buscar" || cmd === "search") {
  cmdBuscar(rest);
} else if (cmd === "atualizar" || cmd === "update") {
  cmdAtualizar(rest);
} else if (cmd === "indice" || cmd === "index") {
  cmdIndice(rest);
} else if (cmd === "anexar" || cmd === "attach") {
  cmdAnexar(rest);
} else {
  console.error(`Comando desconhecido: ${cmd}`);
  printHelp();
  process.exit(1);
}
