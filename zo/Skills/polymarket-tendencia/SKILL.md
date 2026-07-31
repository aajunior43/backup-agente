---
name: polymarket-tendencia
description: Busca os mercados mais apostados no Polymarket (Gamma API) e gera um relatório em português sobre as tendências e possíveis acontecimentos mundiais.
compatibility: Zo Computer — Bun + TypeScript
metadata:
  author: aleksandro.zo.computer
---

# Polymarket Tendência Global

Usa a [Gamma API](https://gamma-api.polymarket.com) (sem autenticação) para buscar os mercados com maior volume de apostas nas últimas 24h e gera um relatório analítico sobre os possíveis acontecimentos mundiais.

## Como usar

```bash
bun run Skills/polymarket-tendencia/scripts/tendencia.ts
```

Gera um relatório em `Relatorios/Polymarket/polymarket-tendencia-<data>.md` e mostra no terminal.

### Opções

- `--save` — também salva o relatório em PDF na mesma pasta
