#!/usr/bin/env bash
set -euo pipefail

HOST="${VPS_HOST_ALIAS:-vps-campinas}"
PASS_FILE="${VPS_PASS_FILE:-/root/.ssh/.vps_senha}"

ssh_base() {
  if command -v sshpass >/dev/null 2>&1 && [ -f "$PASS_FILE" ]; then
    sshpass -f "$PASS_FILE" ssh "$HOST" "$@"
  else
    ssh "$HOST" "$@"
  fi
}

remote() {
  ssh_base "bash -lc $(printf '%q' "$1")"
}

usage() {
  cat <<'EOF'
Uso: vps.sh <comando> [args]

Comandos:
  status              Resumo do servidor
  docker              Containers, imagens e uso do Docker
  logs <container>    Últimas 120 linhas de logs de um container
  updates             Atualizações pendentes
  security            Checagens básicas de segurança
  clean-dry           Mostra cache/itens Docker limpáveis, sem apagar
  exec <comando>      Executa comando remoto
EOF
}

case "${1:-}" in
  status)
    remote '
      set -e
      echo "== Sistema ==";
      hostnamectl 2>/dev/null || true;
      echo;
      echo "== Uptime ==";
      uptime;
      echo;
      echo "== Memória ==";
      free -h;
      echo;
      echo "== Disco ==";
      df -h /;
      echo;
      echo "== Portas principais ==";
      ss -tulpn | sed -n "1,40p";
      echo;
      echo "== Docker ==";
      docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker indisponível";
    '
    ;;
  docker)
    remote '
      set -e
      echo "== Containers ==";
      docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}";
      echo;
      echo "== Imagens ==";
      docker images;
      echo;
      echo "== Uso Docker ==";
      docker system df;
    '
    ;;
  logs)
    container="${2:-}"
    if [ -z "$container" ]; then
      echo "Informe o container. Exemplo: vps.sh logs traefik" >&2
      exit 2
    fi
    remote "docker logs --tail 120 ${container@Q} 2>&1"
    ;;
  updates)
    remote '
      set -e
      apt update >/dev/null;
      apt list --upgradable 2>/dev/null | sed -n "1,80p";
    '
    ;;
  security)
    remote '
      set -e
      echo "== SSH ==";
      sshd -T 2>/dev/null | grep -E "^(port|permitrootlogin|passwordauthentication|pubkeyauthentication) " || true;
      echo;
      echo "== Firewall ==";
      ufw status 2>/dev/null || echo "ufw não instalado/indisponível";
      echo;
      echo "== Fail2ban ==";
      systemctl is-active fail2ban 2>/dev/null || true;
      fail2ban-client status 2>/dev/null || true;
      echo;
      echo "== Logins recentes ==";
      last -n 10 || true;
    '
    ;;
  clean-dry)
    remote '
      set -e
      echo "== Uso atual Docker ==";
      docker system df;
      echo;
      echo "== Build cache limpável (prévia) ==";
      docker builder prune --dry-run 2>/dev/null || true;
    '
    ;;
  exec)
    shift
    if [ "$#" -eq 0 ]; then
      echo "Informe o comando remoto. Exemplo: vps.sh exec \"uptime\"" >&2
      exit 2
    fi
    remote "$*"
    ;;
  ""|-h|--help|help)
    usage
    ;;
  *)
    echo "Comando desconhecido: $1" >&2
    usage >&2
    exit 2
    ;;
esac
