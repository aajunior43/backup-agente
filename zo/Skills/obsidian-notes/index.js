#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const VAULT_BASE = '/home/administrator/obsidian/vaults/MeuCofre';

function slugify(text) {
  return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
}

function nowStamp() {
  return new Date().toISOString().slice(0, 10);
}

function buildNoteContent(title, content, tags = [], area, subfolder) {
  let md = `# ${title}\n\n`;
  if (tags?.length) md += `_tags: ${tags.map(t => `#${t}`).join(' ')}_\n\n`;
  md += `_Created: ${nowStamp()}_\n_Area: ${area}_\n_Subfolder: ${subfolder}_\n\n${content}\n`;
  return md;
}

function run(inputs) {
  try {
    const { title, content, folder, tags = [] } = inputs;
    if (!title || !content) return { status: 'error', message: 'Título e conteúdo obrigatórios' };

    // Determinar área e subpasta
    let area = 'ALEKSANDRO';
    let subfolder = folder || 'Geral';

    // Se folder não informado, usar regras simples baseadas no título/conteúdo
    if (!folder) {
      const txt = (title + ' ' + content).toLowerCase();
      if (txt.includes('prefeitura') || txt.includes('licitacao') || txt.includes('edital') || txt.includes('tce') || txt.includes('copel') || txt.includes('energia')) {
        area = 'PREFEITURA';
        if (txt.includes('senha') || txt.includes('login') || txt.includes('token')) subfolder = 'Senhas';
        else if (txt.includes('licitacao') || txt.includes('edital') || txt.includes('pregão')) subfolder = 'Licitacoes';
        else if (txt.includes('financas') || txt.includes('contabilidade') || txt.includes('empenho')) subfolder = 'Financas';
        else subfolder = 'Documentos_Gerais';
      } else {
        area = 'ALEKSANDRO';
        if (txt.includes('youtube') || txt.includes('canal') || txt.includes('vídeo')) subfolder = 'YouTube';
        else if (txt.includes('saude') || txt.includes('pressao') || txt.includes('glicemia') || txt.includes('medico')) subfolder = 'Saude';
        else if (txt.includes('gasto') || txt.includes('compra') || txt.includes('nubank') || txt.includes('banco')) subfolder = 'Financas';
        else if (txt.includes('pc') || txt.includes('computador') || txt.includes('windows') || txt.includes('otimizar')) subfolder = 'Tech/PC';
        else if (txt.includes('script') || txt.includes('python') || txt.includes('openclaw') || txt.includes('automacao')) subfolder = 'Tech';
        else if (txt.includes('obsidian') || txt.includes('nota') || txt.includes('anotacao')) subfolder = 'Notas';
        else if (txt.includes('prompt') || txt.includes('gpt') || txt.includes('claude') || txt.includes('openrouter')) subfolder = 'Biblioteca de Prompts';
        else if (txt.includes('estudo') || txt.includes('aprender') || txt.includes('curso')) subfolder = 'Estudos';
        else if (txt.includes('projeto') || txt.includes('hobby') || txt.includes('planos')) subfolder = 'Projetos';
        else if (txt.includes('contato') || txt.includes('telefone') || txt.includes('whatsapp')) subfolder = 'Contatos';
        else subfolder = 'Geral';
      }
    }

    const targetDir = path.join(VAULT_BASE, area, subfolder);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const filename = `${nowStamp()}-${slugify(title)}.md`;
    const filepath = path.join(targetDir, filename);
    const contentMD = buildNoteContent(title, content, tags, area, subfolder);

    fs.writeFileSync(filepath, contentMD, 'utf8');

    return {
      status: 'created',
      path: path.join(area, subfolder, filename),
      message: `Nota criada em ${area}/${subfolder}`,
      vault: 'MeuCofre',
      area,
      subfolder
    };
  } catch (e) {
    return { status: 'error', message: e.message };
  }
}

module.exports = { run };
