# Sessão Real: Migração OpenClaw → Hermes (2026-05-09)

## Contexto
Usuário (Aleksandro/Junior) pediu para baixar o repo `openclaw-backup` do GitHub, explorar tudo, e trazer memórias, skills, scripts e dados para o Hermes.

## Estrutura do Backup Encontrado

```
openclaw-backup/
├── hermes/                    # 32 skills oficiais do Hermes
│   ├── memories/              # MEMORY.md, USER.md (curated)
│   ├── skills/                # apple, creative, devops, municipal-budget, etc.
│   ├── data/                  # relacao_despesas_inaja.csv
│   └── migration/             # OpenClaw migration archives
├── workspace/                 # Workspace principal da Eva
│   ├── memoria/               # 25+ diários OpenClaw (YYYY-MM-DD.md)
│   ├── memory/                # 60+ diários Hermes (YYYY-MM-DD.md)
│   ├── skills/                # 35 skills customizadas
│   ├── scripts/               # 70+ scripts de automação
│   ├── dados/                 # financeiro.json, health_tracker.json, orcamento CSVs
│   ├── openclaw/              # Config Eva (openclaw.json, credentials, agents)
│   ├── openclaw-skills/       # 8 skills OpenClaw
│   └── workspace/             # Mirror do workspace (symlink target)
├── obsidian-vault/            # Vault Obsidian com pastas ALEKSANDRO/EVA/PREFEITURA/SIMONE
├── projetos/                  # 14 projetos (blogs, dashboards, kanban, etc.)
└── system/                    # Arquivos de sistema
```

## Técnica de Download e Extração

```bash
# Download do zipball (repo privado)
curl -sL -H "Authorization: Bearer $TOKEN" \
  -o openclaw-backup.zip \
  "https://api.github.com/repos/aajunior43/openclaw-backup/zipball/main"

# Extração sem unzip (Docker containers geralmente não têm)
python3 -c "
import zipfile, os, glob
z = zipfile.ZipFile('openclaw-backup.zip')
z.extractall('.')
folder = glob.glob('aajunior43-openclaw-backup-*')[0]
os.rename(folder, 'openclaw-backup')
print('Extraído!')
"
```

## Dados Estruturados Encontrados

| Arquivo | Tamanho | Conteúdo |
|---------|---------|----------|
| `financeiro.json` | 4.8 KB | Transações, contas recorrentes, metas |
| `health_tracker.json` | 11 KB | Pressão, glicemia, exercícios |
| `orcamento-inaja-2026-despesas.csv` | 179 KB | 548 linhas, separador `;` |
| `orcamento-inaja-2026.csv` | 179 KB | Versão alternativa |
| `relacao_despesas_inaja.csv` | 179 KB | Versão do Hermes |

## Skills Importadas

**Do Hermes (32 existentes, seletivamente copiadas):**
- `municipal-budget` + `municipal-budget-analysis`
- `personal-finance-tracking`

**Do Workspace (35 customizadas, seletivamente copiadas):**
- `dotacao-orcamentaria`
- `proactive-agent`
- `firecrawl`
- `tavily-search`
- `youtube-monitor`
- `polymarket-analyst`
- `github-backup-manager`
- `obsidian-notes`

## Credenciais Encontradas

O backup continha credenciais espalhadas em vários locais:

| Local | Tipo | Status |
|-------|------|--------|
| `hermes/.env` | TELEGRAM_BOT_TOKEN, OPENCODE_GO_API_KEY | Encontrado |
| `workspace/scripts/tavily_weather.py` | TAVILY_API_KEY | Encontrado |
| `workspace/scripts/openai_vision.js` | OPENAI_API_KEY | Encontrado |
| `workspace/openclaw/openclaw.json` | MiniMax, OpenRouter profiles | Sem chave em claro |
| `workspace/openclaw/credentials/` | WhatsApp pre-keys (criptografados) | Ignorado |

**Destino seguro:** `/opt/data/credentials/.env` (perm 600)

## Correção de Comportamento Durante a Sessão

- Usuário corrigiu: **"Meu nome não e professor"** → Sempre chamar de **Junior** (ou Aleksandro), nunca Professor
- Usuário explicitou: **"Não configure o mcp apenas use assim quando nescessário"** → Usar API direta via curl, não MCP

## Comando Útil para Explorar Estrutura

```bash
# Mapear diretórios (max 2 níveis)
find . -maxdepth 2 -type d | sort

# Contar arquivos por extensão
find . -type f | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -20

# Buscar por chaves de API espalhadas
grep -rhoE "(sk-[A-Za-z0-9_\-]{20,}|tvly-[A-Za-z0-9_\-]{20,}|ghp_[A-Za-z0-9_]{30,})" \
  backup/ --include="*.py" --include="*.js" --include="*.sh" --include="*.json" \
  --include="*.md" --include="*.env*" --exclude-dir=node_modules --exclude-dir=.git | sort -u
```

## Lição: Python é mais confiável que unzip em containers

O container não tinha `unzip` instalado. A extração com `zipfile` do Python funcionou perfeitamente. Sempre usar Python como fallback para extração de zip.
