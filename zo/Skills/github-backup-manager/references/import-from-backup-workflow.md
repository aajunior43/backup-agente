# Import from Backup — Complete Workflow

When a user wants to import their entire setup from an existing GitHub backup repository (e.g., `aajunior43/openclaw-backup`), follow this ordered workflow. This applies when the user says things like "traga tudo", "configure tudo", "explore o backup", or "importe os dados".

## Pre-flight Checks

1. Verify the user has a GitHub PAT configured (ask if missing, or check `~/.hermes/config.yaml`)
2. Confirm the target repo is accessible via API (`curl -H "Authorization: Bearer <token>"`)
3. Check available disk space before downloading large repos (this backup was ~193 MB)

## Phase 1: Download and Explore

### 1.1 Get repo metadata
```bash
curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/<owner>/<repo>" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['size'], d['private'], d['default_branch'])"
```

### 1.2 Download as ZIP
```bash
mkdir -p /opt/data/downloads && cd /opt/data/downloads
curl -sL -H "Authorization: Bearer $TOKEN" \
  -o backup.zip "https://api.github.com/repos/<owner>/<repo>/zipball/<branch>"
```

### 1.3 Extract (without `unzip` binary)
```bash
python3 -c "
import zipfile, os, glob
z = zipfile.ZipFile('backup.zip')
z.extractall('.')
z.close()
f = glob.glob('<owner>-<repo>-*')[0]
os.rename(f, '<repo>')
"
```

## Phase 2: Explore Structure

Map these directories if present:
- `<repo>/hermes/memories/` → Hermes MEMORY.md, USER.md
- `<repo>/workspace/memoria/` → OpenClaw/Eva diaries and detailed user profile
- `<repo>/workspace/memory/` → More OpenClaw diaries
- `<repo>/workspace/openclaw/openclaw.json` → Eva config (auth profiles, models)
- `<repo>/workspace/openclaw/credentials/` → WhatsApp/Telegram creds
- `<repo>/workspace/skills/` → Custom skills (35+ in this case)
- `<repo>/hermes/skills/` → Hermes built-in skills
- `<repo>/workspace/scripts/` → Automation scripts (70+)
- `<repo>/workspace/dados/` → Structured data (JSON, CSV)
- `<repo>/projetos/` → Projects folder
- `<repo>/obsidian-vault/` → Obsidian vault

## Phase 3: Import Memories and Identity

1. Read `hermes/memories/MEMORY.md` → operational memories (shared folders, VPS details, Telegram format, budget rules, backup config)
2. Read `hermes/memories/USER.md` → user profile for Hermes
3. Read `workspace/memoria/REFERENCE_USER_DETAILED.md` → rich personal data (family addresses, phone numbers, pets, vehicle, parents' jobs, authorities)
4. Read `workspace/memoria/PREFERENCIAS.md` → hobbies, games, series, tech interests
5. Read `workspace/AGENTS.md` → workspace rules, memory system, security policies

**Merge strategy:** Update existing memory entries rather than replacing wholesale. Preserve the user's existing profile and append new details.

## Phase 4: Import Data Files

Copy to canonical locations:
- `financeiro.json` → `/opt/data/workspace/dados/financeiro.json`
- `health_tracker.json` → `/opt/data/workspace/dados/health_tracker.json`
- `orcamento-*.csv` → `/opt/data/workspace/dados/`
- `relacao_despesas_*.csv` → `/opt/data/workspace/dados/`

## Phase 5: Import Skills

Copy to `/opt/data/skills/`:
- From `hermes/skills/`: `municipal-budget`, `personal-finance-tracking`, etc.
- From `workspace/skills/`: `dotacao-orcamentaria`, `proactive-agent`, `firecrawl`, `tavily-search`, `youtube-monitor`, `polymarket-analyst`, `github-backup-manager`, `obsidian-notes`

**Pitfall:** Some skills may already exist — check before overwriting.

## Phase 6: Import Scripts

Copy to `/opt/data/workspace/scripts/` and `chmod +x`:
- `transcribe_*.py` → transcription scripts
- `openai_tts.sh` → TTS wrapper
- `github-backup.sh` → backup automation
- `sites-health-check.sh` → monitoring
- `jornal_regional.py` → journalism
- `polymarket_report.py` → market analysis

## Phase 7: Extract and Configure Credentials

### 7.1 Find API keys
Search patterns:
```bash
grep -rhoE "tvly-[A-Za-z0-9_\-]{20,}" ...
grep -rhoE "sk-(proj|or|ant)-[A-Za-z0-9_\-]{20,}" ...
grep -rhoE "ghp_[A-Za-z0-9_]{30,}" ...
```

### 7.2 Sources to check
- `<repo>/hermes/.env`
- `<repo>/workspace/scripts/*` (hardcoded keys)
- `<repo>/workspace/skills/*/SKILL.md` or scripts
- `<repo>/workspace/openclaw/openclaw.json` (auth profiles)
- `<repo>/workspace/AGENTS.md` (Tavily key was here!)

### 7.3 Store securely
```bash
mkdir -p /opt/data/credentials
cat > /opt/data/credentials/.env << 'EOF'
GITHUB_PERSONAL_ACCESS_TOKEN=...
OPENAI_API_KEY=...
TAVILY_API_KEY=...
EOF
chmod 600 /opt/data/credentials/.env
```

### 7.4 Also copy to Hermes `.env`
```bash
cat > /opt/data/.env << 'EOF'
# ... same vars ...
EOF
chmod 600 /opt/data/.env
```

**Security rules:**
- `chmod 600` on ALL credential files
- NEVER show full tokens in chat (redact with `***`)
- NEVER save credentials in markdown files that go to Git
- Warn the user if they paste keys in chat (security risk)

## Phase 8: Set Up Directory Structure

Create expected directories so skills work:
```bash
mkdir -p /opt/data/workspace/dados
mkdir -p /opt/data/workspace/documentos
mkdir -p /opt/data/workspace/scripts
mkdir -p /opt/data/workspace/skills
mkdir -p /opt/data/compartilhado/prefeitura/docs
mkdir -p /opt/data/compartilhado/aleksandro/financeiro
mkdir -p /opt/data/compartilhado/aleksandro/saude
mkdir -p /opt/data/compartilhado/contatos
mkdir -p /opt/data/compartilhado/sites-config
```

## Phase 9: Document Crons (DO NOT ACTIVATE)

### 9.1 Find cron references
```bash
find <repo>/ -name "*cron*" ! -path "*/node_modules/*" ! -path "*/.git/*"
cat <repo>/workspace/server_configs/crontab_*.txt
cat <repo>/workspace/system_snapshot/openclaw_crons.txt
cat <repo>/workspace/dados/dashboard_cron_jobs.json
```

### 9.2 Extract script-based crons
Check for these scripts:
- `create_daily_memory.js`
- `daily_health_report.js`
- `sites-monitor.js`
- `youtube_check.sh`
- `github-backup.sh`

### 9.3 Document everything
Create `CRONS_REFERENCE.md` with:
- System crontab entries
- OpenClaw/Eva cron jobs (ID, name, schedule, status)
- Script-based scheduled tasks
- Activation instructions (for when the user asks)
- **Prominently note:** "NONE of these crons were activated — user must explicitly ask"

## Phase 10: Test Key Functions

After import, verify:
1. GitHub API works: `curl -H "Authorization: Bearer $TOKEN" ...`
2. Data files are readable: `cat /opt/data/workspace/dados/financeiro.json`
3. Scripts are executable: `ls -l /opt/data/workspace/scripts/`
4. Skills are discoverable: `ls /opt/data/skills/`

## User Communication Pattern

During this workflow the user may say:
- "traga tudo" / "traga os arquivos necessários" → proceed with full import
- "configure tudo" → after importing, set up `.env`, permissions, directory structure
- "traga credenciais" → Phase 7 only
- "traga as crons" → Phase 9, but DO NOT activate
- "NÃO ative" / "só documente" → respect explicitly, never auto-enable crons

## Known Pitfalls

- **Unzip not available:** Use `python3 -c "import zipfile; ..."` instead
- **Path mismatch:** Old backup paths are `/home/administrator/` — adjust to `/opt/data/`
- **Permission issues:** Always `chmod 600` credential files
- **Memory limit:** Hermes memory is ~2,200 chars — large imports must go to files (`/opt/data/imports/`)
- **Token exposure:** User may paste API keys in chat — immediately warn and suggest revoking
- **Agent identity confusion:** Do NOT import Eva's `SOUL.md` or identity files into Hermes
