---
name: latex-pdf
description: Cria documentos PDF profissionais usando LaTeX com templates prontos para ofícios, relatórios, cartas e mais. Compila com xelatex/lualatex diretamente.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  category: Official
  display-name: LaTeX PDF Generator
  emoji: 📜
---

# LaTeX PDF Generator

## Quando usar

Use esta skill quando o usuário pedir para **criar um PDF** com formatação profissional — especialmente documentos oficiais como ofícios, memorandos, relatórios, declarações, notificações, contratos ou cartas formais. Prefira esta skill (LaTeX nativo) em vez do pandoc quando o documento precisa de **layout controlado, numeração de páginas, cabeçalhos/rodapés personalizados, timbre ou elementos gráficos**.

## Templates disponíveis

| Tipo | Arquivo | Uso |
|---|---|---|
| **Ofício** | `references/modelo_oficio.tex` | Documento oficial para autoridades (prefeito, secretários, TCE) |
| **Relatório** | `references/modelo_relatorio.tex` | Relatórios técnicos, auditoria, prestação de contas |
| **Carta Formal** | `references/modelo_carta.tex` | Comunicações externas formais |
| **Declaração/Certidão** | `references/modelo_declaracao.tex` | Declarações simples com testemunhas |

## Fluxo de trabalho

### 1. Escolher o template

Copie o template desejado de `references/` para a pasta de trabalho ou para `Prefeitura/`:

```bash
cp Skills/latex-pdf/references/modelo_oficio.tex /home/workspace/Prefeitura/meu_oficio.tex
```

### 2. Editar o conteúdo

Edite o arquivo .tex com:
- **Destinatário**, **remetente**, **assunto**
- **Corpo do texto** (substitua o placeholder)
- **Local e data**

### 3. Compilar para PDF

Use o script auxiliar ou compile manualmente:

```bash
# Opção 1 — script auxiliar (recomendado)
bun Skills/latex-pdf/scripts/gerar-pdf.ts /caminho/do/arquivo.tex

# Opção 2 — direto com lualatex
cd /home/workspace/Prefeitura && lualatex -interaction=nonstopmode meu_oficio.tex
```

O script aceita:
- `--clean` — remove arquivos auxiliares (.aux, .log, .out) após compilar
- `--open` — abre o PDF (se houver visualizador disponível)

### 4. Verificar

- Confirme que o PDF foi gerado no mesmo diretório do .tex
- Leia o PDF com `read_file` para verificar visualmente
- Se houver erros de compilação, o log está no mesmo diretório (`.log`)

## Dicas

- **Sempre use lualatex** como engine — tem melhor suporte a Unicode (acentos, emojis, caracteres especiais)
- **Duas compilações** podem ser necessárias para acertar referências e numeração de páginas (o script já faz isso)
- Para **timbre/brasão**: use `\includegraphics` com o caminho absoluto da imagem no workspace
- Para **documentos com muitas páginas**: o template de relatório tem numeração automática
- Se precisar de **fontes diferentes**: adicione `\usepackage{fontspec}` e `\setmainfont{Font Name}` com lualatex

## Manutenção

- Adicione novos templates em `references/` conforme a demanda
- Mantenha os templates parametrizados (com `\newcommand` para dados variáveis)
