# Hermes Backup — Cola Rápida

> Resumo executivo pra consulta imediata. Para detalhes, ver `file 'hermes-backup/AGENTS.md'`.

## Junior (Aleksandro) — perfil rápido

- Mora em **Inajá-PR**, trabalha na **Prefeitura** (controle interno / TI)
- Salário **R$5.000**, meta poupar **R$2.000/mês**
- Tem **2 veículos**: Uno Mille 2013 + (ver `file 'hermes-backup/dados/veiculos.md'`)
- Saúde: glicose e pressão controladas (ver `file 'hermes-backup/dados/health_tracker.json'`)
- Canais ativos: **WhatsApp** (Alisson API), **Telegram** (@ProfessorAnonimus), **X** (@aleksandro_a_jr), **Email** (aajunior43@gmail.com)

## Regras de comportamento (NÃO esquecer)

1. **Testar e corrigir sozinho** — bugs, scripts, paths: resolver, não perguntar.
2. **NUNCA criar crons/automations sem permissão explícita.**
3. **Telegram** — sem tabelas grandes, usar bullets/emojis, valores em **negrito**.
4. **WhatsApp para outros** — sempre me identificar como assistente do Aleksandro.
5. **Mensagens PARA o Aleksandro** → WhatsApp 5544991842415 (não Telegram, não email).
6. **E-mails comerciais** pedindo orçamento — não mencionar a cidade dele.

## Prefeitura Inajá — chave

- **CNPJ:** 76.459.687/0001-40
- **Prefeito:** João Eder Aguiar
- **Reserva Contingência:** 99.099/9.999, R$300k
- **Lei 1359/2025** — créditos suplementares via DECRETO
- **Combustível educação:** ND 3.3.90.30 em 10.002/2.105
- **Ofícios CI ativos:** 020 (CAUC), 021 (SIT/casa-lar), 023 (TCE/prazos)
- **REGRA DURA:** pesquisa de dotações = **só CSV local**, nunca internet.

## Contatos da prefeitura (resumo)

Arquivo completo: `file 'hermes-backup/dados/prefeitura-contatos/'`. Principais:
- **Adolfo** — PRODASP
- **Adriana** — Tesoureira
- **André Kamitani** — TI/infra
- **Cleison Moreira** — Contador
- **Douglas Aguillar** — (verificar cargo)
- **Franciele** —
- **Geisibel** — Chefe de Gabinete
- **Luana Aiará** —
- **Maicon** — PM (Polícia Militar?)
- **Mauro** — Secretário de Saúde
- **Renato** — Lava Jato

## Scripts do backup que valem referência

| Script | Função | Status |
|---|---|---|
| `comprehensive-backup.sh` | Backup completo | referência |
| `github-backup.sh` | Push pra GitHub via rsync+git | referência |
| `daily_health_report.js` | Relatório saúde diário | referência |
| `financeiro-resumo.js` | Resumo financeiro | referência |
| `jornal_regional.py` | Gera jornal regional | referência |

## Skills mais úteis (referência conceitual)

- `whatsapp-api` — Alisson API (api-whatsapp.api-alisson.com.br)
- `municipal-budget` / `dotacao-orcamentaria` — orçamento Inajá
- `personal-finance-tracking` — finanças pessoais
- `github-backup-manager` — backup workspace
- `polymarket-analyst` — prediction markets
- `tavily-search` — busca web estruturada
- `obsidian-notes` — notas estilo Obsidian

## Estado do ambiente ATUAL (Zo Computer, jun/2026)

- Workspace: `/home/workspace/`
- Skills ativas: `file 'Skills'` (separado, mas pode ser cruzado com este backup)
- API WhatsApp: `https://api-whatsapp.api-alisson.com.br`
- Modelo IA: **MiniMax-M3** (Vercel)

## Atalhos de busca

- **Contato de alguém:** `file 'hermes-backup/dados/prefeitura-contatos/<Nome>.md'` ou `contatos-obsidian/`
- **Valor/ofício antigo:** `file 'hermes-backup/dados/'`
- **Lógica de skill:** `file 'hermes-backup/skills/<slug>/SKILL.md'`
- **Regra de comportamento:** `file 'hermes-backup/memorias/MEMORY_IMPORT.md'`
