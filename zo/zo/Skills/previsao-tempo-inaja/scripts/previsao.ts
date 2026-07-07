#!/usr/bin/env bun
/**
 * Previsão do Tempo — Inajá/PR
 * Busca dados da Open-Meteo e exibe em texto ou HTML.
 *
 * Uso:
 *   bun run scripts/previsao.ts           — texto completo (hoje + 7 dias)
 *   bun run scripts/previsao.ts --hoje    — só hoje
 *   bun run scripts/previsao.ts --amanha  — só amanhã
 *   bun run scripts/previsao.ts --html    — gera HTML interativo
 */

// --- Constantes ---
const LAT = -22.7758;
const LON = -51.9011;
const TIMEZONE = "America/Sao_Paulo";

const WMO: Record<number, { label: string; icon: string }> = {
  0: { label: "Céu limpo", icon: "☀️" },
  1: { label: "Principalmente limpo", icon: "🌤️" },
  2: { label: "Parcialmente nublado", icon: "⛅" },
  3: { label: "Nublado", icon: "☁️" },
  45: { label: "Neblina", icon: "🌫️" },
  48: { label: "Geada com neblina", icon: "🌫️" },
  51: { label: "Garoa leve", icon: "🌦️" },
  53: { label: "Garoa moderada", icon: "🌦️" },
  55: { label: "Garoa intensa", icon: "🌧️" },
  61: { label: "Chuva leve", icon: "🌧️" },
  63: { label: "Chuva moderada", icon: "🌧️" },
  65: { label: "Chuva forte", icon: "🌧️" },
  80: { label: "Pancadas de chuva leve", icon: "🌦️" },
  81: { label: "Pancadas de chuva moderada", icon: "🌧️" },
  82: { label: "Pancadas de chuva forte", icon: "⛈️" },
  95: { label: "Tempestade", icon: "⛈️" },
  96: { label: "Tempestade com granizo", icon: "⛈️" },
  99: { label: "Tempestade forte com granizo", icon: "🌩️" },
};

function wmoInfo(code: number): { label: string; icon: string } {
  return WMO[code] ?? { label: "Desconhecido", icon: "❓" };
}

function windDir(deg: number): string {
  if (deg < 23 || deg >= 338) return "Norte (N)";
  if (deg < 68) return "Nordeste (NE)";
  if (deg < 113) return "Leste (L)";
  if (deg < 158) return "Sudeste (SE)";
  if (deg < 203) return "Sul (S)";
  if (deg < 248) return "Sudoeste (SO)";
  if (deg < 293) return "Oeste (O)";
  return "Noroeste (NO)";
}

function uvClass(u: number): string {
  if (u < 3) return "Baixo";
  if (u < 6) return "Moderado";
  if (u < 8) return "Alto";
  if (u < 11) return "Muito alto";
  return "Extremo";
}

function diaSemana(d: Date): string {
  const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return dias[d.getDay()];
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${diaSemana(dt)}, ${d.toString().padStart(2, "0")}/${m.toString().padStart(2, "0")}`;
}

// --- API ---
async function fetchData() {
  const params = new URLSearchParams({
    latitude: String(LAT),
    longitude: String(LON),
    timezone: TIMEZONE,
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index,visibility",
    hourly:
      "temperature_2m,precipitation_probability,weather_code,wind_speed_10m,relative_humidity_2m",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset",
    forecast_days: "8",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// --- Saída texto ---
function outputText(data: any, filtro?: string) {
  const c = data.current;
  const curWmo = wmoInfo(c.weather_code);

  if (!filtro || filtro === "hoje") {
    console.log(`📍 Inajá/PR — Hoje, ${new Date().toLocaleDateString("pt-BR")}`);
    console.log(`   ${curWmo.icon} ${curWmo.label}`);
    console.log(`   🌡️ ${c.temperature_2m}°C (sensação ${c.apparent_temperature}°C)`);
    console.log(`   💧 Umidade: ${c.relative_humidity_2m}%`);
    console.log(`   🌬️ Vento: ${c.wind_speed_10m} km/h (${windDir(c.wind_direction_10m)})`);
    console.log(`   ☔ Precipitação: ${c.precipitation} mm`);
    console.log(`   🔵 Pressão: ${c.surface_pressure} hPa`);
    console.log(`   ☀️ UV: ${c.uv_index} (${uvClass(c.uv_index)})`);
    console.log(`   👁️ Visibilidade: ${(c.visibility / 1000).toFixed(1)} km`);
    console.log("");
  }

  const daily = data.daily;
  for (let i = 0; i < daily.time.length; i++) {
    if (filtro === "hoje" && i > 0) break;
    if (filtro === "amanha" && i !== 1) continue;

    const d = daily;
    const w = wmoInfo(d.weather_code[i]);
    console.log(
      `${w.icon} ${formatDate(d.time[i])}  ` +
        ` ${w.label}  ` +
        `🌡️ ${d.temperature_2m_min[i]}°C ~ ${d.temperature_2m_max[i]}°C  ` +
        `☔ ${d.precipitation_sum[i]}mm (${d.precipitation_probability_max[i]}%)  ` +
        `🌬️ ${d.wind_speed_10m_max[i]} km/h  ` +
        `☀️ UV ${d.uv_index_max[i]} (${uvClass(d.uv_index_max[i])})`
    );
  }
}

// --- Saída HTML ---
function outputHTML(data: any): string {
  const c = data.current;
  const curWmo = wmoInfo(c.weather_code);
  const daily = data.daily;

  const dailyCards = daily.time
    .map((_: string, i: number) => {
      const w = wmoInfo(daily.weather_code[i]);
      return `
      <div class="card">
        <div class="dia">${formatDate(daily.time[i])}</div>
        <div class="icone">${w.icon}</div>
        <div class="cond">${w.label}</div>
        <div class="temp">${daily.temperature_2m_min[i]}° / ${daily.temperature_2m_max[i]}°</div>
        <div class="detalhe">💧 ${daily.precipitation_sum[i]}mm (${daily.precipitation_probability_max[i]}%)</div>
        <div class="detalhe">🌬️ ${daily.wind_speed_10m_max[i]} km/h</div>
        <div class="detalhe">☀️ UV ${daily.uv_index_max[i]}</div>
      </div>`;
    })
    .join("\n");

  const agora = new Date().toLocaleString("pt-BR", { timeZone: TIMEZONE });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Previsão do Tempo — Inajá/PR</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@500;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'DM Mono', monospace;
    background: linear-gradient(135deg, #0b1a2e 0%, #1a3a5c 50%, #2a5f8f 100%);
    color: #e8edf5;
    min-height: 100vh;
    padding: 20px;
    position: relative;
    overflow-x: hidden;
  }
  #stars {
    position: fixed; inset: 0; z-index: 0;
    pointer-events: none;
  }
  .container {
    max-width: 960px; margin: 0 auto; position: relative; z-index: 1;
  }
  h1 {
    font-family: 'Syne', sans-serif;
    font-size: 1.8rem;
    text-align: center;
    margin-bottom: 4px;
  }
  .sub { text-align: center; color: #94a3b8; font-size: 0.85rem; margin-bottom: 24px; }
  .hero {
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 20px;
    padding: 28px;
    margin-bottom: 24px;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px 24px;
    align-items: center;
  }
  .hero-icone { font-size: 4rem; grid-row: span 2; }
  .hero-temp { font-family: 'Syne', sans-serif; font-size: 3.2rem; font-weight: 700; }
  .hero-cond { font-size: 1.1rem; color: #cbd5e1; }
  .hero-grid {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 12px;
    margin-top: 12px;
  }
  .hero-item {
    background: rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 12px;
    text-align: center;
    font-size: 0.85rem;
  }
  .hero-item .val { font-size: 1.2rem; font-weight: 500; color: #f1f5f9; }
  .hero-item .lab { color: #94a3b8; font-size: 0.75rem; }
  .section-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.1rem;
    margin: 20px 0 12px;
    color: #cbd5e1;
  }
  .daily-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 12px;
  }
  .card {
    background: rgba(255,255,255,0.06);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 16px 12px;
    text-align: center;
    transition: transform 0.2s;
  }
  .card:hover { transform: translateY(-3px); }
  .card .dia { font-size: 0.8rem; color: #94a3b8; margin-bottom: 4px; }
  .card .icone { font-size: 2rem; margin: 6px 0; }
  .card .cond { font-size: 0.75rem; color: #cbd5e1; margin-bottom: 6px; }
  .card .temp { font-family: 'Syne', sans-serif; font-size: 1.2rem; }
  .card .detalhe { font-size: 0.75rem; color: #94a3b8; margin-top: 3px; }
  footer {
    text-align: center;
    color: #64748b;
    font-size: 0.75rem;
    margin-top: 32px;
    padding: 16px;
  }
  @media (max-width: 600px) {
    body { padding: 12px; }
    h1 { font-size: 1.3rem; }
    .hero { padding: 16px; gap: 8px; }
    .hero-temp { font-size: 2.5rem; }
    .daily-grid { grid-template-columns: repeat(2, 1fr); }
  }
</style>
</head>
<body>
<canvas id="stars"></canvas>
<div class="container">
  <h1>🌤️ Inajá/PR</h1>
  <div class="sub">Previsão do Tempo</div>

  <div class="hero">
    <div class="hero-icone">${curWmo.icon}</div>
    <div class="hero-temp">${c.temperature_2m}°C</div>
    <div class="hero-cond">${curWmo.label} • Sensação ${c.apparent_temperature}°C</div>
    <div class="hero-grid">
      <div class="hero-item"><div class="val">${c.relative_humidity_2m}%</div><div class="lab">Umidade</div></div>
      <div class="hero-item"><div class="val">${c.wind_speed_10m} km/h</div><div class="lab">Vento (${windDir(c.wind_direction_10m)})</div></div>
      <div class="hero-item"><div class="val">${c.surface_pressure} hPa</div><div class="lab">Pressão</div></div>
      <div class="hero-item"><div class="val">${c.uv_index}</div><div class="lab">UV • ${uvClass(c.uv_index)}</div></div>
      <div class="hero-item"><div class="val">${(c.visibility / 1000).toFixed(1)} km</div><div class="lab">Visibilidade</div></div>
    </div>
  </div>

  <div class="section-title">📅 Próximos 7 dias</div>
  <div class="daily-grid">${dailyCards}</div>

  <footer>
    Fonte: Open-Meteo • Atualizado em ${agora}
  </footer>
</div>
<script>
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random(),
      s: Math.random() * 0.005 + 0.002,
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const st of stars) {
      st.a += st.s;
      const alpha = 0.3 + 0.7 * Math.abs(Math.sin(st.a));
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fillStyle = \`rgba(255,255,255,\${alpha})\`;
      ctx.fill();
    }
    requestAnimationFrame(animate);
  }
  animate();
</script>
</body>
</html>`;
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2);
  const isHtml = args.includes("--html");
  const isHoje = args.includes("--hoje");
  const isAmanha = args.includes("--amanha");

  try {
    const data = await fetchData();

    if (isHtml) {
      const html = outputHTML(data);
      const hoje = new Date().toISOString().slice(0, 10);
      const outDir = "/home/workspace/Skills/previsao-tempo-inaja/outputs";
      const outPath = `${outDir}/tempo-inaja-${hoje}.html`;
      await Bun.write(outPath, html);
      console.log(`✅ HTML gerado: ${outPath}`);
    } else {
      let filtro: string | undefined;
      if (isHoje) filtro = "hoje";
      else if (isAmanha) filtro = "amanha";
      outputText(data, filtro);
    }
  } catch (e: any) {
    console.error("❌ Erro ao buscar previsão:", e.message);
    process.exit(1);
  }
}

main();
