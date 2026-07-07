#!/usr/bin/env node
/**
 * create_daily_memory.js
 * 
 * Cria automaticamente o arquivo memory/YYYY-MM-DD.md do dia atual
 * com template padrão. Roda via cron às 00:01 horário de Inajá (03:01 UTC).
 *
 * Se o arquivo já existir, não sobrescreve.
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || '/home/administrator/.openclaw/workspace';
const MEMORY_DIR = path.join(WORKSPACE, 'memory');

// Garante que o diretório existe
if (!fs.existsSync(MEMORY_DIR)) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

// Data atual no timezone de Brasília (UTC-3)
function getBrasiliaDate() {
  const now = new Date();
  // Ajusta para UTC-3
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brasiliaMs = utcMs - (3 * 3600000);
  const brasilia = new Date(brasiliaMs);

  const year = brasilia.getFullYear();
  const month = String(brasilia.getMonth() + 1).padStart(2, '0');
  const day = String(brasilia.getDate()).padStart(2, '0');

  const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const weekDay = weekDays[brasilia.getDay()];

  return {
    dateStr: `${year}-${month}-${day}`,
    display: `${day}/${month}/${year}`,
    weekDay
  };
}

const { dateStr, display, weekDay } = getBrasiliaDate();
const filePath = path.join(MEMORY_DIR, `${dateStr}.md`);

if (fs.existsSync(filePath)) {
  console.log(`✅ Arquivo já existe: ${filePath}`);
  process.exit(0);
}

const template = `# Memória Diária — ${display} (${weekDay})

## 🌅 Início do Dia

_Resumo do que aconteceu hoje será preenchido ao longo do dia._

---

## 📋 Eventos do Dia

<!-- Preencher conforme eventos ocorrem -->

---

## ✅ Tarefas Concluídas

<!-- Listar tarefas finalizadas com ✅ -->

---

## 🎯 Decisões Tomadas

<!-- Decisões importantes que devem ser lembradas -->

---

## ⏳ Pendências

<!-- O que ficou para amanhã ou está em aberto -->

---

## 💡 Observações

<!-- Notas livres, aprendizados, insights -->

---

## 🏥 Saúde (se registrado)

<!-- Pressão, glicemia, FC — registrar aqui se não tiver ido para health_tracker -->

---

## 💬 Interações Relevantes

<!-- Conversas importantes, decisões tomadas em chat -->

---

_Criado automaticamente em ${new Date().toISOString()}_
_Consolidação automática às 22:00 via scripts/consolidate_memory.js_
`;

try {
  fs.writeFileSync(filePath, template, 'utf-8');
  console.log(`✅ Arquivo criado: ${filePath}`);
  process.exit(0);
} catch (err) {
  console.error(`❌ Erro ao criar arquivo: ${err.message}`);
  process.exit(1);
}
