#!/usr/bin/env node
/**
 * Sites Health Monitor
 * Verifica e restaura todos os sites do unified gateway
 * Executado via cron ou manualmente
 */

const http = require('http');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_FILE = '/tmp/sites-monitor.log';
const SITES_DIR = '/home/administrator/.openclaw/workspace/sites';

// Roteas do gateway (nome -> {port, dir})
const ROUTES = {
  'Calculadora Ar':        { port: 3001, dir: 'ar-calc' },
  'YT Monitor':             { port: 3002, dir: 'youtube-monitor-site' },
  'Cérebro Eva':           { port: 3003, dir: 'cerebro-eva' },
  'Kanban':                { port: 3005, dir: 'kanban-board' },
  'Prefeitura':           { port: 3006, dir: 'prefeitura-site' },
  'ISS Calc':              { port: 3008, dir: 'iss-calc' },
  'Eva Dashboard':         { port: 3009, dir: 'eva-dashboard' },
  'Agenda/Ferramentas':    { port: 3010, dir: 'ferramentas-site' },
  'Combustível':           { port: 3019, dir: 'combustivel-site' },
  'Obsidian Web':          { port: 3012, dir: 'obsidian-web' },
  'Manual da Bíblia':     { port: 3016, dir: 'sites/blogs/manual-biblia' },
  'Manual do Nerd':        { port: 3021, dir: 'sites/blogs/manual-do-nerd' },
  'Gateway':              { port: 3000, dir: 'unified-gateway' },
};

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
  fs.appendFileSync(LOG_FILE, `[${ts}] ${msg}\n`);
}

function checkHttp(port, path = '/') {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}${path}`, { timeout: 5000 }, (res) => {
      resolve(res.statusCode);
    });
    req.on('error', () => resolve(0));
    req.on('timeout', () => { req.destroy(); resolve(0); });
  });
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, { timeout: 2000 }, () => resolve(true));
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

function killPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null; sleep 1`, () => resolve());
  });
}

function startSite(port, dir) {
  return new Promise((resolve) => {
    const serverPath = path.join(SITES_DIR, dir, 'server.js');
    if (!fs.existsSync(serverPath)) {
      log(`❌ server.js não encontrado: ${serverPath}`);
      resolve(false);
      return;
    }
    
    exec(`cd ${path.join(SITES_DIR, dir)} && nohup node server.js > /tmp/site_${port}.log 2>&1 &`, () => {});
    setTimeout(() => resolve(true), 3000);
  });
}

async function checkAndFixSite(name, config) {
  const { port, dir } = config;
  process.stdout.write(`Verificando ${name} (${port})... `);
  
  const statusCode = await checkHttp(port);
  
  if (statusCode === 200) {
    log(`✅ ${name} (${port}) — OK`);
    process.stdout.write(`✅ 200\n`);
    return { name, port, status: 'OK', code: statusCode };
  }
  
  log(`⚠️ ${name} (${port}) — Status ${statusCode}, tentando restart...`);
  process.stdout.write(`⚠️ ${statusCode || 'DOWN'} — reiniciando...\n`);
  
  await killPort(port);
  const started = await startSite(port, dir);
  
  if (started) {
    const newStatus = await checkHttp(port);
    if (newStatus === 200) {
      log(`✅ ${name} (${port}) — RESTAURADO`);
      return { name, port, status: 'RESTORED', code: newStatus };
    }
  }
  
  log(`❌ ${name} (${port}) — FALHA ao restaurar`);
  return { name, port, status: 'FAILED', code: statusCode };
}

async function main() {
  log('========== INICIANDO MONITORAMENTO ==========');
  
  const results = [];
  const startTime = Date.now();
  
  for (const [name, config] of Object.entries(ROUTES)) {
    const result = await checkAndFixSite(name, config);
    results.push(result);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const ok = results.filter(r => r.status === 'OK' || r.status === 'RESTORED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  
  log(`========== MONITORAMENTO FINALIZADO ==========`);
  log(`Tempo: ${duration}s | OK: ${ok} | Falhas: ${failed}`);
  
  // Summary
  console.log('\n📊 RESUMO:');
  for (const r of results) {
    const icon = r.status === 'OK' ? '✅' : r.status === 'RESTORED' ? '♻️' : '❌';
    console.log(`${icon} ${r.name} (${r.port}): ${r.status} (${r.code})`);
  }
  
  if (failed > 0) {
    console.log(`\n⚠️ ${failed} sites com problema. Verifique os logs: tail -f ${LOG_FILE}`);
  }
  
  // Return exit code based on failures
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
