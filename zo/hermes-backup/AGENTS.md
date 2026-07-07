# hermes-backup — Índice de Navegação

Repositório privado `aajunior43/hermes-backup` (espelhado em `file 'hermes-backup'`).
Última atualização externa: **2026-05-09**. Snapshot do sistema: **2026-05-25**.
**11 MB** · 725 arquivos · sem `.git` (cópia local para leitura).

Este índice é o ponto de entrada. Antes de procurar algo aqui, leia este arquivo.

## Estrutura rápida

| Pasta | Tamanho | O que tem |
|---|---|---|
| `file 'hermes-backup/skills'` | 8.8 MB | **36 skills** (apple, github, whatsapp-api, municipal-budget, polymarket-analyst, tavily-search, obsidian-notes, etc.) |
| `file 'hermes-backup/dados'` | 674 KB | JSONs/CSVs/MDs: financeiro, saúde, contatos prefeitura, ofícios, orçamentos |
| `file 'hermes-backup/data'` | 536 KB | CSVs de orçamento Inajá 2026 (duplicados de `dados/`) |
| `file 'hermes-backup/scripts'` | 100 KB | Scripts JS/Python/Bash: backup, saúde, jornal, finanças, cron |
| `file 'hermes-backup/documentos'` | 34 KB | MDs: estudos, financeiro, prefeitura, saúde |
| `file 'hermes-backback/memorias'` | 2.5 KB | `MEMORY_IMPORT.md` — contexto operacional do Junior (salário, contas, regras) |
| `file 'hermes-backup/configs'` | 6.5 KB | `CRONS_REFERENCE.md` — referência de crons (NÃO ativados) |
| `file 'hermes-backup/system_snapshot'` | 1.5 KB | `system_info.txt`, `processes.txt` (de 2026-05-25) |

## Memória crítica (ler primeiro)

`file 'hermes-backup/memorias/MEMORY_IMPORT.md'` tem regras ativas:

- **Finanças:** salário R$5.000, meta poupar R$2.000/mês. Contas maio/2026 ~R$2.103,40.
- **Orçamento Inajá:** CNPJ 76.459.687/0001-40, prefeito João Eder Aguiar. Procurar APENAS no CSV local, nunca na internet.
- **Regra:** Junior quer que eu **teste e corrija automaticamente**, MAS **NUNCA criar crons/automations sem permissão explícita**.
- **Telegram:** sem tabelas grandes, usar bullets/emojis, valores em negrito.
- **VPS antiga:** read_file 500 linhas, browser_navigate falha, OpenClaw (Eva) na 18789 — **obsoleto, ambiente atual é Zo Computer**.

## Hubs de skills (`file 'hermes-backup/skills'`)

Lista das 36 skills (cada uma tem `SKILL.md` e às vezes `scripts/`, `references/`, `assets/`):

apple, autonomous-ai-agents, creative, data-science, devops, diagramming, dogfood, domain, **dotacao-orcamentaria**, email, firecrawl, gaming, gifs, github, github-backup-manager, handling-sensitive-data, inference-sh, mcp, media, mlops, **municipal-budget**, note-taking, obsidian-notes, **personal-finance-tracking**, polymarket-analyst, proactive-agent, productivity, red-teaming, research, smart-home, social-media, software-development, tavily-search, **whatsapp-api**, youtube-monitor, yuanbao

**Destaque operacional:**
- `municipal-budget` / `dotacao-orcamentaria` — orçamento Inajá
- `whatsapp-api` — Alisson API (api-whatsapp.api-alisson.com.br)
- `github-backup-manager` — backup automático do workspace
- `personal-finance-tracking` — finanças pessoais
- `polymarket-analyst` — previsão markets
- `tavily-search` — busca web

## Dados úteis por tópico

**Finanças** — `file 'hermes-backup/dados/financeiro.json'`
**Saúde** — `file 'hermes-backup/dados/health_tracker.json'`, `saude_junior.csv`, `lista_nao_comer.md`, `biblioteca_alimentos.json`
**Refeições** — `file 'hermes-backup/dados/refeicoes/refeicoes.json'`
**Contatos** — `file 'hermes-backup/dados/contatos-obsidian/'`, `prefeitura-contatos/`
**Prefeitura/Inajá** — `file 'hermes-backup/dados/orcamento-inaja-2026-despesas.csv'`, `prefeitura_afazeres.jsonl`, ofícios 020/021/023
**Veículos** — `file 'hermes-backup/dados/veiculos.md'`, `uno-mille-2013.md`
**Jornal** — `file 'hermes-backup/dados/jornal_state.json'`
**Assinaturas** — `file 'hermes-backup/dados/assinaturas.json'`

## Scripts notáveis (`file 'hermes-backup/scripts'`)

- `comprehensive-backup.sh` — backup completo
- `github-backup.sh` — backup pra GitHub via rsync+git
- `fix_cron_jobs.mjs` — consertar crons (referência)
- `daily_health_report.js` — relatório diário de saúde
- `financeiro-resumo.js` — resumo financeiro
- `jornal_regional.py` — gerador de jornal
- `create_daily_memory.js` — memória diária

## ⚠️ Estado desatualizado

Este backup é de **maio/2026** e o ambiente atual (Zo Computer) é diferente:
- Endereços de paths antigos (`~/workspace/`, `/home/hermeswebui/.hermes`) **não funcionam aqui** — equivalente é `/home/workspace/`.
- Crons listados em `configs/CRONS_REFERENCE.md` estão **desativados**.
- Preferências do MEMORY_IMPORT.md ainda valem (regras de comportamento).
- Skills daqui são **referência conceitual** — as versões ativas estão em `file 'Skills'` (Zo workspace).

## Como usar este backup

1. **Procurar skill/conceito** → checar `file 'hermes-backup/skills/<slug>/SKILL.md'`.
2. **Procurar dado histórico** → `file 'hermes-backup/dados/'`.
3. **Procurar script de automação** → `file 'hermes-backup/scripts/'`.
4. **Procurar regra de comportamento** → `file 'hermes-backup/memorias/MEMORY_IMPORT.md'`.
5. **Não confiar em paths absolutos antigos** — sempre mapear pra `/home/workspace/`.

---

_Mantido por mim para referência. Última revisão local: 2026-06-14._
