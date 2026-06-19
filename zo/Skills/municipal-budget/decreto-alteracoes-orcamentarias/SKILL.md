---
name: decreto-alteracoes-orcamentarias
description: Gerar decretos de alterações orçamentárias para Inajá-PR no formato Betha
category: municipal-budget
---

# Decreto de Alterações Orçamentárias — Inajá-PR

## Contexto
Inajá-PR permite créditos suplementares por DECRETO (não precisa de Lei/Câmara), autorizado pela Lei Municipal nº 1359/2025. O formato segue o modelo do sistema Betha (referência: Decreto 034/2026).

## Base Legal
- **Art. 43, §1º, inciso I** da Lei 4.320/64 — Anulação de dotação orçamentária
- **Art. 43, §1º, inciso II** da Lei 4.320/64 — Excesso de arrecadação
- **Lei Municipal nº 1359/2025** — Autoriza o Prefeito a abrir créditos suplementares por decreto

## Formato do Decreto

### Cabeçalho
```
ESTADO DO PARANÁ
MUNICÍPIO DE INAJÁ
CNPJ: [CNPJ do Município]

DECRETO Nº ___/2026, de ___ de _________ de 2026.

[Assunto em maiúsculas]

O PREFEITO(A) MUNICIPAL DE INAJÁ, no uso de suas atribuições que lhe confere a Lei Orgânica do Município de INAJÁ e autorização contida na Lei Municipal nº 1359/2025, de 1 de Outubro de 2025,

D E C R E T A:
```

### Art. 1º — Dotações de destino (suplementação)
Lista cada dotação com código completo e recurso:
```
[ORGÃO] - [NOME DO ÓRGÃO]
[ORGÃO].[UNIDADE].4.[FUNÇÃO].[SUBFUNÇÃO]-[PROGRAMA]-[ND] — [DESCRIÇÃO ND] — R$ [VALOR]
[RECURSO] Recursos Ordinários (Livres) — [VALOR]
```

### Art. 2º — Fonte de anulação
Mesmo formato do Art. 1º, especificando de onde sai o recurso.
Inciso I = anulação de dotação
Inciso II = excesso de arrecadação

### Art. 3º — Vigência
```
Este decreto entrará em vigor na data de sua publicação, revogadas as disposições em contrário.
```

### Rodapé
```
GABINETE DO PREFEITO(A) MUNICIPAL, ___ de _________ de 2026.

JOÃO EDER AGUILAR
Prefeito
```

## Dados do Município
- Prefeito: João Eder Aguiar (conforme Decreto 034/2026)
- CNPJ: Verificar no decreto original
- Código do Município: Verificar nos dados orçamentários

## Tipos de Alteração Suportados
1. **Crédito Suplementar** — suplementar dotação com saldo insuficiente
2. **Crédito Especial** — criar nova dotação (precisa de Lei se não autorizado na LOA)
3. **Anulação** — cancelar dotação com saldo excedente

## Fontes de Anulação Possíveis
1. Reserva de Contingência (9.9.99.99) — R$ 300.000 disponíveis
2. Dotações com folga em outros órgãos (mesmo recurso: Ordinários Livres)
3. Excesso de arrecadação (inciso II)

## Mapeamento Comum de Dotações
- **Combustível (Transporte Escolar)**: não é ND separado. Cai sob **3.3.90.30 — Material de Consumo** no órgão 10.002 (Divisão de Transporte Escolar), ação 2.105, subfunção 361 (Ensino Fundamental), recurso Ordinários Livres. Saldo atual: R$ 58.167,00.
- **Reserva de Contingência**: órgão 99.099, ação 9.999, ND 365 / 9.9.99.99, recurso Ordinários Livres. Saldo: R$ 300.000,00.

## Formato do Código Completo de Dotação
O Betha monta o código assim: `[ÓRGÃO].[AÇÃO].[FUNÇÃO].[SUBFUNÇÃO]-[Nº DESPESA]`
Exemplo: `10.002.2.105.12.361-297` significa Órgão 10.002, Ação 2.105, Função 12, Subfunção 361, Despesa nº 297.
A ND completa: `3.3.90.30.00.00.00.00` (Material de Consumo).
O recurso: `00000.00000.01.07.00.00.1.500.0000` (Recursos Ordinários Livres).

## Geração de PDF
**wkhtmltopdf NÃO está instalado** no VPS. Use `fpdf2` (Python) como fallback:
- `from fpdf import FPDF` — já disponível no venv do Hermes
- **Pitfall 1**: Fontes built-in (Helvetica/Times/Courier) NÃO suportam caracteres Unicode (ç, ã, é, —). Use ASCII equivalente ou `unidecode`.
- **Pitfall 2**: Após `multi_cell()`, a posição X fica deslocada. Sempre chame `pdf.set_x(margin)` antes da próxima `cell()`/`multi_cell()`.
- **Pitfall 3**: DeprecationWarnings sobre `ln=1` — use `new_x="LMARGIN", new_y="NEXT"` na API v2.
- Margens recomendadas: `set_margins(15, 15, 15)` para linhas longas de código de recurso.
- Fonte 8pt para linhas de código de recurso/dotação (são muito longas).

## Observações
- Campos de número, data e emissão ficam em branco (___) para preenchimento manual
- Arquivo salvo em ~/ com padrão: `Decreto_Suplementar_[Tipo]_[Órgão].pdf`
- Gerar também versão HTML para conferência visual
- CNPJ confirmado: **76.459.687/0001-40**
- Nome do Prefeito: **JOÃO EDER AGUILAR** (conforme Decreto 034/2026)

## Arquivos de Referência
- Dados orçamentários: `~/workspace/dados/orcamento-inaja-2026-despesas.csv` (separador: `;` ponto-e-vírgula)
- Decreto modelo: `/home/administrator/.hermes/cache/documents/doc_b845ee9ac000_Decreto de Alterações Orçamentárias (1).pdf`
- Decreto gerado (combustível educação): `/home/administrator/Decreto_Suplementar_Combustivel_Educacao.pdf`

## Templates
- `templates/decreto-suplementar.py` — Script Python+fpdf2 para gerar decreto em PDF