---
name: aposta
description: >
  Analisa jogos esportivos (futebol) para recomendar as melhores apostas.
  Coleta odds de múltiplas casas (bet365, 1xBet, Betano, Betclic, Betnacional, KTO),
  pesquisa histórico, confrontos diretos (H2H), forma recente e calcula value bets
  com modelo estatístico próprio. Gera relatório com recomendações ordenadas por
  expectativa matemática. Use quando o usuário pedir análise de aposta, palpite,
  prognóstico, odds ou previsão de jogo.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  version: 1.0.0
---

# Sports Betting Analyst

Skill para análise profissional de apostas esportivas em jogos de futebol. Combina coleta de odds, pesquisa de estatísticas, confrontos diretos e cálculo de expectativa matemática para gerar recomendações ordenadas por value bet.

## Quando usar

- Usuário pedir "analisar jogo", "palpite", "prognóstico", "melhor aposta"
- Usuário mencionar um jogo específico e pedir recomendação
- Usuário pedir "odds" ou "comparar odds"
- Análise pré-jogo para qualquer competição

## Fluxo de execução

### 1. Coletar dados WEB (obrigatório)

Antes de rodar o script, PESQUISE e extraia dados reais:

#### a) Odds — Use web_search para buscar:
```
"[time casa] vs [time fora] odds apostas [data]"
"[time casa] [time fora] bet365 betano 1xbet oddes"
```
Extraia pelo menos 3 casas de apostas da tabela em `references/houses.md`.

#### b) Estatísticas e H2H — Use web_search ou read_webpage:
```
"[time casa] vs [time fora] confrontos diretos h2h"
"[time casa] forma recente últimos jogos"
"[time fora] retrospecto gols marcados sofridos"
```
Fontes: FlashScore, Soccerway, FBref, FootyStats.

#### c) Notícias — Lesões, escalações, contexto:
```
"[time casa] escalação lesões [data]"
"[time[j--[body]]"
```

### 2. Rodar o script

Salve os dados coletados em arquivos JSON temporários e execute:

```bash
bun Skills/aposta/scripts/betting-analyst.ts \
  --match "Time A x Time B" \
  --date "DD/MM/YYYY HH:MM" \
  --competition "Nome da Competição" \
  --odds-file /tmp/odds.json \
  --stats-file /tmp/stats.json
```

### 3. Formato dos JSON de entrada

**odds.json** — Array de objetos:
```json
[
  { "house": "bet365", "home": 1.75, "draw": 3.60, "away": 4.50 },
  { "house": "1xBet", "home": 1.80, "draw": 3.50, "away": 4.80 }
]
```

**stats.json** — Objeto único:
```json
{
  "homeGoalsScored": 12,
  "homeGoalsConceded": 5,
  "awayGoalsScored": 8,
  "awayGoalsConceded": 10,
  "homeForm": ["W", "W", "D", "L", "W"],
  "awayForm": ["L", "D", "W", "L", "L"],
  "h2h": { "home": 4, "draw": 2, "away": 1 }
}
```
Forma: W=vitória, D=empate, L=derrota (mais recente primeiro).

### 4. Interpretar e apresentar o resultado

O script gera um relatório estruturado. Apresente ao usuário:

1. **Odds comparativas** em tabela (mínimo 5 casas)
2. **Probabilidades estimadas** pelo modelo
3. **Estatísticas resumidas** (gols, forma, H2H)
4. **Recomendações ordenadas** por confiança
5. **Melhor odd** para cada mercado identificado

O modelo usa:
- Expected Goals (xG) estimado via forma e gols recentes
- Ajuste por confronto direto (peso 20%)
- Detecção de value bet (diferença prob implícita vs estimada)
- Rating Elo simplificado

## Casas de apostas

Ver lista completa e URLs em `references/houses.md`.

## Avisos importantes

- Sempre incluir disclaimer de responsabilidade apostas são risco
- Se dados forem insuficientes, declare "dados limitados"
- Nunca invente odds sempre extraia da web
- Value positivo = aposta teoricamente lucrativa a longo prazo
