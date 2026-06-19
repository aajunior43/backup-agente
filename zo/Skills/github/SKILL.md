---
name: github
description: Interage com GitHub usando a `gh` CLI (autenticada como aajunior43). Lista/cria/deleta repositórios, gerencia issues, monitora CI, cria PRs e faz queries avançadas. Use para qualquer tarefa GitHub.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  display-name: GitHub
  emoji: 🐙
---

# 🐙 GitHub Skill

## Configuração atual

- **Usuário**: `aajunior43`
- **Autenticação**: `gh` CLI autenticada com token (escopo completo: repo, workflow, gist, admin:org, etc.)
- **20 repositórios** no GitHub, misto público/privado

## Instalação (se necessário)

```bash
gh auth status  # Verifica se está autenticado
gh auth login   # Login interativo
```

## Scripts

### 📦 `scripts/repo-manager.py` — Gerenciar repositórios

```bash
python3 scripts/repo-manager.py list                    # Lista todos os repos
python3 scripts/repo-manager.py list --limit 50         # Com limite
python3 scripts/repo-manager.py info workspace-backup   # Detalhes: ⭐, 🍴, 🐛, branch
python3 scripts/repo-manager.py create meu-novo-repo    # Cria repo público
python3 scripts/repo-manager.py create meu-repo --private --desc "Descrição"
python3 scripts/repo-manager.py delete repo-antigo      # Deleta (pede confirmação)
python3 scripts/repo-manager.py delete repo-antigo --force  # Sem confirmação
```

### 🐛 `scripts/issue-manager.py` — Gerenciar issues

```bash
python3 scripts/issue-manager.py list aajunior43/workspace-backup              # Issues abertas
python3 scripts/issue-manager.py list aajunior43/workspace-backup --state all  # Todas
python3 scripts/issue-manager.py create aajunior43/workspace-backup --title "Bug: X" --body "Descrição do bug" --label bug
python3 scripts/issue-manager.py view aajunior43/workspace-backup 1            # Lê issue #1
python3 scripts/issue-manager.py close aajunior43/workspace-backup 1           # Fecha issue
```

## Comandos diretos com `gh` CLI

### Pull Requests

```bash
# Listar PRs abertos
gh pr list --repo owner/repo

# Ver status do CI de um PR
gh pr checks 55 --repo owner/repo

# Criar PR
gh pr create --repo owner/repo --title "Título" --body "Descrição" --base main --head minha-branch

# Merge de PR
gh pr merge 55 --repo owner/repo --squash
```

### Workflows / CI

```bash
# Listar workflows
gh workflow list --repo owner/repo

# Listar execuções recentes
gh run list --repo owner/repo --limit 10

# Ver log de um run específico
gh run view <run-id> --repo owner/repo

# Ver apenas steps que falharam
gh run view <run-id> --repo owner/repo --log-failed

# Disparar workflow manualmente
gh workflow run <workflow-name> --repo owner/repo
```

### Releases

```bash
# Listar releases
gh release list --repo owner/repo

# Criar release
gh release create v1.0.0 --repo owner/repo --title "v1.0.0" --notes "Notas da release"
```

### Busca

```bash
# Buscar repositórios
gh search repos "topic:machine-learning language:python" --limit 20

# Buscar issues
gh search issues "bug is:open" --repo owner/repo
```

### Gists

```bash
# Criar gist
gh gist create arquivo.py -d "Descrição"

# Listar gists
gh gist list --limit 10
```

### API Avançada

```bash
# Query GraphQL
gh api graphql -f query='query { viewer { login } }'

# REST API com jq
gh api repos/owner/repo/pulls/55 --jq '.title, .state, .user.login'
gh api repos/owner/repo/issues?state=open --jq '.[] | "\(.number): \(.title)"'
```

## Casos de uso comuns

### Fazer backup do workspace
```bash
cd /home/workspace && git add -A && git commit -m "backup $(date -I)" && git push
```

### Clonar um repo
```bash
gh repo clone owner/repo /home/workspace/repo
```

### Fork + clone rápido
```bash
gh repo fork owner/repo --clone
```

## .gitignore sugerido

```
node_modules/
.env
venv/
__pycache__/
*.aux
*.log
*.out
.DS_Store
Thumbs.db
```

## Repositórios do usuário (aajunior43)

| Nome | Visibilidade | Última atualização |
|------|-------------|-------------------|
| `workspace-backup` | 🌐 Público | 2026-05-15 |
| `CEREBRO_PREFEITURA_INAJA` | 🌐 Público | 2026-05-11 |
| `open-design` | 🌐 Público | 2026-05-07 |
| `openclaw` | 🌐 Público | 2026-05-01 |
| `hermes-agent` | 🌐 Público | 2026-05-01 |
| `renomeador-ia` | 🌐 Público | 2026-04-27 |
| `tri-chat` | 🌐 Público | 2026-04-27 |
| `MEUGITHUB` | 🌐 Público | 2026-04-26 |
| `gerenciador-de-repositorio` | 🌐 Público | 2026-04-21 |
| `Zo-computer` | 🔒 Privado | 2026-05-10 |
| `hermes-backup` | 🔒 Privado | 2026-05-09 |
| `openclaw-backup` | 🔒 Privado | 2026-05-02 |
| `compartilhado` | 🔒 Privado | 2026-04-28 |
| `projetos` | 🔒 Privado | 2026-04-27 |
| `obsidianbackup` | 🔒 Privado | 2026-04-21 |
| `meucofre-vault` | 🔒 Privado | 2026-04-20 |
| `browser-use-custom` | 🔒 Privado | 2026-04-20 |
| `gerador-status` | 🔒 Privado | 2026-04-18 |
| `Tts` | 🔒 Privado | 2026-04-18 |
| `promptfoto` | 🌐 Público | 2026-05-04 |

## Dicas

- Sempre use `--repo owner/repo` quando não estiver dentro de um diretório git
- Para saída estruturada, use `--json` com `--jq`
- O token tem escopo completo — pode criar/deletar repos, gerenciar orgs, etc.
- Para automações, use o script de backup: `Skills/backup-github/scripts/backup.ts`
