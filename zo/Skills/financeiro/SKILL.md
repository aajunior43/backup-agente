---
name: financeiro
description: Gerencia registros financeiros pessoais — contas mensais, faturas de cartão (Inter, Nubank), gastos avulsos e saldo bancário. Use esta skill sempre que o usuário mencionar gastos, contas a pagar, faturas, cartão de crédito, saldo bancário, ou pedir para "anotar" valores financeiros.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  version: "1.0"
  tags: [finanças, contas, cartão, gastos, orçamento]
---

# Skill: Financeiro Pessoal

## O que faz

Gerencia todos os arquivos financeiros do Aleksandro: contas mensais, faturas de cartão de crédito, gastos avulsos e saldo bancário.

## Arquivos

| Arquivo | O que contém |
|---------|-------------|
| `financeiro/contas_maio_2026.md` | Contas fixas e variáveis de maio/2026 — valor, status de pagamento, total, sobra |
| `financeiro/contas_junho_2026.md` | Contas fixas e variáveis de junho/2026 — valor, status de pagamento, total, sobra |
| `financeiro/fatura-inter.md` | Detalhamento da fatura do cartão Inter — itens, valores por mês, histórico |
| `financeiro/contas_maio_2026.pdf` | Versão PDF das contas de maio |
| `financeiro/contas_junho_2026.pdf` | Versão PDF das contas de junho |

**Padrão de nomenclatura para meses futuros:** `contas_<mês>_<ano>.md` (ex: `contas_julho_2026.md`)

## Estrutura dos arquivos de contas mensais

Cada arquivo `contas_<mês>_<ano>.md` segue este formato:

```markdown
# 💳 Contas — <Mês>/<Ano>
**Vencimento: 10/<mês>/<ano>**

| Despesa | Valor (R$) |
|---------|------------|
| Fatura Inter | <valor> |
| Fatura Nubank | <valor> |
| ... | ... |
| **TOTAL** | **<total>** |

## Resumo
- **Salário:** R$ 5.000,00
- **Total contas:** R$ <total>
- **Sobra:** R$ <sobra>

## ⚡ Observações
...
```

**Padrões de marcação de status:**
- `✅ PAGO` — conta já quitada
- `~~valor~~` — valor anterior riscado (substituído por novo)
- `→ **novo_valor**` — atualização de valor (com explicação entre parênteses)
- `🎉 FINALIZADA` ou `🎉 última parcela` — parcela finalizada comemorar

## Estrutura do arquivo de fatura Inter

`financeiro/fatura-inter.md` contém:

```markdown
# Fatura Cartão Inter
**Mês em aberto:** <mês>/<ano>

## <Mês>/<Ano>
**Valor:** R$ <total>
| Item | Valor (R$) |
|------|------------|
| ... | ... |
| **Total** | **<total>** |

## Histórico
| Mês | Valor (R$) |
|-----|------------|
| ... | ... |
```

## Comportamento — como lidar com os pedidos do usuário

### Quando o usuário diz "anota aí", "gastei X no Inter/Nubank", "adicione X reais no cartão"

1. **Identifique o mês atual** e o arquivo correto (`contas_<mês>_<ano>.md`)
2. **Leia o arquivo atual** antes de editar
3. **Atualize o valor** na tabela de contas mensais
4. **Se for Inter**, atualize TAMBÉM o `fatura-inter.md` com o detalhamento do gasto
5. **Atualize o total e a sobra** (Salário 5.000 - Total)
6. **Confirme** o que foi registrado e o novo total

### Quando o usuário diz "marquei como pago", "paguei X"

1. Adicione `✅ PAGO` ao lado do valor
2. Atualize se necessário

### Quando o usuário pergunta "quanto gastei", "meus gastos", "financeiro"

1. Leia os arquivos relevantes e apresente um resumo

### Quando o usuário pergunta sobre Inter especificamente

1. Leia **ambos** os arquivos: `fatura-inter.md` (detalhamento) e `contas_<mês>_<ano>.md` (visão mensal)
2. Apresente os valores com a composição de gastos

### Quando começa um novo mês

1. Crie `financeiro/contas_<mês>_<ano>.md` copiando a estrutura do mês anterior
2. Remova marcações de PAGO do mês anterior
3. Ajuste valores recorrentes conforme necessário
4. Atualize o mês em aberto no `fatura-inter.md`

## Valores recorrentes (base)

| Despesa | Valor mensal |
|---------|-------------|
| Fatura Inter | variável |
| Fatura Nubank | variável |
| Faculdade — Ciências Contábeis | R$ 153,00 |
| Faculdade — Administração | R$ 153,00 |
| Guarda Noturno Doca | R$ 60,00 |
| Ar condicionado | R$ 170,00 (última parcela?) |
| Extensão Lovable | R$ 39,90 |
| Bike ergométrica | R$ 100,00 (FINALIZADA em maio/2026) |

## Salário base

**R$ 5.000,00** — usar para calcular a sobra: `5000 - total_contas`

## Cartões

| Cartão | Arquivo de detalhamento |
|--------|------------------------|
| Inter | `financeiro/fatura-inter.md` |
| Nubank | (sem arquivo dedicado ainda — só nas contas mensais) |

## Bancos e saldo

O usuário mantém saldo em:
- **Bradesco** (principal)
- **Magie**
- **PicPay**

Quando houver atualização de saldo, registrar na seção "Atualização de Saldo Bancário" do arquivo do mês.

## Notas importantes

- O vencimento das contas é sempre **dia 10** de cada mês
- Nunca apague valores antigos — risque com `~~` e adicione o novo
- Mantenha o PDF sincronizado quando fizer alterações significativas (use a skill `zo-generate-pdf`)
- Sempre confirme com o usuário após registrar — ele costuma perguntar "Anotou?"
- O usuário é direto e objetivo, responda no mesmo estilo
