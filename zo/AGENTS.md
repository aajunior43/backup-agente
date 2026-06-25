# AGENTS.md — Workspace do Aleksandro

Índice de roteamento do workspace. Ordernado por utilidade. Para detalhes de um projeto, veja o `AGENTS.md` da pasta correspondente quando existir.

## Perfis rápidos

- **Quem**: Aleksandro Alves (Junior) — Secretário Municipal de Finanças / chefe de gabinete em Inajá/PR.
- **Onde**: Inajá, Paraná (Noroeste do PR).
- **Como falo**: comandos curtos e diretos, em pt-BR. Prefiro entregas concretas (arquivos, mensagens enviadas, registros atualizados) a explicações longas.
- **Notificações para mim**: **Telegram** (`send_telegram_message`, comece com meu nome). Nunca WhatsApp, nunca email — exceto pedidos explícitos. Eventos com data/hora → **Google Calendar** nativo (skill `calendario`), nunca WhatsApp.

## Projetos ativos

- **Saúde** — `saude/registro_saude.md` (registro ativo) + `.txt` (export). Medição de glicose, pressão arterial, pulso, medicamentos. Histórico: `medicoes_pressao.md`, artigos `Alimentos_Diabetes_Hipertensao_Ansiedade.{md,pdf}`.
- **Financeiro** — `financeiro/contas_<mes>_<ano>.md` (contas mensais, saldo, gastos), `financeiro/fatura-inter.md` (fatura cartão Inter). Reconciliação entre faturas e meses éManual e propensa a drift — checar antes de somar.
- **Prefeitura** — `Prefeitura/plano_estudos_secretario_financas.md`, `Prefeitura/plano_transparencia_2026.md`. Documentos públicos de gestão.
- **Jornais** — `Jornais/` (PDFs do "O Regional", ~60M). State file `.jornal_regional_estado.json`. Monitor via automação nas ter/quinta/dom.
- **Blog** — `Blog/posts/` (posts datados `YYYY-MM-DD-slug.md`).
- **Documentos** — `Documentos/` (orçamento, guias, PDFs-chave BB Inajá), `Documents/` (imagens avulsas).
- **Sites/projetos web** — `wendigo-lore/` e `simulador-turbina-eolica/` (cada um `zosite.json`, Vite+Bun+TS). Dev preview ao desenvolver; reinstalar deps (`bun install`) se a preview quebrar após limpeza de `node_modules`.

## Pastas secundárias

`Articles/` (artigos salvos), `Assinatura/`, `Refeicoes/`, `Relatorios/`, `Outputs/`, `Images/`, `Projects/`, `clima/`, `projetos/` (offícios/modelos/scripts avulsos), `Logs/` (logs de automações).

> `Trash/` — itens removidos com metadados em `/home/.z/trash.json` (`originalPath`, `trashPath`, `movedAt`). Não listar a menos que o pedido envolva restaurar/auditar.

## Configurações

- **OpenAI API Key** — em `/home/workspace/.env` (`OPENAI_API_KEY`). Uso: transcrição de áudio, TTS. Restrito `chmod 600`. **Nunca** comitar `.env` (já no `.gitignore` e excluído do rsync do backup).
- **GitHub** — autenticado como `aajunior43` (gh CLI). Backup do workspace em `backup-agente` (pasta `zo/`), gerido por `Skills/backup-github`.

## Skills (rotas)

Usar conforme a regra condicional correspondente (links, calendário). Demais: invoque só quando o pedido casar.

- `calendario` — `file 'Skills/calendario/SKILL.md'` — Google Calendar (1 dia antes, 1 hora antes, na hora).
- `site` — `file 'Skills/site/SKILL.md'` — bookmarks (Supabase): criar/listar/favoritar/arquivar. Verificar duplicata antes de criar.
- `financeiro` — `file 'Skills/financeiro/SKILL.md'` — contas, faturas (Inter/Nubank), saldo.
- `saude` — `file 'Skills/saude/SKILL.md'` — registro de medições.
- `weather-inaja` — `file 'Skills/weather-inaja/SKILL.md'` — previsão Inajá via Open-Meteo (HTML interativo).
- `backup-github` — `file 'Skills/backup-github/SKILL.md'` — backup workspace → repo `backup-agente` (`zo/`).
- `latex-pdf` — `file 'Skills/latex-pdf/SKILL.md'` — PDFs profissionais (ofícios, relatórios, atas).
- `mermaid-diagrams` — `file 'Skills/mermaid-diagrams/SKILL.md'` — Mermaid → PNG/SVG.
- `dotacao-orcamentaria` — `file 'Skills/dotacao-orcamentaria/SKILL.md'` — dotações de Inajá.
- `auditoria-perguntas` — `file 'Skills/auditoria-perguntas/SKILL.md'` — simula banca/auditoria (TCE) sobre documentos.
- `github` — `file 'Skills/github/SKILL.md'` — gh CLI (repos, issues, PRs).
- `plano-estudos` — `file 'Skills/plano-estudos/SKILL.md'` — planos de estudo.
- `vps` — `file 'Skills/vps/SKILL.md'` — VPS Campinas via SSH (Docker, Traefik, Portainer).
- `deepresearch` — `file 'Skills/deepresearch/SKILL.md'` — pesquisa aprofundada.
- `firecrawl` — `file 'Skills/firecrawl/SKILL.md'` — extrair/buscar conteúdo web.
- `mcp/native-mcp` — `file 'Skills/mcp/native-mcp/SKILL.md'` — configurar MCP servers. (Placeholders `sk-...`/`ghp_...` no arquivo são exemplos, não chaves reais.)

## Avisos fixos

> ⚠️ **WhatsApp API descontinuada** — não usar `api-whatsapp.api-alisson.com.br`. Notificações pessoais → Telegram; eventos → Google Calendar.

> 📧 **E-mails comerciais de orçamento** (pneus, peças, serviços) — não mencionar a cidade onde o usuário mora.