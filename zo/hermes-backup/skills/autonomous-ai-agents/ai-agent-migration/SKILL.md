---
name: ai-agent-migration
description: "Analyze, extract, and import memories, skills, and data from AI agent backups or other agent systems. Supports cross-agent migration, backup repository exploration, and selective state import while preserving identity boundaries."
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [AI Agents, Migration, Backup, State Management, Memory, Skills]
    related_skills: [hermes-agent, autonomous-ai-agents, github-repo-management, handling-sensitive-data]
---

# AI Agent Migration

Analyze, extract, and selectively import agent state from backups or other AI agent systems. This skill covers the full workflow: downloading a backup repository, exploring its structure, analyzing memories/skills/scripts, and deciding what to bring into the current agent's context.

## When to Use

- User asks to "trazer memórias de outro agente" / "import from backup"
- User shares a backup repo (e.g., `openclaw-backup`, `.hermes-backup`)
- User wants to migrate from OpenClaw, Claude, or another agent framework
- User asks to "explorar meu backup" / "what's in my backup"
- User wants to consolidate multiple agent workspaces

## Prerequisites

- GitHub API access token (or other source of the backup)
- Python 3 available for zip extraction (may lack `unzip` command)
- Adequate disk space for the backup (often 100-500 MB)

## Workflow

### Phase 1: Download the Backup

The backup is typically a private GitHub repository. Use direct API via curl:

```bash
# Get repo metadata first
curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.github.com/repos/OWNER/BACKUP-REPO

# Download as zipball (works for any branch)
curl -sL -H "Authorization: Bearer $TOKEN" \
  -o backup.zip \
  "https://api.github.com/repos/OWNER/BACKUP-REPO/zipball/BRANCH"
```

**Common backup repo names:** `openclaw-backup`, `hermes-backup`, `agent-backup`, `workspace-backup`

### Phase 2: Extract Without `unzip`

Docker containers often lack `unzip`. Use Python:

```bash
python3 -c "
import zipfile, os, glob
zipfile.ZipFile('backup.zip').extractall('.')
folder = glob.glob('OWNER-REPO-*')[0]
os.rename(folder, 'backup')
print('Extracted!')
"
```

### Phase 3: Map the Structure

Explore the top-level directories to understand the agent system:

```bash
find . -maxdepth 2 -type d | sort
```

**Common structures found:**

```
backup/
├── hermes/              # Hermes Agent data
│   ├── memories/        # MEMORY.md, USER.md
│   └── skills/          # Skill definitions
├── workspace/           # Agent workspace
│   ├── memoria/         # Daily memory diaries
│   ├── memory/          # Alternative memory store
│   ├── skills/          # Custom skills
│   ├── scripts/         # Automation scripts
│   └── dados/           # Structured data (JSON/CSV)
├── openclaw/            # OpenClaw-specific config
├── obsidian-vault/      # Obsidian vault sync
└── projetos/            # Projects folder
```

### Phase 4: Analyze Memories

**Read in priority order:**
1. `MEMORY.md` / `memory/MEMORY.md` — curated long-term memory
2. `USER.md` / `memory/USER.md` — user profile
3. `AGENTS.md` — agent behavior rules and workspace conventions
4. `memory/YYYY-MM-DD.md` — recent daily diaries (today + yesterday first)
5. `PREFERENCIAS.md` — personal preferences

**What to extract:**
- ✅ **User profile data** (name, contacts, family, pets, vehicle)
- ✅ **Financial data** (salary, expenses, recurring payments)
- ✅ **Work context** (job role, authorities, procedures)
- ✅ **System config** (VPS details, ports, folder paths)
- ✅ **Behavioral rules** (format preferences, proactivity levels)
- ✅ **Health data** (blood pressure, glucose, exercise)
- ✅ **API keys/tokens** (only if user explicitly requests)

**What to SKIP:**
- ❌ Other agent's **identity/personality** (SOUL.md, agent name, "who am I")
- ❌ Other agent's **relationship claims** ("I am Eva, the assistant")
- ❌ Outdated config that conflicts with current environment
- ❌ Duplicate data already in current agent's memory

### Phase 5: Analyze Skills

List all skills from both systems:

```bash
# Hermes skills
ls backup/hermes/skills/

# Workspace custom skills
ls backup/workspace/skills/

# OpenClaw skills
ls backup/workspace/openclaw-skills/
```

**Categorize for import:**
- 🔴 **High value — import**: User-specific skills (finance tracking, municipal budget, health monitoring)
- 🟡 **Medium value — review**: General utility skills (scraping, search, monitoring)
- 🟢 **Low value — skip**: Generic skills already in current agent (creative, devops, etc.)
- ⚫ **Conflict — rename**: Skills with same name but different content

### Phase 6: Analyze Scripts & Data

**Scripts folder** (`workspace/scripts/`):
- Transcription scripts (whisper, youtube)
- Backup scripts (github-backup, comprehensive-backup)
- Monitoring scripts (sites-health-check, system_status)
- Financial scripts (grafico_gastos, financeiro-resumo)
- Social media scripts (twitter, x, youtube APIs)

**Data folder** (`workspace/dados/`):
- `financeiro.json` — structured transactions
- `health_tracker.json` — health measurements
- `orcamento-*.csv` — municipal budget data
- `youtube_channels.json` — channel subscriptions

### Phase 7: Extract Credentials (only if user asks)

When the user explicitly requests credentials (e.g., *"Se tiver credenciais traga"* / *"bring the credentials too"*), scan for API keys, tokens, and secrets across the backup:

**Search patterns:**
```bash
grep -rhoE "(sk-[A-Za-z0-9_\-]{20,}|tvly-[A-Za-z0-9_\-]{20,}|ghp_[A-Za-z0-9_]{30,})" \
  backup/ --include="*.py" --include="*.js" --include="*.sh" --include="*.json" \
  --include="*.md" --include="*.env*" --exclude-dir=node_modules --exclude-dir=.git
```

**Common locations:**
- `.env` files in `hermes/`, `workspace/`
- Hardcoded in scripts (`openai_vision.js`, `tavily_weather.py`)
- Config JSON files (`openclaw.json` auth profiles)
- WhatsApp credentials (`credentials/whatsapp/`) — usually encrypted, skip

**Security rules:**
- Store in `/opt/data/credentials/.env` with `chmod 600`
- Redact keys in chat output (show only first/last 4 chars)
- Do NOT commit credentials to Git or persistent memory with full values
- Group by service (GITHUB, OPENAI, TAVILY, etc.)

### Phase 8: Import Decisions

Present findings to user with a clear recommendation table:

| Category | Priority | Action | Rationale |
|----------|----------|--------|-----------|
| Personal memories | 🔴 High | Import | Essential for context |
| Financial data | 🔴 High | Import | Source of truth |
| Health data | 🟡 Medium | Import | Useful tracking |
| Custom skills | 🔴 High | Import selectively | Domain-specific value |
| Generic skills | 🟢 Low | Skip | Already available |
| Other agent identity | ⚫ Conflict | Reject | Preserve current identity |
| Scripts | 🟡 Medium | Import on demand | Reusable code |
| Projects | 🟡 Medium | Import on request | Large, context-specific |

## Identity Boundary Rules 🛡️

**NEVER import another agent's identity:**
- Do NOT read SOUL.md of the other agent as "who I am"
- Do NOT adopt the other agent's name, personality, or relationship claims
- Do NOT merge "I am Hermes" with "I am Eva" — maintain separation
- Do NOT import diaries that say "Today I (Eva) did..." as your own memories

**DO import factual data:**
- User's family contacts → Your USER profile
- User's financial transactions → Your memory
- User's work procedures → Your memory
- Custom skills → Your skill library (adapted)

## Security Considerations

- Backup repos are often **private** — require valid token
- Backup may contain **API keys** in config files — redact before storing
- Backup may contain **personal data** (addresses, phone numbers) — handle per `handling-sensitive-data`
- Do NOT commit imported memories with API keys to persistent storage without redaction

## Pitfalls

- **Assuming unzip is available**: Always use Python fallback for extraction
- **Mixing identities**: Don't let the other agent's "I" statements become your own
- **Importing everything**: Be selective — not all data is relevant to current context
- **Missing structured data**: JSON/CSV files in `dados/` are often more valuable than markdown
- **Ignoring folder symlinks**: Workspaces may use symlinks (e.g., `~/.openclaw/workspace` → Obsidian vault)
- **Not checking for cron jobs**: Some backups contain active automation configs — ask before reactivating
- **User prefers direct API over MCP for downloads**: When the user says "don't configure MCP, just use direct API", respect immediately. Use `curl` with the stored token instead of setting up MCP servers.

## Quick Reference

| Task | Command |
|------|---------|
| Download private repo | `curl -sL -H "Authorization: Bearer $TOKEN" -o file.zip URL` |
| Extract without unzip | `python3 -c "import zipfile; zipfile.ZipFile('f').extractall('.')"` |
| List directories | `find . -maxdepth 2 -type d \| sort` |
| Read JSON data | `python3 -c "import json; d=json.load(open('f')); print(json.dumps(d, indent=2)[:2000])"` |
| Count files by type | `find . -type f \| sed 's/.*\.//' \| sort \| uniq -c \| sort -rn` |
| Search for API keys | `grep -rhoE "(sk-\|tvly-\|ghp_)[A-Za-z0-9_\-]{20,}" backup/ --include="*.py" --include="*.js" --include="*.json"` |

## References

- `references/session-openclaw-backup-analysis.md` — Detailed session transcript and findings from a real migration (2026-05-09)
