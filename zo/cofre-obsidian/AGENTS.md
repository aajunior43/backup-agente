---
title: Cofre Obsidian
tags: meta, indice
tema: raiz
status: completo
---

# Cofre Obsidian

Vault pessoal do Aleksandro. Guarda notas longas/médias que precisam de um lar —
ideias, reflexões, pesquisas, receitas, anotações de estudo, trechos importantes,
rascunhos, etc. Pense nele como caderno geral fora do fluxo de tarefas.

> **Skill que opera este vault:** `Skills/notas/SKILL.md` — sempre use o CLI
> `bun run Skills/notas/scripts/notas.ts` em vez de criar arquivos `.md` à mão.

## Estrutura

```
cofre-obsidian/
├── AGENTS.md            ← Este arquivo
├── README.md            ← Apresentação curta
├── .obsidian/           ← Config do Obsidian (reconhece como vault)
├── ideias/              ← Insights, princípios, reflexões soltas
├── pessoal/             ← Diário, vida, família, saúde mental
├── trabalho/            ← Notas profissionais, atas, 1:1
├── estudos/             ← Cursos, livros, resumos de estudo
├── pesquisas/           ← Web research, Inteligência, papers
├── receitas/            ← Receitas culinárias
├── rascunhos/           ← Texto meio pronto, lixo útil
├── anexos/              ← Imagens, PDFs, áudios referenciados pelas notas
└── indice/
    └── Home.md          ← MOC raiz (gerado/atualizado pelo `notas indice`)
```

## Como adicionar uma nota

```bash
bun run Skills/notas/scripts/notas.ts criar \
  --titulo "Título curto" \
  --tema ideias \
  --tags "tag1,tag2" \
  --conteudo "Texto da nota"
```

Temas disponíveis: `ideias`, `pessoal`, `trabalho`, `estudos`, `pesquisas`,
`receitas`, `rascunhos`. Use `--tema auto` (padrão) se o assunto estiver
ambíguo — o script escolhe por heurística.

## Convenções

- **Nome do arquivo:** kebab-case sem acento (ex: `foco-profundo.md`)
- **Frontmatter:** YAML com `title`, `tags`, `tema`, `data`, `status`
- **Links internos:** wikilinks Obsidian `[[nome-da-nota]]` quando fizer sentido
- **Anexos:** sempre em `anexos/` — a nota referencia por nome
- **Backup:** diário, via `Skills/backup-github` → vai pra `zo/cofre-obsidian/`

## Comandos úteis da skill

| Comando | Uso |
|---------|-----|
| `criar` | Cria nota (com frontmatter e wikilinks) |
| `listar` | Lista notas (filtra por `--tema` e `--limit`) |
| `buscar` | Busca full-text no conteúdo |
| `atualizar` | Anexa texto a nota existente (`--append`) |
| `indice` | Regenera `indice/Home.md` com todas as notas |
| `anexar` | Copia arquivo para `anexos/` |
