---
name: backup-github
description: Faz backup periódico de todo o workspace (/home/workspace) para um repositório GitHub. Cria o repositório se não existir, gerencia .gitignore, commita e faz push automático.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  category: Automation
  display-name: 🔄 GitHub Backup Automático
  emoji: 🔄
---
# 🔄 GitHub Backup Automático

## Propósito

Sincroniza todo o workspace (`/home/workspace`) com um repositório no GitHub automaticamente. Ideal para:

- Backup de segurança dos arquivos
- Histórico de versões de documentos
- Acesso remoto aos arquivos
- Integração com ferramentas de CI/CD

## Pré-requisito

A autenticação no GitHub é feita via `gh` CLI:

```bash
gh auth status
# Deve mostrar "Logged in to github.com account aajunior43"
```

Se não estiver autenticado, use:

```bash
gh auth login
```

Ou cole um token GitHub (começa com `ghp_` ou `github_pat_`):

```bash
echo "seu_token" | gh auth login --with-token
gh auth setup-git
```

## Scripts

### `scripts/setup.ts` — Configuração única

Cria o repositório `workspace-backup`, inicializa git e faz o **primeiro push**.

```bash
bun /home/workspace/Skills/backup-github/scripts/setup.ts
```

### `scripts/backup.ts` — Backup incremental

Commits e envia alterações. Pode ser executado manualmente ou agendado.

```bash
bun /home/workspace/Skills/backup-github/scripts/backup.ts         # commit + push
bun /home/workspace/Skills/backup-github/scripts/backup.ts --status # mostra alterações
bun /home/workspace/Skills/backup-github/scripts/backup.ts --schedule # instruções p/ agendar
```

## Agendamento automático

Para rodar todo dia à meia-noite via Zo Computer Automations:

No painel de automações, crie uma com:

- **Comando:** `bun /home/workspace/Skills/backup-github/scripts/backup.ts`
- **Frequência:** Diariamente, 00:00
- **Rrule:** `RRULE:FREQ=DAILY;BYHOUR=0;BYMINUTE=0`
- **Canal:** Nenhum (roda em background)

Ou peça diretamente: **"Agenda o backup do workspace todo dia"**

## .gitignore

O arquivo `workspace/.gitignore` já ignora:

- `node_modules/`, `.env`, `venv/`, `__pycache__/`
- Arquivos auxiliares do LaTeX (`*.aux`, `*.log`, `*.out` etc.)
- `.DS_Store`, `Thumbs.db`

## Repositório

- **GitHub:** https://github.com/aajunior43/workspace-backup
- **Visibilidade:** Público
