---
name: weather-inaja
description: >
  Pesquisador completo de previsão do tempo para Inajá, PR. Gera um app HTML interativo
  e visual com dados em tempo real via API Open-Meteo (gratuita, sem chave). Use esta skill
  sempre que o usuário pedir previsão do tempo, clima, temperatura, chuva, umidade, vento
  ou qualquer informação meteorológica relacionada a Inajá PR — mesmo frases como
  "como vai estar o tempo amanhã em Inajá", "vai chover esta semana", "temperatura agora
  em Inajá". Gera sempre um arquivo HTML completo, visual e funcional que pode ser aberto
  no navegador.
---

# Weather Inajá PR — Skill

Cria um app HTML completo de previsão do tempo para Inajá-PR usando a API Open-Meteo (gratuita, sem autenticação).

## Coordenadas fixas
- **Cidade:** Inajá, Paraná, Brasil
- **Latitude:** -22.7758
- **Longitude:** -51.9011
- **Timezone:** America/Sao_Paulo

---

## API Open-Meteo — Endpoint e parâmetros

```
https://api.open-meteo.com/v1/forecast
  ?latitude=-22.7758
  &longitude=-51.9011
  &timezone=America%2FSao_Paulo
  &current=temperature_2m,relative_humidity_2m,apparent_temperature,
            precipitation,weather_code,wind_speed_10m,wind_direction_10m,
            surface_pressure,uv_index,visibility
  &hourly=temperature_2m,precipitation_probability,weather_code,
           wind_speed_10m,relative_humidity_2m
  &daily=weather_code,temperature_2m_max,temperature_2m_min,
          precipitation_sum,precipitation_probability_max,
          wind_speed_10m_max,uv_index_max,sunrise,sunset
  &forecast_days=7
  &wind_speed_unit=kmh
  &precipitation_unit=mm
```

Nenhuma chave de API é necessária. A resposta é JSON com os campos `current`, `hourly` e `daily`.

---

## WMO Weather Codes → descrição em português

```js
const WMO = {
  0: { label: 'Céu limpo', icon: '☀️' },
  1: { label: 'Principalmente limpo', icon: '🌤️' },
  2: { label: 'Parcialmente nublado', icon: '⛅' },
  3: { label: 'Nublado', icon: '☁️' },
  45: { label: 'Neblina', icon: '🌫️' },
  48: { label: 'Geada com neblina', icon: '🌫️' },
  51: { label: 'Garoa leve', icon: '🌦️' },
  53: { label: 'Garoa moderada', icon: '🌦️' },
  55: { label: 'Garoa intensa', icon: '🌧️' },
  61: { label: 'Chuva leve', icon: '🌧️' },
  63: { label: 'Chuva moderada', icon: '🌧️' },
  65: { label: 'Chuva forte', icon: '🌧️' },
  80: { label: 'Pancadas de chuva', icon: '🌦️' },
  81: { label: 'Pancadas moderadas', icon: '🌧️' },
  82: { label: 'Pancadas fortes', icon: '⛈️' },
  95: { label: 'Tempestade', icon: '⛈️' },
  96: { label: 'Tempestade com granizo', icon: '⛈️' },
  99: { label: 'Tempestade forte', icon: '🌩️' },
};
```

---

## Estrutura obrigatória do app HTML

O arquivo deve conter em um único `.html`:

### 1. Painel atual (hero)
- Temperatura atual + sensação térmica
- Ícone + descrição do tempo (WMO)
- Umidade relativa, vento (velocidade + direção), pressão, UV, visibilidade

### 2. Previsão horária (próximas 24h)
- Cards horizontais com scroll
- Hora, ícone, temperatura, prob. de chuva

### 3. Previsão 7 dias
- Tabela/cards com: dia da semana, ícone, máx/mín, chuva acumulada, prob. chuva, vento máx

### 4. Gráfico de temperatura (canvas)
- Linha de temperatura máx e mín dos 7 dias
- Barras de precipitação
- Use Canvas API nativo (sem libs externas pesadas)

### 5. Rodapé
- Fonte: Open-Meteo | Última atualização: horário da requisição

---

## Design obrigatório

- **Tema:** dark mode, tons de azul-escuro a azul-noite
- **Fonte:** Google Fonts — Syne (títulos) + DM Mono (dados)
- **Fundo:** gradiente animado de céu noturno com estrelas geradas por JS
- **Cards:** glassmorphism (backdrop-filter: blur + borda sutil)
- **Cores por condição:**
  - Sol → `#f5a623` (âmbar)
  - Chuva → `#4fc3f7` (azul claro)
  - Tempestade → `#7c4dff` (violeta)
  - Nublado → `#90a4ae` (cinza azulado)
- **Responsivo:** funciona em mobile e desktop
- **Loading state:** spinner animado enquanto carrega a API
- **Error state:** mensagem amigável se a API falhar

---

## Código JS — estrutura mínima

```js
const LAT = -22.7758, LON = -51.9011;

async function fetchWeather() {
  showLoading();
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&timezone=America%2FSao_Paulo&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index,visibility&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset&forecast_days=7&wind_speed_unit=kmh&precipitation_unit=mm`;
    const res = await fetch(url);
    const data = await res.json();
    renderAll(data);
  } catch(e) {
    showError('Não foi possível carregar os dados. Verifique sua conexão.');
  }
}

function renderAll(data) {
  renderCurrent(data.current);
  renderHourly(data.hourly);
  renderDaily(data.daily);
  renderChart(data.daily);
  hideLoading();
}
```

---

## Instruções de entrega

1. Gere um **único arquivo `.html`** completo e funcional
2. Salve em `/mnt/user-data/outputs/tempo-inaja.html`
3. Use `present_files` para entregar ao usuário
4. O arquivo deve funcionar ao ser aberto diretamente no navegador (sem servidor)
5. Não use bibliotecas externas exceto Google Fonts e, opcionalmente, Chart.js via CDN do cdnjs.cloudflare.com

---

## Checklist antes de entregar

- [ ] API Open-Meteo chamada corretamente com todos os parâmetros
- [ ] WMO codes mapeados para ícones + descrição em português
- [ ] Temperatura atual, sensação, umidade, vento, UV e pressão exibidos
- [ ] Cards horários (24h) com scroll horizontal
- [ ] Cards de 7 dias com máx/mín, chuva e vento
- [ ] Gráfico de temperatura e precipitação
- [ ] Loading e error states implementados
- [ ] Design dark glassmorphism com estrelas animadas
- [ ] Responsivo (mobile-first)
- [ ] Rodapé com fonte e hora da atualização
