---
name: html-pdf
description: Cria documentos PDF bonitos e profissionais a partir de HTML ou Markdown. Converte com weasyprint usando temas prontos (modern, classic, elegant, corporate). Suporta imagens, tabelas, citações, CSS customizado e formatação rica. Use quando o usuário pedir qualquer documento em PDF — ofícios, relatórios, apostilas, receitas, manuais, etc.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  category: Documents
  display-name: HTML PDF Generator
  emoji: 📄
---

# HTML PDF Generator

## Quando usar

Use esta skill quando o usuário pedir para **criar um PDF** com formatação profissional e visual moderno — apostilas, relatórios, receitas, manuais, ofícios, ou qualquer documento que precise ter boa aparência.

## Fluxo de trabalho

### 1. Preparar conteúdo

Escreva o conteúdo em **Markdown** (`.md`) ou **HTML** (`.html`):

```markdown
# Título do Documento

## Seção 1

Texto com **negrito** e *itálico*.

![Legenda da imagem](imagens/foto.jpg)

| Coluna 1 | Coluna 2 |
|----------|----------|
| Dado 1   | Dado 2   |

> Citação importante em destaque.
```

### 2. Gerar o PDF

```bash
# Básico (tema moderno padrão)
bun Skills/html-pdf/scripts/gerar-pdf.ts doc.md

# Com tema específico
bun Skills/html-pdf/scripts/gerar-pdf.ts doc.md --theme elegant

# Saída com nome customizado
bun Skills/html-pdf/scripts/gerar-pdf.ts doc.md --output /home/workspace/Outputs/relatorio.pdf

# CSS customizado (combinado com tema)
bun Skills/html-pdf/scripts/gerar-pdf.ts doc.html --css /home/workspace/estilo.css

# Abrir PDF automaticamente após gerar
bun Skills/html-pdf/scripts/gerar-pdf.ts doc.md --open
```

### 3. Resultado

O PDF será gerado no mesmo diretório do arquivo de entrada (ou no caminho especificado com `--output`).

## Imagens

O script resolve caminhos automaticamente:

| Tipo de caminho | Exemplo | Comportamento |
|-----------------|---------|---------------|
| Relativo | `imagens/foto.jpg` | ✅ Convertido para `file://` absoluto |
| Absoluto | `/home/workspace/foto.jpg` | ✅ Usado como `file://` |
| URL | `https://exemplo.com/foto.jpg` | ✅ Baixado pelo weasyprint |
| Data URI | `data:image/png;base64,...` | ✅ Preservado |
| Não encontrada | `foto-inexistente.jpg` | ⚠️ Aviso no console, PDF gerado sem imagem |

**Regra:** coloque imagens no mesmo diretório ou subdiretório do arquivo `.md`/`.html`.

## Temas disponíveis

| Tema | Estilo | Ideal para |
|------|--------|------------|
| `modern` | Azul, limpo, profissional | Relatórios, documentos gerais |
| `classic` | Serifado, tons quentes | Documentos formais, certidões |
| `elegant` | Roxo, minimalista | Apresentações, portfólios |
| `corporate` | Azul marinho, institucional | Ofícios, atas, documentos oficiais |

## Scripts

### `gerar-pdf.ts` (principal)

```bash
bun Skills/html-pdf/scripts/gerar-pdf.ts <arquivo> [opções]
```

| Opção | Descrição |
|-------|-----------|
| `--theme <nome>` | Tema CSS: modern, classic, elegant, corporate |
| `--output <caminho>` | Caminho do PDF de saída |
| `--css <caminho>` | CSS customizado (combinado com tema) |
| `--title <texto>` | Título do documento `<title>` |
| `--open` | Abre o PDF após gerar com `xdg-open` |

## Dicas

- **Imagens**: coloque na mesma pasta do `.md`, use caminho relativo
- **Tabelas**: funciona com sintaxe markdown de tabelas (e pipe tables)
- **Citações**: use `> texto` no markdown
- **Quebras de página**: adicione `<div style="page-break-before: always;"></div>` no HTML
- **Tamanho**: imagens grandes aumentam o PDF. Redimensione antes se necessário
- **Erros**: se falhar, um `.debug.html` é salvo ao lado do PDF para inspeção
- **CSS customizado**: use `--css` para adicionar estilos extras sem modificar o tema

## Dependências

- `pandoc` — converte Markdown para HTML
- `weasyprint` — converte HTML+CSS para PDF
- Ambos já estão instalados no sistema
