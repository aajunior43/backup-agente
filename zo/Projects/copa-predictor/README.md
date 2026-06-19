# 🏆 Preditor da Copa do Mundo 2026

Fórmula baseada em dados que estima a chance de cada seleção ser campeã, com simulação **Monte Carlo** (10.000 Copas).

## A fórmula: Team Power Index (TPI)

Cada seleção recebe um TPI = média ponderada de 6 métricas normalizadas (0–1):

```
TPI = 0.25·FIFA + 0.20·Forma + 0.15·Elenco + 0.15·Copa + 0.10·Saldo + 0.15·ELO
```

| Componente | Peso | O que mede |
|---|---|---|
| **FIFA** | 25% | Pontos no ranking da FIFA (jun/2026) |
| **Forma** | 20% | Vitórias nos últimos 10 jogos |
| **Elenco** | 15% | Valor de mercado do elenco (€M) |
| **Copa** | 15% | Histórico: títulos×15 + semis×5 + quartas×2 |
| **Saldo** | 10% | Saldo de gols nos últimos 20 jogos |
| **ELO** | 15% | Força relativa (proxy do FIFA) |

## Probabilidade de vitória em uma partida

Estilo **ELO** com fator de empate:

```
expected_A  = 1 / (1 + 10^((TPI_B − TPI_A) × 10))
p_draw      = max(0.10, 0.24 − |TPI_A − TPI_B| × 0.4)   (fase de grupos)
p_draw      = max(0.10, 0.18 − |TPI_A − TPI_B| × 0.4)   (mata-mata)
p_A         = (1 − p_draw) × expected_A
p_B         = (1 − p_draw) × (1 − expected_A)
```

Em mata-mata, empate vai para pênaltis (50/50).

## A simulação

1. Sorteia os 3 jogos de cada grupo das 12 chaves
2. Ordena por pontos → saldo → gols pró → vitórias
3. Pega os 2 primeiros de cada grupo + 8 melhores terceiros (32 no total)
4. Roda o mata-mata: R32 → R16 → QF → SF → Final
5. Repete **10.000 vezes** e conta a frequência de cada título

## Como rodar

```bash
cd Projects/copa-predictor
python3 predict.py
```

Resultado sai na tela e em `resultado.txt`.

## Como ajustar

- Pesos: altere as constantes `W_FIFA`, `W_FORM`, `W_VALOR`, `W_WC`, `W_GD`, `W_ELO`
- Dados das seleções: edite o dicionário `TEAMS` no topo de `predict.py`
- Nº de simulações: altere `N_SIMS`

## Resultado mais recente (10.000 simulações)

| # | Seleção     | TPI    | % Título |
|---|-------------|--------|----------|
| 1 | França 🇫🇷  | 0.8612 | 34.84%   |
| 2 | Argentina 🇦🇷 | 0.8429 | 24.27%   |
| 3 | Espanha 🇪🇸 | 0.8385 | 23.06%   |
| 4 | Inglaterra 🏴 | 0.8037 | 10.52%   |
| 5 | Brasil 🇧🇷  | 0.7764 |  5.36%   |
| 6 | Alemanha 🇩🇪 | 0.6921 |  0.83%   |
| 7 | Portugal 🇵🇹 | 0.6862 |  0.74%   |

**Caminho do Brasil:**
- 🏆 Campeão: 5.36%
- 🥈 Vice: 12.98%
- 4️⃣ Semifinal: 23.88%
- 4️⃣ Quartas: 23.41%
- 8️⃣ R16: 19.01%
- ❌ Cai no R32: 15.36%

## Limitações

- Dados de FIFA points e forma recente são estimativas jun/2026
- Critérios de desempate da Copa (sorteio, fair play) não implementados
- Bracket do R32 é aleatório (a FIFA segue um critério fixo, mas o efeito é pequeno)
- Não considera lesões, suspensão de jogadores, etc.
