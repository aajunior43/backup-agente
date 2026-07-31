---
name: organizar-workspace
description: Organiza os arquivos soltos na raiz do workspace (/home/workspace), movendo cada um para a pasta adequada (Prefeitura, saude, financeiro, Images, Articles, projetos, livro-cuscuz etc.) conforme o tipo e o conteúdo do nome. É conservador — só move arquivos com classificação confiável e lista os incertos para decisão manual, sem nunca apagar nada. Use sempre que Aleksandro pedir para organizar, arrumar, limpar ou ordenar os arquivos do workspace.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  display-name: 🗂️ Organizar Workspace
  version: "1.0"
  tags: [organização, arquivos, workspace, limpeza, classificação]
---

# 🗂️ Skill: Organizar Workspace

## O que faz

Varre a **raiz do workspace** (`/home/workspace`) atrás de **arquivos soltos** e move
cada um para a pasta correta, conforme o tipo e palavras-chave do nome. Substitui a
lógica que vivia solta na automação "Organização Automática do Workspace".

**Princípios de segurança:**
- **Nunca apaga** arquivos — apenas move.
- **Nunca toca** em `AGENTS.md`, `SOUL.md`, arquivos ocultos (`.algo`) nem pastas.
- **Só move o que tem classificação confiável.** Arquivos ambíguos são listados como
  "incertos" para o Aleksandro decidir — nada é jogado em pasta errada.
- **Dry-run por padrão**: mostra o que faria sem mover nada. Só move com `--apply`.

## Como usar

```bash
# 1. SEMPRE comece com o dry-run para mostrar o plano ao usuário
bun Skills/organizar-workspace/scripts/organizar.ts

# 2. Se o plano estiver certo, aplique de fato
bun Skills/organizar-workspace/scripts/organizar.ts --apply
```

O script imprime três blocos: **MOVIDOS** (o que foi/vai ser movido), **PROTEGIDOS**
(arquivos que ficam na raiz de propósito) e **INCERTOS** (classificação ambígua —
pergunte ao usuário antes de mover manualmente).

## Regras de classificação

| Arquivo | Destino |
|---|---|
| Nome com palavra municipal (prefeitura, ofício, contrato, empenho, licitação, TCE, decreto…) | `Prefeitura/` |
| `converted*.txt` (transcrições de áudio de medições) | `saude/transcricoes-audio/` |
| Nome de saúde (glicose, pressão, insulina, medições…) | `saude/` |
| Nome financeiro (credenciais, bancário, conta, FPM…) | `financeiro/` |
| `.pdf` sem contexto municipal | `Articles/` |
| `.html` / `.htm` | `projetos/` |
| Imagem (`.png .jpg .jpeg .gif .webp .svg`) | `Images/` |
| `livro-cuscuz.*` | `livro-cuscuz/` |
| Artefatos LaTeX (`.aux .log .toc .out`) | movidos junto do projeto, senão listados como incertos |
| `.txt` / `.json` sem padrão claro | **incerto** (não move, reporta) |
