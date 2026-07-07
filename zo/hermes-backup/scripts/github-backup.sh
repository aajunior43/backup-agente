#!/bin/bash

# GitHub Full Backup — versão completa
# Cobre todo o estado do OpenClaw + ambiente do VPS

set -uo pipefail

LOG_FILE="/tmp/github-backup.log"
BACKUP_DIR="/home/administrator/vps-github-backup"
OPENCLAW_DIR="/home/administrator/.openclaw"
REPO_URL="https://github.com/aajunior43/openclaw-backup.git"
TIMESTAMP="$(TZ=America/Sao_Paulo date '+%Y-%m-%d %H:%M:%S')"
TIMESTAMP_FILE="$(TZ=America/Sao_Paulo date '+%Y%m%d_%H%M%S')"
ERRORS=0
TELEGRAM_TOKEN="$(python3 -c "import json; print(json.load(open('/home/administrator/.openclaw/credentials/telegram/default.json'))['token'])" 2>/dev/null || echo "")"
TELEGRAM_CHAT_ID="942288759"
TAR_FILE="/tmp/openclaw-backup-${TIMESTAMP_FILE}.tar.gz"

# ─── helpers ────────────────────────────────────────────────────────────────

log() {
  echo "[$(TZ=America/Sao_Paulo date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

ok()    { log "  ✅ $*"; }
skip()  { log "  ⏭️  $* (não existe, pulando)"; }
fail()  { log "  ❌ $*"; ERRORS=$((ERRORS + 1)); }

sync_dir() {
  local src="$1"
  local dst="$2"
  shift 2
  local extra_args=("$@")

  if [ -d "$src" ]; then
    mkdir -p "$BACKUP_DIR/$dst"
    if rsync -a --delete "${extra_args[@]}" "$src/" "$BACKUP_DIR/$dst/" 2>/dev/null; then
      ok "$dst/"
    else
      fail "$dst/ (rsync retornou erro)"
    fi
  else
    skip "$dst/"
  fi
}

sync_file() {
  local src="$1"
  local dst="$2"

  if [ -f "$src" ]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$dst")"
    if cp "$src" "$BACKUP_DIR/$dst" 2>/dev/null; then
      ok "$dst"
    else
      fail "$dst (falha ao copiar)"
    fi
  else
    skip "$dst"
  fi
}

# ─── início ─────────────────────────────────────────────────────────────────

log "========================================================"
log "🚀 Iniciando backup GitHub — $TIMESTAMP"
log "========================================================"

cd "$BACKUP_DIR" || { log "FATAL: Diretório não existe: $BACKUP_DIR"; exit 1; }

# Garantir repositório git
if [ ! -d ".git" ]; then
  log "🔧 Inicializando repositório..."
  git init
  git remote add origin "$REPO_URL" 2>/dev/null || true
fi

# ─── 1. núcleo do openclaw ────────────────────────────────────────────────

log ""
log "📦 [1/6] Núcleo do OpenClaw"

# Workspace completo
sync_dir "$OPENCLAW_DIR/workspace"       "workspace"    \
  --exclude='.git' --exclude='node_modules/' --exclude='__pycache__/' \
  --exclude='*.pyc' --exclude='.DS_Store' --exclude='*.sqlite-wal' \
  --exclude='*.sqlite-shm'

# Agentes, subagents, hooks, skills
sync_dir "$OPENCLAW_DIR/agents"          "agents"
sync_dir "$OPENCLAW_DIR/subagents"       "subagents"
sync_dir "$OPENCLAW_DIR/hooks"           "hooks"
sync_dir "$OPENCLAW_DIR/skills"          "skills"       --exclude='.git' --exclude='node_modules/'

# Canvas e identidade
sync_dir "$OPENCLAW_DIR/canvas"          "canvas"
sync_dir "$OPENCLAW_DIR/identity"        "identity"

# Devices e configurações de canal
sync_dir "$OPENCLAW_DIR/devices"         "devices"
sync_dir "$OPENCLAW_DIR/credentials"     "credentials"

# Cron jobs
sync_dir "$OPENCLAW_DIR/cron"            "cron"

# Config principal e todos os backups .bak*
sync_file "$OPENCLAW_DIR/openclaw.json"           "openclaw.json"
sync_file "$OPENCLAW_DIR/update-check.json"       "update-check.json"
for bak in "$OPENCLAW_DIR"/openclaw.json.bak*; do
  [ -f "$bak" ] && sync_file "$bak" "$(basename "$bak")"
done

# ─── 2. estado de canais (telegram, whatsapp) ─────────────────────────────

log ""
log "📡 [2/6] Estado dos canais"

sync_dir "$OPENCLAW_DIR/telegram"        "telegram"
sync_dir "$OPENCLAW_DIR/delivery-queue"  "delivery-queue"

# ─── 3. memória e mídia ───────────────────────────────────────────────────

log ""
log "🧠 [3/6] Memória e mídia"

# Banco SQLite de memória — dump SQL para garantir consistência
if [ -f "$OPENCLAW_DIR/memory/main.sqlite" ]; then
  mkdir -p "$BACKUP_DIR/memory"
  if command -v sqlite3 &>/dev/null; then
    if sqlite3 "$OPENCLAW_DIR/memory/main.sqlite" .dump > "$BACKUP_DIR/memory/main.sql" 2>/dev/null; then
      ok "memory/main.sql (dump SQL do SQLite)"
    else
      # fallback: copia binária
      cp "$OPENCLAW_DIR/memory/main.sqlite" "$BACKUP_DIR/memory/main.sqlite" 2>/dev/null && \
        ok "memory/main.sqlite (cópia binária — sqlite3 falhou)" || \
        fail "memory/ (não foi possível fazer backup do banco)"
    fi
  else
    cp "$OPENCLAW_DIR/memory/main.sqlite" "$BACKUP_DIR/memory/main.sqlite" 2>/dev/null && \
      ok "memory/main.sqlite (cópia binária — sqlite3 não instalado)" || \
      fail "memory/ (não foi possível fazer backup do banco)"
  fi
  # outros arquivos na pasta memory além do sqlite
  rsync -a --exclude='main.sqlite' "$OPENCLAW_DIR/memory/" "$BACKUP_DIR/memory/" 2>/dev/null || true
else
  skip "memory/main.sqlite"
fi

# Mídia (limita a arquivos dos últimos 30 dias para não crescer demais)
if [ -d "$OPENCLAW_DIR/media" ]; then
  mkdir -p "$BACKUP_DIR/media"
  find "$OPENCLAW_DIR/media" -type f -mtime -30 -exec \
    rsync -a --relative {} "$BACKUP_DIR/media/" \; 2>/dev/null || true
  ok "media/ (arquivos dos últimos 30 dias)"
else
  skip "media/"
fi

# ─── 4. logs ─────────────────────────────────────────────────────────────

log ""
log "📋 [4/6] Logs"

mkdir -p "$BACKUP_DIR/logs-backup"

# Logs internos do openclaw (últimos 7 dias)
if [ -d "$OPENCLAW_DIR/logs" ]; then
  find "$OPENCLAW_DIR/logs" -type f -mtime -7 \
    -exec cp --preserve=timestamps {} "$BACKUP_DIR/logs-backup/" \; 2>/dev/null || true
  ok "logs/ internos do openclaw (7 dias)"
else
  skip "logs/ internos do openclaw"
fi

# Logs gerais do VPS (últimos 7 dias)
if [ -d "/home/administrator/logs" ]; then
  find /home/administrator/logs -name "*.log" -mtime -7 \
    -exec cp --preserve=timestamps {} "$BACKUP_DIR/logs-backup/" \; 2>/dev/null || true
  ok "logs/ gerais do VPS (7 dias)"
fi

# ─── 5. aplicações e scripts ─────────────────────────────────────────────

log ""
log "🛠️  [5/6] Aplicações e scripts"

sync_dir "/home/administrator/scripts"            "scripts"
sync_dir "/home/administrator/openrouter-manager" "openrouter-manager" \
  --exclude='.git' --exclude='node_modules/' --exclude='__pycache__/' \
  --exclude='*.pyc' --exclude='venv/'

# Obsidian vault
if [ -d "/home/administrator/obsidian/vaults/MeuCofre" ]; then
  sync_dir "/home/administrator/obsidian/vaults/MeuCofre" "obsidian_vault_backup" \
    --exclude='.git' --exclude='.trash' --exclude='node_modules/'
elif [ -d "/home/administrator/ObsidianVault" ]; then
  sync_dir "/home/administrator/ObsidianVault" "obsidian_vault_backup" \
    --exclude='.git' --exclude='.trash' --exclude='node_modules/'
else
  skip "ObsidianVault"
fi

# Hermes/Pandora backup
if [ -d "/home/administrator/.hermes" ]; then
  mkdir -p "$BACKUP_DIR/hermes"
  sync_file "/home/administrator/.hermes/config.yaml"  "hermes/config.yaml"
  sync_file "/home/administrator/.hermes/.env"           "hermes/.env"
  sync_file "/home/administrator/.hermes/SOUL.md"       "hermes/SOUL.md"
  sync_file "/home/administrator/.hermes/auth.json"     "hermes/auth.json"
  sync_dir "/home/administrator/.hermes/memories"       "hermes/memories"
  sync_dir "/home/administrator/.hermes/sessions"       "hermes/sessions"
  sync_dir "/home/administrator/.hermes/agents"         "hermes/agents"
  sync_dir "/home/administrator/.hermes/skills"          "hermes/skills"
  sync_dir "/home/administrator/.hermes/cron"            "hermes/cron"
  sync_dir "/home/administrator/.hermes/hooks"           "hermes/hooks"
  log "  ℹ️  Hermes state.db não incluso (reconstruído via WhatsApp/pairing)"
fi

# Backups de restauração do openclaw (pre-restore-backup-*)
for predir in "$OPENCLAW_DIR"/pre-restore-backup-*; do
  if [ -d "$predir" ]; then
    dirname="$(basename "$predir")"
    sync_dir "$predir" "pre-restore/$dirname"
  fi
done

# ─── 6. snapshot do sistema ───────────────────────────────────────────────

log ""
log "🖥️  [6/6] Snapshot do sistema"

mkdir -p "$BACKUP_DIR/system_backup"

# Crontab do usuário
crontab -l 2>/dev/null > "$BACKUP_DIR/system_backup/crontab.txt" || \
  echo "(sem crontab)" > "$BACKUP_DIR/system_backup/crontab.txt"
ok "system_backup/crontab.txt"

# Processos relacionados ao openclaw
ps aux | grep -E 'openclaw|node|python' | grep -v grep \
  > "$BACKUP_DIR/system_backup/processes.txt" 2>/dev/null || true
ok "system_backup/processes.txt"

# Uso de disco
df -h > "$BACKUP_DIR/system_backup/disk_usage.txt" 2>/dev/null || true
du -sh "$OPENCLAW_DIR"/* 2>/dev/null >> "$BACKUP_DIR/system_backup/disk_usage.txt" || true
ok "system_backup/disk_usage.txt"

# Versão do openclaw (tenta detectar)
{
  echo "Timestamp do backup: $TIMESTAMP"
  echo ""
  echo "=== openclaw.json meta ==="
  if command -v jq &>/dev/null; then
    jq '.meta' "$OPENCLAW_DIR/openclaw.json" 2>/dev/null || echo "(jq falhou)"
  else
    grep -A5 '"meta"' "$OPENCLAW_DIR/openclaw.json" 2>/dev/null || true
  fi
  echo ""
  echo "=== Node.js ==="
  node --version 2>/dev/null || echo "não encontrado"
  echo ""
  echo "=== Sistema ==="
  uname -a
  echo ""
  echo "=== Variáveis de ambiente (sem segredos) ==="
  env | grep -vE 'TOKEN|SECRET|KEY|PASSWORD|API|AUTH' | sort
} > "$BACKUP_DIR/system_backup/version_info.txt" 2>/dev/null
ok "system_backup/version_info.txt"

# ─── commit e push ───────────────────────────────────────────────────────

log ""
log "💾 Commitando mudanças..."

git add -A 2>/dev/null

if git diff-index --quiet HEAD -- 2>/dev/null; then
  log "✅ Nenhuma mudança para commit"
else
  CHANGED=$(git diff --cached --name-only 2>/dev/null | wc -l)
  log "   📝 $CHANGED arquivo(s) modificado(s)"
  git commit -m "Backup automático — $TIMESTAMP" --quiet
  log "📤 Pushing para GitHub..."
  if timeout 60 git push origin main --quiet 2>/dev/null; then
    log "✅ Push concluído (main)"
  else
    # Se main não existir no remote, cria com força
    timeout 60 git push -u origin HEAD:main --quiet 2>/dev/null && log "✅ Push concluído (main criado)" || fail "Push falhou — verifique credenciais/branch"
  fi
fi

# ─── sumário ─────────────────────────────────────────────────────────────

log ""
log "========================================================"
if [ "$ERRORS" -eq 0 ]; then
  log "✅ Backup finalizado SEM erros"
else
  log "⚠️  Backup finalizado com $ERRORS erro(s) — verifique o log acima"
fi
log "📁 Diretório: $BACKUP_DIR"
log "🔗 Repositório: $REPO_URL"
log "========================================================"

# ─── envio pelo telegram ─────────────────────────────────────────────────

telegram_send_text() {
  local msg="$1"
  curl -s -X POST \
    "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=${msg}" \
    --max-time 30 >/dev/null 2>&1
}

# Só notificar se houver erros
if [ "$ERRORS" -gt 0 ] && [ -n "$TELEGRAM_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
  log ""
  log "📱 Enviando notificação de ERRO pelo Telegram..."

  STATUS_ICON="⚠️"
  STATUS_TEXT="${ERRORS} erro(s) — backup pode estar incompleto"

  # Cria tar.gz do diretório de backup (excluindo .git para não pesar)
  if tar -czf "$TAR_FILE" -C "$(dirname "$BACKUP_DIR")" \
      --exclude="$(basename "$BACKUP_DIR")/.git" \
      "$(basename "$BACKUP_DIR")" 2>/dev/null; then
    TAR_BYTES=$(stat -c%s "$TAR_FILE" 2>/dev/null || echo "0")
    TAR_SIZE=$(du -sh "$TAR_FILE" 2>/dev/null | cut -f1)
    log "   📦 TAR.GZ criado: $TAR_FILE ($TAR_SIZE)"

    if [ "$TAR_BYTES" -gt 52428800 ]; then
      # Arquivo maior que 50MB — envia só mensagem de texto
      log "   ⚠️  TAR.GZ muito grande ($TAR_SIZE > 50MB), enviando só notificação"
      telegram_send_text "${STATUS_ICON} Backup OpenClaw — ${TIMESTAMP}
📦 Arquivo gerado: ${TAR_SIZE} (grande demais para enviar pelo Telegram)
🔗 GitHub: ${REPO_URL}
${STATUS_ICON} ${STATUS_TEXT}"
      rm -f "$TAR_FILE"
    else
      # Envia o arquivo como documento
      CAPTION="${STATUS_ICON} Backup OpenClaw — ${TIMESTAMP}
📦 Tamanho: ${TAR_SIZE}
🔗 GitHub: ${REPO_URL}
${STATUS_ICON} ${STATUS_TEXT}"

      SEND_RESULT=$(curl -s -X POST \
        "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument" \
        -F "chat_id=${TELEGRAM_CHAT_ID}" \
        -F "document=@${TAR_FILE}" \
        -F "caption=${CAPTION}" \
        --max-time 120 2>/dev/null)

      if echo "$SEND_RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); exit(0 if d.get('ok') else 1)" 2>/dev/null; then
        log "   ✅ Arquivo enviado pelo Telegram"
      else
        ERR_MSG=$(echo "$SEND_RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('description','erro desconhecido'))" 2>/dev/null || echo "erro ao parsear resposta")
        fail "Telegram: $ERR_MSG"
        # Tenta enviar ao menos notificação de texto como fallback
        telegram_send_text "❌ Backup OpenClaw — ${TIMESTAMP}
⚠️  Falha ao enviar o arquivo pelo Telegram: ${ERR_MSG}
${STATUS_ICON} ${STATUS_TEXT}
🔗 GitHub: ${REPO_URL}"
      fi

      rm -f "$TAR_FILE"
    fi
  else
    # tar falhou — envia notificação de erro pelo Telegram
    fail "Falha ao criar TAR.GZ do backup"
    telegram_send_text "❌ Backup OpenClaw — ${TIMESTAMP}
⚠️  Falha ao gerar o arquivo TAR.GZ — backup NÃO foi enviado
${STATUS_ICON} ${STATUS_TEXT}
🔗 GitHub: ${REPO_URL}"
  fi
else
  log "   ⏭️  Telegram não configurado, pulando envio"
fi

exit 0
