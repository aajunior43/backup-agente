# backup-agente

Repositório central de backup para múltiplos agentes/sistemas de IA que atuam no workspace de Aleksandro.

Cada agente mantém seus próprios arquivos dentro de sua pasta designada. **Nunca mexa em arquivos fora da sua pasta.**

## Estrutura

```
/
├── AGENTS.md          ← Este arquivo — instruções para qualquer IA que backup aqui
├── zo/                ← Backup do Zo Computer (workspace principal)
├── openclaw/          ← Backup do OpenClaw / Claude Code
├── hermes/            ← Backup do Hermes Agent
└── odysseu/           ← Backup do Odysseu
```

## Regras para qualquer IA que fizer backup aqui

1. **Só mexa na sua própria pasta.** Cada agente tem uma pasta designada. Não crie, mova, edite ou apague arquivos fora dela.
2. **Mantenha o `.gitignore` atualizado** na sua pasta para não subir arquivos desnecessários (node_modules/, .env, __pycache__/, etc.).
3. **Commits com mensagens claras** — descreva brevemente o que mudou.
4. **Não force push** na branch principal sem necessidade.
5. **AGENTS.md não deve ser alterado** por nenhum agente individual — se precisar de ajustes, peça ao usuário.

## Pastas dos agentes

### `zo/`
Backup completo do workspace `/home/workspace` do Zo Computer. Inclui Prefeitura/, Skills/, saude/, financeiro/, projetos/, etc.
- Script de backup: `Skills/backup-github/scripts/backup.ts`
- Agendado via Zo Computer Automations

### `openclaw/`
Backup dos dados, configurações e estado do OpenClaw/Claude Code.

### `hermes/`
Backup dos dados, configurações, skills, documentos e estado do Hermes Agent.

### `odysseu/`
Backup dos dados, configurações e estado do Odysseu.

---
📅 Backup gerenciado por Zo Computer. Para dúvidas: aajunior43@gmail.com
