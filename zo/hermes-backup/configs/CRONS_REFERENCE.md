# 🕐 Cron Jobs — Referência Completa (NÃO ATIVADOS)

> **Aviso:** Todas as configurações abaixo foram importadas do backup OpenClaw/Hermes
> **Status:** APENAS DOCUMENTADAS — nenhuma foi ativada no sistema atual

---

## 📊 Resumo dos Crons Encontrados

### Crons do Sistema (crontab)

| Schedule | Comando | Descrição | Origem |
|----------|---------|-----------|--------|
| `0 3 * * *` | `/home/administrator/scripts/github-backup.sh` | Backup GitHub automático | crontab_user.txt |

### Crons do Hermes (ativas)

| Schedule | Comando | Descrição | Status |
|----------|---------|-----------|--------|
| `every 2h` | `versioned_backup.sh` | Backup versionado do Hermes para GitHub | ✅ ATIVO |

### Crons do OpenClaw (Eva)

| ID | Nome | Schedule | Status |
|----|------|----------|--------|
| `105800ef-*` | GitHub Backup | every 3h | ok |
| `ab4d2702-*` | Commit Automático OpenClaw | `0 */4 * * *` | ok |
| `sites-health-check-*` | Sites Health Check | `0 */4 * * *` | ok |
| `auto-dream-001` | Auto-Dream Memory | `0 4,16 * * *` | ok |
| `e6f7b45c-*` | Inteligência Polymarket | `0 7 * * *` | ok |
| `be80e3d5-*` | Auto-Melhoria Eva | `0 9 * * *` | ok |
| `apostas-diario-*` | Análise de Apostas | `0 10 * * *` | error |
| `maintenance-weekly-*` | Manutenção Semanal | `0 6 * * 1` | ok |

### Scripts com Função de Cron

| Script | Função | Frequência Esperada |
|--------|--------|---------------------|
| `github-backup.sh` | Backup GitHub (rsync + git push) | 3h / diário |
| `youtube_check.sh` | Monitora canais YouTube via RSS | Configurável |
| `create_daily_memory.js` | Cria diário memory/YYYY-MM-DD.md | 00:01 BRT |
| `daily_health_report.js` | Relatório diário de saúde | Diário |
| `comprehensive-backup.sh` | Backup completo do sistema | Diário |
| `sites-monitor.js` | Monitoramento de sites | 4h |
| `fix_cron_jobs.mjs` | Verifica e corrige crons quebrados | Sob demanda |
| `cron_runner.sh` | Runner para análise de apostas | Diário 10:00 |

---

## 📁 Configurações Detalhadas

### 1. GitHub Backup (Sistema)

**Arquivo:** `scripts/github-backup.sh`  
**Crontab:** `0 3 * * *` (03:00 da manhã)  
**Destino:** `github.com/aajunior43/openclaw-backup`

```bash
# O que faz:
- rsync sem --delete (modo preservação)
- git pull + rebase antes do push
- git push sem -f
- Cobre: meucofre-vault, workspace, projetos, .hermes, system
```

**Token:** `~/.github_backup_env` (perm 600)

---

### 2. GitHub Backup (OpenClaw — every 3h)

**ID:** `105800ef-bbd6-4492-b5c8-aba4a10f4f01`  
**Schedule:** `every 3h`  
**Modelo:** `minimax/MiniMax-M2.7`

---

### 3. Commit Automático OpenClaw

**ID:** `ab4d2702-bb3e-4286-9b9c-b9a4e3c2ec10`  
**Schedule:** `0 */4 * * *` (a cada 4 horas)  
**Descrição:** Faz commit automático das mudanças no workspace

---

### 4. Sites Health Check

**ID:** `sites-health-check-6x-1776645460`  
**Schedule:** `0 */4 * * *` (a cada 4 horas)  
**Descrição:** Verifica se os sites estão online e notifica se houver queda

**Portas monitoradas:**
- 3010 → Linktree
- 3011 → Calculadoras
- 3012 → Dashboards
- 3013 → Ferramentas
- 3014 → Kanban-UI
- 3015 → Saúde
- 3017 → Blogs

---

### 5. Auto-Dream Memory

**ID:** `auto-dream-001`  
**Schedule:** `0 4,16 * * *` (às 04:00 e 16:00 BRT)  
**Descrição:** Processa memórias e gera insights automáticos

---

### 6. Inteligência Polymarket

**ID:** `e6f7b45c-1405-4439-9c34-b1dc944aacca`  
**Schedule:** `0 7 * * *` (às 07:00 BRT)  
**Descrição:** Gera relatório diário de mercados de previsão Polymarket

---

### 7. Auto-Melhoria Eva

**ID:** `be80e3d5-535f-4265-851e-dab882297452`  
**Schedule:** `0 9 * * *` (às 09:00 BRT)  
**Descrição:** Executa melhorias automáticas no sistema e skills

---

### 8. Análise de Apostas

**ID:** `apostas-diario-0730-1776643847`  
**Schedule:** `0 10 * * *` (às 10:00 BRT)  
**Status:** error (com problemas)  
**Descrição:** Analisa jogos do dia e gera palpites

---

### 9. Manutenção Semanal

**ID:** `maintenance-weekly-cleanup`  
**Schedule:** `0 6 * * 1` (segundas às 06:00 BRT)  
**Descrição:** Limpeza e manutenção semanal do sistema

---

### 10. YouTube Monitor

**Arquivo:** `scripts/youtube_check.sh`  
**Função:** Monitora canais via RSS e envia no Telegram  
**State:** `/workspace/dados/youtube_channels.json`

**Canais monitorados (exemplo):**
- Rato Borrachudo
- Outros canais configurados no JSON

---

### 11. Create Daily Memory

**Arquivo:** `scripts/create_daily_memory.js`  
**Schedule:** `0 1 * * *` (00:01 BRT / 03:01 UTC)  
**Descrição:** Cria arquivo `memory/YYYY-MM-DD.md` com template padrão

---

### 12. Daily Health Report

**Arquivo:** `scripts/daily_health_report.js`  
**Schedule:** Diário (hora configurável)  
**Descrição:** Gera relatório de saúde baseado em `health_tracker.json`

---

## 📖 Dashboard JSON

**Arquivo:** `workspace/dados/dashboard_cron_jobs.json`

```json
{
    "1772288643887": {
        "name": "Backup Diário",
        "schedule": "0 0 * * *",
        "command": "openclaw backup",
        "description": "Backup automático diário",
        "enabled": true,
        "created_at": "2026-02-28T14:24:03.887973"
    }
}
```

---

## 🛠️ Como Ativar (quando você quiser)

### Opção 1: Crontab do Sistema
```bash
# Editar crontab
crontab -e

# Adicionar linha (exemplo: backup às 3h da manhã)
0 3 * * * /opt/data/workspace/scripts/github-backup.sh >> /tmp/github-backup.log 2>&1
```

### Opção 2: Hermes Cron Job
```bash
# Usar a ferramenta cronjob do Hermes
cronjob action='create' name='GitHub Backup' schedule='every 3h' prompt='Execute backup...'
```

### Opção 3: Scripts Manuais
```bash
# Rodar manualmente quando quiser
bash /opt/data/workspace/scripts/github-backup.sh
node /opt/data/workspace/scripts/create_daily_memory.js
```

---

## ⚠️ Observações Importantes

1. **Nenhum cron foi ativado** — esta é apenas uma referência
2. Alguns scripts precisam de **ajustes de path** (estavam em `/home/administrator/`, agora são `/opt/data/`)
3. O script de **Análise de Apostas** estava com **erro** no backup
4. Tokens e chaves API já estão configurados no `/opt/data/.env`
5. Sempre **perguntar antes de ativar** rotinas automáticas — conforme sua preferência

---

*Última atualização: 2026-05-09*  
*Importado de: openclaw-backup (branch main)*
