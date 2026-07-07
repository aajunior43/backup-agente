# 🤖 Hermes Backup

Repositório privado de backup das configurações, dados, skills e documentos do Hermes Agent.

## 📁 Estrutura

```
hermes-backup/
├── dados/              # Dados estruturados (JSON, CSV)
│   ├── financeiro.json
│   ├── health_tracker.json
│   ├── orcamento-inaja-2026-despesas.csv
│   └── ...
├── documentos/         # Documentos organizados
│   ├── prefeitura/
│   ├── financeiro/
│   ├── saude/
│   └── estudos/
├── skills/             # Skills customizadas
├── scripts/            # Scripts de automação
├── configs/            # Configurações e referências
│   └── CRONS_REFERENCE.md
├── memorias/           # Memórias importadas
│   └── MEMORY_IMPORT.md
└── README.md
```

## 🔐 Segurança

- Este repositório é **PRIVADO**
- Credenciais (tokens, API keys) **NÃO** devem ser commitadas em texto claro
- Use variáveis de ambiente ou o arquivo `.env` local (ignorado pelo Git)

## 🔄 Última atualização

2026-05-09 — Importação completa do backup OpenClaw/Hermes
