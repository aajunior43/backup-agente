#!/bin/bash
# Health Check para Sites - Verifica e restura sites se necessário
# Executado 6x ao dia (a cada 4 horas)

LOG_FILE="/tmp/sites-health.log"
SITES_DIR="$HOME/.openclaw/workspace/sites"
GATEWAY_PORT="3000"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

check_site() {
    local name=$1
    local port=$2
    local path=$3
    
    # Check if port is listening
    if lsof -i :$port >/dev/null 2>&1; then
        # Try HTTP request
        if curl -s --max-time 5 "http://localhost:$port/" | grep -q "DOCTYPE\|html"; then
            log "✅ $name (porta $port) - OK"
            return 0
        else
            log "⚠️ $name (porta $port) - HTTP Erro, reiniciando..."
            restart_site "$name" "$port" "$path"
            return 1
        fi
    else
        log "❌ $name (porta $port) - NÃO está rodando, iniciando..."
        start_site "$name" "$port" "$path"
        return 1
    fi
}

restart_site() {
    local name=$1
    local port=$2
    local path=$3
    
    # Kill existing
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        kill $pid 2>/dev/null
        sleep 2
    fi
    
    # Start fresh
    start_site "$name" "$port" "$path"
}

start_site() {
    local name=$1
    local port=$2
    local path=$3
    
    if [ -f "$path/server.js" ]; then
        cd "$path"
        nohup node server.js > "/tmp/${name// /_}.log" 2>&1 &
        sleep 2
        if lsof -i :$port >/dev/null 2>&1; then
            log "✅ $name iniciado na porta $port"
        else
            log "❌ Falha ao iniciar $name"
        fi
    else
        log "❌ server.js não encontrado em $path"
    fi
}

log "========== INICIANDO HEALTH CHECK =========="

# Verificar sites conhecidos
check_site "Manual da Biblia" 3016 "$SITES_DIR/blogs/manual-biblia"
check_site "Manual do Nerd" 3021 "$SITES_DIR/blogs/manual-do-nerd"

# Verificar gateway via pgrep (OpenClaw roda como processo de usuário)
if pgrep -f "openclaw-gateway" >/dev/null 2>&1; then
    log "✅ OpenClaw Gateway - OK"
else
    log "❌ OpenClaw Gateway não está rodando"
fi

log "========== HEALTH CHECK FINALIZADO =========="
