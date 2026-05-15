---
name: backup-github
description: Faz backup periódico de todo o workspace (/home/workspace) para um repositório GitHub. Cria o repositório se não existir, gerencia .gitignore, commita e faz push automático.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  category: Automation
  display-name: 🔄 GitHub Backup Automático
  emoji: 🔄
---

# GitHub Backup Automático

## Propósito

Sincroniza todo o workspace (`/home/workspace`) com um repositório no GitHub automaticamente, em intervalos regulares. Útil para:

- Backup automático de todos os arquivos
- Histórico de versões (poder voltar no tempo)
- Acesso aos arquivos de qualquer lugar via GitHub

## Como configurar pela primeira vez

A skill já está pronta. Só precisa rodar o script de setup uma vez:

```bash
bun /home/workspace/Skills/backup-github/scripts/setup.ts
```

Esse script:
1. Cria o repositório `workspace-backup` no GitHub (se não existir)
2. Inicializa o git em `/home/workspace` (se não existir)
3. Cria um `.gitignore` com exclusões sensatas
4. Dá o primeiro commit + push
5. Pronto — as automações seguintes são só `commit && push`

## .gitignore padrão

A skill já cria um `.gitignore` que exclui:
- `node_modules/`, `Trash/`
- `.env`, arquivos de ambiente
- PDFs > 10 MB, imagens > 5 MB
- Cache do navegador e logs internos do Zo

## Agenda recomendada

| Frequência | Ideal para |
|------------|-----------|
| Diária (00:00) | Uso normal — backup noturno |
| A cada 6h | Uso intenso com alterações frequentes |

## Como agendar o backup automático

Use o script com a flag `--schedule`:

```bash
bun /home/workspace/Skills/backup-github/scripts/backup.ts --schedule
```

Isso abre o seletor de frequência no chat. Ou crie manualmente um agente agendado com a instrução:

> Rode `bun /home/workspace/Skills/backup-github/scripts/backup.ts` e me informe se houve alterações enviadas.

## Comandos

```bash
# Setup inicial (uma vez)
bun /home/workspace/Skills/backup-github/scripts/setup.ts

# Forçar backup agora
bun /home/workspace/Skills/backup-github/scripts/backup.ts

# Ver status do repositório
bun /home/workspace/Skills/backup-github/scripts/backup.ts --status
```
