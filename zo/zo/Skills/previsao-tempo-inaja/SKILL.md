---
name: previsao-tempo-inaja
description: >
  Previsão do tempo completa para Inajá/PR via API Open-Meteo (gratuita, sem chave).
  Usar sempre que o usuário pedir clima, temperatura, chuva, umidade, vento ou qualquer
  informação meteorológica de Inajá. Gera resposta em texto direto ou HTML interativo
  com gráficos — o script `previsao.ts` faz a busca e formata a saída.
compatibility: Criado para Zo Computer
metadata:
  author: aleksandro.zo.computer
---

# Previsão do Tempo — Inajá/PR

Skill completa de meteorologia para Inajá, Paraná. Usa a API gratuita Open-Meteo (sem chave).

## Coordenadas

| Cidade | Latitude | Longitude | Fuso |
|--------|----------|-----------|------|
| Inajá, PR | -22.7758 | -51.9011 | America/Sao_Paulo |

---

## Script principal

`file 'Skills/previsao-tempo-inaja/scripts/previsao.ts'` — busca a API e exibe a previsão.

```bash
bun run Skills/previsao-tempo-inaja/scripts/previsao.ts          # texto completo (hoje + 7 dias)
bun run Skills/previsao-tempo-inaja/scripts/previsao.ts --hoje   # só hoje
bun run Skills/previsao-tempo-inaja/scripts/previsao.ts --amanha # só amanhã
bun run Skills/previsao-tempo-inaja/scripts/previsao.ts --html   # gera HTML interativo
```

---

## API Open-Meteo — Endpoint

```
https://api.open-meteo.com/v1/forecast
  ?latitude=-22.7758&longitude=-51.9011
  &timezone=America%2FSao_Paulo
  &current=temperature_2m,relative_humidity_2m,apparent_temperature,
            precipitation,weather_code,wind_speed_10m,wind_direction_10m,
            surface_pressure,uv_index,visibility
  &hourly=temperature_2m,precipitation_probability,weather_code,
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

## Quando gerar HTML

Se o usuário pedir HTML, app visual, gráfico ou previsão detalhada:

1. Execute `bun run Skills/previsao-tempo-inaja/scripts/previsao.ts --html`
2. O script salva em `Skills/previsao-tempo-inaja/outputs/tempo-inaja-{data}.html`
3. Informe o usuário do caminho

### Design do HTML (obrigatório)

- **Tema:** dark mode, fundo gradiente azul-noite com estrelas animadas (JS)
- **Fonte:** Google Fonts — Syne (títulos) + DM Mono (dados)
- **Cards:** glassmorphism (`backdrop-filter: blur` + borda sutil)
- **Cores por condição:**
  - Sol → `#f5a623` (âmbar)
  - Chuva → `#4fc3f7` (azul claro)
  - Tempestade → `#7c4dff` (violeta)
  - Nublado → `#90a4ae` (cinza azulado)
- **Responsivo:** mobile-first
- **Loading state:** spinner animado
- **Error state:** mensagem amigável

### Estrutura do HTML

1. **Painel atual (hero)** — temperatura + sensação, ícone WMO, umidade, vento (direção cardinal), pressão, UV (com classificação), visibilidade
2. **Previsão horária (24h)** — cards com scroll horizontal, hora, ícone, temp, prob. chuva
3. **Previsão 7 dias** — cards: dia, ícone, máx/mín, chuva acum., prob. chuva, vento máx
4. **Gráfico de temperatura (Canvas)** — linha máx/mín + barras de precipitação
5. **Rodapé** — "Fonte: Open-Meteo | Atualizado em: {data/hora}"

---

## Resposta em texto direto

Quando o usuário pedir apenas a previsão (sem HTML), execute o script com `--hoje`, `--amanha` ou sem flag e apresente o resultado formatado.

---

## Checklist antes de entregar

- [ ] API chamada com todos os parâmetros
- [ ] WMO → descrição em português + ícone
- [ ] Vento em km/h com direção cardinal
- [ ] UV com classificação (baixo, moderado, alto…)
- [ ] Loading/error states (no HTML)
- [ ] Design dark glassmorphism + estrelas animadas (no HTML)
