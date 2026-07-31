---
name: dotacao-orcamentaria
description: >-
  Auxilia na consulta e análise de dotações orçamentárias da Prefeitura
  de Inajá/PR. Pesquisa leis orçamentárias (LOA, LDO, PPA), código
  tributário e documentação fiscal do município para fundamentar
  ofícios, relatórios, empenhos e processos administrativos.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  display-name: 💰 Dotação Orçamentária
  output-format: dotacao-com-id
  version: "2.2"
  tags: [orcamento, prefeitura, inaja, loa, ldo, ppa, tributario, despesas, empenho]
---
# Skill: Dotação Orçamentária

Consulta e análise de dotações orçamentárias, leis e documentação fiscal
da Prefeitura de Inajá/PR. Usada para localizar o **ID da dotação** (Número
da despesa) para empenho, verificar saldo por ação/fonte, e fundamentar
processos administrativos.

## ⚠️ FORMATO OBRIGATÓRIO DE RESPOSTA

**Aleksandro sempre precisa do ID da dotação para empenhar e da classificação completa da despesa.** Toda resposta de dotação orçamentária deve usar este formato:

```markdown
| ID Dotação | Classificação da Despesa | Ação | Fonte | Saldo |
|:----------:|--------------------------|------|-------|-------:|
| **ID** | N.G.M.E.SS.II.FF.DD — Descrição | N.AAA — Nome da Ação | Código — Recurso | R$ X.XXX,XX |
```

Onde a classificação segue a estrutura:

| Dígitos | Significado | Exemplo (3.3.90.14.00.00.00.00.00) |
|---------|-------------|----------------------------------|
| N (1º) | **Categoria Econômica** — 3 = Despesa Corrente | 3 |
| G (2º) | **Grupo de Despesa (GND)** — 3 = Outras Despesas Correntes | 3 |
| M (3º) | **Modalidade de Aplicação** — 90 = Aplicações Diretas | 90 |
| E (4º) | **Elemento de Despesa** — 14 = Diárias-Civil | 14 |
| SS (5º) | Subitem | 00 |
| II (6º) | Item | 00 |
| FF (7º) | Fonte | 00 |
| DD (8º) | Desdobramento | 00 |

**Exemplo correto:**

| ID Dotação | Classificação da Despesa | Ação | Fonte | Saldo |
|:----------:|--------------------------|------|-------|-------:|
| **199** | 3.3.90.14.00.00.00.00 — DIÁRIAS-CIVIL | 2.902 — Manutenção da Divisão de Saúde | 00000 — Recursos Ordinários (Livres) | R$ 282,89 |
| **199** | 3.3.90.14.00.00.00.00 — DIÁRIAS-CIVIL | 2.902 — Manutenção da Divisão de Saúde | 00303 — SAÚDE - RECEITAS VINCULADAS (EC 29/00 - 15%) | R$ 2.850,35 |

### Regras

1. **ID da dotação** (coluna `Número da despesa`) é o campo mais importante — sempre em **negrito** na tabela
2. **Classificação da despesa** sempre com o código completo + descrição (ex: `3.3.90.14.00.00.00.00 — DIÁRIAS-CIVIL`)
3. Agrupar por ação, ordenar do maior saldo para o menor
4. Se a mesma natureza tiver duas fontes, mostrar ambas
5. Ao final, perguntar: *"Qual destes você quer empenhar?"*
6. Se só tiver uma dotação, já retornar o ID + confirmação sem perguntar
7. **Nunca omitir o ID nem a classificação completa**

### Quando a dotação não existe

Explicar que não existe na unidade/ação solicitada e sugerir:
1. Alternativa mais próxima (outra ação ou natureza similar)
2. Solicitar suplementação na dotação desejada

## Arquivos de referência

### Principal — CSV de despesas

O arquivo mais usado para consultar dotações é o CSV de relação de despesas:

| Caminho | Conteúdo |
|---------|----------|
| `hermes-backup/dados/relacao_despesas_inaja.csv` | Todas as dotações orçamentárias |
| `hermes-backup/dados/orcamento-inaja-2026-despesas.csv` | Mesmo conteúdo (cópia) |

**Colunas do CSV:**

| Coluna | Descrição |
|--------|-----------|
| Entidade | Prefeitura ou Câmara |
| Número do Organograma | Código do órgão (ex: 09.001 = Direção Hospitalar) |
| Descrição do organograma | Nome da unidade |
| Número da ação | Código da ação (ex: 2.902) |
| Descrição da ação | Nome da ação |
| Número da despesa | **⚠️ ID da dotação** — usado para empenhar |
| Natureza de Despesa | Código da natureza (ex: 3.3.90.14) |
| Descrição da natureza de despesa | Ex: DIÁRIAS-CIVIL, MATERIAL DE CONSUMO |
| Recurso | Código completo da fonte de recurso |
| Descrição do recurso | Ex: RECURSOS ORDINÁRIOS (LIVRES), EC 29/00 - 15% |
| Saldo atual da despesa | Valor disponível para empenho |

### Documentos complementares

| Arquivo | Conteúdo |
|---------|----------|
| `Prefeitura/manual_empenho_liquidacao_pagamento_inaja.pdf` | Manual de empenho, liquidação e pagamento |
| `Prefeitura/manual_empenho_liquidacao_pagamento_inaja_ocr.txt` | Versão OCR do manual |
| `Prefeitura/Lei-ordinaria-598-2001-Codigo-Tributario-Inaja-PR.pdf` | Código Tributário Municipal |
| `Prefeitura/relatorio_1porcento_fpm_julho.pdf` | Relatório 1% FPM |
| `Prefeitura/relatorio_1porcento_fpm_julho.tex` | Fonte LaTeX do relatório |
| `Prefeitura/prefeitos-inaja.pdf` | Histórico de prefeitos |
| `Prefeitura/Leis/` | Leis municipais diversas |

## Como usar

### 1. Buscar dotação por ação

```bash
grep ";2.902;" /home/workspace/hermes-backup/dados/relacao_despesas_inaja.csv
```

### 2. Buscar por unidade (órgão)

```bash
grep "DIVISÃO DE VIGILANCIA SANITÁRIA" /home/workspace/hermes-backup/dados/relacao_despesas_inaja.csv
```

### 3. Buscar por natureza de despesa

```bash
# Diárias-Civil
grep "3.3.90.14" /home/workspace/hermes-backup/dados/relacao_despesas_inaja.csv

# Material de Consumo (combustível, etc.)
grep "3.3.90.30" /home/workspace/hermes-backup/dados/relacao_despesas_inaja.csv
```

### 4. Buscar por fonte de recurso

```bash
# EC 29/00 - 15%
grep "EC 29/00" /home/workspace/hermes-backup/dados/relacao_despesas_inaja.csv

# Recursos Ordinários (Livres)
grep "RECURSOS ORDINÁRIOS" /home/workspace/hermes-backup/dados/relacao_despesas_inaja.csv
```

### 5. Buscar combinando ação + natureza

```bash
# Diárias na Ação 2.902
grep "2.902" /home/workspace/hermes-backup/dados/relacao_despesas_inaja.csv | grep "3.3.90.14"

# Material de consumo na Ação 2.903 (Vigilância Sanitária)
grep "2.903" /home/workspace/hermes-backup/dados/relacao_despesas_inaja.csv | grep "3.3.90.30"
```

### 6. Usar Python para relatórios estruturados

```python
import csv
from pathlib import Path

path = Path("/home/workspace/hermes-backup/dados/relacao_despesas_inaja.csv")
rows = list(csv.reader(path.read_text(encoding="utf-8").splitlines(), delimiter=";"))
header = [h.strip() for h in rows[0]]
col = {name: i for i, name in enumerate(header)}

def get(row, key):
    return row[col[key]].strip() if key in col and len(row) > col[key] else ""

# Exemplo: filtrar por ação
for row in rows[1:]:
    if get(row, "Número da ação") == "2.902":
        print(f"ID {get(row, 'Número da despesa')} | {get(row, 'Natureza de Despesa')} — {get(row, 'Descrição da natureza de despesa')} | {get(row, 'Descrição do recurso')} | R$ {get(row, 'Saldo atual da despesa')}")
```

## Gerar PDF da Dotação

Após apresentar a dotação no formato obrigatório, SEMPRE perguntar:
*"Quer gerar um PDF com estas informações?"*

O PDF é um documento padronizado contendo:

- **Cabeçalho:** Brasão de Inajá/PR, nome da Prefeitura, endereço e CNPJ
- **Título:** INFORMAÇÃO DE DOTAÇÃO ORÇAMENTÁRIA
- **Tabela de campos:** Órgão, Unidade, Programa, Ação, Natureza da Despesa, Identificador da Dotação (ID), Fonte de Recurso, Saldo Atual
- **Finalidade/Histórico:** campo livre que deve ser preenchido com o motivo do empenho
- **Rodapé:** data, local e observações legais

### Como gerar

```bash
python3 /home/workspace/Skills/dotacao-orcamentaria/scripts/gerar-pdf-dotacao.py \
  --orgao "PREFEITURA MUNICIPAL DE INAJÁ" \
  --unidade "NOME DA UNIDADE" \
  --programa "NOME DO PROGRAMA" \
  --acao "CÓDIGO" \
  --desc-acao "NOME DA AÇÃO" \
  --classificacao "N.G.ME.SS.II.FF.DD" \
  --desc-natureza "DESCRIÇÃO DA NATUREZA" \
  --id-dotacao "NÚMERO" \
  --fonte "CÓDIGO" \
  --desc-fonte "DESCRIÇÃO DA FONTE" \
  --saldo VALOR \
  --finalidade "Motivo do empenho"
```

### Arquivos

| Caminho | Função |
|---------|--------|
| `Skills/dotacao-orcamentaria/scripts/gerar-pdf-dotacao.py` | Script de geração do PDF |
| `Skills/dotacao-orcamentaria/assets/modelo-dotacao.html` | Template HTML do documento |
| `Prefeitura/brasao-inaja.png` | Brasão do município |
| `Prefeitura/Documentos/dotacao-{ID}-{data}.pdf` | PDF gerado |

### Regras

1. **Sempre perguntar** se o usuário quer o PDF — não gerar sem confirmação
2. **Solicitar a finalidade** se o usuário não informou o motivo do empenho
3. Preencher **todos os parâmetros** do script com os dados consultados
4. Informar o caminho exato do PDF gerado na resposta
5. O PDF é salvo em `Prefeitura/Documentos/` com o padrão `dotacao-{ID}-{AAAA-MM-DD}.pdf`

## Naturezas de despesa mais comuns

| Código | Descrição |
|--------|-----------|
| 3.3.90.14 | DIÁRIAS-CIVIL |
| 3.3.90.30 | MATERIAL DE CONSUMO (combustível, material de escritório, etc.) |
| 3.3.90.36 | OUTROS SERVIÇOS DE TERCEIROS-PESSOA FÍSICA |
| 3.3.90.39 | OUTROS SERVIÇOS DE TERCEIROS-PESSOA JURÍDICA |
| 3.3.90.48 | OUTROS AUXÍLIOS FINANCEIROS A PESSOAS FÍSICAS |
| 3.3.50.43 | SUBVENÇÕES SOCIAIS |
| 3.1.90.11 | VENCIMENTOS E VANTAGENS FIXAS-PESSOAL CIVIL |
| 3.1.90.13 / 3.1.91.13 | CONTRIBUIÇÕES PATRONAIS |
| 4.4.90.52 | EQUIPAMENTOS E MATERIAL PERMANENTE |

## Dicas importantes

- O **Número da despesa** é o **ID da dotação** — use esse número para empenhar
- Uma mesma ação + natureza pode ter **duas linhas**: uma para Recursos Ordinários (00000) e outra para fonte vinculada (EC 29/00, 00104, etc.)
- Para saber se o saldo é suficiente, compare o valor a empenhar com o `Saldo atual da despesa`
- O `manual_empenho_liquidacao_pagamento_inaja.pdf` explica o fluxo completo de empenho
