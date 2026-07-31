---
title: Cofre Obsidian
tags: [meta, indice]
---

# 🗄️ Cofre Obsidian

Cofre pessoal de notas do Aleksandro, gerenciado por mim (Zo) dentro do workspace
`/home/workspace/cofre-obsidian/`. Foi feito para ser aberto no Obsidian (ou
qualquer editor Markdown) — todos os arquivos aqui são `.md` puro, com wikilinks
e frontmatter.

---

## 📂 Estrutura

As notas ficam organizadas por **tópico** (pastas), mas você não precisa decorar
nada — basta me pedir e eu cuido da pasta certa.

| Pasta        | O que guardar                                                |
|--------------|--------------------------------------------------------------|
| `ideias/`    | Insights, reflexões, frases, lampejos rápidos                |
| `pessoal/`   | Vida pessoal, saúde, família, rotina, diário                 |
| `trabalho/`  | Prefeitura, finanças, projetos, clientes                     |
| `estudos/`   | Cursos, livros, resumos, anotações de aula                   |
| `pesquisas/` | Pesquisas web, reportagens, referências salvas               |
| `receitas/`  | Receitas, dicas de cozinha, restaurantes                     |
| `rascunhos/` | Coisas temporárias, depois a gente move                      |
| `anexos/`    | Imagens, PDFs, áudios referenciados pelas notas              |
| `indice/`    | Notas-índice (MOCs — Maps of Content)                        |

> Obsidian cuida da indexação e dos backlinks automaticamente. Não precisa
> mexer em nada de config.

---

## 💬 Como pedir para eu salvar uma nota

Você pode usar qualquer um destes comandos (eu entendo todos):

- **"salva essa nota no cofre: ..."** → cria uma nota nova
- **"anota no obsidian: ..."** → cria uma nota nova
- **"guarda essa ideia no cofre"** → cria nota rápida em `ideias/`
- **"adiciona isso à nota X"** → atualiza nota existente
- **"cria uma nota sobre Y com tudo que a gente conversou"** → nota longa
- **"lista as notas sobre Z"** → busca por título/tag/tópico
- **"apaga a nota X"** → manda pra lixeira
- **"faz backup do cofre agora"** → roda o `backup-github`

Eu cuido de:
- Escolher a pasta certa (ou perguntar se tiver dúvida)
- Criar/atualizar frontmatter (`title`, `tags`, `data`, `fonte`)
- Adicionar wikilinks `[[nota]]` quando você mencionar algo que já existe
- Sugerir tags consistentes
- Mover para `rascunhos/` o que for temporário

---

## 🔗 Wikilinks e tags

- Notas se referenciam com `[[nome-da-nota]]`
- Tags vão no frontmatter e no corpo (`#tag`)
- Para citar uma fonte: `[^1]` com a URL no rodapé da nota

---

## 🛡️ Backup

O cofre é incluído no backup diário do workspace para o repositório
`backup-agente/zo/` no GitHub (via skill `backup-github`).
Pra rodar backup manual: me peça "faz backup do cofre agora".
