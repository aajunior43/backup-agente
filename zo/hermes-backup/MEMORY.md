# MEMORY — Memória Consolidada (importada do Hermes)

> Este é o arquivo de memória persistente. Quando eu precisar lembrar de algo sobre o Junior, sobre a prefeitura, regras, contatos, etc., **leio isto primeiro**.

---

## 👤 Junior (Aleksandro) — perfil

- Mora em **Inajá, Paraná**. Trabalha na **Prefeitura** como **Secretário de Finanças / Controle Interno / TI**.
- **Salário:** R$5.000/mês. **Meta:** poupar R$2.000/mês.
- **Veículos:** Uno Mille 2013 + outro (ver `dados/veiculos.md`).
- **Saúde:** glicose e pressão controladas (ver `dados/health_tracker.json`, `dados/saude_junior.csv`, `dados/lista_nao_comer.md`).
- **Canais ativos:** WhatsApp (Alisson API), Telegram (@ProfessorAnonimus), X (@aleksandro_a_jr), Email (aajunior43@gmail.com).
- **OpenAI API Key:** `/home/workspace/.env` (transcrições, TTS, etc.).

## ⚠️ Regras de comportamento (NUNCA violar)

1. **NUNCA criar crons/automations sem permissão explícita** do Junior. Sempre perguntar antes de agendar.
2. Junior quer que eu **teste e corrija automaticamente** (bugs, scripts, paths), mas **NÃO** ativar rotinas automáticas.
3. **Orçamento Inajá:** procurar APENAS no CSV local `dados/orcamento-inaja-2026-despesas.csv`. **NUNCA** buscar na internet.
4. **Telegram:** sem tabelas grandes, usar bullets • ou emojis, valores em **negrito**, seções separadas por `---`.
5. **WhatsApp:** ao enviar para outras pessoas (não o Junior), me identificar como assistente do Aleksandro, nunca fingir ser ele.
6. **Quando enviar algo para o Junior:** sempre WhatsApp no 5544991842415 (não Telegram, não email). Incluir o nome dele no início.

## 🏛️ Prefeitura de Inajá — contexto

- **CNPJ:** 76.459.687/0001-40
- **Prefeito:** João Eder Aguiar ("Dedo")
- **Chefe de Gabinete:** Geisibel de Souza Fernandes ("Jezebel") — coordena gestão, eventos, pagamentos
- **Tesoureira:** Adriana
- **Contador:** Cleison Moreira
- **Secretário Saúde:** Mauro
- **Suporte sistema:** Adolfo (PRODASP) — acessa via AnyDesk
- **Controle Interno / Resp. TI:** Aleksandro
- **Orçamento:** créditos suplementares via DECRETO (Lei 1359/2025)
- **Reserva Contingência:** 99.099/9.999, R$300k (Ordinários Livres)
- **Combustível educação:** ND 3.3.90.30 em 10.002/2.105
- **Ofícios recentes:** 020 (CAUC), 021 (SIT/casa-lar), 023 (TCE/prazos) — todos em `dados/`
- **Fornecedor saúde:** DSORT, Clínica de Imagem, PLENA MÉDICA
- **Fornecedor cestas:** Márcia (PASIM)
- **Motoristas:** Helinho, Cristiano (vão a Maringá)

## 📂 Hubs do backup (`file 'hermes-backup'`)

- **`skills/`** — 36 skills (referência). Ativas em `file 'Skills'`.
- **`dados/`** — JSONs/CSVs/MDs: financeiro, saúde, contatos, ofícios, orçamentos, refeições, veículos.
- **`data/`** — CSVs de orçamento Inajá 2026.
- **`scripts/`** — comprehensive-backup.sh, github-backup.sh, daily_health_report.js, financeiro-resumo.js, jornal_regional.py, fix_cron_jobs.mjs.
- **`documentos/`** — estudos, financeiro, prefeitura, saúde.
- **`memorias/`** — MEMORY_IMPORT.md (regras de comportamento).
- **`configs/`** — CRONS_REFERENCE.md (referência, desativados).
- **`system_snapshot/`** — info e processos de 2026-05-25 (VPS antiga, obsoleta).

## 🔧 Skills de destaque (referência em `file 'hermes-backup/skills'`)

- `municipal-budget/` — orçamento Inajá (decreto, execução, ofício municipal)
- `dotacao-orcamentaria/` — dotações orçamentárias
- `whatsapp-api/` — Alisson API
- `github-backup-manager/` — backup automático workspace
- `personal-finance-tracking/` — finanças pessoais
- `polymarket-analyst/` — previsão markets
- `tavily-search/` — busca web
- `obsidian-notes/` — notas Obsidian

## 🗺️ Mapeamento de paths (VPS antiga → Zo atual)

| Antigo (VPS Hermes) | Atual (Zo) |
|---|---|
| `~/workspace/` | `/home/workspace/` |
| `/home/hermeswebui/.hermes/` | `/home/workspace/.z/` (interno Zo) |
| `/home/hermes/` | `/home/workspace/` |
| VPS `192.168.122.4→93.127.136.225` | **Obsoleto** |
| OpenClaw (Eva) porta 18789 | **Obsoleto** |
| read_file limite 500 linhas | **Sem limite agora** (mas usar sed/python se for gigante) |
| browser_navigate falha | **Funciona** no Zo via `open_webpage`/`agent-browser` |

## 📊 Estado financeiro (snapshot parcial de 05/2026)

- **Contas maio/2026 (venc 10/05):** Inter R$750, Nubank R$405, Faculdades R$306, Guarda Noturno R$60, Tio R$88, Prima gasolina R$100, Ar cond R$170, Bike R$100, Jabá R$124,40 → **TOTAL R$2.103,40**.
- _Atenção: este snapshot é antigo. Para estado atual, ler `file 'financeiro/contas_junho_2026.md'` no workspace._

## 🔄 Backup automático

- **Repo:** `github.com/aajunior43/hermes-backup` (privado)
- **Scripts:** `scripts/comprehensive-backup.sh`, `scripts/github-backup.sh`
- **MODO PRESERVAÇÃO:** rsync sem `--delete`, git push sem `-f`, pull+rebase antes push
- **Cobrir:** workspace, projetos, configs, system
- **Cron:** _desativado por enquanto_ (regra: nunca criar sem permissão)

## 📝 Atalhos de busca

- Procurar skill/conceito → `file 'hermes-backup/skills/<slug>/SKILL.md'`
- Procurar dado histórico → `file 'hermes-backup/dados/'`
- Procurar script → `file 'hermes-backup/scripts/'`
- Procurar regra → `file 'hermes-backup/memorias/MEMORY_IMPORT.md'`
- Procurar contato → `file 'hermes-backup/dados/prefeitura-contatos/'` ou `dados/contatos-obsidian/`

---

_Sincronizado em 2026-06-14 a partir do snapshot do repositório `aajunior43/hermes-backup` de 2026-05-09 + `memorias/MEMORY_IMPORT.md` + 11 contatos da prefeitura._
