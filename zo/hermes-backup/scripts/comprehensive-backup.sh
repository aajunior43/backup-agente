#!/bin/bash
# ==============================================================
# COMPREHENSIVE BACKUP — TUDO PARA MIGRAÇÃO DE VPS
# Feito para: Eva + Hermes → Novo VPS
# ==============================================================

set -uo pipefail

LOG_FILE="/tmp/full-backup-migration.log"
BACKUP_DIR="/home/administrator/vps-full-backup"
REPO_URL="https://github.com/aajunior43/openclaw-backup.git"
TIMESTAMP="$(TZ=America/Sao_Paulo date '+%Y-%m-%d %H:%M:%S')"
TIMESTAMP_FILE="$(TZ=America/Sao_Paulo date '+%Y%m%d_%H%M%S')"
ERRORS=0
TAR_GZ="/tmp/vps-full-backup-${TIMESTAMP_FILE}.tar.gz"

# Telegram (Eva)
TELEGRAM_TOKEN="$(python3 -c "import json; print(json.load(open('/home/administrator/.openclaw/credentials/telegram/default.json'))['token'])" 2>/dev/null || echo "")"
TELEGRAM_CHAT_ID="942288759"

log() { echo "[$(TZ=America/Sao_Paulo date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }
ok()    { log "  ✅ $*"; }
skip()  { log "  ⏭️  $*"; }
fail()  { log "  ❌ $*"; ERRORS=$((ERRORS + 1)); }

sync_dir() {
  local src="$1"; local dst="$2"; shift 2
  if [ -d "$src" ]; then
    mkdir -p "$BACKUP_DIR/$dst"
    rsync -a --delete "$@" "$src/" "$BACKUP_DIR/$dst/" 2>/dev/null && ok "$dst/" || fail "$dst/"
  else skip "$dst/"; fi
}

sync_file() {
  local src="$1"; local dst="$2"
  if [ -f "$src" ]; then
    mkdir -p "$(dirname "$BACKUP_DIR/$dst")"
    cp "$src" "$BACKUP_DIR/$dst" 2>/dev/null && ok "$dst" || fail "$dst"
  else skip "$dst"; fi
}

# ==============================================================
# INÍCIO
# ==============================================================

log "========================================================"
log "🚀 COMPREHENSIVE BACKUP — MIGRAÇÃO DE VPS"
log "   Data: $TIMESTAMP"
log "========================================================"

cd "$BACKUP_DIR" || { log "FATAL: $BACKUP_DIR não existe"; exit 1; }

# Garantir git
if [ ! -d ".git" ]; then
  log "🔧 Inicializando repositório..."
  git init >/dev/null 2>&1
  git remote add origin "$REPO_URL" 2>/dev/null || true
fi

# ==============================================================
# SEÇÃO 1: OPENCLAW COMPLETO
# ==============================================================

log ""
log "📦 [1/12] OPENCLAW — CONFIGURAÇÃO COMPLETA"

OPENCLAW_DIR="/home/administrator/.openclaw"

# Workspace completo (exclui só o que não precisa)
sync_dir "$OPENCLAW_DIR/workspace" "workspace" \
  --exclude='.git' --exclude='node_modules/' --exclude='__pycache__/' \
  --exclude='*.pyc' --exclude='*.sqlite-wal' --exclude='*.sqlite-shm' \
  --exclude='youtube_videos.db' --exclude='*.db-shm' --exclude='*.db-wal'

# ⚠️ INCLUI TUDO: documentos, dados, memory, etc
sync_dir "$OPENCLAW_DIR/agents"       "openclaw/agents"
sync_dir "$OPENCLAW_DIR/subagents"    "openclaw/subagents"
sync_dir "$OPENCLAW_DIR/hooks"        "openclaw/hooks"
sync_dir "$OPENCLAW_DIR/skills"       "openclaw/skills" --exclude='.git' --exclude='node_modules/'
sync_dir "$OPENCLAW_DIR/canvas"       "openclaw/canvas"
sync_dir "$OPENCLAW_DIR/identity"     "openclaw/identity"
sync_dir "$OPENCLAW_DIR/devices"      "openclaw/devices"
sync_dir "$OPENCLAW_DIR/cron"         "openclaw/cron"
sync_dir "$OPENCLAW_DIR/logs"         "openclaw/logs"
sync_dir "$OPENCLAW_DIR/media"         "openclaw/media"
sync_dir "$OPENCLAW_DIR/memory"        "openclaw/memory"
sync_dir "$OPENCLAW_DIR/extensions"   "openclaw/extensions"
sync_dir "$OPENCLAW_DIR/flows"        "openclaw/flows"
sync_dir "$OPENCLAW_DIR/delivery-queue" "openclaw/delivery-queue"
sync_dir "$OPENCLAW_DIR/cache"        "openclaw/cache"

# Configs principais (INCLUI CREDENCIAIS)
sync_file "$OPENCLAW_DIR/openclaw.json"        "openclaw/openclaw.json"
for bak in "$OPENCLAW_DIR"/openclaw.json.bak*; do
  [ -f "$bak" ] && sync_file "$bak" "openclaw/$(basename "$bak")"
done

# Credentials COMPLETAS (tokens, senhas, chaves)
sync_dir "$OPENCLAW_DIR/credentials"   "openclaw/credentials"

# ==============================================================
# SEÇÃO 2: CREDENCIAIS COMPLETAS (JSON FORMAT)
# ==============================================================

log ""
log "🔐 [2/12] CREDENCIAIS COMPLETAS"

CRED_FILE="$BACKUP_DIR/openclaw/credentials-complete.json"
python3 - << 'PYEOF' > "$CRED_FILE" 2>/dev/null
import json, os, glob

creds = {}

# Telegram Eva
try:
    with open('/home/administrator/.openclaw/credentials/telegram/default.json') as f:
        creds['telegram_eva'] = json.load(f)
except: pass

# WhatsApp
try:
    wa_dir = '/home/administrator/.openclaw/credentials/whatsapp'
    for f in glob.glob(wa_dir + '/**/*', recursive=True):
        if os.path.isfile(f):
            key = f.replace('/', '_').replace('.', '_')
            try:
                with open(f) as fh:
                    creds[f'whatsapp_{key}'] = fh.read().strip()
            except: pass
except: pass

# Hermes .env
try:
    with open('/home/administrator/.hermes/.env') as f:
        env_lines = {}
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                env_lines[k] = v
        creds['hermes_env'] = env_lines
except: pass

# Hermes auth
try:
    with open('/home/administrator/.hermes/auth.json') as f:
        creds['hermes_auth'] = json.load(f)
except: pass

# Hermes config.yaml
try:
    import yaml
    with open('/home/administrator/.hermes/config.yaml') as f:
        creds['hermes_config'] = yaml.safe_load(f)
except:
    try:
        with open('/home/administrator/.hermes/config.yaml') as f:
            creds['hermes_config_raw'] = f.read()
    except: pass

# OpenRouter keys (from openclaw.json providers)
try:
    with open('/home/administrator/.openclaw/openclaw.json') as f:
        cfg = json.load(f)
        providers = cfg.get('providers', {})
        or_key = None
        for pname, pdata in providers.items():
            if isinstance(pdata, dict) and 'apiKey' in pdata:
                or_key = pdata['apiKey']
                break
        if or_key:
            creds['openrouter_api_key'] = or_key
except: pass

# Token usage
try:
    with open('/home/administrator/.openclaw/workspace/dados/token_usage.json') as f:
        creds['token_usage'] = json.load(f)
except: pass

print(json.dumps(creds, indent=2, ensure_ascii=False))
PYEOF
if [ -s "$CRED_FILE" ]; then ok "credentials-complete.json"; else fail "credentials-complete.json"; fi

# ==============================================================
# SEÇÃO 3: UNIFIED GATEWAY
# ==============================================================

log ""
log "🌐 [3/12] UNIFIED GATEWAY"

sync_dir "/home/administrator/.openclaw/workspace/unified-gateway" "unified-gateway"

# ==============================================================
# SEÇÃO 4: CÉREBRO EVA
# ==============================================================

log ""
log "🧠 [4/12] CÉREBRO EVA"

sync_dir "/home/administrator/.openclaw/workspace/cerebro-eva" "cerebro-eva"

# ==============================================================
# SEÇÃO 5: SITES HOSPEDADOS (TODOS)
# ==============================================================

log ""
log "🏢 [5/12] SITES HOSPEDADOS"

if [ -d "/home/administrator/.openclaw/workspace/sites" ]; then
  mkdir -p "$BACKUP_DIR/sites"
  for site_dir in /home/administrator/.openclaw/workspace/sites/*/; do
    site_name=$(basename "$site_dir")
    sync_dir "$site_dir" "sites/$site_name"
  done
  ok "sites/ (todos os sites)"
else
  skip "sites/"
fi

# ==============================================================
# SEÇÃO 6: HERMES COMPLETO
# ==============================================================

log ""
log "🤖 [6/12] HERMES — CONFIGURAÇÃO COMPLETA"

HERMES_DIR="/home/administrator/.hermes"

sync_file "$HERMES_DIR/config.yaml"   "hermes/config.yaml"
sync_file "$HERMES_DIR/.env"           "hermes/.env"
sync_file "$HERMES_DIR/auth.json"      "hermes/auth.json"
sync_file "$HERMES_DIR/SOUL.md"        "hermes/SOUL.md"
sync_dir  "$HERMES_DIR/memories"       "hermes/memories"
sync_dir  "$HERMES_DIR/sessions"        "hermes/sessions"
sync_dir  "$HERMES_DIR/skills"          "hermes/skills"
sync_dir  "$HERMES_DIR/cron"            "hermes/cron"
sync_dir  "$HERMES_DIR/hooks"           "hermes/hooks"
sync_dir  "$HERMES_DIR/agents"          "hermes/agents"
sync_dir  "$HERMES_DIR/pairing"         "hermes/pairing"
sync_dir  "$HERMES_DIR/logs"            "hermes/logs"

# Hermes agent code (hermes-agent directory)
if [ -d "$HERMES_DIR/hermes-agent" ]; then
  sync_dir "$HERMES_DIR/hermes-agent" "hermes/hermes-agent" \
    --exclude='.git' --exclude='node_modules/' --exclude='__pycache__/' \
    --exclude='venv/lib' --exclude='*.pyc' --exclude='site-packages/'
fi

# Hermes state.db (last state)
if [ -f "$HERMES_DIR/state.db" ]; then
  cp "$HERMES_DIR/state.db" "$BACKUP_DIR/hermes/state.db" 2>/dev/null && ok "hermes/state.db" || skip "hermes/state.db"
fi

# ==============================================================
# SEÇÃO 7: SCRIPTS PERSONALIZADOS
# ==============================================================

log ""
log "📜 [7/12] SCRIPTS PERSONALIZADOS"

sync_dir "/home/administrator/scripts"          "scripts"
sync_dir "/home/administrator/.openclaw/workspace/scripts" "workspace_scripts"

# ==============================================================
# SEÇÃO 8: OPENROUTER MANAGER
# ==============================================================

log ""
log "🔄 [8/12] OPENROUTER MANAGER"

sync_dir "/home/administrator/openrouter-manager" "openrouter-manager" \
  --exclude='.git' --exclude='node_modules/' --exclude='__pycache__/' \
  --exclude='venv/'

# ==============================================================
# SEÇÃO 9: OBSIDIAN VAULT
# ==============================================================

log ""
log "📓 [9/12] OBSIDIAN VAULT"

for vault in "/home/administrator/obsidian/vaults/MeuCofre" "/home/administrator/ObsidianVault"; do
  if [ -d "$vault" ]; then
    vault_name=$(basename "$(dirname "$vault")")_$(basename "$vault")
    sync_dir "$vault" "obsidian_vaults/$vault_name" \
      --exclude='.git' --exclude='.trash' --exclude='node_modules/' \
      --exclude='.obsidian/plugins/' --exclude='*.md.bak'
    break
  fi
done

# ==============================================================
# SEÇÃO 10: CONFIGURAÇÕES DE REDE E SERVIDOR
# ==============================================================

log ""
log "⚙️  [10/12] CONFIGURAÇÕES DE SERVIDOR"

mkdir -p "$BACKUP_DIR/server_configs"

# Caddyfiles
for cf in /home/administrator/*.caddyfile /home/administrator/Caddyfile*; do
  [ -f "$cf" ] && cp "$cf" "$BACKUP_DIR/server_configs/" 2>/dev/null && ok "$(basename $cf)"
done
for cf in /etc/caddy/Caddyfile; do
  [ -f "$cf" ] && cp "$cf" "$BACKUP_DIR/server_configs/" 2>/dev/null && ok "$(basename $cf)"
done

# Nginx configs
mkdir -p "$BACKUP_DIR/server_configs/nginx"
for nf in /etc/nginx/*.conf /etc/nginx/conf.d/*.conf; do
  [ -f "$nf" ] && cp "$nf" "$BACKUP_DIR/server_configs/nginx/" 2>/dev/null
done
ls "$BACKUP_DIR/server_configs/nginx/" >/dev/null 2>&1 && ok "nginx configs" || skip "nginx configs"

# Systemd services do openclaw e hermes
for svc in openclaw-gateway hermes-gateway; do
  sf="/etc/systemd/system/${svc}.service"
  [ -f "$sf" ] && cp "$sf" "$BACKUP_DIR/server_configs/" 2>/dev/null && ok "$svc.service"
done

# Crontabs
crontab -l 2>/dev/null > "$BACKUP_DIR/server_configs/crontab_user.txt"
sudo crontab -l 2>/dev/null > "$BACKUP_DIR/server_configs/crontab_root.txt" || true
ok "crontabs"

# Hosts
cp /etc/hosts "$BACKUP_DIR/server_configs/hosts" 2>/dev/null && ok "hosts" || skip "hosts"

# SSH authorized keys
mkdir -p "$BACKUP_DIR/server_configs/ssh"
for uk in /home/administrator/.ssh/authorized_keys*; do
  [ -f "$uk" ] && cp "$uk" "$BACKUP_DIR/server_configs/ssh/" 2>/dev/null && ok "$(basename $uk)"
done

# ==============================================================
# SEÇÃO 11: SISTEMA E ESTADO
# ==============================================================

log ""
log "🖥️  [11/12] SNAPSHOT DO SISTEMA"

mkdir -p "$BACKUP_DIR/system_snapshot"

# Info geral
{
  echo "=== BACKUP COMPLETO — MIGRAÇÃO DE VPS ==="
  echo "Data: $TIMESTAMP"
  echo "Host: $(hostname)"
  echo "Kernel: $(uname -a)"
  echo "Node: $(node --version 2>/dev/null || echo 'N/A')"
  echo "Python: $(python3 --version 2>/dev/null || echo 'N/A')"
  echo ""
  echo "=== ARQUITETURA ==="
  echo "OpenClaw dir: $OPENCLAW_DIR"
  echo "Hermes dir: $HERMES_DIR"
  echo "Workspace: $OPENCLAW_DIR/workspace"
  echo ""
  echo "=== DISK ==="
  df -h | grep -v tmpfs
  echo ""
  echo "=== REDE ==="
  hostname -I
  echo ""
  echo "=== PORTAS EM USO ==="
  ss -tlnp | sort
} > "$BACKUP_DIR/system_snapshot/system_info.txt"
ok "system_info.txt"

# Lista de serviços
ps aux | grep -E 'node|python.*server|openclaw|hermes|caddy|nginx' | grep -v grep \
  > "$BACKUP_DIR/system_snapshot/processos.txt" 2>/dev/null
ok "processos.txt"

# OpenClaw cron jobs completos
openclaw cron list > "$BACKUP_DIR/system_snapshot/openclaw_crons.txt" 2>/dev/null
ok "openclaw_crons.txt"

# Installed packages relevantes
dpkg -l | grep -E 'nodejs|python3|caddy|nginx|git|rsync' \
  > "$BACKUP_DIR/system_snapshot/pacotes_instalados.txt" 2>/dev/null
ok "pacotes_instalados.txt"

# ==============================================================
# SEÇÃO 12: DADOS IMPORTANTES (JSON)
# ==============================================================

log ""
log "📊 [12/12] DADOS IMPORTANTES"

mkdir -p "$BACKUP_DIR/important_data"

# Health tracker
if [ -f "$OPENCLAW_DIR/workspace/dados/health_tracker.json" ]; then
  cp "$OPENCLAW_DIR/workspace/dados/health_tracker.json" "$BACKUP_DIR/important_data/"
  ok "health_tracker.json"
fi

# Assinaturas
if [ -f "$OPENCLAW_DIR/workspace/dados/assinaturas.json" ]; then
  cp "$OPENCLAW_DIR/workspace/dados/assinaturas.json" "$BACKUP_DIR/important_data/"
  ok "assinaturas.json"
fi

# Veículos
if [ -f "$OPENCLAW_DIR/workspace/dados/veiculos.md" ]; then
  cp "$OPENCLAW_DIR/workspace/dados/veiculos.md" "$BACKUP_DIR/important_data/"
  ok "veiculos.md"
fi

# Heartbeat state
if [ -f "$OPENCLAW_DIR/workspace/dados/heartbeat-state.json" ]; then
  cp "$OPENCLAW_DIR/workspace/dados/heartbeat-state.json" "$BACKUP_DIR/important_data/"
  ok "heartbeat-state.json"
fi

# YouTube channels
if [ -f "$OPENCLAW_DIR/workspace/dados/youtube_channels.json" ]; then
  cp "$OPENCLAW_DIR/workspace/dados/youtube_channels.json" "$BACKUP_DIR/important_data/"
  ok "youtube_channels.json"
fi

# ==============================================================
# INSTRUÇÕES DE RESTAURAÇÃO
# ==============================================================

cat > "$BACKUP_DIR/README_MIGRACAO.md" << 'MDEOF'
# 📋 GUIA DE MIGRAÇÃO — EVA + HERMES PARA NOVO VPS

## ARQUIVOS CONTIDOS NESTE BACKUP

```
vps-full-backup/
├── workspace/                    # Workspace completo da Eva
├── openclaw/                     # Config do OpenClaw (inclui credentials)
│   ├── openclaw.json            # ⚠️ CONTÉM TOKENS E KEYS
│   └── credentials/             # ⚠️ TOKENS DE API
├── openclaw/credentials-complete.json  # ⚠️ TODAS AS CREDENCIAIS CENTRALIZADAS
├── unified-gateway/              # Gateway que roteia todos os sites
├── cerebro-eva/                  # Cérebro da Eva
├── sites/                       # TODOS os sites hospedados
├── hermes/                      # Config completa do Hermes/Pandora
│   ├── .env                     # ⚠️ CONTÉM API KEYS
│   ├── config.yaml
│   ├── auth.json
│   ├── hermes-agent/           # Código do Hermes
│   ├── memories/
│   ├── sessions/
│   ├── skills/
│   └── state.db                 # Estado do banco
├── scripts/                     # Scripts do administrador
├── workspace_scripts/            # Scripts do workspace
├── openrouter-manager/          # Gerenciador de modelos
├── obsidian_vaults/            # Vault do Obsidian
├── server_configs/             #Configs de servidor
│   ├── crontab_user.txt
│   ├── crontab_root.txt
│   ├── Caddyfile*              # ⚠️ Config do Caddy
│   ├── nginx/
│   └── ssh/
├── system_snapshot/             # Info do sistema
├── important_data/              # Dados importantes (saúde, finanças)
└── README_MIGRACAO.md          # Este arquivo
```

## PASSOS DE RESTAURAÇÃO NO NOVO VPS

### 1. INSTALAR DEPENDÊNCIAS BASE
```bash
# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python 3.12+
sudo apt-get install -y python3 python3-pip python3-venv

# Git, rsync
sudo apt-get install -y git rsync curl wget

# SQLite
sudo apt-get install -y sqlite3

# Caddy (se usar)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

### 2. CLONAR O BACKUP DO GITHUB
```bash
cd ~
git clone https://github.com/aajunior43/openclaw-backup.git vps-full-backup
cd vps-full-backup
```

### 3. RESTAURAR OPENCLAW
```bash
# Criar diretórios
mkdir -p ~/.openclaw
mkdir -p ~/.hermes

# Copiar configs
cp -r openclaw/ ~/.openclaw/
cp -r hermes/ ~/.hermes/

# Instalar OpenClaw
npm install -g openclaw

# Restaurar credentials (ler do credentials-complete.json)
# ⚠️ Configure os tokens nas variáveis de ambiente ou config
```

### 4. RESTAURAR UNIFIED GATEWAY
```bash
cp -r unified-gateway/ ~/.openclaw/workspace/
cp unified-gateway/server.js ~/.openclaw/workspace/unified-gateway/

# Configurar pra rodar como serviço systemd
```

### 5. RESTAURAR CÉREBRO EVA
```bash
cp -r cerebro-eva/ ~/.openclaw/workspace/
```

### 6. RESTAURAR SITES
```bash
cp -r sites/ ~/.openclaw/workspace/sites/
# Cada site precisa ter seu server.js iniciado
```

### 7. RESTAURAR HERMES
```bash
cd ~/.hermes/hermes-agent/hermes-agent
pip3 install -e .
# ou usar setup-hermes.sh

# Configurar .env com as credenciais
# Iniciar: python3 -m hermes_cli.main gateway run --replace
```

### 8. RECRIAR CRON JOBS
```bash
# Cron do sistema
crontab server_configs/crontab_user.txt
sudo crontab server_configs/crontab_root.txt

# Cron do OpenClaw (recriar via openclaw cron)
openclaw cron import < openclaw_crons.txt
```

### 9. CONFIGURAR SERVIÇOS SYSTEMD
```bash
# OpenClaw Gateway
sudo cp server_configs/openclaw-gateway.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable openclaw-gateway
sudo systemctl start openclaw-gateway

# Hermes Gateway (similar)
```

## ⚠️ CREDENCIAIS IMPORTANTES (do backup)

### Eva — Telegram
- Bot: @Evabotjrbot
- Token: 8540151491:AAGsHITvjM65F4JxvrDulz-RkXrYxOnOHwvU

### Hermes — Telegram
- Bot: @pandorajrbot
- Token: 8646208153:AAEeX-QzDuxmgQYzCdUZxeQ1o3R-AucAcMg

### APIs
- OpenRouter API Key (ver em openclaw.json ou credentials-complete.json)
- OpenAI API Key (TTS + Vision)
- Tavily API Key: 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
- Firecrawl API Key: fc-65ef8c023a0d4da4863d7d8e7ea31321

### Hermes — Model Provider
- Provider: minimax
- Model: MiniMax-M2.7

## PORTAS PADRÃO

| Porta | Serviço |
|-------|---------|
| 18789/18791 | OpenClaw Gateway |
| 3000 | Unified Gateway |
| 3003 | Cérebro Eva |
| 3016 | Blog Manual da Bíblia |
| 3019 | Combustível |
| 3021 | Manual do Nerd |
| 3022 | Agenda de Obrigações |
| 3005 | Kanban |
| 3006 | Prefeitura |
| 3008 | ISS Calc |
| 3009 | Eva Dashboard |
| 3010 | Flow |
| 3012 | Obsidian Web |
| 3021 | Manual do Nerd |
| 8090 | Hermes WebUI |

## AUTORIAIS

Backup feito pela EVA em: TIMESTAMP
Repositório: https://github.com/aajunior43/openclaw-backup
MDEOF

ok "README_MIGRACAO.md"

# ==============================================================
# COMMIT E PUSH
# ==============================================================

log ""
log "💾 Commitando..."

git add -A 2>/dev/null

if git diff-index --quiet HEAD -- 2>/dev/null; then
  log "✅ Nenhuma mudança para commit"
else
  CHANGED=$(git diff --cached --name-only 2>/dev/null | wc -l)
  log "   📝 $CHANGED arquivo(s)"
  git commit -m "FULL BACKUP — Migração VPS — $TIMESTAMP" --quiet
  log "📤 Push..."
  if timeout 120 git push origin main --quiet 2>/dev/null; then
    ok "Push concluído"
  else
    timeout 120 git push -u origin HEAD:main --quiet 2>/dev/null && ok "Push (new branch)" || fail "Push"
  fi
fi

# ==============================================================
# SUMÁRIO
# ==============================================================

BACKUP_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
log ""
log "========================================================"
log "✅ COMPREHENSIVE BACKUP FINALIZADO"
log "   📁 Tamanho: $BACKUP_SIZE"
log "   📝 Erros: $ERRORS"
log "   🔗 Repo: $REPO_URL"
log "========================================================"

# Notificação Telegram (só se tudo ok)
if [ "$ERRORS" -eq 0 ] && [ -n "$TELEGRAM_TOKEN" ]; then
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=✅ Backup Completo — Migração VPS
📦 Tamanho: $BACKUP_SIZE
📝 Arquivos: $CHANGED
🔗 Repo: github.com/aajunior43/openclaw-backup
⏰ Data: $TIMESTAMP" \
    --max-time 30 >/dev/null 2>&1
fi

exit 0