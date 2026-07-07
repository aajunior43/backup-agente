#!/usr/bin/env node
/**
 * daily_health_report.js
 *
 * Gera resumo diário de saúde (pressão, glicemia, FC) e envia via WhatsApp.
 * Lê health_tracker.json e calcula médias/tendências do dia.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = '/home/administrator/.openclaw/workspace';
const HEALTH_FILE = path.join(WORKSPACE, 'dados/health_tracker.json');

function sendWhatsApp(msg) {
  try {
    execSync(`openclaw message send --channel whatsapp --target +554491842415 --message "${msg.replace(/"/g, '\\"')}"`, {
      encoding: 'utf-8', timeout: 15000
    });
    return true;
  } catch (e) {
    console.error('Erro WhatsApp:', e.message);
    return false;
  }
}

function getBrasiliaDate() {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brasiliaMs = utcMs - (3 * 3600000);
  return new Date(brasiliaMs).toISOString().split('T')[0];
}

function statusEmoji(tipo, valor) {
  if (tipo === 'sistolica') return valor < 130 ? '✅' : valor < 140 ? '⚠️' : '❌';
  if (tipo === 'diastolica') return valor < 85 ? '✅' : valor < 90 ? '⚠️' : '❌';
  if (tipo === 'fc') return valor < 100 ? '✅' : valor < 110 ? '⚠️' : '❌';
  if (tipo === 'glicemia') return valor < 180 ? '✅' : valor < 200 ? '⚠️' : '❌';
  return '📊';
}

function main() {
  const today = getBrasiliaDate();
  console.log(`[${new Date().toISOString()}] Gerando relatório de saúde para ${today}...`);

  if (!fs.existsSync(HEALTH_FILE)) {
    console.log('❌ health_tracker.json não encontrado');
    process.exit(1);
  }

  let tracker;
  try {
    tracker = JSON.parse(fs.readFileSync(HEALTH_FILE, 'utf-8'));
  } catch (e) {
    console.error('❌ Erro ao ler health_tracker.json:', e.message);
    process.exit(1);
  }

  // Filtrar registros de hoje
  const records = (tracker.records || tracker.entries || [])
    .filter(r => (r.date || r.timestamp || '').startsWith(today));

  if (records.length === 0) {
    console.log('⚠️ Nenhum registro de hoje encontrado');
    // Verificar último registro
    const all = (tracker.records || tracker.entries || []);
    if (all.length > 0) {
      const last = all[all.length - 1];
      const lastDate = (last.date || last.timestamp || '').split('T')[0];
      const msg = `💊 *Saúde — Lembrete*\n\nNenhum registro de saúde hoje (${today}).\nÚltimo registro: ${lastDate}\n\n📊 Lembre-se de medir pressão e glicemia! 💎`;
      sendWhatsApp(msg);
    }
    process.exit(0);
  }

  // Calcular médias
  const avg = (arr, key) => {
    const vals = arr.map(r => r[key]).filter(v => v != null && !isNaN(v));
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };

  const sistolica = avg(records, 'sistolica') || avg(records, 'systolic') || avg(records, 'pressao_sistolica');
  const diastolica = avg(records, 'diastolica') || avg(records, 'diastolic') || avg(records, 'pressao_diastolica');
  const fc = avg(records, 'fc') || avg(records, 'heart_rate') || avg(records, 'frequencia_cardiaca');
  const glicemia = avg(records, 'glicemia') || avg(records, 'glucose') || avg(records, 'blood_glucose');

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const d = new Date(today + 'T12:00:00Z');
  const dayName = weekDays[d.getDay()];
  const [y, m, day] = today.split('-');

  let msg = `💊 *Saúde — ${dayName}, ${day}/${m}/${y}*\n`;
  msg += `📊 ${records.length} registro${records.length > 1 ? 's' : ''} hoje\n\n`;

  if (sistolica && diastolica) {
    msg += `${statusEmoji('sistolica', sistolica)} *Pressão:* ${sistolica}/${diastolica} mmHg\n`;
  }
  if (fc) {
    msg += `${statusEmoji('fc', fc)} *FC:* ${fc} bpm\n`;
  }
  if (glicemia) {
    msg += `${statusEmoji('glicemia', glicemia)} *Glicemia:* ${glicemia} mg/dL\n`;
  }

  // Resumo rápido
  const issues = [];
  if (sistolica && sistolica >= 140) issues.push('pressão alta');
  if (diastolica && diastolica >= 90) issues.push('pressão diastólica elevada');
  if (glicemia && glicemia >= 200) issues.push('glicemia elevada');
  if (fc && fc >= 110) issues.push('FC elevada');

  msg += '\n';
  if (issues.length === 0) {
    msg += '🎯 Tudo dentro das metas hoje!\n';
  } else {
    msg += `⚠️ Atenção: ${issues.join(', ')}\n`;
  }

  msg += '\n💎 _Relatório automático by Eva_';

  console.log('📨 Enviando relatório...');
  console.log(msg);

  if (sendWhatsApp(msg)) {
    console.log('✅ Relatório enviado!');
  } else {
    console.log('❌ Falha no envio');
    process.exit(1);
  }
}

main();
