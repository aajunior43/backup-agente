---
name: personal-finance-tracking
description: Track, update, and sync personal finance data for Junior (Aleksandro) using JSON as source-of-truth and Markdown for human-readable monthly summaries.
version: 1.0.0
---

# Personal Finance Tracking

Gerenciar e sincronizar dados financeiros pessoais do usuário (Junior), com fonte única em JSON e espelhamento em Markdown legível.

## Trigger
- Usuário pede para "atualizar contas", "quanto vou pagar", "meus gastos", "finanças", ou similar
- Usuário pergunta sobre **assinaturas**, **vencimentos**, **datas de pagamento**, "meus débitos automáticos"
- Usuário corrige valor/descricao de qualquer conta
- Início de novo mês (criar pasta `contas-<MES>-<ANO>`)

## Estrutura de Arquivos

```
~/workspace/dados/
  financeiro.json          ← FONTE DA VERDADE — transações (JSON)
  assinaturas.json         ← FONTE DA VERDADE — assinaturas/subscrições (JSON)
  financeiro/              ← (legado, verificar)
    financeiro-aleksandro.md

~/workspace/documentos/
  contas-<MES>-<ANO>/      ← Pasta do mês
    estimativa.md          ← Visão legível para o usuário

~/workspace/documentos/
  contas-abril-2026/
    gastos-cartao-inter.md ← Detalhamento da fatura (consolidada)
```

### financeiro.json — Schema

```json
{
  "metadata": { "version": "1.0.0", "last_update": "ISO8601" },
  "transactions": [
    {
      "id": "txn_YYYYMMDD_NNN",
      "date": "YYYY-MM-DD",
      "type": "expense|income",
      "amount": 0.00,
      "description": "...",
      "category": "cartao|educacao|servicos|alimentacao|casa|transporte|outros|salario",
      "recurrent": true|false,
      "due_date": "YYYY-MM-DD",
      "notes": "..."
    }
  ]
}
```

### assinaturas.json — Schema

Arquivo em `~/workspace/dados/assinaturas.json`. Contém subscrições/assinaturas ativas com datas de vencimento e renovação.

```json
{
  "meta": { "title": "...", "last_updated": "YYYY-MM-DD" },
  "assinaturas": [
    {
      "id": 1,
      "servico": "Nome do serviço",
      "descricao": "...",
      "plano": "Mensal|Anual|Crédito",
      "valor_pago": "R$ XX ou $XX (~R$ YY)",
      "data_pagamento": "YYYY-MM-DD",
      "data_vencimento": "YYYY-MM-DD ou null",
      "status": "ativo|cancelado|pausado",
      "renovacao_automatica": true|false|null,
      "link": "URL ou null",
      "notas": "..."
    }
  ],
  "resumo": {
    "total_ativas": 5,
    "proxima_renovacao": "data",
    "gasto_mensal_usd": "...",
    "gasto_anual_estimado": "..."
  }
}
```

**Quando apresentar finanças ao usuário:** Sempre cruzar **ambos** os arquivos. O usuário espera ver contas do mês (`financeiro.json`) E assinaturas com vencimentos (`assinaturas.json`) juntos.

## Categorias do Junior

| Categoria | Exemplos |
|-----------|----------|
| `cartao` | Fatura Inter, Fatura Nubank |
| `educacao` | Faculdade 1, Faculdade 2 |
| `servicos` | Guarda Noturno Doca |
| `alimentacao` | Mercado do Jabá |
| `casa` | Ar condicionado, Bike ergométrica |
| `transporte` | Gasolina |
| `outros` | Tio — mercado, Prima — gasolina |
| `salario` | Receita mensal |

## Regras de Ouro

1. **JSON é a fonte da verdade** — sempre edite `financeiro.json` primeiro via Python/json
2. **Sincronize os markdowns** — após editar JSON, re-gerar `estimativa.md` e arquivos de fatura
3. **Consolide cartões** — fatura do cartão = UM registro com valor total, não itemizar no JSON (detalhes ficam em markdown separado se necessário)
4. **Nunca duplique dados** — se já existe no JSON, não crie outro registro para a mesma coisa
5. **Memória** — após finalizar, atualizar `memory` com o resumo mensal para recall futuro

## Fluxo de Trabalho

### Atualizar valor existente
```python
# 1. Ler financeiro.json
# 2. Encontrar transação pelo id ou descrição
# 3. Atualizar campo
# 4. Salvar JSON
# 5. Re-gerar estimativa.md
# 6. Atualizar memory
```

### Início de novo mês
1. Criar pasta `~/workspace/documentos/contas-MES-ANO/`
2. Criar `estimativa.md` vazio com estrutura base
3. Migrar recorrentes do mês anterior (copiar do JSON com nova data)
4. Perguntar ao usuário: "Quais contas novas para MÊS/ANO?"

### Quando o usuário diz "tudo anotado no lugar bom"
- Significa: sincronize tudo (JSON ↔ markdown) E anote na memória persistente
- Sempre fazer ambos, não apenas um

## Valores Fixos Conhecidos

- Salário: R$ 5.000,00/mês
- Meta de poupança: R$ 2.000,00/mês
- Vencimento típico cartões: dia 10
- Faculdades: R$ 153,00 cada (2x)
- Guarda Noturno: R$ 60,00

## Formato de Resumo ao Usuário

Sempre apresentar em formato Telegram-friendly (bullet points, emojis, seções ---). **Sempre incluir contas E assinaturas** quando o usuário pede o panorama financeiro completo.

```
### 💳 Cartões (venc. DD/MM)
- Fatura X — R$ XXX

### 🔁 Recorrentes
- Conta Y — R$ YYY

### 📋 Outros
- Conta Z — R$ ZZZ

### 📊 TOTAL: R$ X.XXX,XX
Receita: R$ 5.000,00 → Sobra: R$ X.XXX,XX

---

### 🔄 Assinaturas Ativas
**Mensais:**
• Serviço — R$ XXX (venc: DD/Mês)

**Anuais (já pagos):**
• Serviço — R$ XXX (vence: DD/MM/AAAA)

### 📊 Gasto Mensal com Assinaturas: ~R$ XXX/mês
```

## Pitfalls

- **Não usar read_file + write_file** em JSON — use Python `json.load/dump`
- **Não deixar registros com valor R$ 0** — remova se for consolidado em outro registro
- **Não criar duplicatas** de mercado/cartão — somar se for o mesmo local
- **Verificar fatura real** antes de registrar — o usuário pode dizer "é a fatura do cartão", não um gasto individual
- **Sincronizar markdowns** — o usuário lê os .md, o JSON é só estrutura

## Linked Files

- `references/personal-finance-structure.md` — estrutura detalhada de diretórios
