# GitHub Backup Manager — Skill

## Descrição

Skill para gerenciar o backup completo do OpenClaw no GitHub. Fornece interface via comando, status, logs e guias de restauração.

## Instalação

Já vem incluída no repositório de backup. Não requer instalação adicional.

## Comandos (use com a Eva)

```
Eva, backup agora           # Executa backup imediatamente
Eva, backup status          # Mostra status (diretório, repo, tamanho)
Eva, backup logs            # Últimas linhas do log
Eva, backup info            # Lista tudo que é backupado
Eva, backup restore         # Instruções de restauração detalhadas
Eva, backup listar          # Lista arquivos presentes no backup
```

## O que o sistema de backup cobre

### Workspace
- AGENTS.md, MEMORY.md, USER.md, SOUL.md, TOOLS.md, IDENTITY.md, HEARTBEAT.md
- memoria/ (diários YYYY-MM-DD.md)
- documentos/ (manuais, receitas, treinos)
- dados/ (JSON: health_tracker, kanban_tasks, youtube_channels, heartbeat-state)
- scripts/ (scripts do usuário)
- skills/ (skills customizadas)
- Arquivos de configuração (.json)

### OpenClaw Core
- openclaw.json
- agents/ (configs de agentes)
- cron/ (cron jobs)
- hooks/, subagents/, canvas/, identity/, devices/, credentials/
- telegram/, delivery-queue/

### Aplicações externas
- openrouter-manager/ (interface web)
- ~/scripts/ (scripts úteis)
- Obsidian vault (MeuCofre)

### Snapshot do sistema
- crontab do usuário
- processos relacionados (openclaw, node, python)
- uso de disco
- versões (Node.js, OpenClaw meta, uname -a)

### Restrições
- Mídia: apenas arquivos dos últimos 30 dias (find -mtime -30)
- Credenciais de WhatsApp sessions: **não** são backupadas
- Arquivos .env: apenas se explicitamente incluídos (normalmente não)
- Repositório Git: `.git` exclude padrão (é recriado no push)

## Restauração em novo VPS

1. `git clone https://github.com/aajunior43/openclaw-backup.git openclaw-restore`
2. Copie `workspace/` → `~/.openclaw/workspace/`
3. Copie `cron/` → `~/.openclaw/cron/`
4. Copie `agents/` → `~/.openclaw/agents/`
5. Copie `scripts/` → `~/scripts/`
6. Copie `openclaw.json` → `~/.openclaw/`
7. Reconfigure `.env` em `agents/main/.env` (chaves API)
8. `openclaw gateway restart`
9. Refça login WhatsApp: `openclaw channels login --channel whatsapp`

Para detalhes completos: comando `backup restore` ou veja `RESTORE.md`.

## Execução automática

- **Cron job**: `0 * * * *` (hora em hora)
- **Log**: `/tmp/github-backup.log`
- **Diretório de trabalho**: `/home/administrator/vps-github-backup/`
- **Push automático**: sim, para branch `main`

## Troubleshooting

### Backup falhando
- Verifique espaço em disco: `df -h`
- Veja log: `tail -f /tmp/github-backup.log`
- Teste manual: `bash ~/scripts/github-backup.sh`

### Git Push falhando
- Verifique token HTTPS configurado
- Confirme que o repositório remoto existe e você tem permissão

### Restauração não funciona
- Permissões dos arquivos: `chmod +x ~/scripts/*.sh`
- Node modules: `cd ~/.openclaw/workspace/skills/* && npm ci` (se houver package.json)
- Reinicie: `openclaw gateway restart`

---

**Versão da skill:** 1.0.0  
**Criada em:** 2026-03-30
