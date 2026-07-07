#!/usr/bin/env node
/**
 * system_status.js
 *
 * Gera um relatório rápido de saúde do sistema para uso no heartbeat.
 * Verifica: gateway, cron jobs, kanban, arquivos críticos, disco.
 *
 * Uso: node system_status.js [--json] [--brief]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || '/home/administrator/.openclaw/workspace';
const args = process.argv.slice(2);
const JSON_MODE = args.includes('--json');
const BRIEF = args.includes('--brief');

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 5000 }).trim();
  } catch (e) {
    return null;
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) {
    return null;
  }
}

function checkDisk() {
  const out = run("df -h /home --output=pcent | tail -1");
  if (!out) return { status: 'unknown', usage: null };
  const pct = parseInt(out.replace('%', '').trim());
  return {
    status: pct > 90 ? 'critical' : pct > 75 ? 'warning' : 'ok',
    usage: `${pct}%`
  };
}

function checkGateway() {
  const out = run("openclaw gateway status 2>&1");
  if (!out) return { status: 'unknown' };
  const running = out.includes('running (pid') || out.includes('state active');
  const pidMatch = out.match(/pid (\d+)/);
  return {
    status: running ? 'ok' : 'down',
    pid: pidMatch ? pidMatch[1] : null
  };
}

function checkCronJobs() {
  const out = run("openclaw cron list --json 2>/dev/null");
  if (!out) {
    // Fallback: tentar sem --json
    const outPlain = run("openclaw cron list 2>/dev/null");
    if (!outPlain) return { status: 'unknown', jobs: [] };
    const lines = outPlain.split('\n').filter(l => l.includes('│')).length;
    return { status: 'ok', total: lines, note: 'plain-text parse' };
  }
  // Tentar como JSON
  try {
    const data = JSON.parse(out);
    const jobs = Array.isArray(data) ? data : (data.jobs || []);
    const failing = jobs.filter(j => j.state?.lastRunStatus === 'error' || j.lastRunStatus === 'error');
    const disabled = jobs.filter(j => j.enabled === false);
    return {
      status: failing.length > 0 ? 'warning' : 'ok',
      total: jobs.length,
      failing: failing.map(j => j.name || j.id),
      disabled: disabled.length
    };
  } catch {
    // Se não é JSON, contar linhas
    const lines = out.split('\n').filter(l => l.trim()).length;
    return { status: 'ok', total: lines, note: 'counted lines' };
  }
}

function checkKanban() {
  const state = readJson(path.join(WORKSPACE, 'dados/kanban_tasks.json'));
  if (!state) return { status: 'unknown' };

  const pending = Array.isArray(state) ? state.filter(t => t.status === 'pending').length :
                  (state.tasks || []).filter(t => t.status === 'pending').length;

  return {
    status: pending > 50 ? 'warning' : 'ok',
    pending
  };
}

function checkHeartbeatState() {
  const state = readJson(path.join(WORKSPACE, 'dados/heartbeat-state.json'));
  if (!state) return { status: 'missing' };

  const lastCheck = state.lastCheck || state.lastChecks?.gateway;
  const ageMs = lastCheck ? (Date.now() - new Date(lastCheck).getTime()) : null;
  const ageMin = ageMs ? Math.round(ageMs / 60000) : null;

  return {
    status: ageMin && ageMin > 120 ? 'stale' : 'ok',
    lastCheckAgo: ageMin ? `${ageMin}m atrás` : 'desconhecido',
    alerts: state.alerts?.length || 0
  };
}

function checkTodayMemory() {
  // Data de Brasília
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brasiliaMs = utcMs - (3 * 3600000);
  const brasilia = new Date(brasiliaMs);
  const dateStr = brasilia.toISOString().split('T')[0];
  const file = path.join(WORKSPACE, 'memory', `${dateStr}.md`);

  return {
    status: fs.existsSync(file) ? 'ok' : 'missing',
    file: dateStr + '.md'
  };
}

// Executa todas as verificações
const report = {
  timestamp: new Date().toISOString(),
  checks: {
    disk: checkDisk(),
    gateway: checkGateway(),
    cron: checkCronJobs(),
    kanban: checkKanban(),
    heartbeat: checkHeartbeatState(),
    todayMemory: checkTodayMemory()
  }
};

// Determina status geral
const statuses = Object.values(report.checks).map(c => c.status);
const hasError = statuses.some(s => s === 'down' || s === 'critical' || s === 'missing');
const hasWarning = statuses.some(s => s === 'warning' || s === 'stale' || s === 'unknown');
report.overall = hasError ? 'error' : hasWarning ? 'warning' : 'ok';

if (JSON_MODE) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

if (BRIEF) {
  const icons = { ok: '✅', warning: '⚠️', error: '❌', unknown: '❓', missing: '❌', down: '❌', critical: '❌', stale: '⚠️' };
  const c = report.checks;
  console.log(`Sistema: ${icons[report.overall] || '❓'} ${report.overall.toUpperCase()}`);
  console.log(`Disco: ${icons[c.disk.status]} ${c.disk.usage}`);
  console.log(`Gateway: ${icons[c.gateway.status]}`);
  console.log(`Cron: ${icons[c.cron.status]} ${c.cron.total || '?'} jobs${c.cron.failing?.length ? `, ${c.cron.failing.length} falhando` : ''}`);
  console.log(`Kanban: ${icons[c.kanban.status]} ${c.kanban.pending ?? '?'} pendentes`);
  console.log(`Heartbeat: ${icons[c.heartbeat.status]} ${c.heartbeat.lastCheckAgo}`);
  console.log(`Memória do dia: ${icons[c.todayMemory.status]} ${c.todayMemory.file}`);
  process.exit(hasError ? 1 : hasWarning ? 2 : 0);
}

// Output completo
const icons = { ok: '✅', warning: '⚠️', error: '❌', unknown: '❓', missing: '❌', down: '❌', critical: '❌', stale: '⚠️' };
console.log(`\n╔══════════════════════════════╗`);
console.log(`║  Eva — Status do Sistema     ║`);
console.log(`╚══════════════════════════════╝`);
console.log(`Status geral: ${icons[report.overall]} ${report.overall.toUpperCase()}`);
console.log(`Timestamp: ${new Date(report.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (Brasília)\n`);

const labels = {
  disk: 'Disco',
  gateway: 'Gateway OpenClaw',
  cron: 'Cron Jobs',
  kanban: 'Kanban Queue',
  heartbeat: 'Heartbeat State',
  todayMemory: 'Memória do Dia'
};

for (const [key, check] of Object.entries(report.checks)) {
  const icon = icons[check.status] || '❓';
  const extras = Object.entries(check)
    .filter(([k]) => k !== 'status')
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join(' | ');
  console.log(`${icon} ${labels[key] || key}: ${check.status}${extras ? ` (${extras})` : ''}`);
}

console.log('');
process.exit(hasError ? 1 : hasWarning ? 2 : 0);
