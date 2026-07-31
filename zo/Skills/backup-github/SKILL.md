---
name: backup-github
description: Faz backup periódico de todo o workspace (/home/workspace) para a pasta zo/ do repositório compartilhado backup-agente no GitHub. Repositório usado por múltiplos agentes (zo, openclaw, hermes, odysseu).
compatibility: Requer bun, gh CLI autenticado, rsync e git instalados. Variável ZO_CLIENT_IDENTITY_TOKEN necessária para notificação de falha por Telegram.
metadata:
  author: aleksandro.zo.computer
---

# Backup GitHub — Workspace Zo

Backup automatizado do workspace para o GitHub. Cada agente escreve **apenas na sua pasta** (`zo/`, `openclaw/`, `hermes/`, `odysseu/`). O Zo é responsável exclusivamente por `zo/`.

## 🎯 Comandos

### Fazer backup (commit + push)
```bash
bun Skills/backup-github/scripts/backup.ts
```

### Verificar status (sem commitar)
```bash
bun Skills/backup-github/scripts/backup.ts --status
```

### Instruções de agendamento
```bash
bun Skills/backup-github/scripts/backup.ts --schedule
```

## ⚙️ Configuração

### Exclusões
Os padrões de exclusão ficam em `scripts/exclusions.txt` (sintaxe rsync, um por linha, `#` para comentários). Edite esse arquivo para incluir/remover exclusões **sem alterar o script**.

### Variáveis de ambiente
| Variável | Uso |
|----------|-----|
| `ZO_CLIENT_IDENTITY_TOKEN` | Necessária para notificar falha por Telegram (opcional, best-effort) |
| `ZO_BACKUP_MODEL` | Modelo usado na notificação via `/zo/ask` (opcional) |

## 🛡️ Melhorias de robustez

- **Lock file** (`/tmp/zo-backup.lock`) — impede execuções simultâneas; detecta e sobrescreve locks órfãos.
- **Notificação de falha por Telegram** — se qualquer etapa falhar, o Aleksandro é avisado automaticamente.
- **Recuperação de conflito de rebase** — se `git pull --rebase` falhar, aborta o rebase e reseta para a origem (seguro: o backup é regenerado do workspace a cada run).
- **Detecção de arquivos grandes** — avisa sobre arquivos >50MB e remove automaticamente os >100MB (limite duro do GitHub) para não travar o push.
- **Verificação pós-push** — confirma via `git ls-remote` que o commit local realmente chegou ao remote.
- **`--status` detalhado** — mostra contagem de alterações, tamanho total do backup e último commit.

## 🔄 Agendamento

Roda via Automation do Zo Computer, diariamente às 00:00 (America/Sao_Paulo). Ajuste a frequência pedindo ao Zo ("mude o backup para rodar a cada 12 horas").

## 📁 Estrutura

```
Skills/backup-github/
├── SKILL.md
└── scripts/
    ├── backup.ts          # script principal
    └── exclusions.txt     # padrões de exclusão (editável)
```

## 🔒 Regras do repositório compartilhado

- Cada agente escreve **somente na sua pasta** (`zo/` para o Zo).
- Nunca force push na branch principal sem instrução explícita.
- Commits com mensagens descritivas em português.
- `AGENTS.md` da raiz é editado apenas pelo usuário.
