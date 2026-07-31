---
name: notas
description: Gerencia o cofre de notas no estilo Obsidian Vault em /home/workspace/cofre-obsidian/. Cria, busca, lista e atualiza notas em markdown com frontmatter, wikilinks e estrutura por tema. Use sempre que Aleksandro pedir para salvar, anotar, guardar, arquivar, fixar ou registrar uma nota, ideia, reflexão, lembrete, citação, trecho de pesquisa ou qualquer conteúdo de texto longo/médio no "cofre", "obsidian", "vault", "notas" ou "anotações".
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  display-name: 📝 Cofre de Notas (Obsidian)
  version: "1.0"
  tags: [notas, obsidian, vault, cofre, markdown, ideias, pessoal]
---

# 📝 Skill: Cofre de Notas (Obsidian)

Vault pessoal do Aleksandro em `/home/workspace/cofre-obsidian/`, estruturado para abrir
diretamente no **Obsidian** como `Open folder as vault`. Tudo é markdown puro, com
frontmatter, wikilinks e organização por tema.

---

## 📂 Estrutura do vault

```
cofre-obsidian/
├── .obsidian/          ← Config do Obsidian (tema, plugins, atalhos)
├── README.md           ← Apresentação do cofre
├── indice/             ← Notas-índice (MOCs — Maps of Content)
│   └── Home.md         ← Página inicial do vault com Dataview
├── ideias/             ← Insights, reflexões, "puxar do papel"
├── pessoal/            ← Vida pessoal, família, saúde
├── trabalho/           ← Prefeitura, projetos profissionais
├── estudos/            ← Cursos, leituras, resumos
├── pesquisas/          ← Pesquisas web, relatórios, clippings
├── receitas/           ← Receitas culinárias
├── rascunhos/          ← Coisas incompletas, em progresso
└── anexos/             ← Imagens, PDFs, áudios referenciados pelas notas
```

### Quando criar uma pasta nova

**Nunca** criar pasta nova sem o usuário pedir. Se uma nota não encaixar nas pastas
existentes, perguntar uma vez antes de criar.

---

## 🏷️ Pastas — quando usar cada uma

| Pasta | Quando usar |
|-------|-------------|
| `ideias/` | Insights rápidos, frases, reflexões, "preciso pensar sobre isso" |
| `pessoal/` | Família, saúde, hobbies, vida pessoal |
| `trabalho/` | Prefeitura, tarefas profissionais, rotinas de trabalho |
| `estudos/` | Cursos, livros, resumos de leitura, conceitos a aprender |
| `pesquisas/` | Resultados de busca, artigos salvos, clippings, fontes |
| `receitas/` | Receitas de comida, drinks, técnicas culinárias |
| `rascunhos/` | Notas incompletas, inacabadas, em progresso |
| `anexos/` | Arquivos binários (imagens, PDFs, áudios) — referenciados por `![[anexos/arquivo.png]]` |
| `indice/` | MOCs (Maps of Content) — notas que indexam outras por tema |

---

## ✍️ Convenção de nome de arquivo

**Sempre `kebab-case` sem acento nem cedilha:**

- ✅ `gestao-do-tempo.md`
- ✅ `receita-bolo-de-cenoura.md`
- ❌ `Gestão do tempo.md`
- ❌ `gestão_do_tempo.md`
- ❌ `receita-bolo-de-cenoura-com-cobertura.md` (genérico demais)

**Regras:**
1. Minúsculas, sem acentos, sem espaços
2. Palavras separadas por hífen
3. Sem stop words desnecessárias ("de", "para", "com") só se for o título inteiro
4. Extensão `.md` obrigatória
5. Se o título for muito longo, encurtar mantendo ideia central

---

## 📋 Frontmatter obrigatório

Toda nota nova **deve** começar com frontmatter YAML:

```markdown
---
title: Título legível da nota
tags: [tag1, tag2, tag3]
data: 2026-07-26
tema: ideias
fonte: (opcional) onde a ideia veio
status: rascunho | completo | revisado
---
```

### Campos

| Campo | Obrigatório | Descrição |
|-------|:-----------:|-----------|
| `title` | ✅ | Título legível (com acentos, maiúsculas) |
| `tags` | ✅ | Lista de 1-5 tags em kebab-lowercase |
| `data` | ✅ | Data de criação ISO (AAAA-MM-DD) — America/Sao_Paulo |
| `tema` | ✅ | Nome da pasta: `ideias`, `pessoal`, `trabalho`, `estudos`, `pesquisas`, `receitas`, `rascunhos` |
| `fonte` | ❌ | URL, livro, conversa, pessoa — onde veio |
| `status` | ❌ | `rascunho` (padrão), `completo`, `revisado` |
| `anexos` | ❌ | Lista de anexos referenciados (ex: `["anexos/grafico.png"]`) |

---

## 🔗 Wikilinks — quando usar

Use `[[nome-da-nota]]` para linkar entre notas do próprio vault:

```markdown
Vi numa pesquisa que [[foco-profundo]] é mais produtivo que multitarefa.
Relacionado: [[gestao-do-tempo]], [[produtividade-pessoal]].
```

**Regras:**
1. Use o **slug** do arquivo, sem `.md`: `[[receita-bolo-cenoura]]` não `[[receita-bolo-cenoura.md]]`
2. Wikilinks entre notas do mesmo vault
3. Não use wikilinks para arquivos fora do vault — use link markdown normal `[texto](caminho)`
4. **Backlinks** são automáticos no Obsidian, mas ao criar nota nova:
   - Fazer `grep` ou `listar` notas do mesmo tema
   - Se houver 1+ nota relacionada, **sugerir 1 backlink** ao usuário

### Embasamentos (embed)

Para imagens, PDFs e áudios:

```markdown
![[anexos/grafico-glicose.png]]
![[anexos/entrevista.mp3]]
```

Anexos vão em `anexos/` e são referenciados — **nunca inline em markdown**.

---

## 🎯 Como o usuário pede (gatilhos)

A skill é acionada por pedidos como:

- "Salva no cofre: ..."
- "Anota no obsidian: ..."
- "Guarda essa ideia: ..."
- "Arquiva essa nota: ..."
- "Cria uma nota sobre ..."
- "Registra isso no vault: ..."
- "Manda pro cofre: ..."
- "Fixa essa reflexão: ..."

E variações naturais: "anota aí", "guarda isso", "salva pra depois", "quero lembrar
disso", "isso é importante, anota".

---

## 🔄 Fluxo completo ao receber um pedido

1. **Detectar tema**
   - Inferir pelo conteúdo (ex: receita → `receitas/`, Prefeitura → `trabalho/`)
   - Se genuinamente incerto, **perguntar UMA vez** com as 2-3 opções mais prováveis

2. **Definir título e slug**
   - Título em linguagem natural (com acentos)
   - Slug em kebab-case sem acento
   - Se já existir nota com mesmo slug, perguntar se quer atualizar ou criar v2

3. **Detectar tags**
   - 1-5 tags relevantes, kebab-lowercase
   - Pelo menos 1 tag deve refletir o tema

4. **Compor frontmatter**
   - `data` = hoje (America/Sao_Paulo) em ISO
   - `status` = `rascunho` (default) a menos que Aleksandro diga "completo" / "revisado"

5. **Escrever corpo da nota**
   - Markdown válido, headings `#`/`##`/`###` quando fizer sentido
   - Wikilinks para notas relacionadas
   - Se for continuação de nota existente, perguntar se quer **append** ou **nova nota**

6. **Salvar em `cofre-obsidian/<tema>/<slug>.md`**

7. **Verificar backlinks** (opcional mas recomendado)
   - `grep -rli "palavra-chave" cofre-obsidian/` para achar notas relacionadas
   - Se houver match óbvio, mencionar 1 backlink sugerido

8. **Confirmar**
   - Mostrar caminho do arquivo
   - Mostrar snippet do frontmatter
   - Sugerir 1 backlink se existir nota parecida

---

## 🛠️ Script CLI

A skill inclui `scripts/notas.ts` (Bun/TypeScript) para gerenciar o cofre:

```bash
bun run Skills/notas/scripts/notas.ts --help
```

### Comandos

| Comando | Função |
|---------|--------|
| `criar` | Cria nova nota com frontmatter, detecta tema, gera slug |
| `listar` | Lista todas as notas (com filtro por tema) |
| `buscar` | Busca por texto no título, tags ou corpo |
| `atualizar` | Atualiza uma nota existente (frontmatter ou append conteúdo) |
| `indice` | Atualiza a página Home do vault com lista de últimas notas |
| `anexar` | Move arquivo para `anexos/` e retorna o wikilink pronto |

### Exemplos

```bash
# Criar nota simples (tema detectado pelo conteúdo)
bun run Skills/notas/scripts/notas.ts criar \
  --titulo "Foco profundo em trabalho" \
  --tema ideias \
  --tags "produtividade,foco" \
  --conteudo "Sessões de 90min sem interrupção rendem 3x mais que várias curtas."

# Criar nota com conteúdo via stdin ou arquivo
cat pensamento.txt | bun run Skills/notas/scripts/notas.ts criar \
  --titulo "Pensamento sobre X" --tema pessoal

# Listar
bun run Skills/notas/scripts/notas.ts listar
bun run Skills/notas/scripts/notas.ts listar --tema trabalho

# Buscar
bun run Skills/notas/scripts/notas.ts buscar "foco"

# Anexar imagem
bun run Skills/notas/scripts/notas.ts anexar /home/workspace/Images/grafico.png
# → ![[anexos/grafico.png]]
```

---

## 📌 Página inicial do vault (`indice/Home.md`)

A nota `indice/Home.md` é a **porta de entrada** do vault. Usa Dataview para listar
notas recentes e por tema. Atualizar quando Aleksandro criar/abrir o vault pela primeira
vez ou pedir para "atualizar o índice".

Exemplo de conteúdo:

```markdown
---
title: Home — Cofre de Notas
data: 2026-07-26
tags: [home, indice]
---

# 📝 Cofre de Notas

Bem-vindo ao cofre. Use a barra lateral para navegar por tema, ou veja abaixo as
**últimas notas adicionadas**.

## 🆕 Recentes

\`\`\`dataview
LIST
FROM ""
SORT data DESC
LIMIT 10
\`\`\`

## 💡 Por tema

- **Ideias** → [[ideias/Home]]
- **Pessoal** → [[pessoal/Home]]
- **Trabalho** → [[trabalho/Home]]
- **Estudos** → [[estudos/Home]]
- **Pesquisas** → [[pesquisas/Home]]
- **Receitas** → [[receitas/Home]]
- **Rascunhos** → [[rascunhos/Home]]
```

(Obsidian renderiza o bloco Dataview se o plugin estiver ativado. Sem o plugin, mostra
como código.)

---

## ⚙️ Configuração do Obsidian (`.obsidian/`)

Ao criar o vault, são gerados:

- `.obsidian/app.json` — nome do vault, janela, layout
- `.obsidian/appearance.json` — tema (claro/escuro)
- `.obsidian/vault-stats.json` — estatísticas

**Não editar `.obsidian/`** a menos que Aleksandro peça explicitamente. Plugins e
configurações são responsabilidade dele dentro do app.

---

## 🛡️ Princípios da skill

1. **Conservadora** — só salva o que foi pedido, não inventa conteúdo
2. **Idempotente** — se já existe nota com mesmo slug, pergunta antes de sobrescrever
3. **Wikilinker** — sempre que possível conecta a notas existentes do mesmo tema
4. **Estruturada** — frontmatter consistente, kebab-case, sem acento
5. **Respeita organização** — nunca cria pasta nova sem o usuário pedir
6. **Backup-friendly** — o cofre já é coberto pelo `backup-github` automaticamente

---

## 📚 Exemplos práticos

### Exemplo 1: Salvar uma ideia rápida

> Aleksandro: "Salva no cofre: pensei que toda reunião deveria ter agenda por escrito
> e ata no final, senão é só bate-papo."

**Resultado:** `cofre-obsidian/ideias/reunioes-com-agenda-e-ata.md`

```markdown
---
title: Reuniões com agenda e ata
tags: [produtividade, trabalho, gestão]
data: 2026-07-26
tema: ideias
status: rascunho
---

Toda reunião deveria ter agenda por escrito e ata no final, senão é só bate-papo.

Relacionado: [[gestao-do-tempo]], [[reunioes-eficazes]].
```

### Exemplo 2: Salvar uma receita

> Aleksandro: "Anota no obsidian: bolo de cenoura com cobertura de chocolate."

**Resultado:** `cofre-obsidian/receitas/bolo-cenoura-cobertura-chocolate.md`

### Exemplo 3: Salvar uma pesquisa

> Aleksandro: "Guarda isso no cofre: achei um artigo sobre produtividade no X."

**Resultado:** `cofre-obsidian/pesquisas/produtividade-artigo-x.md` (com `fonte: URL` no frontmatter)

### Exemplo 4: Adicionar lembrete rápido

> Aleksandro: "Fixa essa ideia: a resposta tá em fazer menos, não mais."

**Resultado:** `cofre-obsidian/ideias/fazer-menos-nao-mais.md` — citação curta, status `completo`

---

## 🔗 Integrações

- **Backup:** O cofre inteiro entra no backup automático do GitHub via `backup-github`
- **Busca web:** Quando Aleksandro disser "pesquise e salve no cofre", combinar com
  `firecrawl` ou `scrapling` para trazer o conteúdo
- **Relatórios:** Notas de `pesquisas/` podem virar relatórios em `Relatorios/`
- **Saúde:** Notas de `pessoal/saude/` (se criadas) NÃO substituem o registro de saúde
  em `saude/registro_saude.md` — esse é estruturado e contínuo

---

## 🆘 Quando NÃO usar esta skill

- **Medições de saúde (glicose, pressão, pulso)** → use a skill `saude`
- **Links/bookmarks** → use a skill `site`
- **Calendário/eventos** → use a skill `calendario`
- **PDFs oficiais/Prefeitura** → use a skill `pdf` + manter em `Prefeitura/`
- **Registros contínuos estruturados** (ex: saúde, finanças) → manter nas skills próprias

A skill `notas` é para **conteúdo livre**, **reflexões**, **conhecimento solto** —
tudo que é texto e merece um lugar pra ser lembrado e linkado depois.
