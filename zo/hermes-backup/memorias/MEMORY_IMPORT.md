# Memórias Importadas do OpenClaw Backup

## Memórias Operacionais do Hermes (Maio/2026)

### Pasta Compartilhada
- Hermes+Eva: /compartilhado/ (repo Git)
- Estrutura: aleksandro/ (saude/, financeiro/, compras/, veiculos/), prefeitura/ (dotacoes/, oficios/, capel/, contratos/, docs/), contatos/, lembretes/, sites-config/

### Finanças Pessoais
- Salário: R$5.000. Meta poupar: R$2.000/mês
- Contas maio/2026 (venc 10/05): Inter R$750, Nubank R$405, Faculdades R$306, Guarda Noturno R$60, Tio R$88, Prima gasolina R$100, Ar cond R$170, Bike R$100 (última!), Jabá R$124,40
- TOTAL: R$2.103,40
- Fonte: ~/workspace/dados/financeiro.json

### Infraestrutura VPS
- VPS Database Mart: NAT 192.168.122.4→93.127.136.225
- Sem Cloudflare
- read_file limite 500 linhas → usar sed/python
- browser_navigate falha (AppArmor) → usar python3 http.server + curl
- OpenClaw (Eva): modelo MiniMax-M2.7, gateway porta 18789

### Formato Telegram
- Sem tabelas grandes (quebram no Telegram)
- Usar bullet points • ou emojis
- Seções separadas por ---
- Valores em **negrito**
- Evitar blocos de texto longos

### Backup GitHub
- Repo: github.com/aajunior43/openclaw-backup
- Scripts: ~/scripts/github-backup-adaptado.sh + run-github-backup.sh
- Cron a cada 6h
- Token: ~/.github_backup_env (perm 600)
- Cobre: meucofre-vault, workspace, projetos, .hermes, system
- MODO PRESERVAÇÃO: rsync sem --delete, git push sem -f, pull+rebase antes push

### Orçamento Inajá-PR
- Arquivo: ~/workspace/dados/orcamento-inaja-2026-despesas.csv (548 linhas, separador `;`)
- Créditos suplementares via DECRETO (Lei 1359/2025)
- CNPJ: 76.459.687/0001-40
- Prefeito: João Eder Aguiar
- Reserva Contingência: 99.099/9.999, R$300k (Ordinários Livres)
- Combustível educação = ND 3.3.90.30 em 10.002/2.105
- 3 ofícios CI em ~/workspace/dados/: 020, 021, 023
- **REGRA:** Ao pesquisar dotações, procurar APENAS no arquivo local CSV. NÃO buscar na internet.

### Preferências de Comportamento
- Junior prefere que eu teste e corrija automaticamente (bugs, scripts, paths)
- Fluxo: criar teste → analisar → corrigir → re-testar
- **PORÉM:** NUNCA criar cron jobs ou automações agendadas sem permissão explícita
- Sempre perguntar antes de ativar rotinas automáticas
