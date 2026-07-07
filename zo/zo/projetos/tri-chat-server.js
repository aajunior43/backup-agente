const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.TRICHAT_PORT || 18888;
const TOKEN=process.env.TRICHAT_TOKEN || 'tri-chat-' + crypto.randomBytes(8).toString('hex');
const DB_PATH = path.join(__dirname, 'tri-chat.db');
const BASE = '/tri-chat';
const DEFAULT_ROUNDS = 3;

// ── AI Provider Config ──
const AI_API_KEY = process.env.OPENCODE_API_KEY || process.env.MINIMAX_API_KEY || "***";
const AI_API_URL = process.env.OPENCODE_API_URL || 'https://opencode.ai/zen/go/v1/chat/completions';
const AI_MODEL = process.env.OPENCODE_MODEL || 'opencode-go/deepseek-v4-flash-free';

// ── OpenAI TTS Config ──
const OPENAI_API_KEY=process.env.OPENAI_API_KEY || '';
const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';
const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// ── Migration: add voice column if missing ──
try { db.exec("ALTER TABLE agents ADD COLUMN voice TEXT NOT NULL DEFAULT 'nova'"); } catch(e) {}
// ── Migration: add agents_md column for generated agent.md file ──
try { db.exec(`ALTER TABLE agents ADD COLUMN agents_md TEXT`); } catch(e) {}

// ── Schema ──
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    api_url TEXT NOT NULL DEFAULT 'https://api.openai.com/v1/chat/completions',
    api_key TEXT NOT NULL,
    system_prompt TEXT NOT NULL DEFAULT 'Você é um assistente IA que participa de debates estruturados.',
    color TEXT NOT NULL DEFAULT '#8b5cf6',
    avatar TEXT NOT NULL DEFAULT '',
    voice TEXT NOT NULL DEFAULT 'nova',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'open',
    rounds INTEGER NOT NULL DEFAULT 3,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  );
  CREATE TABLE IF NOT EXISTS task_agents (
    task_id INTEGER NOT NULL,
    agent_id INTEGER NOT NULL,
    PRIMARY KEY (task_id, agent_id)
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    round INTEGER NOT NULL DEFAULT 0,
    author TEXT NOT NULL,
    author_type TEXT NOT NULL DEFAULT 'user',
    agent_id INTEGER,
    content TEXT NOT NULL,
    color TEXT DEFAULT '#8b5cf6',
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
  );
  CREATE TABLE IF NOT EXISTS conclusions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    agent_id INTEGER,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
  );
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    agent_id INTEGER,
    event TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'info',
    details TEXT,
    duration_ms INTEGER,
    tokens_in INTEGER,
    tokens_out INTEGER,
    model TEXT,
    api_url TEXT,
    status_code INTEGER,
    error TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  );
`);

// ── Running debate trackers ──
const runningDebates = new Map();

// ── Startup recovery: reset stuck debates ──
try {
  const stuckResult = db.prepare("UPDATE tasks SET status = 'open', updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE status IN ('debating', 'concluding')").run();
  if (stuckResult.changes > 0) {
    console.log(`[Recovery] Reset ${stuckResult.changes} stuck debate(s) to 'open' status`);
  }
} catch (e) {
  console.error('[Recovery] Failed to reset stuck debates:', e.message);
}

// ── Auth ──
function checkToken(req) {
  const auth = req.headers['authorization'];
  const cookie = (req.headers.cookie || '').match(/trichat_token=([^;]+)/)?.[1];
  const query = req.query.token;
  const body = req.body?._token;
  if (auth === `Bearer ${TOKEN}`) return true;
  if (cookie === TOKEN) return true;
  if (query === TOKEN) return true;
  if (body === TOKEN) return true;
  return false;
}

// Auth disabled — open access
app.use((req, res, next) => next());

// ── SSE ──
const clients = new Set();
app.get(`${BASE}/api/events`, (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  clients.add(res);
  req.on('close', () => { clients.delete(res); });
});

// ── Logging ──
function logEvent({ task_id = null, agent_id = null, event, level = 'info', details = null, duration_ms = null, tokens_in = null, tokens_out = null, model = null, api_url = null, status_code = null, error = null }) {
  try {
    db.prepare(`
      INSERT INTO logs (task_id, agent_id, event, level, details, duration_ms, tokens_in, tokens_out, model, api_url, status_code, error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(task_id, agent_id, event, level, details, duration_ms, tokens_in, tokens_out, model, api_url, status_code, error);
  } catch (e) {
    console.error('[Log] Failed to write log:', e.message);
  }
}


// Text sanitizer: SIMPLE VERSION - only remove CJK/foreign chars
function sanitizeResponse(text) {
  if (!text || typeof text !== 'string') return text || '';
  // Remove ALL CJK characters (expanded ranges)
  text = text.replace(/[\u2E80-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF\u2CEB0-\u2EBEF\u30000-\u3134F]/g, "");
  // Remove Hangul (Korean)
  text = text.replace(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g, "");
  // Remove Hiragana/Katakana (Japanese)
  text = text.replace(/[\u3040-\u309F\u30A0-\u30FF]/g, "");
  // Remove Arabic/Hebrew/Cyrillic that shouldn't appear in Portuguese
  text = text.replace(/[\u0600-\u06FF\u0590-\u05FF\u0400-\u04FF]/g, "");
  // Spanish/English words -> Portuguese equivalents
  const fixes = {
    "cualquier":"qualquer","cual":"qual","entonces":"entao","pero":"mas",
    "cuando":"quando","siempre":"sempre","mismo":"mesmo","tambien":"tambem",
    "emisión":"emissão","emision":"emissao","occur":"ocorrer","occurred":"ocorreu",
    "mention":"mencionar","mentioned":"mencionou","because":"porque",
    "problem":"problema","before":"antes","after":"depois","however":"porém",
    "también":"tambem","razón":"razão","además":"alem disso","mientras":"enquanto",
    "durante":"durante","sobre":"sobre","entre":"entre","según":"segundo",
    "aunque":"embora","porque":"porque","como":"como"
  };
  for (const [es, pt] of Object.entries(fixes)) {
    text = text.replace(new RegExp("\\b" + es + "\\b", "gi"), pt);
  }
  // Clean up: remove orphaned fragments left after CJK removal (single consonants, broken words)
  text = text.replace(/\s{2,}/g, " ").trim();
  // Fix common tokenization artifacts: word glued together
  text = text.replace(/emdotação/gi, "em dotação");
  text = text.replace(/inúmera\s+casos/gi, "inúmeros casos");
  text = text.replace(/inúmera\s+vezes/gi, "inúmeras vezes");
  // Remove isolated single characters that are likely CJK residue
  // REMOVED: this was destroying valid Portuguese words
  return text;
}

function broadcast(event, data) {
  const payload = `data: ${JSON.stringify({ type: event, data })}\n\n`;
  for (const c of clients) { try { c.write(payload); } catch (e) { clients.delete(c); } }
}

// ── Login ──
app.get(`${BASE}/login`, (req, res) => {
  res.send(`<!DOCTYPE html>
<html><head><title>Jr Conversation — Login</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body{display:flex;justify-content:center;align-items:center;min-height:100vh;background:#0f0f1a;color:#e0e0e0;font-family:system-ui;margin:0}
  .box{background:#1a1a2e;padding:2rem;border-radius:16px;box-shadow:0 0 30px rgba(139,92,246,0.2);text-align:center;width:90%;max-width:360px}
  .box h1{color:#a78bfa;margin-bottom:.5rem;font-size:1.5rem}
  .box p{color:#9999b3;font-size:.85rem;margin-bottom:1rem}
  .box input{width:100%;padding:.8rem;border:1px solid #333;border-radius:8px;background:#111;color:#fff;font-size:1rem;margin:.5rem 0;box-sizing:border-box}
  .box button{width:100%;padding:.8rem;border:none;border-radius:8px;background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#fff;font-size:1rem;font-weight:700;cursor:pointer;margin-top:.5rem}
  .err{color:#ef4444;font-size:.85rem;display:none;margin-top:.5rem}
</style></head><body>
<div class="box">
  <h1>💬 Jr Conversation</h1>
  <p>Digite a senha de acesso</p>
  <form onsubmit="doLogin(event)">
    <input type="password" id="pw" placeholder="Senha..." autofocus>
    <div class="err" id="err">Senha incorreta</div>
    <button type="submit">Entrar</button>
  </form>
</div>
<script>
async function doLogin(e){
  e.preventDefault();
  var pw=document.getElementById('pw').value;
  var r=await fetch('${BASE}/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:pw})});
  var d=await r.json();
  if(d.ok){document.cookie='trichat_token='+pw+';path=/;max-age=31536000';window.location.href='${BASE}/';}
  else{document.getElementById('err').style.display='block';document.getElementById('pw').value='';}
}
</script></body></html>`);
});

app.post(`${BASE}/api/verify`, (req, res) => {
  res.json({ ok: req.body?.token === TOKEN });
});

// ── API: Agents ──
function maskKey(key) {
  if (!key || key.length < 8) return '****';
  return key.substring(0, 4) + '****' + key.substring(key.length - 4);
}

app.get(`${BASE}/api/agents`, (req, res) => {
  const agents = db.prepare('SELECT * FROM agents ORDER BY id ASC').all();
  res.json(agents.map(a => ({ ...a, api_key: maskKey(a.api_key) })));
});

app.post(`${BASE}/api/agents`, (req, res) => {
  const { name, system_prompt, color, avatar, voice } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  // Use API key from an existing active agent, or fallback to global
  const existingAgent = db.prepare('SELECT api_url, api_key, model FROM agents WHERE active = 1 LIMIT 1').get();
  const agentApiUrl = existingAgent ? existingAgent.api_url : AI_API_URL;
  const agentApiKey = existingAgent ? existingAgent.api_key : AI_API_KEY;
  const agentModel = existingAgent ? existingAgent.model : AI_MODEL;
  // Auto-assign a voice not already used
  const usedVoices = db.prepare('SELECT voice FROM agents WHERE active = 1').all().map(a => a.voice);
  const availableVoices = VOICES.filter(v => !usedVoices.includes(v));
  const autoVoice = voice || (availableVoices.length > 0 ? availableVoices[0] : VOICES[usedVoices.length % VOICES.length]);
  const result = db.prepare(
    'INSERT INTO agents (name, model, api_url, api_key, system_prompt, color, avatar, voice) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(name, agentModel, agentApiUrl, agentApiKey, system_prompt || 'Você é um assistente IA que participa de debates estruturados.', color || '#8b5cf6', avatar || name.charAt(0).toUpperCase(), autoVoice);
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(result.lastInsertRowid);
  broadcast('agent_created', { ...agent, api_key: maskKey(agent.api_key) });
  res.json({ ...agent, api_key: maskKey(agent.api_key) });
});

app.patch(`${BASE}/api/agents/:id`, (req, res) => {
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'agent not found' });
  const fields = {};
  for (const key of ['name', 'model', 'api_url', 'system_prompt', 'color', 'avatar', 'voice', 'active']) {
    if (req.body[key] !== undefined) fields[key] = req.body[key];
  }
  // api_key: only update if provided and not masked
  if (req.body.api_key && !req.body.api_key.includes('****')) {
    fields.api_key = req.body.api_key;
  }
  if (Object.keys(fields).length === 0) return res.json({ ...agent, api_key: maskKey(agent.api_key) });
  const setClauses = Object.keys(fields).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE agents SET ${setClauses} WHERE id = ?`).run(...Object.values(fields), req.params.id);
  const updated = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id);
  broadcast('agent_updated', { ...updated, api_key: maskKey(updated.api_key) });
  res.json({ ...updated, api_key: maskKey(updated.api_key) });
});

app.delete(`${BASE}/api/agents/:id`, (req, res) => {
  db.prepare('DELETE FROM task_agents WHERE agent_id = ?').run(req.params.id);
  db.prepare('DELETE FROM agents WHERE id = ?').run(req.params.id);
  broadcast('agent_deleted', { id: parseInt(req.params.id) });
  res.json({ ok: true });
});

// ── API: Download agents.md for an agent ──
app.get(`${BASE}/api/agents/:id/agents.md`, (req, res) => {
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'agent not found' });
  const md = agent.agents_md || '';
  const safeName = (agent.name || 'agente').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}-agents.md"`);
  res.send(md);
});

// ── API: Tasks ──
app.get(`${BASE}/api/tasks`, (req, res) => {
  const { status, search } = req.query;
  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (search) { query += ' AND (title LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  query += ' ORDER BY id DESC';
  const tasks = db.prepare(query).all(...params);
  const result = tasks.map(t => ({
    ...t,
    agents: db.prepare('SELECT a.id, a.name, a.color, a.avatar FROM agents a JOIN task_agents ta ON a.id = ta.agent_id WHERE ta.task_id = ?').all(t.id)
  }));
  res.json(result);
});

app.post(`${BASE}/api/tasks`, (req, res) => {
  const { title, description, agent_ids, rounds } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const r = rounds || DEFAULT_ROUNDS;
  const result = db.prepare('INSERT INTO tasks (title, description, rounds) VALUES (?, ?, ?)').run(title, description || '', r);
  const taskId = result.lastInsertRowid;
  const agents = agent_ids && agent_ids.length > 0 ? agent_ids : db.prepare('SELECT id FROM agents WHERE active = 1').all().map(a => a.id);
  const insertTA = db.prepare('INSERT OR IGNORE INTO task_agents (task_id, agent_id) VALUES (?, ?)');
  for (const aid of agents) { insertTA.run(taskId, aid); }
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  const taggedAgents = db.prepare('SELECT a.id, a.name, a.color, a.avatar FROM agents a JOIN task_agents ta ON a.id = ta.agent_id WHERE ta.task_id = ?').all(taskId);
  broadcast('task_created', { ...task, agents: taggedAgents });
  res.json({ ...task, agents: taggedAgents });
});

app.patch(`${BASE}/api/tasks/:id`, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'task not found' });
  const { status } = req.body;
  if (status) {
    db.prepare("UPDATE tasks SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?").run(status, req.params.id);
  }
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  const agents = db.prepare('SELECT a.id, a.name, a.color, a.avatar FROM agents a JOIN task_agents ta ON a.id = ta.agent_id WHERE ta.task_id = ?').all(req.params.id);
  broadcast('task_updated', { ...updated, agents });
  res.json({ ...updated, agents });
});

app.delete(`${BASE}/api/tasks/:id`, (req, res) => {
  // Cancel running debate if any
  if (runningDebates.has(parseInt(req.params.id))) {
    runningDebates.set(parseInt(req.params.id), 'cancelled');
  }
  db.prepare('DELETE FROM messages WHERE task_id = ?').run(req.params.id);
  db.prepare('DELETE FROM conclusions WHERE task_id = ?').run(req.params.id);
  db.prepare('DELETE FROM task_agents WHERE task_id = ?').run(req.params.id);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  broadcast('task_deleted', { id: parseInt(req.params.id) });
  res.json({ ok: true });
});

// ── API: Cancel Debate ──
app.post(`${BASE}/api/tasks/:id/cancel`, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'task not found' });
  if (task.status !== 'debating' && task.status !== 'concluding') {
    return res.status(400).json({ error: 'task is not running' });
  }

  // Signal the debate loop to stop
  if (runningDebates.has(parseInt(req.params.id))) {
    runningDebates.set(parseInt(req.params.id), 'cancelled');
  }

  // Reset task to open so user can send a new message
  db.prepare("UPDATE tasks SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?").run('open', req.params.id);
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  const agents = db.prepare('SELECT a.id, a.name, a.color, a.avatar FROM agents a JOIN task_agents ta ON a.id = ta.agent_id WHERE ta.task_id = ?').all(req.params.id);
  broadcast('task_updated', { ...updated, agents });
  logEvent({ task_id: parseInt(req.params.id), event: 'debate_cancelled', details: 'Debate cancelado pelo usuário' });
  res.json({ ok: true, task: { ...updated, agents } });
});

// ── API: Messages ──
app.get(`${BASE}/api/tasks/:taskId/messages`, (req, res) => {
  res.json(db.prepare('SELECT * FROM messages WHERE task_id = ? ORDER BY id ASC').all(req.params.taskId));
});

app.post(`${BASE}/api/tasks/:taskId/messages`, (req, res) => {
  const { author, author_type, content, round, color, agent_id } = req.body;
  if (!author || !content) return res.status(400).json({ error: 'author and content required' });
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'task not found' });

  const type = author_type || 'user';
  const msgColor = color || '#8b5cf6';
  const msgRound = round || 0;
  const msgAgentId = agent_id || null;
  const result = db.prepare('INSERT INTO messages (task_id, round, author, author_type, agent_id, content, color) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(req.params.taskId, msgRound, author, type, msgAgentId, content, msgColor);
  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
  broadcast('message_created', message);

  // If this is a user message on an open task, start the debate
  let updatedTask = task;
  if (type === 'user' && task.status === 'open') {
    db.prepare("UPDATE tasks SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?").run('debating', req.params.taskId);
    updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.taskId);
    broadcast('task_updated', updatedTask);
    // Start debate loop in background
    startDebate(parseInt(req.params.taskId));
  }

  res.json(message);
});

// ── API: Conclusions ──
app.get(`${BASE}/api/tasks/:taskId/conclusions`, (req, res) => {
  res.json(db.prepare('SELECT * FROM conclusions WHERE task_id = ? ORDER BY id ASC').all(req.params.taskId));
});

app.post(`${BASE}/api/tasks/:taskId/conclusions`, (req, res) => {
  const { author, agent_id, content, color } = req.body;
  if (!author || !content) return res.status(400).json({ error: 'author and content required' });
  const result = db.prepare('INSERT INTO conclusions (task_id, agent_id, author, content, color) VALUES (?, ?, ?, ?, ?)')
    .run(req.params.taskId, agent_id || null, author, content, color || '#8b5cf6');
  const conclusion = db.prepare('SELECT * FROM conclusions WHERE id = ?').get(result.lastInsertRowid);
  broadcast('conclusion_created', conclusion);
  res.json(conclusion);
});

// ── API: Generate Summary Conclusion ──
app.post(`${BASE}/api/tasks/:taskId/conclude`, async (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'task not found' });

  const messages = db.prepare('SELECT * FROM messages WHERE task_id = ? ORDER BY id ASC').all(req.params.taskId);
  if (messages.length === 0) return res.status(400).json({ error: 'no messages to summarize' });

  // Build debate transcript
  let transcript = `Tema: ${task.title}\n`;
  if (task.description) transcript += `Contexto: ${task.description}\n\n`;
  for (const m of messages) {
    transcript += `[${m.author}]: ${m.content}\n\n`;
  }

  const chatMessages = [
    { role: 'system', content: 'Você é um mediador imparcial e analista de debates. Leia o debate abaixo e escreva uma conclusão estruturada em português do Brasil:\n\n1. **Resumo das posições** — cite nominalmente cada participante e sua tese principal (2-3 frases)\n2. **Pontos de convergência** — onde houve acordo ou parcial acordo\n3. **Pontos de divergência** — os desacordos centrais e seus fundamentos\n4. **Síntese final** — qual posição se mostrou mais bem fundamentada e por quê\n\nSeja objetivo, cite artigos de lei quando mencionados no debate, e não invente informações.' },
    { role: 'user', content: `Analise o seguinte debate e escreva uma conclusão geral sintetizada:\n\n${transcript}` }
  ];

  // Use the first active agent's API config for the call
  const agent = db.prepare(`
    SELECT a.* FROM agents a
    JOIN task_agents ta ON a.id = ta.agent_id
    WHERE ta.task_id = ? AND a.active = 1
    LIMIT 1
  `).get(req.params.taskId);

  if (!agent) return res.status(400).json({ error: 'no active agents for this task' });

  // Set task status to concluding
  db.prepare("UPDATE tasks SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?").run('concluding', req.params.taskId);
  broadcast('task_updated', { ...task, status: 'concluding' });
  broadcast('agent_typing', { task_id: parseInt(req.params.taskId), agent_id: null, agent_name: '📋 Síntese', round: 'conclusão' });

  try {
    const response = await callAI(agent, chatMessages, { maxTokens: 3000 });
    const result = db.prepare(
      'INSERT INTO conclusions (task_id, agent_id, author, content, color) VALUES (?, ?, ?, ?, ?)'
    ).run(req.params.taskId, null, '📋 Síntese Geral', response, '#22c55e');
    const conclusion = db.prepare('SELECT * FROM conclusions WHERE id = ?').get(result.lastInsertRowid);
    broadcast('conclusion_created', conclusion);

    // Close task
    db.prepare("UPDATE tasks SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?").run('closed', req.params.taskId);
    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.taskId);
    const taskAgents = db.prepare('SELECT a.id, a.name, a.color, a.avatar FROM agents a JOIN task_agents ta ON a.id = ta.agent_id WHERE ta.task_id = ?').all(req.params.taskId);
    broadcast('task_updated', { ...updatedTask, agents: taskAgents });

    res.json(conclusion);
  } catch (err) {
    console.error('[Conclude] Error:', err.message);
    db.prepare("UPDATE tasks SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?").run('closed', req.params.taskId);
    res.status(500).json({ error: err.message });
  }
});

// ── API: Generate Agent Prompt ──
app.post(`${BASE}/api/generate-prompt`, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  try {
    const chatMessages = [
      { role: 'system', content: 'Você é um especialista em criar system prompts para agentes de IA. Crie prompts curtos, objetivos e específicos, em português do Brasil. O prompt deve definir claramente o papel, expertise e estilo de resposta do agente. Responda APENAS com o prompt, sem explicações adicionais, sem aspas, sem markdown.' },
      { role: 'user', content: `Crie um system prompt detalhado para um agente de IA chamado "${name}". O prompt deve definir seu papel, área de especialização e como deve responder. Máximo 3 frases.` }
    ];

    // Use an agent's API key from DB, fallback to global key
    const dbAgent = db.prepare('SELECT api_url, api_key, model FROM agents WHERE active = 1 LIMIT 1').get();
    const agent = dbAgent
      ? { api_url: dbAgent.api_url, api_key: dbAgent.api_key, model: dbAgent.model }
      : { api_url: AI_API_URL, api_key: AI_API_KEY, model: AI_MODEL };
    const prompt = await callAI(agent, chatMessages);
    res.json({ prompt: prompt.trim() });
  } catch (err) {
    console.error('[GeneratePrompt] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── API: Generate Agent with AI ──
app.post(`${BASE}/api/agents/generate`, async (req, res) => {
  const { description, name, specialty, role, tone, color, voice, extra, create } = req.body;

  // Monta a descricao a partir dos campos do formulario (ou usa description direto)
  let fullDesc = description || '';
  if (!fullDesc && name) {
    const roleLabel = { defensor: 'defensor de uma posicao', cético: 'cético e questionador', moderador: 'moderador e equilibrado', especialista: 'especialista tecnico', inovador: 'inovador e visionario' }[role] || role;
    const toneLabel = { profissional: 'profissional', direto: 'direto e objetivo', calmo: 'calmo e analitico', agressivo: 'agressivo e confrontador', didatico: 'didatico' }[tone] || tone;
    fullDesc = `Agente: ${name}. Especialidade: ${specialty}. Papel no debate: ${roleLabel}. Tom de voz: ${toneLabel}.` + (extra ? ` Observacoes: ${extra}.` : '');
  }

  if (!fullDesc) return res.status(400).json({ error: 'Preencha o formulario (nome e especialidade sao obrigatorios).' });
  if (name && !specialty) return res.status(400).json({ error: 'Especialidade e obrigatoria.' });
  if (!name && !specialty && !description) return res.status(400).json({ error: 'Nome e especialidade sao obrigatorios.' });

  try {
    const systemMsg = `Voce e um assistente especializado em criar agentes de IA para debates.
Sua tarefa e gerar a configuracao de um agente com base nas respostas do usuario.

Retorne APENAS um JSON valido (sem markdown, sem texto antes ou depois) neste formato:
{
  "name": "nome curto do agente em portugues, 1-3 palavras",
  "system_prompt": "persona detalhada em portugues explicando quem e o agente, sua especialidade, como deve se comportar em debates e seu tom. Maximo 3 paragrafos.",
  "avatar": "um emoji que represente o agente"
}

Regras:
- name: curto, em portugues, 1-3 palavras
- system_prompt: em portugues, tom profissional, descreva a personalidade e a expertise
- avatar: emoji como balanca, microscopio, livro, martelo, grafico, etc.
- NAO inclua cor no JSON (o usuario ja escolheu)`;

    const chatMessages = [
      { role: 'system', content: systemMsg },
      { role: 'user', content: `Crie um agente para: ${fullDesc}` }
    ];

    const result = await callAI(
      { api_url: AI_API_URL, api_key: AI_API_KEY, model: AI_MODEL },
      chatMessages,
      { maxTokens: 4000, temperature: 0.3 }
    );

    console.log('[GenerateAgent] IA respondeu (len=' + (result ? result.length : 0) + '):', JSON.stringify(result).substring(0, 500));

    // Strip markdown code fences if present
    const cleaned = (result || '').replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    // Parse JSON from response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Resposta invalida da IA: ' + cleaned.substring(0, 200));

    const config = JSON.parse(jsonMatch[0]);

    if (!config.name || !config.system_prompt) {
      throw new Error('Configuracao incompleta gerada pela IA');
    }

    // Validate/clean config
    config.name = config.name.trim().substring(0, 100);
    config.system_prompt = config.system_prompt.trim();
    // Cor/voz vem do formulario do usuario (preferencia dele)
    config.color = color || '#8b5cf6';
    config.avatar = config.avatar ? config.avatar.trim().substring(0, 2) : config.name.charAt(0).toUpperCase();
    config.voice = voice || 'nova';

    // Gerar o arquivo agents.md
    const roleLabelMd = { defensor: 'Defensor de uma posicao', cético: 'Cetico / questionador', moderador: 'Moderador / equilibrado', especialista: 'Especialista tecnico', inovador: 'Inovador / visionario' }[role] || role || 'Nao definido';
    const toneLabelMd = { profissional: 'Profissional', direto: 'Direto e objetivo', calmo: 'Calmo e analitico', agressivo: 'Agressivo / confrontador', didatico: 'Didatico' }[tone] || tone || 'Nao definido';
    const agentsMd = `# ${config.name}

> Gerado por IA em ${new Date().toISOString()}

## Identidade
- **Especialidade:** ${specialty || 'Nao definida'}
- **Papel no debate:** ${roleLabelMd}
- **Tom de voz:** ${toneLabelMd}
- **Avatar:** ${config.avatar}
- **Cor:** ${config.color}

## System Prompt (persona)
${config.system_prompt}

## Configuracao tecnica
- **Modelo:** ${AI_MODEL}
- **API:** ${AI_API_URL}
- **Voz (TTS):** ${config.voice}
${extra ? `\n## Observacoes do criador\n${extra}\n` : ''}
---
*Arquivo gerado automaticamente pelo Tri-Chat - Criador de Agente com IA*
`;

    config.agents_md = agentsMd;

    if (create) {
      const existingAgent = db.prepare('SELECT api_url, api_key, model FROM agents WHERE active = 1 LIMIT 1').get();
      const agentApiUrl = existingAgent ? existingAgent.api_url : AI_API_URL;
      const agentApiKey = existingAgent ? existingAgent.api_key : AI_API_KEY;
      const agentModel = existingAgent ? existingAgent.model : AI_MODEL;

      const insertResult = db.prepare(
        'INSERT INTO agents (name, model, api_url, api_key, system_prompt, color, avatar, voice, agents_md) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(config.name, agentModel, agentApiUrl, agentApiKey, config.system_prompt, config.color, config.avatar, config.voice, agentsMd);

      const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(insertResult.lastInsertRowid);
      broadcast('agent_created', { ...agent, api_key: maskKey(agent.api_key) });
      return res.json({ agent: { ...agent, api_key: maskKey(agent.api_key) }, generated: config });
    }

    res.json({ generated: config });
  } catch (err) {
    console.error('[GenerateAgent] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// ── API: TTS (OpenAI) ──
app.get(`${BASE}/api/voices`, (req, res) => {
  res.json(VOICES);
});

app.post(`${BASE}/api/tts`, async (req, res) => {
  const { text, voice, agent_id } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });

  // Determine voice: from request, from agent, or default
  let selectedVoice = voice || 'nova';
  if (agent_id && !voice) {
    const agent = db.prepare('SELECT voice FROM agents WHERE id = ?').get(agent_id);
    if (agent?.voice) selectedVoice = agent.voice;
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured. Set OPENAI_API_KEY environment variable.' });
  }

  try {
    const response = await fetch(OPENAI_TTS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.substring(0, 4096),
        voice: selectedVoice,
        response_format: 'mp3'
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      throw new Error(`OpenAI TTS ${response.status}: ${errText.substring(0, 300)}`);
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error('[TTS] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── AI Calling ──
function isAnthropicUrl(url) {
  return url.includes('/anthropic') || url.includes('anthropic');
}

// Non-streaming AI call — uses fetch directly, returns full response text
async function callAI(agent, chatMessages, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  const maxTokens = opts.maxTokens || 800;

  try {
    const anthropic = isAnthropicUrl(agent.api_url);
    let headers, body, apiUrl;

    if (anthropic) {
      const systemMsg = chatMessages.find(m => m.role === 'system');
      const userMessages = chatMessages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));
      const merged = [];
      for (const msg of userMessages) {
        const last = merged[merged.length - 1];
        if (last && last.role === msg.role) { last.content += '\n\n' + msg.content; }
        else { merged.push({ role: msg.role, content: msg.content }); }
      }
      if (merged.length > 0 && merged[0].role !== 'user') {
        merged.unshift({ role: 'user', content: 'Por favor, responda à pergunta acima.' });
      }
      headers = { 'Content-Type': 'application/json', 'x-api-key': agent.api_key, 'anthropic-version': '2023-06-01' };
      body = JSON.stringify({ model: agent.model, max_tokens: maxTokens, messages: merged, ...(systemMsg ? { system: systemMsg.content } : {}) });
      apiUrl = agent.api_url.replace(/\/+$/, '');
      if (!apiUrl.includes('/v1/messages')) { apiUrl = apiUrl + '/v1/messages'; }
    } else {
      headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${agent.api_key}` };
      body = JSON.stringify({ model: agent.model, messages: chatMessages, temperature: opts.temperature ?? 0.8, max_tokens: maxTokens, stream: false });
      apiUrl = agent.api_url;
    }

    const response = await fetch(apiUrl, { method: 'POST', headers, body, signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API ${response.status}: ${errText.substring(0, 300)}`);
    }

    const data = await response.json();

    if (anthropic) {
      // Anthropic format
      const blocks = data.content || [];
      const text = blocks.filter(b => b.type === 'text').map(b => b.text).join('');
      return text;
    } else {
      // OpenAI format
      const choice = data.choices && data.choices[0];
      if (!choice) return '';
      const msg = choice.message || {};
      // Prefer content; some reasoning models put output in content and reasoning in reasoning_content
      return (msg.content || '').trim();
    }
  } finally {
    clearTimeout(timeout);
  }
}

// Streaming — yields text chunks as they arrive
async function* callAIStream(agent, chatMessages, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const anthropic = isAnthropicUrl(agent.api_url);
    let headers, body, apiUrl;
    const maxTokens = opts.maxTokens || 800;

    if (anthropic) {
      const systemMsg = chatMessages.find(m => m.role === 'system');
      const userMessages = chatMessages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content
      }));

      const merged = [];
      for (const msg of userMessages) {
        const last = merged[merged.length - 1];
        if (last && last.role === msg.role) {
          last.content += '\n\n' + msg.content;
        } else {
          merged.push({ role: msg.role, content: msg.content });
        }
      }
      if (merged.length > 0 && merged[0].role !== 'user') {
        merged.unshift({ role: 'user', content: 'Por favor, responda à pergunta acima.' });
      }

      headers = {
        'Content-Type': 'application/json',
        'x-api-key': agent.api_key,
        'anthropic-version': '2023-06-01'
      };
      body = JSON.stringify({
        model: agent.model,
        max_tokens: maxTokens,
        stream: true,
        messages: merged,
        ...(systemMsg ? { system: systemMsg.content } : {})
      });
      apiUrl = agent.api_url.replace(/\/+$/, '');
      if (!apiUrl.includes('/v1/messages')) {
        apiUrl = apiUrl + '/v1/messages';
      }
    } else {
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agent.api_key}`
      };
      body = JSON.stringify({
        model: agent.model,
        messages: chatMessages,
        temperature: opts.temperature ?? 0.8,
        max_tokens: maxTokens,
        stream: true
      });
      apiUrl = agent.api_url;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API ${response.status}: ${errText.substring(0, 500)}`);
    }

    // Parse SSE stream
    const reader = response.body;
    const decoder = new TextDecoder();
    let buffer = '';

    for await (const chunk of reader) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('event:')) continue;

        if (anthropic) {
          // Anthropic SSE: content_block_delta with text_delta or thinking_delta
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.type === 'content_block_delta') {
                if (data.delta?.type === 'text_delta' && data.delta?.text) {
                  yield data.delta.text;
                }
                // Skip thinking_delta — don't yield internal reasoning
              }
            } catch (e) { /* skip malformed */ }
          }
        } else {
          // OpenAI SSE: data: {"choices":[{"delta":{"content":"..."}}]}
          if (trimmed === 'data: [DONE]') return;
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) yield content;
            } catch (e) { /* skip malformed */ }
          }
        }
      }
    }
  } finally {
    clearTimeout(timeout);
  }
}

// ── Debate Loop ──
async function startDebate(taskId) {
  // Prevent duplicate debate loops
  if (runningDebates.has(taskId)) return;
  runningDebates.set(taskId, 'running');

  console.log(`[Debate] Starting debate for task ${taskId}`);
    logEvent({ task_id: taskId, event: 'debate_start', details: `Debate ${taskId} iniciado` });

  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!task) return;

    const agents = db.prepare(`
      SELECT a.* FROM agents a
      JOIN task_agents ta ON a.id = ta.agent_id
      WHERE ta.task_id = ? AND a.active = 1
    `).all(taskId);

    if (agents.length === 0) {
      console.log(`[Debate] No agents for task ${taskId}, waiting`);
      logEvent({ task_id: taskId, event: 'debate_no_agents', level: 'warn', details: 'Nenhum agente ativo encontrado' });
      runningDebates.delete(taskId);
      return;
    }

    const totalRounds = task.rounds || DEFAULT_ROUNDS;

    // ── Debate rounds ──
    for (let round = 1; round <= totalRounds; round++) {
      if (runningDebates.get(taskId) === 'cancelled') break;
      const currentStatus = db.prepare('SELECT status FROM tasks WHERE id = ?').get(taskId)?.status;
      if (currentStatus !== 'debating') break;

      for (const agent of agents) {
        if (runningDebates.get(taskId) === 'cancelled') break;
        const st = db.prepare('SELECT status FROM tasks WHERE id = ?').get(taskId)?.status;
        if (st !== 'debating') break;

        // Broadcast typing indicator
        broadcast('agent_typing', { task_id: taskId, agent_id: agent.id, agent_name: agent.name, agent_color: agent.color, agent_avatar: agent.avatar, round });

        // Build context from all messages
        const messages = db.prepare('SELECT * FROM messages WHERE task_id = ? ORDER BY id ASC').all(taskId);

        // Build a clear transcript of the dialogue so far
        let transcript = '';
        for (const m of messages) {
          if (m.author_type === 'user') {
            transcript += `PERGUNTA INICIAL: ${m.content}\n\n`;
          } else if (m.agent_id === agent.id) {
            transcript += `EU (${agent.name}) disse:\n${m.content}\n\n`;
          } else {
            transcript += `${m.author} disse:\n${m.content}\n\n`;
          }
        }

        const isLastRound = round === totalRounds;
        const isLastTurn = isLastRound;
        const otherAgents = messages.filter(m => m.author_type === 'agent' && m.agent_id !== agent.id);
        const lastOther = otherAgents.length > 0 ? otherAgents[otherAgents.length - 1] : null;
        const whoSaid = lastOther ? lastOther.author : 'os outros participantes';

        // Get other agents' names
        const allAgentNames = agents.map(a => a.name);
        const otherNames = allAgentNames.filter(n => n !== agent.name).join(' e ');
        const agentIndex = agents.indexOf(agent);
        const stance = agentIndex === 0 ? 'discordar se necessário, apresentar contra-argumentos' : 'buscar pontos diferentes, questionar premissas';

        // System prompt — natural dialogue, not formal debate
        let systemContent = `${agent.system_prompt}

Você está tendo uma conversa natural com ${otherNames} sobre o tema "${task.title}". O usuário se chama Junior e acompanha a conversa.

POSICIONAMENTO: Seu papel é ${stance}. NÃO concorde automaticamente com o que o outro disse. Questione, traga nuances, apresente outro ângulo.

REGRAS OBRIGATÓRIAS:
- SUA FALA DEVE TER NO MÁXIMO 2 FRASES. Direto e curto. Se passar de 2, FALHOU.
- Fale como gente conversando, NÃO como relatório.
- Chame os outros pelo nome: ${otherNames} e Junior.
- PROIBIDO: títulos, bullet points, listas, markdown, parágrafos longos.
- Responda APENAS em português do Brasil. NUNCA use caracteres de outros idiomas.
- Não use palavras em espanhol, inglês ou qualquer outro idioma.`;

        if (isLastTurn) {
          systemContent += `\n\nEsta é sua última fala. Feche o raciocínio de forma natural, como quem encerra uma conversa.`;
        }

        const chatMessages = [
          { role: 'system', content: systemContent }
        ];

        chatMessages.push({ role: 'user', content: transcript.trim() });

        // Natural dialogue cues
        if (round === 1 && totalRounds === 1) {
          chatMessages.push({
            role: 'user',
            content: `Você é ${agent.name}. Dê sua opinião sobre o tema de forma natural, como se estivesse conversando com um colega. Português do Brasil.`
          });
        } else if (round === 1) {
          chatMessages.push({
            role: 'user',
            content: `Você é ${agent.name}. Abra a conversa dando sua visão sobre o tema de forma natural. Português do Brasil.`
          });
        } else if (isLastTurn) {
          chatMessages.push({
            role: 'user',
            content: `Você é ${agent.name}. Responda ao que ${whoSaid} falou e encerre sua participação de forma natural. Português do Brasil.`
          });
        } else {
          chatMessages.push({
            role: 'user',
            content: `Você é ${agent.name}. Responda ao que ${whoSaid} falou de forma natural, como uma conversa. Português do Brasil.`
          });
        }

        try {
          // Stream tokens and broadcast partial content
          let fullResponse = '';
          for await (const token of callAIStream(agent, chatMessages, { maxTokens: 2000 })) {
            fullResponse += token;
            broadcast('agent_stream', {
              task_id: taskId,
              agent_id: agent.id,
              agent_name: agent.name,
              agent_color: agent.color,
              agent_avatar: agent.avatar,
              round,
              content: fullResponse
            });
          }

          // Sanitize: remove CJK/foreign characters only
          fullResponse = fullResponse.replace(/[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\u0600-\u06FF\u3000-\u303F\uFF00-\uFFEF]/g, "").replace(/\s{2,}/g, " ").trim();

          const result = db.prepare(
            'INSERT INTO messages (task_id, round, author, author_type, agent_id, content, color) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).run(taskId, round, agent.name, 'agent', agent.id, fullResponse, agent.color);

          const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
          broadcast('message_created', message);
          logEvent({ task_id: taskId, agent_id: agent.id, event: 'agent_response', details: `Rodada ${round}: ${agent.name} respondeu (${fullResponse.length} chars)`, model: agent.model, api_url: agent.api_url });
        } catch (err) {
          console.error(`[Debate] Agent ${agent.name} (${agent.model}) failed in round ${round}:`, err.message);
          logEvent({ task_id: taskId, agent_id: agent.id, event: 'agent_error', level: 'error', details: `Rodada ${round}: ${agent.name} falhou`, model: agent.model, api_url: agent.api_url, error: err.message });
          const errMsg = db.prepare(
            'INSERT INTO messages (task_id, round, author, author_type, agent_id, content, color) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).run(taskId, round, `⚠️ ${agent.name}`, 'system', null, `Erro ao contactar ${agent.name}: ${err.message}`, '#ef4444');
          broadcast('message_created', db.prepare('SELECT * FROM messages WHERE id = ?').get(errMsg.lastInsertRowid));
        }

        // Delay between agents
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    // ── Check if debate was cancelled ──
    if (runningDebates.get(taskId) === 'cancelled') {
      runningDebates.delete(taskId);
      return;
    }

    // ── Auto-generate conclusion ──
    const currentStatus = db.prepare('SELECT status FROM tasks WHERE id = ?').get(taskId)?.status;
    if (currentStatus === 'debating') {
      // Set to concluding
      db.prepare("UPDATE tasks SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?").run('concluding', taskId);
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
      const agents2 = db.prepare('SELECT a.id, a.name, a.color, a.avatar FROM agents a JOIN task_agents ta ON a.id = ta.agent_id WHERE ta.task_id = ?').all(taskId);
      broadcast('task_updated', { ...task, agents: agents2 });
      broadcast('agent_typing', { task_id: taskId, agent_id: null, agent_name: '📋 Síntese', round: 'conclusão' });

      try {
        // Build transcript
        const messages = db.prepare('SELECT * FROM messages WHERE task_id = ? ORDER BY id ASC').all(taskId);
        let transcript = `Tema: ${task.title}\n`;
        if (task.description) transcript += `Contexto: ${task.description}\n\n`;
        for (const m of messages) {
          transcript += `[${m.author}]: ${m.content}\n\n`;
        }

        const chatMessages = [
          { role: 'system', content: 'Você é um mediador imparcial e analista de debates. Leia o debate abaixo e escreva uma conclusão estruturada em português do Brasil:\n\n1. **Resumo das posições** — cite nominalmente cada participante e sua tese principal (2-3 frases)\n2. **Pontos de convergência** — onde houve acordo ou parcial acordo\n3. **Pontos de divergência** — os desacordos centrais e seus fundamentos\n4. **Síntese final** — qual posição se mostrou mais bem fundamentada e por quê\n\nSeja objetivo, cite artigos de lei quando mencionados no debate, e não invente informações.' },
          { role: 'user', content: `Analise o seguinte debate e escreva uma conclusão geral sintetizada:\n\n${transcript}` }
        ];

        const agent = db.prepare(`SELECT a.* FROM agents a JOIN task_agents ta ON a.id = ta.agent_id WHERE ta.task_id = ? AND a.active = 1 LIMIT 1`).get(taskId);
        if (agent) {
          const response = await callAI(agent, chatMessages);
          const result = db.prepare('INSERT INTO conclusions (task_id, agent_id, author, content, color) VALUES (?, ?, ?, ?, ?)').run(taskId, null, '📋 Síntese Geral', response, '#22c55e');
          const conclusion = db.prepare('SELECT * FROM conclusions WHERE id = ?').get(result.lastInsertRowid);
          broadcast('conclusion_created', conclusion);
          logEvent({ task_id: taskId, event: 'conclusion_generated', details: `Conclusão gerada (${response.length} chars)` });
        }
      } catch (err) {
        console.error('[Auto-Conclude] Error:', err.message);
        logEvent({ task_id: taskId, event: 'conclusion_error', level: 'error', error: err.message });
      }

      // Close task
      db.prepare("UPDATE tasks SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?").run('closed', taskId);
      const closedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
      const closedAgents = db.prepare('SELECT a.id, a.name, a.color, a.avatar FROM agents a JOIN task_agents ta ON a.id = ta.agent_id WHERE ta.task_id = ?').all(taskId);
      broadcast('task_updated', { ...closedTask, agents: closedAgents });
    }
  } catch (err) {
    console.error(`[Debate] Fatal error for task ${taskId}:`, err);
    logEvent({ task_id: taskId, event: 'debate_fatal', level: 'error', error: err.message });
  } finally {
    runningDebates.delete(taskId);
  }
}

// ── API: Podcast TTS — generate single audio for entire dialogue ──
app.post(`${BASE}/api/tasks/:taskId/podcast`, async (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'task not found' });

  const messages = db.prepare('SELECT * FROM messages WHERE task_id = ? AND author_type = ? ORDER BY id ASC').all(req.params.taskId, 'agent');
  if (messages.length === 0) return res.status(400).json({ error: 'no agent messages' });

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  broadcast('podcast_generating', { task_id: parseInt(req.params.taskId), status: 'starting' });
    logEvent({ task_id: parseInt(req.params.taskId), event: 'podcast_start', details: `Gerando podcast com ${messages.length} mensagens` });

  try {
    const audioBuffers = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      broadcast('podcast_generating', {
        task_id: parseInt(req.params.taskId),
        status: 'generating',
        current: i + 1,
        total: messages.length,
        agent_name: msg.author
      });

      // Get agent voice
      let voice = 'nova';
      if (msg.agent_id) {
        const agent = db.prepare('SELECT voice FROM agents WHERE id = ?').get(msg.agent_id);
        if (agent?.voice) voice = agent.voice;
      }

      // Clean text — remove markdown formatting for speech
      let cleanText = msg.content
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .trim();

      try {
        const response = await fetch(OPENAI_TTS_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: cleanText.substring(0, 4096),
            voice: voice,
            response_format: 'mp3'
          })
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => 'Unknown error');
          console.error(`[Podcast] TTS failed for ${msg.author}: ${response.status} ${errText.substring(0, 200)}`);
          continue; // Skip this message but continue with others
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        audioBuffers.push(buffer);
      } catch (err) {
        console.error(`[Podcast] TTS error for ${msg.author}:`, err.message);
        continue;
      }
    }

    if (audioBuffers.length === 0) {
      return res.status(500).json({ error: 'Failed to generate any audio' });
    }

    // Combine all audio buffers (simple concatenation — MP3 frames are self-contained)
    const combined = Buffer.concat(audioBuffers);

    broadcast('podcast_generating', {
      task_id: parseInt(req.params.taskId),
      status: 'done',
      size: combined.length
    });
    logEvent({ task_id: parseInt(req.params.taskId), event: 'podcast_done', details: `Podcast gerado: ${(combined.length / 1024).toFixed(1)}KB` });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="podcast-${task.title.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 40)}.mp3"`);
    res.setHeader('Content-Length', combined.length);
    res.send(combined);

  } catch (err) {
    console.error('[Podcast] Error:', err.message);
    logEvent({ task_id: parseInt(req.params.taskId), event: 'podcast_error', level: 'error', error: err.message });
    broadcast('podcast_generating', { task_id: parseInt(req.params.taskId), status: 'error', error: err.message });
    res.status(500).json({ error: err.message });
  }
});


// ── API: Logs ──
app.get(`${BASE}/api/logs`, (req, res) => {
  const { task_id, agent_id, level } = req.query;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 500);
  let query = 'SELECT * FROM logs WHERE 1=1';
  const params = [];
  if (task_id) { query += ' AND task_id = ?'; params.push(task_id); }
  if (agent_id) { query += ' AND agent_id = ?'; params.push(agent_id); }
  if (level) { query += ' AND level = ?'; params.push(level); }
  query += ' ORDER BY id DESC LIMIT ?';
  params.push(limit);
  const logs = db.prepare(query).all(...params);
  res.json(logs);
});

// ── API: Stats ──
app.get(`${BASE}/api/stats`, (req, res) => {
  const totalDebates = db.prepare('SELECT COUNT(*) as c FROM tasks').get().c;
  const totalMessages = db.prepare('SELECT COUNT(*) as c FROM messages').get().c;
  const totalAgents = db.prepare('SELECT COUNT(*) as c FROM agents WHERE active = 1').get().c;
  const totalErrors = db.prepare("SELECT COUNT(*) as c FROM logs WHERE level = 'error'").get().c;
  const recentLogs = db.prepare('SELECT * FROM logs ORDER BY id DESC LIMIT 10').all();
  res.json({ totalDebates, totalMessages, totalAgents, totalErrors, recentLogs });
});

// ── Static + Main ──
app.use(`${BASE}/public`, express.static(path.join(__dirname, 'public')));
app.get(`${BASE}`, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get(`${BASE}/`, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Jr Conversation running on http://localhost:${PORT}${BASE}/`);
  console.log(`Token: ${TOKEN}`);
  require('fs').writeFileSync(path.join(__dirname, '.token'), TOKEN);
});

// ── Graceful Shutdown ──
function shutdown(signal) {
  console.log(`\n[Shutdown] ${signal} received, closing server...`);
  try {
    // Cancel all running debates
    for (const [taskId] of runningDebates) {
      runningDebates.set(taskId, 'cancelled');
    }
    // Close SSE connections
    for (const c of clients) { try { c.end(); } catch (e) {} }
    clients.clear();
    // Close database
    db.close();
    console.log('[Shutdown] Database closed. Goodbye!');
  } catch (e) {
    console.error('[Shutdown] Error during shutdown:', e.message);
  }
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
