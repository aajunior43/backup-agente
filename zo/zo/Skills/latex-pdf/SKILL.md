---
name: html-pdf
description: Cria documentos PDF bonitos e profissionais a partir de HTML ou Markdown. Converte com weasyprint usando temas prontos (modern, classic, elegant, corporate). Use quando o usuário pedir qualquer documento em PDF — ofícios, relatórios, declarações, memorandos, atas, apresentações ou documentos pessoais.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  category: Documents
  display-name: HTML to PDF Generator
  emoji: 📄
---

# HTML to PDF Generator

Gera PDFs com design profissional a partir de arquivos **HTML** ou **Markdown**. Usa `weasyprint` para conversão com suporte completo a CSS (cores, fontes, layouts, cabeçalhos, rodapés, tabelas estilizadas).

## Quando usar

Use esta skill quando o usuário pedir para **criar um PDF** — especialmente:
- Ofícios, relatórios, declarações, memorandos, atas de reunião
- Apresentações, currículos, certificados
- Qualquer documento que precise de aparência profissional

## Fluxo de trabalho

### 1. A partir de Markdown (mais simples)

```bash
bun Skills/html-pdf/scripts/gerar-pdf.ts documento.md
```

O script converte automaticamente MD → HTML → PDF usando pandoc + weasyprint.

### 2. A partir de HTML (mais controle)

```bash
bun Skills/html-pdf/scripts/gerar-pdf.ts pagina.html --theme elegant
```

### 3. Com tema específico

```bash
bun Skills/html-pdf/scripts/gerar-pdf.ts doc.md --theme corporate --output relatorio.pdf
```

## Temas disponíveis

| Tema | Estilo | Ideal para |
|------|--------|------------|
| `modern` | Azul, limpo, sem serifa | Relatórios, documentos gerais |
| `classic` | Serifado, tons quentes | Documentos formais, acadêmicos |
| `elegant` | Roxo, minimalista | Apresentações, portfólios |
| `corporate` | Azul marinho, institucional | Documentos oficiais, contratos |

Padrão: `modern`.

## Opções do script

```
bun gerar-pdf.ts <arquivo> [opções]

  --theme <nome>      modern | classic | elegant | corporate
  --output <caminho>  PDF de saída (padrão: mesmo nome com .pdf)
  --css <caminho>     CSS customizado (sobrescreve tema)
  --title <texto>     Título do documento
```

## CSS customizado

Para total controle visual, crie um CSS e passe com `--css`:

```bash
bun Skills/html-pdf/scripts/gerar-pdf.ts doc.md --css /home/workspace/meu-estilo.css
```

Use os arquivos em `themes/` como base.

## Estrutura de arquivos

```
Skills/html-pdf/
├── SKILL.md
├── themes/
│   ├── modern.css      # Azul, limpo, sem serifa
│   ├── classic.css     # Serifado, tons quentes
│   ├── elegant.css     # Roxo, minimalista
│   └── corporate.css   # Azul marinho, institucional
├── scripts/
│   └── gerar-pdf.ts    # Conversor principal
└── config/
    └── municipio.json  # Dados do município (fallback)
```

## Dicas

- **Markdown**: use `#`, `##`, `**negrito**`, `*itálico*`, `- listas`, `> citações`, ` ```código``` `
- **Tabelas em MD**: tabelas markdown são convertidas e estilizadas automaticamente
- **Imagens**: use `<img src="/caminho/absoluto.png">` ou `![alt](caminho)` em MD
- **Cabeçalho/rodapé**: os temas já incluem numeração de páginas no rodapé
- **Quebras de página**: use `<div style="page-break-before: always">` para forçar nova página
- **Erros**: se falhar, o HTML intermediário é salvo como `.debug.html` para inspeção

## Dependências

- `pandoc` — converte Markdown para HTML
- `weasyprint` — converte HTML+CSS para PDF
