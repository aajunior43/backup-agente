# 🔄 Guia de Migração e Restauração Completa

Este guia permite replantar o sistema OpenClaw em outro VPS ou恢复 após desastre.

## 📦 O que está no backup

O repositório contém:

```
openclaw-backup/
├── workspace/              # Personalidade Eva + dados do usuário
│   ├── AGENTS.md           # Regras do workspace
│   ├── MEMORY.md           # Memória curada
│   ├── USER.md             # Perfil do Aleksandro
│   ├── SOUL.md             # Identidade da Eva
│   ├── TOOLS.md            # Configs locais (APIs, dispositivos)
│   ├── IDENTITY.md         # Identidade concisa
│   ├── HEARTBEAT.md        # Checklist de health checks
│   ├── memoria/            # Diários YYYY-MM-DD.md
│   ├── documentos/         # Manuais, receitas, treinos
│   ├── dados/              # JSON: health_tracker, kanban, youtube_channels, heartbeat-state
│   ├── scripts/            # Scripts do usuário
│   ├── skills/             # Skills customizadas (contador-mensal, polymarket-analyst, etc)
│   └── *.json (configs)
│
├── cron/                   # Jobs agendados do OpenClaw
│   └── jobs.json
│
├── agents/                 # Configs dos agentes
│   ├── main/config.json
│   ├── main/.env           # Variáveis (BRAVE_API_KEY, etc) — **RESTAURAR MANUAL**
│   └── ...
│
├── scripts/                # Scripts de automação
│   ├── github-backup.sh    # Este script de backup
│   ├── process_kanban.py
│   └── ...
│
├── openclaw.json           # Config principal do OpenClaw
├── .env.example            # Variáveis de exemplo (não contém secrets reais)
└── RESTORE.md              # Este arquivo
```

**NÃO incluso (por segurança):**
- Sessões WhatsApp (arquivos de autenticação)
- Tokens de API privadas a não ser que tenham sido manualmente colocadas em `.env`
- Arquivos de mídia antigos (>30 dias)

---

## 🚀 Restauração Passo a Passo

### 1. Pré-requisitos no novo VPS

```bash
# Systemd (user units) habilitado
loginctl show-user $USER

# Node.js v22+ instalado
node --version

# Python3 (para alguns scripts)
python3 --version

# git configurado com sua conta
git config user.name "Aleksandro Junior"
git config user.email "seu@email.com"

# rsync instalado
rsync --version
```

### 2. Clone o repositório

```bash
cd ~
git clone https://github.com/aajunior43/openclaw-backup.git openclaw-restore
cd openclaw-restore
```

### 3. Copie os arquivos para o local correto

```bash
# Workspace (Eva, memória, skills personalizadas)
cp -r workspace/* ~/.openclaw/workspace/

# Cron jobs do OpenClaw
cp -r cron/* ~/.openclaw/cron/

# Agentes e configs
cp -r agents/* ~/.openclaw/agents/

# Scripts úteis
mkdir -p ~/scripts
cp -r scripts/* ~/scripts/

# Config principal
cp openclaw.json ~/.openclaw/

# (opcional) Obsidian vault
# cp -r obsidian_vault_backup/* ~/obsidian/vaults/MeuCofre/  # ajuste o caminho
```

### 4. Variáveis de ambiente críticas

O arquivo `agents/main/.env` **não é backupado** por conter secrets. Você precisa recriá-lo manualmente.

Crie `~/.openclaw/agents/main/.env` com:

```bash
BRAVE_API_KEY=sua_chave_aqui
# (outras vars que você usava)
```

**Onde encontrar as chaves:**
- Brave API Key: já documentada em `TOOLS.md` (`BSAnMdJ-PLDu3HpsagpN-CseMs8rStJ`)
- Telegram Bot Token: configurado no canal Telegram
- Outras chaves (OpenAI, Notion, etc): onde você as armazenou originalmente (podem estar em `TOOLS.md` ou `credentials/` parcial)

### 5. Instalação de dependências

```bash
# Instalar skills que usam npm? (se houver package.json)
cd ~/.openclaw/workspace/skills
# para cada skill com package.json:
# npm ci

# Reinstalar Kilo CLI se necessário
npm install -g kilo
```

### 6. Reconfigure canais de mensageria

WhatsApp precisa de reautenticação (QR code):

```bash
openclaw channels login --channel whatsapp --account default
# Escaneie o QR no terminal ou use --qr para mostrar
```

Telegram deve funcionar se o bot token estiver em `openclaw.json` ou canal configurado.

### 7. Reinicie o gateway

```bash
openclaw gateway restart
```

### 8. Verifique tudo

```bash
openclaw status
openclaw cron list
openclaw channels status --probe
```

---

## 🔧 Restauração Parcial

Se só precisar de um arquivo específico:

```bash
# Exemplo: recuperar MEMORY.md
git show main:workspace/MEMORY.md > ~/.openclaw/workspace/MEMORY.md
```

---

## ⚠️ Pontos Críticos

1. **WhatsApp sessions** não são backupadas. Refaça login.
2. **.env do agente** não é backupado. Recrie com suas chaves.
3. Caminhos absolutos no `.env` podem precisar ajuste se a home mudar.
4. Variáveis de ambiente do systemd user podem precisar reconfigurar:
   ```bash
   systemctl --user restart openclaw-gateway
   ```
5. Verifique permissões dos scripts (`chmod +x ~/scripts/*.sh`).

---

## 🧪 Teste de Restauração

Após restaurar, teste:

```bash
# Gateway responde?
openclaw status

# Cron jobs aparecem?
openclaw cron list

# Health tracker funciona?
cat ~/.openclaw/workspace/dados/health_tracker.json

# Envia mensagem de teste?
Eva, teste
```

---

## 📞 Suporte

Se algo dar errado, verifique logs:

```bash
# Gateway
journalctl --user -u openclaw-gateway -f

# Backup (última execução)
tail -f /tmp/github-backup.log

# Cron jobs
openclaw cron list --json | jq .
```

---

**Última atualização do guia:** 2026-03-30  
**Repositório:** https://github.com/aajunior43/openclaw-backup  
**Mantido por:** Eva (para Aleksandro Junior)
