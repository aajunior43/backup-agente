- `saude/registro_saude.md` — Registro de pressão arterial, glicose e medicamentos
- `financeiro/contas_maio_2026.md` — Contas mensais, saldo e gastos
- `financeiro/fatura-inter.md` — Detalhamento fatura cartão Inter
- `Prefeitura/plano_estudos_secretario_financas.md` — Plano de estudos completo do básico ao expert para Secretário Municipal de Finanças
- `estudos/plano_secretari`
- `Prefeitura/plano_transparencia_2026.md` — Plano de ação para melhorar nota ITP do Portal da Transparência

## Configurações
- **OpenAI API Key**: Configurada em `/home/workspace/.env` (OPENAI_API_KEY)
  - Uso: transcrições de áudio, text-to-speech (TTS), e outras tarefas que exigem API da OpenAI
  - Permissões restritas (chmod 600)

## Localização
- **Cidade**: Inajá, Paraná (PR)
- **Região**: Noroeste do Paraná

## Skills
- `calendario` — `file 'Skills/calendario/SKILL.md'` — Criar eventos no Google Calendar com notificações em 3 momentos (1 dia antes, 1 hora antes, na hora). Usar `use_app_google_calendar`.
- `github` — `file 'Skills/github/SKILL.md'` — GitHub CLI: repositórios, issues, PRs, CI/CD, busca.
- `plano-estudos` — `file 'Skills/plano-estudos/SKILL.md'` — Planos de estudo personalizados para qualquer área.
- `financeiro` — `file 'Skills/financeiro/SKILL.md'` — Gestão de contas mensais, faturas (Inter, Nubank), gastos e saldo bancário.
- `auditoria-perguntas` — `file 'Skills/auditoria-perguntas/SKILL.md'` — Simula perguntas de banca/auditoria (TCE, controle interno) sobre documentos para preparação defensiva.
- `vps` — `file 'Skills/vps/SKILL.md'` — Gerenciar VPS Campinas via SSH: status, Docker, Traefik, Portainer, updates, segurança.
- `weather-inaja` — `file 'Skills/weather-inaja/SKILL.md'` — Previsão do tempo para Inajá/PR via Open-Meteo. Gera HTML interativo.
- `backup-github` — `file 'Skills/backup-github/SKILL.md'` — Backup do workspace para repositório compartilhado backup-agente (pasta zo/).
- `site` — `file 'Skills/site/SKILL.md'` — Gerenciar bookmarks (Supabase MCP): criar, listar, favoritar, arquivar, pastas.
- `mermaid-diagrams` — `file 'Skills/mermaid-diagrams/SKILL.md'` — Renderizar diagramas Mermaid para PNG/SVG (fluxogramas, sequência, Gantt, ER, etc).
- `latex-pdf` — `file 'Skills/latex-pdf/SKILL.md'` — Gerar PDFs profissionais (ofícios, relatórios, declarações, atas) com LaTeX.
- `dotacao-orcamentaria` — `file 'Skills/dotacao-orcamentaria/SKILL.md'` — Consultar dotações orçamentárias de Inajá.
- `saude` — `file 'Skills/saude/SKILL.md'` — Registrar e consultar medições de saúde (glicose, pressão, pulso).
- `deepresearch` — `file 'Skills/deepresearch/SKILL.md'` — Pesquisa aprofundada com múltiplas fontes.
- `firecrawl` — `file 'Skills/firecrawl/SKILL.md'` — Extrair e buscar conteúdo de páginas web.

> ⚠️ **WhatsApp API**: Descontinuada. Não usar mais envios via api-whatsapp.api-alisson.com.br. Para notificações pessoais, usar Telegram. Para notificações de eventos, usar Google Calendar nativo.