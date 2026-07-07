# Session: OpenClaw Backup Analysis (2026-05-09)

## Context
User (Aleksandro/Junior) has a private GitHub repo `aajunior43/openclaw-backup` containing a full backup of their OpenClaw agent (Eva) and Hermes agent workspaces. Requested: "Explore tudo e traga as memórias e skills."

## Repository Details
- **Repo:** `aajunior43/openclaw-backup`
- **Branch:** main
- **Privacy:** Private
- **Size:** 245,853 KB (~240 MB raw, 193 MB zip)
- **Download:** `curl -sL -H "Authorization: Bearer $TOKEN" -o backup.zip API_URL`

## Top-Level Structure

```
openclaw-backup/
├── hermes/                    # Hermes Agent config + data
│   ├── bin/
│   ├── creative/
│   ├── cron/
│   ├── data/
│   ├── dogfood/
│   ├── hermes-agent/
│   ├── memories/           # MEMORY.md, USER.md (Hermes)
│   ├── migration/
│   ├── skills/             # 32 skills
│   └── state-snapshots/
├── obsidian-vault/          # Vault Obsidian
│   ├── .obsidian/
│   ├── ALEKSANDRO/
│   ├── EVA/
│   ├── PREFEITURA/
│   └── SIMONE/
├── projetos/                # 14 project folders
├── system/                  # System files
└── workspace/               # Main workspace
    ├── .openclaw/           # OpenClaw config + memory
    ├── Contatos/
    ├── Documentacao-Adicional/
    ├── Importantes/
    ├── PREFEITURA/
    ├── Privado/
    ├── SIMONE/
    ├── agents/
    ├── backups/
    ├── cerebro-eva/
    ├── config/
    ├── dados/               # JSON data files
    ├── docs/
    ├── documentos/
    ├── estudos/
    ├── important_data/
    ├── logs/
    ├── manual-biblia/
    ├── media/
    ├── memoria/             # OpenClaw daily diaries (~25 files)
    ├── memory/              # More diaries (~40 files)
    ├── obsidian_vaults/
    ├── openclaw/            # OpenClaw core config
    ├── openclaw-skills/     # 8+ OpenClaw skills
    ├── openrouter-manager/
    ├── private/
    ├── scripts/             # 70+ automation scripts
    ├── server_configs/
    ├── skills/              # 35 custom workspace skills
    ├── system_snapshot/
    ├── unified-gateway/
    └── workspace/
```

## Key Memory Files

### Hermes `/hermes/memories/MEMORY.md`
- Pasta compartilhada `/compartilhado/` (repo Git) entre Hermes e Eva
- Estrutura: `aleksandro/` (saude, financeiro, compras, veiculos), `prefeitura/` (dotacoes, oficios, capel, contratos, docs), `contatos/`, `lembretes/`, `sites-config/`
- Salário: R$5.000, meta poupar R$2.000
- Contas maio/2026 (venc 10/05): Inter R$750, Nubank R$405, Faculdades R$306, Guarda Noturno R$60, Tio R$88, Prima gasolina R$100, Ar cond. R$170 (5/10), Bike R$100 (última!), Jabá R$124,40. TOTAL R$2.103,40
- VPS Database Mart: NAT 192.168.122.4→93.127.136.225, sem Cloudflare
- `read_file` limite 500 linhas — usar sed/python
- `browser_navigate` falha (AppArmor) — usar python3 -m http.server + curl
- OpenClaw (Eva): modelo MiniMax-M2.7, gateway porta 18789, bot Telegram requireMention:true
- Backup GitHub: cron 6h, token `~/.github_backup_env`, modo preservação (rsync sem --delete)
- Orçamento Inajá-PR: CNPJ 76.459.687/0001-40, Prefeito João Eder Aguiar, Reserva Contingência 99.099/9.999 (R$300k)
- Combustível educação: ND 3.3.90.30, dotação 10.002/2.105
- 3 ofícios CI em `~/workspace/dados/`: 020, 021, 023
- **Regra crítica:** Só buscar dotações no arquivo CSV local, NUNCA na internet

### Hermes `/hermes/memories/USER.md`
- Nome: Aleksandro Alves da Rocha Junior
- Telegram: @ProfessorAnonimus (NOTA: usuário corrigiu, prefere ser chamado de Junior, NÃO Professor)
- Contato: +55 44 91312-415
- Cargo: Secretário do Departamento Financeiro Municipal
- Prefere testar e corrigir automaticamente (bugs, scripts, paths)
- **NÃO** criar cron jobs ou automações sem permissão explícita
- Plataforma: Telegram, Bot: @pandorajrbot

### OpenClaw `/workspace/memoria/REFERENCE_USER_DETAILED.md`
- Família completa com endereços e WhatsApps:
  - Pai: Aleksandro Alves da Rocha, Rua Vereador Miguel Vacca São João 221
  - Tio Cristiano: mesma rua
  - Tio Marsso: mora ao lado, 3 filhas (Marsilayne, Mislayne, Kaylane)
  - Tia Solange: casa alugada atrás do mercado do Pastor Daniel, +55 44 9143-3026
  - Prima Myllena: +55 44 9183-0950
  - Avó (mãe Cida): +55 44 9138-6803
  - Mãe Simone: Maringá-PR, +55 43 9131-3320
- Pets: Bahuan (Shitzu), Churrinho (Shorkie)
- Veículo: Uno Mille Fire vermelho 2013 2 portas
- Profissão dos pais: Pai na Mademax (manutenção), Mãe na Stevia (operadora de máquina)
- Autoridades da Prefeitura: Prefeito João Eder Aguilar (Dedo), Vice Rogério (Ratinho), etc.

### OpenClaw `/workspace/memoria/PREFERENCIAS.md`
- Jogos: GTA, Red Dead Redemption, single player, mundo aberto
- Séries: Supernatural
- Tecnologia: hardware, overclocking, Python, JS/TS
- Geek: HQs Marvel/DC, mangá, anime, board games, RPG de mesa
- Bebida: Café e Coca-Zero
- Cor favorita: Preto

### OpenClaw `/workspace/AGENTS.md`
- Workspace vive em vault Obsidian via symlink
- Sincronizado com celular (Syncthing) e versionado no Git
- Regra de Timestamp: converter UTC-3 = BRT
- Sistema de Heartbeat com checklist proativo
- **Regra de Ouro:** ESCREVA, não "guarde na cabeça"
- Firecrawl é a ferramenta padrão para leitura de sites
- Tavily como fallback para buscas web

## Skills Analysis

### Hermes Skills (32 total)
High-value for import: `municipal-budget`, `municipal-budget-analysis`, `personal-finance-tracking`, `whisper-setup-vps`
Skip: generic skills already available (`creative`, `devops`, `gaming`, etc.)

### Workspace Custom Skills (35 total)
High-value: `dotacao-orcamentaria`, `controle-financeiro`, `finance-unified`, `proactive-agent`, `firecrawl`, `tavily-search`, `youtube-monitor`, `polymarket-analyst`, `github-backup-manager`, `obsidian-notes`, `meus-sites`, `monitor-diario-oficial-pr`

### OpenClaw Skills (8+ total)
Notable: `monitor-concursos-maringa-paranavai`, `previsao-tempo-inaja-pr`, `sites-legais`, `criador-de-subagentes`

## Scripts Analysis (70+ scripts)

### Transcrição (áudio)
`transcribe_fast.py`, `transcribe_final.py`, `transcribe_parts.py`, `transcribe_split.py`, `transcribe_video.py`, `transcribe_youtube.py`, `whisper_openai.sh`

### Redes Sociais / APIs
`twitter_api.py`, `twitter_search.py`, `x_api.py`, `x_search.py`, `youtube_check.sh`, `yt_check.js`

### Finanças / Polymarket
`polymarket_intel_report.py`, `polymarket_report.py`, `polymarket_report_v2.py`, `financeiro-resumo.js`, `migrar_financeiro.js`, `grafico_gastos.py`

### Jornalismo
`jornal_regional.py`, `jornal_regional_manual.py`, `debug_jornal.py`

### Sistema / Backup
`comprehensive-backup.sh`, `github-backup.sh`, `ensure_backup_repo.py`, `sites-health-check.sh`, `system_status.js`

## Structured Data Files

### `/workspace/dados/financeiro.json`
- Schema: transactions array com id, date, type, amount, description, category, recurrent, due_date
- Última atualização: 2026-04-23
- Exemplos: Fatura Inter R$750, Nubank R$405, Faculdades R$153+153

### `/workspace/dados/health_tracker.json`
- Registros de pressão arterial, glicemia, exercício
- Exemplo: PA 123/85, FC 94, glicemia 267 mg/dL pós-exercício

## User Preferences Discovered

1. **Nome:** Prefere ser chamado de **Junior** (NÃO "Professor")
2. **MCP:** Prefere API direta via curl em vez de MCP configurado
3. **GitHub:** Usa token direto, não quer configuração complexa
4. **Automação:** Gosta que eu teste e corrija automaticamente, MAS não criar cron jobs sem permissão
5. **Orçamento:** Sempre buscar no arquivo CSV local primeiro, nunca na internet
6. **Formato Telegram:** Sem tabelas grandes, usar bullet points com emojis, seções separadas por ---

## Security Events

1. GitHub PAT compartilhado em chat: `REDACTED_GITHUB_PAT`
   - Usuário recusou revogação ("Não vou recogar")
   - Pediu para salvar ("Salve junto o token")
   - Armazenado em memória para uso futuro

2. OpenAI API key compartilhado em chat: `REDACTED_OPENAI_KEY`
   - Mesmo padrão: aviso de segurança + armazenamento sob demanda

## Technical Notes

- Container Docker oficial Hermes roda como root
- `HERMES_HOME=/opt/data`
- Hermes venv em `/opt/hermes/.venv/`
- Pacote `mcp` pode não estar instalado no venv — usar `uv pip install --python /opt/hermes/.venv/bin/python mcp`
- `unzip` geralmente não está disponível — usar Python `zipfile`
- `read_file` tem limite de 500 linhas — usar `sed` ou `python` para arquivos grandes
- `browser_navigate` pode falhar por AppArmor — usar `python3 -m http.server` + `curl`
