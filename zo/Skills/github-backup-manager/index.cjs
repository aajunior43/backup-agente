#!/usr/bin/env node
"use strict";

/**
 * Skill: GitHub Backup Manager
 * Gerencia Backup completo do OpenClaw no GitHub.
 *
 * Comandos:
 *   backup agora          — Executa backup imediatamente
 *   backup status         — Mostra status do último backup
 *   backup logs           — Mostra logs da última execução
 *   backup restore        — Mostra instruções de restauração
 *   backup info           — Informações sobre o que é backupado
 *
 * Exemplo: "Eva, backup agora"
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = '/home/administrator/vps-github-backup';
const LOG_FILE = '/tmp/github-backup.log';
const SCRIPT_PATH = '/home/administrator/scripts/github-backup.sh';
const REPO_URL = 'https://github.com/aajunior43/openclaw-backup.git';

function executarScript(args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn('bash', [SCRIPT_PATH, ...args], {
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || `exit code ${code}`));
    });
    proc.on('error', reject);
  });
}

function lerLog() {
  try {
    return fs.readFileSync(LOG_FILE, 'utf8').slice(-1500); // últimas linhas
  } catch (e) {
    return `(log não encontrado: ${e.message})`;
  }
}

function statusBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    return '⚠️ Diretório de backup não encontrado. Backup ainda não executado?';
  }
  try {
    const gitDir = path.join(BACKUP_DIR, '.git');
    if (!fs.existsSync(gitDir)) {
      return '⚠️ Repositório git não inicializado.';
    }
    const info = {
      diretorio: BACKUP_DIR,
      repo: REPO_URL,
      logFile: LOG_FILE,
      script: SCRIPT_PATH,
      tamanhoDB: Math.round(fs.statSync(BACKUP_DIR).size / 1024 / 1024) + ' MB'
    };
    return Object.entries(info).map(([k, v]) => `• ${k}: ${v}`).join('\n');
  } catch (e) {
    return `Erro ao verificar status: ${e.message}`;
  }
}

function listarArquivosBackup() {
  if (!fs.existsSync(BACKUP_DIR)) return '(diretório vazio)';
  const list = [];
  function walk(dir, prefix = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const name = prefix + e.name;
      if (e.isDirectory()) {
        if (e.name !== '.git') walk(path.join(dir, e.name), name + '/');
      } else {
        list.push(name);
      }
    }
  }
  walk(BACKUP_DIR);
  return list.slice(0, 50).join('\n') + (list.length > 50 ? '\n(... e mais ' + (list.length - 50) + ')' : '');
}

function executarScriptEmBackground() {
  const proc = spawn('bash', [SCRIPT_PATH], {
    detached: true,
    stdio: 'ignore' // não captura saída aqui
  });
  proc.unref();
  return true;
}

function processar(input) {
  const cmd = input.toLowerCase().trim();

  if (cmd === 'backup agora' || cmd === 'fazer backup agora' || cmd === 'executar backup') {
    try {
      executarScriptEmBackground();
      return `🚀 Backup iniciado em background.\n` +
             `📊 Acompanhe via: \`tail -f /tmp/github-backup.log\`\n` +
             `⏰ Pode levar vários minutos. Use "backup logs" para ver o andamento.`;
    } catch (e) {
      return `❌ Falha ao iniciar backup: ${e.message}`;
    }
  }

  if (cmd === 'backup status' || cmd === 'status backup') {
    const s = statusBackup();
    return `📊 Status do Backup:\n${s}`;
  }

  if (cmd === 'backup logs' || cmd === 'logs backup') {
    const log = lerLog();
    return `📋 Logs da última execução:\n\`\`\`\n${log}\n\`\`\``;
  }

  if (cmd === 'backup info' || cmd === 'info backup' || cmd === 'o que backup') {
    return `💾 O que é backupado:\n\n` +
           `• workspace/ (personalidade, memória, skills, documentos)\n` +
           `• cron/ (jobs agendados)\n` +
           `• agents/ (configs de agentes)\n` +
           `• scripts/ (scripts úteis)\n` +
           `• openclaw.json (config principal)\n` +
           `• memory/ (banco SQLite + diários)\n` +
           `• dados/ (health_tracker, kanban, YouTube channels)\n` +
           `• Obsidian vault\n` +
           `• Snapshot do sistema (crontab, processos, versões)\n\n` +
           ` Repositório: ${REPO_URL}`;
  }

  if (cmd === 'backup restore' || cmd === 'restaurar backup' || cmd === 'como restaurar') {
    return `🔧 Instruções de Restauração:\n\n` +
           `1️⃣ Clone o repositório:\n` +
           `   git clone ${REPO_URL} openclaw-restore\n` +
           `2️⃣ Copie as pastas para seus locais:\n` +
           `   - workspace/ → ~/.openclaw/workspace/\n` +
           `   - cron/ → ~/.openclaw/cron/\n` +
           `   - agents/ → ~/.openclaw/agents/\n` +
           `   - scripts/ → ~/scripts/ (ou /root/scripts/)\n` +
           `   - openclaw.json → ~/.openclaw/\n` +
           `3️⃣ Restaure permissões e variáveis de ambiente (.env)\n` +
           `4️⃣ Reinicie: openclaw gateway restart\n\n` +
           `Nota: Credenciais de WhatsApp NÃO são includas (por segurança).`;
  }

  if (cmd.includes('listar') || cmd.includes('list')) {
    const arquivos = listarArquivosBackup();
    return `📁 Arquivos no backup:\n${arquivos}`;
  }

  // fallback: executar o script se input for vazio ou suspeito de ser um comando do script
  if (cmd === '' || cmd.startsWith('bash ') || cmd.includes('github-backup')) {
    return 'Use os comandos da skill: "backup agora", "backup status", "backup logs", "backup info", "backup restore"';
  }

  return `Comandos disponíveis:\n` +
         `• backup agora        — Executa backup imediatamente\n` +
         `• backup status       — Mostra status do último backup\n` +
         `• backup logs         — Logs da última execução\n` +
         `• backup info         — O que é backupado\n` +
         `• backup restore      — Instruções de restauração\n` +
         `• backup listar       — Lista arquivos no diretório de backup`;
}

// Execução via linha de comando
if (require.main === module) {
  const input = process.argv.slice(2).join(' ');
  const resultado = processar(input);
  console.log(resultado);
}

module.exports = { processar };
