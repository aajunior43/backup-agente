#!/usr/bin/env node

/**
 * Skill: obsidian-notes (inteligente)
 * Cria notas no vault do Obsidian com classificação automática
 *
 * Se começar com "Nota", analisa o conteúdo para decidir se vai para
 * ALEKSANDRO (pessoal) ou PREFEITURA (trabalho). Se não houver pasta adequada,
 * cria uma nova que combine com o conteúdo.
 */

import fs from 'fs';
import path from 'path';

// Caminho do vault
const VAULT_BASE = '/home/administrator/obsidian/vaults/MeuCofre';

// Slugify
function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function nowStamp() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// Detectar se comando começa com "Nota"
function isNoteCommand(text) {
  return text.trim().toLowerCase().startsWith('nota');
}

// Análise de conteúdo para classificação
function classifyContent(content, title = '') {
  const txt = (title + ' ' + content).toLowerCase();

  // Palavras-chave da PREFEITURA
  const prefeituraKeywords = [
    'prefeitura', 'inajá', 'municipal', 'secretaria', 'finanças',
    'contabilidade', 'edital', 'licitação', 'contrato', 'tce',
    'diário oficial', 'portal da transparência', 'betah', 'btha',
    'empenho', 'ordem de pagamento', 'rp', 'rp', 'crédito',
    'lei orçamentária', 'loa', 'ppp', 'plano plurianual',
    'prefeito', 'vice-prefeito', 'vereador', 'câmara',
    'tesouraria', 'contas públicas', 'pregão', 'ata',
    'certidão', 'nota fiscal', 'nf-e', 'xml', 'destae',
    'concurso', 'edital concurso', 'prova', 'cargo público'
  ];

  // Palavras-chave PESSOAIS
  const pessoalKeywords = [
    'vó cida', 'mãe', 'simone', 'jaqueline', 'pai', 'avó',
    'tia solange', 'myllena', 'familia', 'familiar',
    'saúde', 'pressão', 'glicemia', 'diabetes', 'hipertensão',
    'médico', 'hospital', 'farmácia', 'remédio', 'exame',
    'gasto', 'compra', 'mercado', 'conta', 'cartão', 'crédito',
    'débito', 'nubank', 'inter', 'banco', 'investimento',
    'youtube', 'vídeo', 'canal', 'playlist', 'tech', 'linux',
    'automação', 'openclaw', 'script', 'python', 'node',
    'obsidian', 'vault', 'nota', 'anotação', 'ideia',
    'projeto', 'hobby', 'estudo', 'aprender', 'curso'
  ];

  // Contagem de matches
  let prefeituraScore = 0;
  let pessoalScore = 0;

  for (const kw of prefeituraKeywords) {
    if (txt.includes(kw)) prefeituraScore++;
  }
  for (const kw of pessoalKeywords) {
    if (txt.includes(kw)) pessoalScore++;
  }

  // Decisão
  if (prefeituraScore > pessoalScore) {
    return { area: 'PREFEITURA', confidence: prefeituraScore };
  } else if (pessoalScore > prefeituraScore) {
    return { area: 'ALEKSANDRO', confidence: pessoalScore };
  }
  // Empate ou baixas contagens: default para pessoal, mas relata incerteza
  return { area: 'ALEKSANDRO', confidence: Math.max(prefeituraScore, pessoalScore), uncertain: true };
}

// Sugerir subpasta dentro da área
function suggestSubfolder(area, content, title) {
  const txt = (title + ' ' + content).toLowerCase();

  // Mapeamento de temas para subpastas
  const mapping = {
    'PREFEITURA': [
      { keywords: ['licitação', 'edital', 'pregão', 'ata'], folder: 'Licitacoes' },
      { keywords: ['secretaria', 'finanças', 'contabilidade', 'empenho', 'op', 'rp'], folder: 'Financas' },
      { keywords: ['tce', 'prestação de contas', 'relatório', 'balanço'], folder: 'Controle_Externo' },
      { keywords: ['concurso', 'edital concurso', 'cargo público', 'prova'], folder: 'Concursos' },
      { keywords: ['portaria', 'decreto', 'lei', 'resolução'], folder: 'Legislacao' },
      { keywords: ['processo', 'protocolo', 'documento'], folder: 'Processos' },
      { keywords: ['senha', 'acesso', 'credencial', 'token'], folder: 'Senhas' },
      { keywords: ['reunião', 'agenda', 'compromisso'], folder: 'Agenda' }
    ],
    'ALEKSANDRO': [
      { keywords: ['youtube', 'vídeo', 'canal', 'playlist'], folder: 'YouTube' },
      { keywords: ['saúde', 'pressão', 'glicemia', 'médico', 'hospital'], folder: 'Saude' },
      { keywords: ['gasto', 'compra', 'conta', 'cartão', 'mercado'], folder: 'Financas' },
      { keywords: ['obsidian', 'nota', 'anotação', 'ideia'], folder: 'Notas' },
      { keywords: ['script', 'python', 'node', 'openclaw', 'automacao'], folder: 'Tech' },
      { keywords: ['estudo', 'aprender', 'curso', 'livro'], folder: 'Estudos' },
      { keywords: ['projeto', 'hobby', 'planos'], folder: 'Projetos' },
      { keywords: ['contato', 'telefone', 'whatsapp', 'e-mail'], folder: 'Contatos' }
    ]
  };

  const areaMappings = mapping[area] || [];
  for (const map of areaMappings) {
    for (const kw of map.keywords) {
      if (txt.includes(kw)) {
        return map.folder;
      }
    }
  }

  // Default: pasta genérica
  return area === 'PREFEITURA' ? 'Documentos_Gerais' : 'Geral';
}

// Montar conteúdo completo com metadata
function buildNoteContent(title, content, tags = [], area, subfolder) {
  const date = nowStamp();
  let md = `# ${title}\n\n`;
  if (tags.length > 0) {
    md += `_tags: ${tags.map(t => `#${t}`).join(' ')}_\n\n`;
  }
  md += `_Created: ${date}_\n`;
  md += `_Area: ${area}_\n`;
  if (subfolder) md += `_Subfolder: ${subfolder}_\n\n`;
  md += content + '\n';
  return md;
}

// Execução principal
async function run(inputs) {
  try {
    const { title, content, folder, tags = [] } = inputs;

    if (!title || !content) {
      return { status: 'error', message: 'Título e conteúdo são obrigatórios' };
    }

    // Verificar se é comando "Nota" — se não for, usa comportamento antigo (folder explícito)
    const isNoteCmd = isNoteCommand(title + ' ' + content);
    let targetArea = 'ALEKSANDRO';
    let subfolder = 'Geral';
    let autoClassified = false;

    if (isNoteCmd) {
      // Remover palavra "Nota" do título se presente
      let cleanTitle = title;
      if (title.trim().toLowerCase().startsWith('nota')) {
        cleanTitle = title.replace(/^nota\s+/i, '').trim();
      }
      // Extrair conteúdo premierda mensagem completa para análise
      const fullText = cleanTitle + ' ' + content;
      const classification = classifyContent(fullText, cleanTitle);
      targetArea = classification.area;
      subfolder = suggestSubfolder(targetArea, fullText, cleanTitle);
      autoClassified = true;

      // Se folder foi passado explicitamente, usar ele como subpasta
      if (folder) {
        subfolder = folder;
      }
    } else {
      // Comportamento anterior: folder obrigatório
      if (!folder) {
        return { status: 'error', message: 'Para comandos que não começam com "Nota", é necessário informar a pasta (folder).' };
      }
      targetArea = 'ALEKSANDRO'; // padrão antigo
      subfolder = folder;
    }

    // Validar vault
    if (!fs.existsSync(VAULT_BASE)) {
      return { status: 'error', message: `Vault não encontrado: ${VAULT_BASE}` };
    }

    // Construir caminho: VAULT_BASE/Área/Subpasta/
    const targetDir = path.join(VAULT_BASE, targetArea, subfolder);

    // Criar diretórios se não existirem
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`[Obsidian] Criada nova pasta: ${targetArea}/${subfolder}`);
    }

    // Nome do arquivo
    const timestamp = nowStamp();
    const slug = slugify(cleanTitle || title);
    const filename = `${timestamp}-${slug}.md`;
    const filepath = path.join(targetDir, filename);

    // Conteúdo completo
    const noteContent = buildNoteContent(cleanTitle || title, content, tags, targetArea, subfolder);

    // Escrever arquivo
    fs.writeFileSync(filepath, noteContent, 'utf8');

    // Retorno
    const relativePath = path.join(targetArea, subfolder, filename);
    return {
      status: 'created',
      path: relativePath,
      message: `Nota criada em ${relativePath}${autoClassified ? ` (classificação automática: ${targetArea}/${subfolder})` : ''}`,
      vault: 'MeuCofre',
      area: targetArea,
      subfolder
    };

  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      error: true
    };
  }
}

module.exports = { run };
