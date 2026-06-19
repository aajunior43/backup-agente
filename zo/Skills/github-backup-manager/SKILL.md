---
name: github-backup-manager
description: "Gerencia o backup completo do sistema no GitHub e importação/restauração a partir de backups existentes."
version: 1.1.0
author: Hermes Agent
license: MIT
---

# GitHub Backup Manager

Gerencia o backup completo do sistema OpenClaw no GitHub, com interface de comando e instruções de migração e importação.

## Comandos

| Comando | Descrição |
|---------|-----------|
| `backup agora` | Executa backup imediatamente (async, pode demorar) |
| `backup status` | Mostra status do último backup (diretório, repo, tamanho) |
| `backup logs` | Últimas linhas do log da execução |
| `backup info` | Lista tudo que é backupado |
| `backup restore` | Instruções passo a passo para restaurar em outro lugar |
| `backup listar` | Lista arquivos atuais no diretório de backup |

## O que o backup cobre

- `workspace/` — personalidade (MEMORY.md, USER.md, Soul.md), memória diária, documentos, skills customizadas
- `cron/` — configuração de todos os cron jobs
- `agents/` — configurações de agentes (main, eva, etc)
- `scripts/` — scripts úteis do usuário
- `openclaw.json` — configuração principal
- `memory/` — banco SQLite + diários
- `dados/` — health_tracker.json, kanban_tasks.json, youtube_channels.json, heartbeat-state.json
- `Obsidian vault` — vault completo do Obsidian
- `openrouter-manager/` — interface web (se existir)
- Snapshot do sistema: crontab, processos em execução, uso de disco, versões

## Execução automática

- Cron job: executa **hora em hora** (`0 * * * *`)
- Logs: `/tmp/github-backup.log`
- Diretório de trabalho: `/home/administrator/vps-github-backup/`
- Repositório: `https://github.com/aajunior43/openclaw-backup.git` (privado)

## Restauração em outro lugar

Use o comando `backup restore` ou siga o guia:

1. Clone o repositório no novo VPS
2. Copie cada pasta para seu local correto (veja `backup info`)
3. Copie variáveis de ambiente (`.env` do agente main)
4. Reinicie o gateway: `openclaw gateway restart`
5. Refaça login nos canais (WhatsApp) se necessário

## Importação completa do backup (Hermes)

Para importar tudo de um backup existente em um agente Hermes — memórias, skills, scripts, credenciais, dados e crons — consulte `references/import-from-backup-workflow.md`.
Essa referência documenta o workflow completo de 10 fases usado quando o usuário pede "traga tudo" ou "configure tudo" a partir de um backup.

## Notas

- Credenciais sensíveis (sessões WhatsApp) **não** são backupadas por segurança.
- Mídia: apenas arquivos dos últimos 30 dias (evita growth descontrolado).
- O repositório é **privado** — não compartilhe.
