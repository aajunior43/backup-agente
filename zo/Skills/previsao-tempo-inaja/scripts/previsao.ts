#!/usr/bin/env bun
/**
 * Previsão do tempo para Inajá/PR via Open-Meteo.
 * Saídas: texto, JSON ou HTML. Com cache, retry e alertas.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

// ─── Configuração ───────────────────────────────────────────────────────────

const CONFIG = {
  lat: process.env.PREVISAO_LAT || "-22.7758",
  lon: process.env.PREVISAO_LON || "-51.9011",
  tz: process.env.PREVISAO_TZ || "America/Sao_Paulo",
  cidade: process.env.PREVISAO_CIDADE || "Inajá/PR",
  diasDefault: 7,
  cacheMinutos: 10,
  timeoutMs: 10_000,
  retries: 3,
};

const CACHE_DIR = join(homedir(), ".cache", "previsao-tempo-inaja");
const CACHE_FILE = join(CACHE_DIR, "cache.json");
const OUTPUT_DIR = join(
  import.meta.dir,
  "..",
  "outputs"
);

// ─── WMO → descrição + ícone + cor ──────────────────────────────────────────

interface WmoInfo {
  icon: string;
  label: string;
  color: string;
}

const WMO: Record<number, WmoInfo> = {
  0: { icon: "☀️", label: "Céu limpo", color: "#f5a623" },
  1: { icon: "🌤️", label: "Principalmente limpo", color: "#f5a623" },
  2: { icon: "⛅", label: "Parcialmente nublado", color: "#90a4ae" },
  3: { icon: "☁️", label: "Nublado", color: "#90a4ae" },
  45: { icon: "🌫️", label: "Neblina", color: "#b0bec5" },
  48: { icon: "🌫️", label: "Geada com neblina", color: "#b0bec5" },
  51: { icon: "🌦️", label: "Garoa leve", color: "#4fc3f7" },
  53: { icon: "🌦️", label: "Garoa moderada", color: "#4fc3f7" },
  55: { icon: "🌧️", label: "Garoa intensa", color: "#4fc3f7" },
  56: { icon: "🌧️", label: "Garoa congelante leve", color: "#4fc3f7" },
  57: { icon: "🌧️", label: "Garoa congelante intensa", color: "#4fc3f7" },
  61: { icon: "🌧️", label: "Chuva leve", color: "#4fc3f7" },
  63: { icon: "🌧️", label: "Chuva moderada", color: "#4fc3f7" },
  65: { icon: "🌧️", label: "Chuva forte", color: "#2196f3" },
  66: { icon: "🌧️", label: "Chuva congelante leve", color: "#2196f3" },
  67: { icon: "🌧️", label: "Chuva congelante forte", color: "#2196f3" },
  71: { icon: "🌨️", label: "Neve leve", color: "#90caf9" },
  73: { icon: "🌨️", label: "Neve moderada", color: "#90caf9" },
  75: { icon: "🌨️", label: "Neve intensa", color: "#90caf9" },
  77: { icon: "🌨️", label: "Grãos de neve", color: "#90caf9" },
  80: { icon: "🌦️", label: "Pancadas de chuva leve", color: "#4fc3f7" },
  81: { icon: "🌧️", label: "Pancadas de chuva moderada", color: "#4fc3f7" },
  82: { icon: "⛈️", label: "Pancadas de chuva forte", color: "#7c4dff" },
  85: { icon: "🌨️", label: "Pancadas de neve leve", color: "#90caf9" },
  86: { icon: "🌨️", label: "Pancadas de neve forte", color: "#90caf9" },
  95: { icon: "⛈️", label: "Tempestade", color: "#7c4dff" },
  96: { icon: "⛈️", label: "Tempestade com granizo leve", color: "#7c4dff" },
  99: { icon: "🌩️", label: "Tempestade forte com granizo", color: "#7c4dff" },
};

function wmo(code: number): WmoInfo {
  return WMO[code] || { icon: "❓", label: "Desconhecido", color: "#9e9e9e" };
}

// ─── Utilitários ────────────────────────────────────────────────────────────

function cardinal(deg: number): string {
  const d = ((deg % 360) + 360) % 360;
  if (d >= 338 || d < 23) return "N";
  if (d < 68) return "NE";
  if (d < 113) return "L";
  if (d < 158) return "SE";
  if (d < 203) return "S";
  if (d < 248) return "SO";
  if (d < 293) return "O";
  if (d < 338) return "NO";
  return "N";
}

function uvClass(uv: number): string {
  if (uv <= 2) return "Baixo";
  if (uv <= 5) return "Moderado";
  if (uv <= 7) return "Alto";
  if (uv <= 10) return "Muito alto";
  return "Extremo";
}

function fmtDateTime(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    timeZone: CONFIG.tz,
    ...opts,
  });
}

function fmtDate(iso: string): string {
  return fmtDateTime(iso, { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtTime(iso: string): string {
  return fmtDateTime(iso, { hour: "2-digit", minute: "2-digit" });
}

function fmtHour(iso: string): string {
  return fmtDateTime(iso, { hour: "2-digit", minute: "2-digit", hour12: false });
}

function diaSemana(iso: string): string {
  const d = new Date(iso);
  const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return dias[d.getDay()];
}

function round(n: number, digits = 1): number {
  return Math.round(n * 10 ** digits) / 10 ** digits;
}

// ─── Tipos da API ───────────────────────────────────────────────────────────

interface Current {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  surface_pressure: number;
  uv_index: number;
  visibility: number;
}

interface Hourly {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  precipitation: number[];
  weather_code: number[];
  wind_speed_10m: number[];
  relative_humidity_2m: number[];
}

interface Daily {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
  uv_index_max: number[];
  sunrise: string[];
  sunset: string[];
}

interface ForecastData {
  current: Current;
  hourly: Hourly;
  daily: Daily;
  meta: { fetchedAt: string; cached?: boolean };
}

// ─── Cache ──────────────────────────────────────────────────────────────────

function cachePath(): string {
  mkdirSync(CACHE_DIR, { recursive: true });
  return CACHE_FILE;
}

function cacheKey(dias: number): string {
  return `${CONFIG.lat}_${CONFIG.lon}_${CONFIG.tz}_${dias}`;
}

function readCache(dias: number): ForecastData | null {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const raw = JSON.parse(readFileSync(CACHE_FILE, "utf8"));
    const entry = raw[cacheKey(dias)];
    if (!entry) return null;
    const ageMin = (Date.now() - entry.ts) / 60_000;
    if (ageMin > CONFIG.cacheMinutos) return null;
    return { ...entry.data, meta: { ...entry.data.meta, cached: true } };
  } catch {
    return null;
  }
}

function writeCache(dias: number, data: ForecastData): void {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    let raw: Record<string, any> = {};
    if (existsSync(CACHE_FILE)) raw = JSON.parse(readFileSync(CACHE_FILE, "utf8"));
    raw[cacheKey(dias)] = { ts: Date.now(), data };
    writeFileSync(CACHE_FILE, JSON.stringify(raw, null, 2));
  } catch {
    // falha silenciosa no cache
  }
}

// ─── Fetch com retry e timeout ──────────────────────────────────────────────

async function fetchWithRetry(url: string, retries = CONFIG.retries): Promise<any> {
  let lastErr: Error | undefined;
  for (let i = 0; i < retries; i++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), CONFIG.timeoutMs);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err as Error;
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastErr || new Error("Falha ao buscar dados da API Open-Meteo");
}

async function fetchForecast(dias: number): Promise<ForecastData> {
  const cached = readCache(dias);
  if (cached) return cached;

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", CONFIG.lat);
  url.searchParams.set("longitude", CONFIG.lon);
  url.searchParams.set("timezone", CONFIG.tz);
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index,visibility");
  url.searchParams.set("hourly", "temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,relative_humidity_2m");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset");
  url.searchParams.set("forecast_days", String(dias + 1));
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("precipitation_unit", "mm");
  url.searchParams.set("timeformat", "iso8601");

  const json = await fetchWithRetry(url.toString());

  const data: ForecastData = {
    current: json.current as Current,
    hourly: json.hourly as Hourly,
    daily: json.daily as Daily,
    meta: { fetchedAt: new Date().toISOString() },
  };

  writeCache(dias, data);
  return data;
}

// ─── Alertas ────────────────────────────────────────────────────────────────

interface Alerta {
  nivel: "info" | "warn" | "danger";
  icon: string;
  text: string;
}

function gerarAlertas(data: ForecastData): Alerta[] {
  const alertas: Alerta[] = [];
  const code = data.current.weather_code;
  const w = wmo(code);

  if ([82, 95, 96, 99].includes(code)) {
    alertas.push({ nivel: "danger", icon: w.icon, text: `${w.label} agora. Tome cuidado.` });
  } else if ([61, 63, 65, 80, 81].includes(code) && data.current.precipitation > 0) {
    alertas.push({ nivel: "warn", icon: w.icon, text: `${w.label} no momento.` });
  }

  if (data.current.wind_speed_10m >= 50) {
    alertas.push({ nivel: "danger", icon: "💨", text: `Vento forte: ${round(data.current.wind_speed_10m)} km/h.` });
  } else if (data.current.wind_speed_10m >= 30) {
    alertas.push({ nivel: "warn", icon: "💨", text: `Vento moderado: ${round(data.current.wind_speed_10m)} km/h.` });
  }

  const proximasChuvas = data.hourly.time
    .map((t, i) => ({ t, p: data.hourly.precipitation_probability[i], code: data.hourly.weather_code[i] }))
    .filter((h, i) => i < 24 && h.p >= 60);

  if (proximasChuvas.length > 0) {
    const horarios = proximasChuvas.map((h) => fmtHour(h.t)).join(", ");
    alertas.push({ nivel: "warn", icon: "🌧️", text: `Alta chance de chuva nas próximas horas: ${horarios}.` });
  }

  const diasChuva = data.daily.time
    .map((t, i) => ({
      t,
      prob: data.daily.precipitation_probability_max[i],
      mm: data.daily.precipitation_sum[i],
      code: data.daily.weather_code[i],
    }))
    .filter((d, i) => i > 0 && (d.prob >= 70 || d.mm >= 10 || [82, 95, 96, 99].includes(d.code)));

  if (diasChuva.length > 0) {
    const lista = diasChuva.map((d) => `${diaSemana(d.t)} (${fmtDate(d.t)})`).join(", ");
    alertas.push({ nivel: "info", icon: "☔", text: `Chuva esperada em: ${lista}.` });
  }

  return alertas;
}

// ─── Saída texto ────────────────────────────────────────────────────────────

function outputCurrent(data: ForecastData): string {
  const c = data.current;
  const w = wmo(c.weather_code);
  const lines = [
    `📍 ${CONFIG.cidade} — Agora (${fmtHour(c.time)})`,
    `   ${w.icon} ${w.label}`,
    `   🌡️ ${round(c.temperature_2m)}°C (sensação ${round(c.apparent_temperature)}°C)`,
    `   💧 Umidade: ${c.relative_humidity_2m}%`,
    `   🌬️ Vento: ${round(c.wind_speed_10m)} km/h (${cardinal(c.wind_direction_10m)})`,
    `   ☔ Precipitação: ${round(c.precipitation)} mm`,
    `   🔵 Pressão: ${round(c.surface_pressure)} hPa`,
    `   ☀️ UV: ${round(c.uv_index)} (${uvClass(c.uv_index)})`,
    `   👁️ Visibilidade: ${round(c.visibility)} km`,
  ];
  return lines.join("\n");
}

function outputHourly(data: ForecastData, limit = 24): string {
  const lines = ["\n🕐 Próximas horas:"];
  for (let i = 0; i < Math.min(limit, data.hourly.time.length); i++) {
    const t = data.hourly.time[i];
    const temp = round(data.hourly.temperature_2m[i]);
    const prob = data.hourly.precipitation_probability[i];
    const w = wmo(data.hourly.weather_code[i]);
    lines.push(`   ${fmtHour(t)}  ${w.icon} ${temp.toString().padStart(4)}°C  💧${data.hourly.relative_humidity_2m[i]}%  ☔${prob}%  🌬️${round(data.hourly.wind_speed_10m[i])} km/h`);
  }
  return lines.join("\n");
}

function outputDaily(data: ForecastData, start = 0, end?: number): string {
  const lines = ["\n📅 Previsão dos próximos dias:"];
  const max = end ?? data.daily.time.length;
  for (let i = start; i < Math.min(max, data.daily.time.length); i++) {
    const t = data.daily.time[i];
    const w = wmo(data.daily.weather_code[i]);
    const maxT = round(data.daily.temperature_2m_max[i]);
    const minT = round(data.daily.temperature_2m_min[i]);
    const rain = round(data.daily.precipitation_sum[i]);
    const prob = data.daily.precipitation_probability_max[i];
    const wind = round(data.daily.wind_speed_10m_max[i]);
    const uv = round(data.daily.uv_index_max[i]);
    const label = i === 0 ? "Hoje" : diaSemana(t);
    lines.push(
      `   ${label}, ${fmtDate(t)}   ${w.icon} ${w.label.padEnd(22)} 🌡️ ${minT}°C ~ ${maxT}°C  ☔ ${rain}mm (${prob}%)  🌬️ ${wind} km/h  ☀️ UV ${uv} (${uvClass(uv)})`
    );
  }
  return lines.join("\n");
}

function outputAlerts(alertas: Alerta[]): string {
  if (alertas.length === 0) return "";
  const lines = ["\n⚠️ Alertas:"];
  for (const a of alertas) {
    const prefix = a.nivel === "danger" ? "🔴" : a.nivel === "warn" ? "🟡" : "🔵";
    lines.push(`   ${prefix} ${a.icon} ${a.text}`);
  }
  return lines.join("\n");
}

function outputText(data: ForecastData, modo: "completo" | "hoje" | "amanha" | "hora"): string {
  const alertas = gerarAlertas(data);
  let out = "";

  if (modo === "hoje") {
    out = outputCurrent(data) + outputDaily(data, 0, 1) + outputAlerts(alertas);
  } else if (modo === "amanha") {
    const c = data.current;
    out = `📍 ${CONFIG.cidade} — Amanhã\n` + outputDaily(data, 1, 2) + outputAlerts(alertas);
  } else if (modo === "hora") {
    out = outputCurrent(data) + outputHourly(data, 24) + outputAlerts(alertas);
  } else {
    out = outputCurrent(data) + outputHourly(data, 24) + outputDaily(data, 0, CONFIG.diasDefault + 1) + outputAlerts(alertas);
  }

  const fonte = data.meta.cached ? "(cache)" : "";
  return `${out}\n\nFonte: Open-Meteo ${fonte} | Atualizado: ${fmtDateTime(data.meta.fetchedAt)}`.trim();
}

// ─── Saída JSON ─────────────────────────────────────────────────────────────

function buildJson(data: ForecastData): object {
  const horaria = data.hourly.time.slice(0, 24).map((t, i) => ({
    hora: fmtHour(t),
    temperatura: round(data.hourly.temperature_2m[i]),
    sensacao: null,
    umidade: data.hourly.relative_humidity_2m[i],
    precipitacao_mm: round(data.hourly.precipitation[i]),
    probabilidade_chuva: data.hourly.precipitation_probability[i],
    vento_kmh: round(data.hourly.wind_speed_10m[i]),
    codigo_wmo: data.hourly.weather_code[i],
    descricao: wmo(data.hourly.weather_code[i]).label,
    icone: wmo(data.hourly.weather_code[i]).icon,
  }));

  const diaria = data.daily.time.map((t, i) => ({
    data: fmtDate(t),
    dia_semana: i === 0 ? "Hoje" : diaSemana(t),
    maxima: round(data.daily.temperature_2m_max[i]),
    minima: round(data.daily.temperature_2m_min[i]),
    precipitacao_mm: round(data.daily.precipitation_sum[i]),
    probabilidade_chuva: data.daily.precipitation_probability_max[i],
    vento_max_kmh: round(data.daily.wind_speed_10m_max[i]),
    uv_max: round(data.daily.uv_index_max[i]),
    uv_classificacao: uvClass(data.daily.uv_index_max[i]),
    nascer_sol: fmtTime(data.daily.sunrise[i]),
    por_sol: fmtTime(data.daily.sunset[i]),
    codigo_wmo: data.daily.weather_code[i],
    descricao: wmo(data.daily.weather_code[i]).label,
    icone: wmo(data.daily.weather_code[i]).icon,
  }));

  const c = data.current;
  return {
    cidade: CONFIG.cidade,
    coordenadas: { lat: Number(CONFIG.lat), lon: Number(CONFIG.lon), timezone: CONFIG.tz },
    atual: {
      hora: fmtHour(c.time),
      temperatura: round(c.temperature_2m),
      sensacao: round(c.apparent_temperature),
      umidade: c.relative_humidity_2m,
      precipitacao_mm: round(c.precipitation),
      vento_kmh: round(c.wind_speed_10m),
      vento_direcao_graus: c.wind_direction_10m,
      vento_direcao_cardinal: cardinal(c.wind_direction_10m),
      pressao: round(c.surface_pressure),
      uv: round(c.uv_index),
      uv_classificacao: uvClass(c.uv_index),
      visibilidade_km: round(c.visibility),
      codigo_wmo: c.weather_code,
      descricao: wmo(c.weather_code).label,
      icone: wmo(c.weather_code).icon,
    },
    horaria,
    diaria,
    alertas: gerarAlertas(data),
    meta: {
      fonte: "Open-Meteo",
      atualizado_em: data.meta.fetchedAt,
      cache: !!data.meta.cached,
    },
  };
}

// ─── Saída HTML ─────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildHtml(data: ForecastData): string {
  const json = buildJson(data);
  const jsData = JSON.stringify(json);
  const alertas = gerarAlertas(data);
  const now = fmtDateTime(data.meta.fetchedAt);

  const alertHtml = alertas
    .map((a) => {
      const cls = a.nivel === "danger" ? "alert-danger" : a.nivel === "warn" ? "alert-warn" : "alert-info";
      return `<div class="alert ${cls}"><span class="alert-icon">${a.icon}</span> ${escapeHtml(a.text)}</div>`;
    })
    .join("\n");

  const hourlyCards = (json as any).horaria
    .map((h: any) => {
      const w = wmo(h.codigo_wmo);
      return `
        <div class="hour-card">
          <div class="hour-time">${h.hora}</div>
          <div class="hour-icon" style="color:${w.color}">${w.icon}</div>
          <div class="hour-temp">${h.temperatura}°C</div>
          <div class="hour-rain">☔ ${h.probabilidade_chuva}%</div>
          <div class="hour-wind">🌬️ ${h.vento_kmh}</div>
        </div>`;
    })
    .join("");

  const dailyCards = (json as any).diaria
    .map((d: any) => {
      const w = wmo(d.codigo_wmo);
      return `
        <div class="day-card">
          <div class="day-name">${d.dia_semana}</div>
          <div class="day-date">${d.data}</div>
          <div class="day-icon" style="color:${w.color}">${w.icon}</div>
          <div class="day-desc">${escapeHtml(d.descricao)}</div>
          <div class="day-temps"><span class="max">${d.maxima}°</span> / <span class="min">${d.minima}°</span></div>
          <div class="day-rain">☔ ${d.precipitacao_mm}mm (${d.probabilidade_chuva}%)</div>
          <div class="day-wind">🌬️ ${d.vento_max_kmh} km/h · UV ${d.uv_max}</div>
        </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Previsão do Tempo — ${escapeHtml(CONFIG.cidade)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg-1: #0f172a;
      --bg-2: #1e293b;
      --card: rgba(30, 41, 59, 0.72);
      --border: rgba(148, 163, 184, 0.16);
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #38bdf8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Syne', sans-serif;
      background: linear-gradient(135deg, var(--bg-1), #020617 60%, var(--bg-2));
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
    }
    #stars {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }
    .star {
      position: absolute;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      animation: twinkle 3s infinite ease-in-out;
    }
    @keyframes twinkle {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
    .container {
      position: relative;
      z-index: 1;
      max-width: 1100px;
      margin: 0 auto;
      padding: 2rem 1rem 4rem;
    }
    h1 {
      font-weight: 800;
      font-size: clamp(2rem, 6vw, 3.5rem);
      margin: 0 0 0.25rem;
      letter-spacing: -0.04em;
    }
    .subtitle {
      color: var(--muted);
      font-family: 'DM Mono', monospace;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }
    .hero {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    @media (min-width: 720px) {
      .hero { grid-template-columns: 1.2fr 1fr; }
    }
    .glass {
      background: var(--card);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: 1.5rem;
      padding: 1.5rem;
      box-shadow: 0 10px 40px rgba(0,0,0,0.25);
    }
    .current-main {
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
    }
    .current-icon {
      font-size: 5rem;
      line-height: 1;
      margin-bottom: 0.5rem;
    }
    .current-temp {
      font-size: 4rem;
      font-weight: 800;
      line-height: 1;
    }
    .current-feels {
      color: var(--muted);
      font-family: 'DM Mono', monospace;
      margin-top: 0.5rem;
    }
    .current-desc {
      font-size: 1.4rem;
      margin-top: 0.5rem;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    .metric { text-align: center; }
    .metric-label {
      color: var(--muted);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .metric-value {
      font-family: 'DM Mono', monospace;
      font-size: 1.25rem;
      margin-top: 0.25rem;
    }
    .section-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 2.5rem 0 1rem;
    }
    .alerts { margin-bottom: 1rem; }
    .alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.9rem 1rem;
      border-radius: 1rem;
      margin-bottom: 0.75rem;
      font-size: 0.95rem;
      border: 1px solid transparent;
    }
    .alert-icon { font-size: 1.25rem; }
    .alert-danger { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.35); }
    .alert-warn { background: rgba(245, 166, 35, 0.15); border-color: rgba(245, 166, 35, 0.35); }
    .alert-info { background: rgba(56, 189, 248, 0.15); border-color: rgba(56, 189, 248, 0.35); }
    .hourly {
      display: flex;
      gap: 0.75rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }
    .hour-card {
      flex: 0 0 90px;
      background: var(--card);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 0.9rem 0.5rem;
      text-align: center;
    }
    .hour-time { font-family: 'DM Mono', monospace; font-size: 0.8rem; color: var(--muted); }
    .hour-icon { font-size: 1.75rem; margin: 0.4rem 0; }
    .hour-temp { font-weight: 700; font-size: 1rem; }
    .hour-rain, .hour-wind { font-size: 0.75rem; color: var(--muted); margin-top: 0.15rem; }
    .daily {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
    }
    .day-card {
      background: var(--card);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1rem;
      text-align: center;
    }
    .day-name { font-weight: 700; }
    .day-date { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: var(--muted); }
    .day-icon { font-size: 2.25rem; margin: 0.5rem 0; }
    .day-desc { font-size: 0.85rem; color: var(--muted); margin-bottom: 0.5rem; }
    .day-temps { font-size: 1.1rem; font-weight: 700; }
    .day-temps .max { color: #f5a623; }
    .day-temps .min { color: #38bdf8; }
    .day-rain, .day-wind { font-size: 0.75rem; color: var(--muted); margin-top: 0.25rem; }
    .chart-wrap {
      position: relative;
      height: 260px;
      margin-top: 1rem;
    }
    #chart { width: 100%; height: 100%; }
    footer {
      text-align: center;
      color: var(--muted);
      font-family: 'DM Mono', monospace;
      font-size: 0.8rem;
      margin-top: 3rem;
    }
  </style>
</head>
<body>
  <canvas id="stars"></canvas>
  <div class="container">
    <h1>${escapeHtml(CONFIG.cidade)}</h1>
    <div class="subtitle">Previsão do tempo · Open-Meteo · ${now}</div>

    <div class="hero">
      <div class="glass current-main">
        <div class="current-icon" id="currentIcon" style="color:${(json as any).atual.codigo_wmo ? wmo((json as any).atual.codigo_wmo).color : '#fff'}">${(json as any).atual.icone}</div>
        <div class="current-temp">${(json as any).atual.temperatura}°C</div>
        <div class="current-feels">Sensação ${(json as any).atual.sensacao}°C</div>
        <div class="current-desc">${escapeHtml((json as any).atual.descricao)}</div>
      </div>
      <div class="glass metrics">
        <div class="metric"><div class="metric-label">Umidade</div><div class="metric-value">${(json as any).atual.umidade}%</div></div>
        <div class="metric"><div class="metric-label">Vento</div><div class="metric-value">${(json as any).atual.vento_kmh} km/h ${(json as any).atual.vento_direcao_cardinal}</div></div>
        <div class="metric"><div class="metric-label">Chuva agora</div><div class="metric-value">${(json as any).atual.precipitacao_mm} mm</div></div>
        <div class="metric"><div class="metric-label">Pressão</div><div class="metric-value">${(json as any).atual.pressao} hPa</div></div>
        <div class="metric"><div class="metric-label">UV</div><div class="metric-value">${(json as any).atual.uv} (${escapeHtml((json as any).atual.uv_classificacao)})</div></div>
        <div class="metric"><div class="metric-label">Visibilidade</div><div class="metric-value">${(json as any).atual.visibilidade_km} km</div></div>
      </div>
    </div>

    ${alertas.length ? `<div class="alerts">${alertHtml}</div>` : ""}

    <h2 class="section-title">Próximas 24 horas</h2>
    <div class="hourly">${hourlyCards}</div>

    <h2 class="section-title">Próximos dias</h2>
    <div class="daily">${dailyCards}</div>

    <h2 class="section-title">Tendência de temperatura e chuva</h2>
    <div class="glass chart-wrap"><canvas id="chart"></canvas></div>

    <footer>Fonte: Open-Meteo · Atualizado em ${now}</footer>
  </div>

  <script>
    const data = ${jsData};

    // Estrelas animadas
    (function stars() {
      const canvas = document.getElementById('stars');
      const ctx = canvas.getContext('2d');
      let width, height, stars = [];
      function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        stars = [];
        for (let i = 0; i < 120; i++) {
          stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 1.5 + 0.3,
            a: Math.random(),
            s: Math.random() * 0.02 + 0.005
          });
        }
      }
      function draw() {
        ctx.clearRect(0, 0, width, height);
        stars.forEach(s => {
          s.a += s.s;
          const opacity = 0.3 + 0.7 * Math.abs(Math.sin(s.a));
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,' + opacity + ')';
          ctx.fill();
        });
        requestAnimationFrame(draw);
      }
      window.addEventListener('resize', resize);
      resize();
      draw();
    })();

    // Gráfico Canvas
    (function chart() {
      const canvas = document.getElementById('chart');
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const parent = canvas.parentElement;
      function resize() {
        canvas.width = parent.clientWidth * dpr;
        canvas.height = parent.clientHeight * dpr;
        canvas.style.width = parent.clientWidth + 'px';
        canvas.style.height = parent.clientHeight + 'px';
        ctx.scale(dpr, dpr);
        draw();
      }
      function draw() {
        const w = parent.clientWidth;
        const h = parent.clientHeight;
        const pad = { top: 30, right: 20, bottom: 40, left: 40 };
        const chartW = w - pad.left - pad.right;
        const chartH = h - pad.top - pad.bottom;
        const days = data.diaria;
        const maxT = Math.max(...days.map(d => d.maxima)) + 2;
        const minT = Math.min(...days.map(d => d.minima)) - 2;
        const maxR = Math.max(...days.map(d => d.precipitacao_mm), 5);

        ctx.clearRect(0, 0, w, h);

        // Eixos
        ctx.strokeStyle = 'rgba(148,163,184,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.left, pad.top);
        ctx.lineTo(pad.left, h - pad.bottom);
        ctx.lineTo(w - pad.right, h - pad.bottom);
        ctx.stroke();

        // Barras de chuva
        const barW = chartW / days.length * 0.5;
        days.forEach((d, i) => {
          const x = pad.left + (i + 0.5) * (chartW / days.length);
          const bh = (d.precipitacao_mm / maxR) * chartH * 0.5;
          ctx.fillStyle = 'rgba(79,195,247,0.55)';
          ctx.fillRect(x - barW / 2, h - pad.bottom - bh, barW, bh);
        });

        // Linha máxima
        ctx.strokeStyle = '#f5a623';
        ctx.lineWidth = 3;
        ctx.beginPath();
        days.forEach((d, i) => {
          const x = pad.left + (i + 0.5) * (chartW / days.length);
          const y = pad.top + (1 - (d.maxima - minT) / (maxT - minT)) * chartH;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Linha mínima
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        days.forEach((d, i) => {
          const x = pad.left + (i + 0.5) * (chartW / days.length);
          const y = pad.top + (1 - (d.minima - minT) / (maxT - minT)) * chartH;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Labels dos dias
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px DM Mono';
        ctx.textAlign = 'center';
        days.forEach((d, i) => {
          const x = pad.left + (i + 0.5) * (chartW / days.length);
          ctx.fillText(d.dia_semana, x, h - pad.bottom + 18);
        });

        // Labels temperatura
        ctx.fillStyle = '#f8fafc';
        ctx.font = '11px DM Mono';
        ctx.textAlign = 'right';
        ctx.fillText(maxT + '°', pad.left - 8, pad.top + 4);
        ctx.fillText(minT + '°', pad.left - 8, h - pad.bottom - 4);
      }
      window.addEventListener('resize', resize);
      resize();
    })();
  </script>
</body>
</html>`;
}

// ─── CLI ────────────────────────────────────────────────────────────────────

function showHelp(): void {
  console.log(`
🌤️  Previsão do Tempo — ${CONFIG.cidade}

Uso:
  bun run previsao.ts [opções]

Opções:
  --hoje           Exibe apenas a previsão de hoje.
  --amanha         Exibe apenas a previsão de amanhã.
  --hora           Exibe a previsão horária das próximas 24h.
  --dias N         Define quantos dias exibir (1-16). Padrão: ${CONFIG.diasDefault}.
  --json           Saída em JSON (imprime no stdout).
  --html           Gera arquivo HTML interativo.
  --output PATH    Caminho de saída para JSON ou HTML.
  --help           Mostra esta ajuda.

Configuração via variáveis de ambiente:
  PREVISAO_LAT, PREVISAO_LON, PREVISAO_TZ, PREVISAO_CIDADE

Exemplos:
  bun run previsao.ts --hoje
  bun run previsao.ts --json --output previsao.json
  bun run previsao.ts --html --output /tmp/previsao.html
  PREVISAO_CIDADE="Londrina" PREVISAO_LAT=-23.3045 PREVISAO_LON=-51.1695 bun run previsao.ts
`);
}

interface CliArgs {
  help: boolean;
  hoje: boolean;
  amanha: boolean;
  hora: boolean;
  json: boolean;
  html: boolean;
  dias?: number;
  output?: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const out: CliArgs = { help: false, hoje: false, amanha: false, hora: false, json: false, html: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--hoje") out.hoje = true;
    else if (a === "--amanha") out.amanha = true;
    else if (a === "--hora") out.hora = true;
    else if (a === "--json") out.json = true;
    else if (a === "--html") out.html = true;
    else if (a === "--dias") {
      const n = Number(args[++i]);
      if (!Number.isNaN(n)) out.dias = Math.max(1, Math.min(16, n));
    } else if (a === "--output" || a === "-o") {
      out.output = args[++i];
    }
  }
  return out;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  const dias = args.dias ?? CONFIG.diasDefault;

  try {
    const data = await fetchForecast(dias);

    if (args.json) {
      const json = JSON.stringify(buildJson(data), null, 2);
      if (args.output) {
        writeFileSync(args.output, json);
        console.log(`JSON salvo em: ${resolve(args.output)}`);
      } else {
        console.log(json);
      }
      return;
    }

    if (args.html) {
      const html = buildHtml(data);
      const outPath = args.output
        ? resolve(args.output)
        : join(OUTPUT_DIR, `tempo-inaja-${fmtDate(data.meta.fetchedAt).replace(/\//g, "-")}.html`);
      mkdirSync(OUTPUT_DIR, { recursive: true });
      writeFileSync(outPath, html);
      console.log(`HTML salvo em: ${outPath}`);
      return;
    }

    let modo: "completo" | "hoje" | "amanha" | "hora" = "completo";
    if (args.hoje) modo = "hoje";
    else if (args.amanha) modo = "amanha";
    else if (args.hora) modo = "hora";

    console.log(outputText(data, modo));
  } catch (err: any) {
    console.error(`❌ Erro: ${err.message || err}`);
    process.exit(1);
  }
}

main();
