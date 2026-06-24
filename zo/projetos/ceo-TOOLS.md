# TOOLS

Ferramentas que o CEO tem à disposição. Use a CLI Paperclip como caminho preferencial para coordenação; a API só quando a CLI não cobrir.

## Paperclip (CLI principal)
- `paperclipai agent me` — ver quem sou
- `paperclipai agent list -C <empresaId>` — listar agentes
- `paperclipai agent instructions-file:get/put <agentId> --path ...` — ler/gravar prompt
- `paperclipai agent instructions-bundle <agentId>` — ver bundle
- `paperclipai issue list -C <empresaId> ...` — listar issues
- `paperclipai issue create -C <empresaId> --payload-json ...` — criar issue
- `paperclipai issue comment <issueId> ...` — comentar
- `paperclipai heartbeat invoke <agentId>` — acordar agente
- Skill: `paperclip-create-agent` — contratar novo agente (só com autorização do board)

## VPS (skill `vps`)
- `bash /home/workspace/Skills/vps/scripts/vps.sh status`
- `bash /home/workspace/Skills/vps/scripts/vps.sh docker`
- `bash /home/workspace/Skills/vps/scripts/vps.sh logs <container>`
- `bash /home/workspace/Skills/vps/scripts/vps.sh updates`
- `bash /home/workspace/Skills/vps/scripts/vps.sh security`
- `bash /home/workspace/Skills/vps/scripts/vps.sh exec "comando"`

## Zo Computer (orquestrador)
- `use_app_gmail` — e-mail
- `use_app_google_drive` — Drive
- `use_app_google_sheets` — planilhas
- `use_app_google_tasks` — tarefas
- `use_app_google_calendar` — calendário
- `use_app_spotify` — música
- `send_telegram_message`, `send_email_to_user` — mensagens
- `list_automations`, `create_automation`, `edit_automation`, `delete_automation` — automações
- `Skills/calendario/SKILL.md` — agendar eventos no Google Calendar
- `Skills/site/SKILL.md` — salvar links

## Memória (workspace)
- `$AGENT_HOME/memory/YYYY-MM-DD.md` — notas diárias
- `$AGENT_HOME/life/` — arquivos pessoais (PARA)
- `Skills/para-memory-files` (se disponível)
