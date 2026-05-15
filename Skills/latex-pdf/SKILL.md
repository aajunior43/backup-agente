---
name: latex-pdf
description: Cria documentos PDF profissionais usando LaTeX. Templates prontos para ofícios, relatórios, declarações, memorandos e atas de reunião. Compila com lualatex/xelatex/pdflatex. Use quando o usuário pedir qualquer documento oficial em PDF.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  category: Documents
  display-name: LaTeX PDF Generator
  emoji: 📜
---

# LaTeX PDF Generator

## Quando usar

Use esta skill quando o usuário pedir para **criar um PDF** com formatação profissional — especialmente documentos oficiais como ofícios, relatórios, declarações, memorandos e atas.

## Fluxo de trabalho

### Opção A: Gerar a partir de template (rápido)

1. Copie o template para o destino
2. Preencha os `\newcommand` no topo do .tex
3. Compile com `gerar-pdf.ts`

### Opção B: Preencher via JSON (automatizado)

1. Crie um JSON com os dados
2. Use `fill-template.py` para gerar o .tex preenchido
3. Compile com `gerar-pdf.ts`

## Templates disponíveis

| Template | Arquivo | Uso |
|----------|---------|-----|
| Ofício | `references/modelo_oficio.tex` | Comunicação oficial para autoridades |
| Relatório | `references/modelo_relatorio.tex` | Relatórios técnicos, auditorias |
| Declaração | `references/modelo_declaracao.tex` | Declarações simples com testemunhas |
| Memorando | `references/modelo_memorando.tex` | Comunicação interna entre setores |
| Ata de Reunião | `references/modelo_ata_reuniao.tex` | Registro de deliberações |

## Scripts

### 1. Compilar PDF (`gerar-pdf.ts`)

```bash
# Compilar
bun scripts/gerar-pdf.ts /home/workspace/Prefeitura/oficio.tex

# Compilar e limpar auxiliares
bun scripts/gerar-pdf.ts /home/workspace/Prefeitura/oficio.tex --clean

# Usar outro compilador
bun scripts/gerar-pdf.ts /home/workspace/Prefeitura/oficio.tex --engine xelatex

# Verificar dependências antes
bun scripts/gerar-pdf.ts /home/workspace/Prefeitura/oficio.tex --check --clean
```

Suporta `--engine lualatex` (padrão), `xelatex` ou `pdflatex`.

### 2. Preencher template (`fill-template.py`)

```bash
# Listar templates
python3 scripts/fill-template.py --list-templates

# Preencher com JSON
python3 scripts/fill-template.py references/modelo_oficio.tex dados.json --output /home/workspace/Prefeitura/meu_oficio.tex
```

Exemplo de `dados.json`:
```json
{
  "numeroOficio": "042/2026",
  "destinatarioNome": "Secretário de Saúde",
  "destinatarioCargo": "Secretário Municipal de Saúde",
  "assuntoOficio": "Solicitação de materiais",
  "remetenteNome": "Nome do Remetente",
  "remetenteCargo": "Cargo do Remetente"
}
```

### 3. Diagnóstico (`check-latex.py`)

```bash
python3 scripts/check-latex.py
```

Verifica compiladores instalados e testa compilação mínima.

## Configuração do município

Os dados do município ficam em `config/municipio.json`:

```json
{
  "municipio": "Inajá",
  "uf": "PR",
  "prefeitura": "Prefeitura Municipal de Inajá",
  "prefeito": "João Eder Aguilar",
  "brasao_path": ""
}
```

Estes valores são usados como fallback pelo `fill-template.py` — se o JSON não sobrescrever, os valores do município são aplicados automaticamente.

## Dicas

- **Timbre/brasão**: use `\includegraphics{caminho/absoluto.png}` no template
- **Fontes personalizadas**: ad `\usepackage{fontspec}` + `\setmainfont{Nome}` com lualatex
- **Muitas páginas**: o template de relatório tem numeração automática
- **Erros de compilação**: verifique o `.log` gerado na mesma pasta
- **Adicionar templates**: coloque em `references/` e mantenha os `\newcommand` parametrizados
