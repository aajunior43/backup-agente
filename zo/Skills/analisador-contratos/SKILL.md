---
name: analisador-contratos
description: >-
  Analisa contratos (PDF, DOCX ou texto) e produz um relatório estruturado com
  resumo executivo, tabela de dados-chave, análise cláusula a cláusula, matriz
  de riscos, checagem de conformidade (Lei 14.133/2021 para contratos
  administrativos) e recomendações. Use quando Aleksandro pedir para analisar,
  revisar, auditar, conferir ou resumir um contrato, minuta, aditivo ou termo
  de referência.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  display-name: 📄 Analisador de Contratos
  version: "1.0"
  tags: [contratos, jurídico, administrativo, lei-14133, licitação, análise, riscos]
---

# 📄 Skill: Analisador de Contratos

Lê um contrato (PDF/DOCX/texto) e entrega um relatório de análise completo: o que o contrato diz, quais os riscos, se está em conformidade e o que corrigir.

## Quando usar

- "Analisa esse contrato pra mim"
- "Revisa essa minuta e aponta os riscos"
- "Confere se esse contrato está de acordo com a 14.133"
- "Resume as cláusulas principais desse aditivo"
- "Esse contrato tem alguma pegadinha?"

## Instruções de execução

### Passo 1 — Obtenha o contrato

- Se Aleksandro mencionou um arquivo, leia com `read_file` (PDF/DOCX aceitos).
- Se colou o texto no chat, use direto.
- Se não há contrato ainda, peça o arquivo/texto antes de prosseguir.

### Passo 2 — Identifique o tipo

Determine se é:
- **Contrato administrativo** (envolve órgão público → aplicar módulo Lei 14.133/2021)
- **Contrato privado/civil** (particulares → análise civil geral)
- **Aditivo, ata, termo de referência ou minuta** (ajustar escopo)

### Passo 3 — Extraia os dados-chave

Preencha a tabela do relatório com: partes, objeto, valor, vigência, forma de pagamento, garantia, reajuste, rescisão, foro e nº do processo/licitação (se houver). Marque `[não consta]` quando o dado faltar — nunca invente.

### Passo 4 — Análise cláusula a cláusula

Para cada bloco relevante, avalie e sinalize o risco (ver `references/checklist.md`):
- 🟢 OK / 🟡 Atenção / 🔴 Crítico
- Justifique cada marcação em 1-2 linhas com referência à cláusula.

### Passo 5 — Conformidade (só para contratos administrativos)

Cheque os pontos da Lei 14.133/2021 em `references/checklist.md`: cláusulas essenciais do art. 92, hipóteses de contratação, matriz de riscos, reajuste, sanções, garantia, publicação. Marque o que está conforme, ausente ou irregular.

### Passo 6 — Monte a matriz de riscos

Liste os riscos encontrados ordenados por severidade, cada um com: descrição, probabilidade, impacto e recomendação de mitigação.

### Passo 7 — Entregue o relatório

Use o formato de saída abaixo. Salve em `Contratos/analise-<objeto-curto>-<AAAA-MM-DD>.md` (crie a pasta se necessário) e envie o resumo executivo no chat.

## Formato de saída

````markdown
# 📄 Análise de Contrato — [objeto resumido]

**Data da análise:** [AAAA-MM-DD] | **Tipo:** [administrativo/privado/minuta/aditivo]

## 🎯 Resumo executivo
[3-5 linhas: do que trata, valor, prazo, e os 2-3 pontos mais críticos]

## 📋 Dados-chave
| Item | Valor encontrado |
|------|------------------|
| Partes | ... |
| Objeto | ... |
| Valor total | ... |
| Vigência | ... |
| Pagamento | ... |
| Garantia | ... |
| Reajuste | ... |
| Rescisão | ... |
| Foro | ... |
| Processo/Licitação | ... |

## 🔍 Análise cláusula a cláusula
### [Bloco/Cláusula]
- **Risco:** 🟢/🟡/🔴 — [justificativa em 1-2 linhas]

## ⚖️ Conformidade (Lei 14.133/2021) *(só contratos administrativos)*
| Ponto | Situação |
|-------|----------|
| Cláusulas essenciais (art. 92) | ✅/⚠️/❌ |
| ... | ... |

## 🚨 Matriz de riscos
| # | Risco | Prob. | Impacto | Mitigação |
|---|-------|-------|---------|-----------|
| 1 | ... | alta | alto | ... |

## ✅ Recomendações
1. [ação concreta, priorizada]

## ⚠️ Observações / premissas
- [dados ausentes, premissas adotadas, ressalvas]
````

## Regras obrigatórias

- **Nunca invente** dados, cláusulas ou valores — marque `[não consta]`.
- **Raciocine passo a passo** ao avaliar riscos; cite a cláusula/número quando possível.
- **Não substitui advogado** — inclua ressalva de que é uma análise preliminar.
- Para fatos legais (artigos de lei), **verifique antes de citar**; se incerto, marque [não verificado].
- Relatório sempre em PT-BR, tom técnico e direto.

## Referências

- `references/checklist.md` — checklist de análise por tipo de contrato + pontos da Lei 14.133/2021
