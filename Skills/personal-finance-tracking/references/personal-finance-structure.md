# Estrutura de Diretórios Financeiros do Junior

## Fonte da Verdade (JSON)

`~/workspace/dados/financeiro.json`
- Único arquivo JSON com todas as transações
- Schema: transactions[] com id, date, type, amount, description, category, recurrent, due_date, notes
- Atualizado via Python `json.load/dump`
- NUNCA usar read_file+write_file (trunca >500 linhas)

## Registros Mensais (Markdown)

`~/workspace/documentos/contas-<MES>-<ANO>/estimativa.md`
- Ex: `contas-abril-2026/`, `contas-maio-2026/`
- Visão legível para o usuário
- Auto-gerado a partir do financeiro.json
- Estrutura: Contas Previstas / Recorrentes / Cartões / Mercado / Resumo Geral

## Detalhamento de Faturas

`~/workspace/documentos/contas-abril-2026/gastos-cartao-inter.md`
- Registro consolidado da fatura do cartão Inter
- Valor total = Único número, não itemizado
- Referência ao JSON para detalhes internos

## Arquivos Legados (não usar como fonte)

`~/workspace/dados/financeiro/financeiro-aleksandro.md`
- Contém info geral (renda, meta, objetivos)
- NÃO contém transações detalhadas
- Mantido para referência histórica

## Arquivos Legados Eva (OpenClaw)

`~/workspace/skills/financeiro-organizado/`
`~/workspace/skills/controle-financeiro/`
`~/workspace/skills/finance-unified/`
`~/workspace/skills/contador-mensal/`
- Skills do OpenClaw (Eva)
- NÃO são skills do Hermes
- Não usar como referência ativa
