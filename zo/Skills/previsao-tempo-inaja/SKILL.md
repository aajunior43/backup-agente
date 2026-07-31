---
name: previsao-tempo-inaja
description: >
  Previsão do tempo completa para Inajá/PR via API Open-Meteo (gratuita, sem chave).
  Usar sempre que o usuário pedir clima, temperatura, chuva, umidade, vento ou qualquer
  informação meteorológica de Inajá. Gera resposta em texto direto, JSON ou HTML interativo
  com gráficos — o script `previsao.ts` faz a busca, cache e formatação.
compatibility: Criado para Zo Computer
metadata:
  author: aleksandro.zo.computer
  display-name: 🌤️ Previsão do Tempo - Inajá
  version: "2.0"
  tags: [clima, tempo, previsão, inajá, open-meteo]
---

# Previsão do Tempo — Inajá/PR

Skill completa de meteorologia para Inajá, Paraná. Usa a API gratuita Open-Meteo (sem chave),
com cache local, retry automático, alertas de chuva/tempestade e saída em texto, JSON ou HTML.

## Coordenadas padrão

| Cidade | Latitude | Longitude | Fuso |
|--------|----------|-----------|------|
| Inajá, PR | -22.7758 | -51.9011 | America/Sao_Paulo |

Para outra cidade, use as variáveis de ambiente:

```bash
export PREVISAO_LAT=-23.5505
export PREVISAO_LON=-46.6333
export PREVISAO_TZ="America/Sao_Paulo"
export PREVISAO_CIDADE="São Paulo"
```

---

## Script principal

`file 'Skills/previsao-tempo-inaja/scripts/previsao.ts'` — busca a API e exibe a previsão.

```bash
# ajuda
bun run Skills/previsao-tempo-inaja/scripts/previsao.ts --help

# texto
bun run Skills/previsao-tempo-inaja/scripts/previsao.ts          # completo: agora + 24h + 7 dias
bun run Skills/previsao-tempo-inaja/scripts/previsao.ts --hoje   # só hoje
bun run Skills/previsao-tempo-inaja/scripts/previsao.ts --amanha # só amanhã
bun run Skills/previsao-tempo-inaja/scripts/previsao.ts --hora   # próximas 24h

# JSON
bun run Skills/previsao-tempo-inaja/scripts/previsao.ts --json
bun run Skills/previsao-tempo-inaja/scripts/previsao.ts --json --output previsao.json

# HTML
bun run Skills/previsao-tempo-inaja/scripts/previsao.ts --html
bun run Skills/previsao-tempo-inaja/scripts/previsao.ts --html --output /tmp/previsao.html

# número de dias (1-16)
bun run Skills/previsao-tempo-inaja/scripts/previsao.ts --dias 10
```

---

## Funcionalidades

- **Dados atuais**: temperatura, sensação térmica, umidade, vento (km/h + direção cardinal), pressão, UV, visibilidade, precipitação.
- **Previsão horária**: próximas 24h com temperatura, probabilidade de chuva, ícone WMO e vento.
- **Previsão diária**: até 16 dias com máxima/mínima, chuva acumulada, probabilidade de chuva, vento máximo, UV, nascer/pôr do sol.
- **Alertas automáticos**: destaca chuva forte, tempestades, granizo, ventos fortes e dias com alta probabilidade de precipitação.
- **Cache**: reutiliza dados por 10 minutos para evitar chamadas repetidas à API.
- **Retry**: até 3 tentativas com timeout de 10s.
- **HTML interativo**: dark mode, glassmorphism, gráfico de temperatura/precipitação, estrelas animadas e responsivo.

---

## API Open-Meteo — Endpoint

```
https://api.open-meteo.com/v1/forecast
  ?latitude=-22.7758&longitude=-51.9011
  &timezone=America%2FSao_Paulo
  &current=temperature_2m,relative_humidity_2m,apparent_temperature,
            precipitation,weather_code,wind_speed_10m,wind_direction_10m,
            surface_pressure,uv_index,visibility
  &hourly=temperature_2m,precipitation_probability,precipitation,weather_code,
           wind_speed_10m,relative_humidity_2m
  &daily=weather_code,temperature_2m_max,temperature_2m_min,
          precipitation_sum,precipitation_probability_max,
          wind_speed_10m_max,uv_index_max,sunrise,sunset
  &forecast_days=8
  &wind_speed_unit=kmh
  &precipitation_unit=mm
```

---

## Códigos WMO → descrição em português

```
 0 — ☀️ Céu limpo
 1 — 🌤️ Principalmente limpo
 2 — ⛅ Parcialmente nublado
 3 — ☁️ Nublado
45 — 🌫️ Neblina
48 — 🌫️ Geada com neblina
51 — 🌦️ Garoa leve
53 — 🌦️ Garoa moderada
55 — 🌧️ Garoa intensa
61 — 🌧️ Chuva leve
63 — 🌧️ Chuva moderada
65 — 🌧️ Chuva forte
80 — 🌦️ Pancadas de chuva leve
81 — 🌧️ Pancadas de chuva moderada
82 — ⛈️ Pancadas de chuva forte
95 — ⛈️ Tempestade
96 — ⛈️ Tempestade com granizo
99 — 🌩️ Tempestade forte com granizo
```

---

## Direção do vento (graus → cardeal)

| Graus | Direção |
|-------|---------|
| 0° | Norte (N) |
| 23–67° | Nordeste (NE) |
| 68–112° | Leste (L) |
| 113–157° | Sudeste (SE) |
| 158–202° | Sul (S) |
| 203–247° | Sudoeste (SO) |
| 248–292° | Oeste (O) |
| 293–337° | Noroeste (NO) |
| 338–360° | Norte (N) |

---

## Índice UV — classificação

| UV | Classificação |
|----|-------------|
| 0–2 | Baixo |
| 3–5 | Moderado |
| 6–7 | Alto |
| 8–10 | Muito alto |
| 11+ | Extremo |

---

## Saídas suportadas

### Texto (padrão)
Resposta direta no terminal, ideal para o assistente relatar ao usuário.

### JSON (`--json`)
Objeto completo com `atual`, `horaria`, `diaria`, `alertas`, `meta`.

### HTML (`--html`)
Relatório visual salvo em `Skills/previsao-tempo-inaja/outputs/tempo-inaja-{data}.html`
(ou caminho customizado com `--output`).

#### Design do HTML

- **Tema:** dark mode, fundo gradiente azul-noite com estrelas animadas (JS).
- **Fonte:** Google Fonts — Syne (títulos) + DM Mono (dados).
- **Cards:** glassmorphism (`backdrop-filter: blur` + borda sutil).
- **Cores por condição:**
  - Sol → `#f5a623` (âmbar)
  - Chuva → `#4fc3f7` (azul claro)
  - Tempestade → `#7c4dff` (violeta)
  - Nublado → `#90a4ae` (cinza azulado)
- **Responsivo:** mobile-first.
- **Gráfico:** linha de temperatura máxima/mínima + barras de precipitação em Canvas.
- **Rodapé:** "Fonte: Open-Meteo | Atualizado em: {data/hora}".

---

## Quando usar

Sempre que o usuário perguntar sobre:

- "Vai chover?"
- "Qual a previsão do tempo?"
- "Qual a temperatura em Inajá?"
- "Vento/umidade/UV em Inajá"
- "Clima para amanhã"

Execute o script com a flag apropriada e resuma os pontos principais para o usuário,
destacando alertas de chuva ou tempestade quando existirem.

---

## Checklist antes de entregar

- [ ] API chamada com todos os parâmetros necessários.
- [ ] WMO → descrição em português + ícone.
- [ ] Vento em km/h com direção cardinal.
- [ ] UV com classificação (baixo, moderado, alto…).
- [ ] Probabilidade de chuva exibida.
- [ ] Alertas destacados quando houver chuva forte, tempestade ou granizo.
- [ ] Cache respeitado (10 minutos) e retry automático.
- [ ] HTML com gráfico e previsão horária (quando solicitado).
