---
name: backup-github
description: Faz backup periódico de todo o workspace (/home/workspace) para a pasta zo/ do repositório compartilhado backup-agente no GitHub. Repositório usado por múltiplos agentes (zo, openclaw, hermes, odysseu).
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  category: Automation
  display-name: 🔄 GitHub Backup Automático
  emoji: 🔄
---

# 🔄 GitHub Backup Automático (Zo Computer)

## Propósito

Sincroniza o workspace (`/home/workspace`) com a pasta `zo/` do repositório **backup-agente** no GitHub.

O repositório é **compartilhado** entre múltiplos agentes. Cada um tem sua própria pasta:

```
backup-agente/
├── AGENTS.md       ← Instruções para todas as IAs
├── zo/             ← Zo Computer (este script)
├── openclaw/       ← OpenClaw / Claude Code
├── hermes/         ← Hermes Agent
└── odysseu/        ← Odysseu
```

⚠️ **Nunca modifique arquivos fora da pasta `zo/`** — cada agente gerencia seus próprios backups.

## Pré-requisito

Autenticação via `gh` CLI:

```bash
gh auth status
# Deve mostrar "Logged in to github.com account aajunior43"
```

Se não estiver autenticado:

```bash
gh auth login
```
Ou com token:
```bash
echo "seu_token" | gh auth login --with-token
gh auth setup-git
```

## Scripts

### `scripts/setup.ts` — Configuração única

Cria o repositório `backup-agente`, configura git e faz o primeiro push.

```bash
bun /home/workspace/Skills/backup-github/scripts/setup.ts
```

### `scripts/backup.ts` — Backup incremental

Rsync do workspace para `zo/` + commit + push.

```bash
bun /home/workspace/Skills/backup-github/scripts/backup.ts         # commit + push
bun /home/workspace/Skills/backup-github/scripts/backup.ts --status # mostra alterações
bun /home/workspace/Skills/backup-github/scripts/backup.ts --schedule # instruções
```

## Agendamento automático

Para rodar todo dia à meia-noite:

- **Comando:** `bun /home/workspace/Skills/backup-github/scripts/backup.ts`
- **Frequência:** Diariamente, 00:00 (horário Inajá)
- **Rrule:** `RRULE:FREQ=DAILY;BYHOUR=0;BYMINUTE=0`

Ou peça: **"Agenda o backup do workspace todo dia"**

## Repositório

- **GitHub:** https://github.com/aajunior43/backup-agente
- **Visibilidade:** Público
- **Estrutura:** pastas separadas por agente (`zo/`, `openclaw/`, `hermes/`, `odysseu/`)