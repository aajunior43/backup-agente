---
name: municipal-budget-execution
description: |
  Executar operações práticas de orçamento municipal: buscar dotações, verificar saldos,
  validar compatibilidade de naturezas de despesa, criar fichas de requisição de empenho
  e preparar dados para decretos de crédito suplementar. Foco no município de Inajá-PR.
triggers:
  - User asks for "ficha de empenho", "ficha para pagamento", "requisição de empenho"
  - User wants to "remanejar", "suplementar", "anular dotação", "crédito suplementar"
  - User asks about specific dotacao/despesa by number or description
  - User needs to check saldo, natureza de despesa, or orgao for a budget line
  - User mentions "pedreiro", "servente", "obra", "serviço", "material" in budget context
---

# Execução Orçamentária Municipal — Inajá-PR

## Arquivos de Suporte

- `templates/ficha-empenho.md` — Template de ficha de requisição de empenho (copiar e preencher)
- `references/naturezas-despesa-inaja.md` — Tabela rápida de naturezas de despesa comuns e regras de compatibilidade

## 1. Buscar Dotações no CSV

Arquivo fonte: `~/.hermes/data/relacao_despesas_inaja.csv` (548 linhas, `;` delimitador)

### Comandos rápidos
```bash
# Buscar por termo
grep -i "TERM" ~/.hermes/data/relacao_despesas_inaja.csv

# Buscar por número da despesa
grep "^PREFEITURA.*;DESPESA_N;" ~/.hermes/data/relacao_despesas_inaja.csv

# Buscar por natureza específica (ex: 3.3.90.39 para serviços PJ)
python3 scripts/buscar_dotacoes.py natureza 3.3.90.39

# Buscar dotações com saldo >= R$ 5.000
python3 scripts/buscar_dotacoes.py saldo_min 5000

# Usar skill script legado (se disponível)
cd ~/workspace && python3 skills/dotacao-orcamentaria/scripts/dotacao.py buscar --item N
```

### Parse de saldo (formato brasileiro)
```python
def parse_saldo(val):
    return float(val.replace('.', '').replace(',', '.'))
```

## 2. Regra de Compatibilidade de Naturezas ⚠️ CRÍTICO

**NUNCA remanejar entre naturezas incompatíveis.** O usuário pode aceitar, mas a contabilidade pode não.

| Origem | Destino Válido | Inválido |
|--------|----------------|----------|
| 4.4.90.51 (Obras e Instalações) | Outra 4.4.90.51 | 3.3.90.39 (Serviços PJ) |
| 3.3.90.39 (Serviços Terceiros PJ) | Outra 3.3.90.39 | 4.4.90.51 (Obras) |
| 3.3.90.30 (Material de Consumo) | Outra 3.3.90.30 | 3.1.90.11 (Pessoal) |
| 3.1.90.11 (Vencimentos) | Outra 3.1.90.11 | 3.3.90.39 (Serviços) |

**Regra prática:** Se o usuário pede "ficha para serviço PJ", busque uma dotação com natureza **3.3.90.39** como origem. Se pede "ficha para obra", busque **4.4.90.51**.

### Naturezas mais comuns no orçamento de Inajá:
- **3.1.90.11** — Vencimentos e Vantagens Fixas — Pessoal Civil
- **3.1.90.13** — Contribuições Patronais
- **3.3.90.30** — Material de Consumo
- **3.3.90.32** — Material/Bem/Serviço para Distribuição Gratuita
- **3.3.90.34** — Outras Despesas de Pessoal decorrentes de Contrato
- **3.3.90.36** — Outros Serviços de Terceiros — Pessoa Física
- **3.3.90.39** — Outros Serviços de Terceiros — Pessoa Jurídica
- **4.4.90.51** — Obras e Instalações
- **4.4.90.52** — Equipamentos e Material Permanente

## 3. Criar Ficha de Requisição de Empenho

### Verificações obrigatórias antes de criar:
1. Saldo da origem ≥ valor solicitado
2. Natureza da origem ≡ natureza do destino (ou compatível)
3. Recurso é o mesmo (ordinários, FUNDEB, etc.)
4. Valor ≤ R$ 26.432,00 (limite dispensa de licitação)

### Campos da ficha:
- Dotação Origem (anulação): nº despesa, ação, natureza, órgão, saldo
- Dotação Destino (suplementação): nº despesa, ação, natureza, órgão
- Valor do empenho
- Objeto/descrição do serviço/material
- Base legal (art. 26 da LRF, Decreto)

### Template: `templates/ficha-empenho.md`
Copie e preencha o template em `templates/ficha-empenho.md`.

## 4. Formato de Resposta para Telegram 📱

**Preferência do usuário (Junior):** respostas diretas, sem tabelas grandes, usando bullet points com emoji quando apropriado.

✅ **Fazer:**
- Usar bullet points com `•` ou emojis
- Separar seções com `---`
- Destacar valores em **negrito**
- Usar `||spoiler||` para dados sensíveis (nunca senhas)

❌ **Evitar:**
- Tabelas grandes (quebram no Telegram)
- Blocos de texto corridos longos
- Explicações desnecessárias antes da resposta

### Exemplo de formato bom:
```
**ORIGEM:**
• Despesa 142 — Serviços Rodoviários
• Saldo: **R$ 100.000,00**
• Natureza: 3.3.90.39

**DESTINO:**
• Despesa 183 — Conselho Tutelar
• Valor: **R$ 5.000,00**

---
Base legal: Art. 26 da LRF (Decreto)
```

## 5. Decreto de Crédito Suplementar

Para gerar o decreto formal, use a skill `decreto-alteracoes-orcamentarias`.
A ficha de empenho é o passo prévio — o decreto formaliza a alteração.

## 6. Reserva de Contingência

Despesa 365 — Reserva de Contingência — R$ 300.000,00
Útima alternativa quando nenhuma dotação do mesmo órgão tem saldo.

## Pitfalls

- **Natureza incompatível:** O USUÁRIO PODE ACEITAR, mas a contabilidade pode não aceitar depois. Se o usuário pede "ficha para serviço PJ", a ORIGEM **TAMBÉM** deve ser 3.3.90.39. NUNCA sugira 4.4.90.51 (Obras) como origem para serviço PJ — pergunte qual natureza ele quer usar ou busque uma dotação 3.3.90.39 com saldo.
- **CSV grande:** `read_file` limita a 500 linhas. Use `grep`/`sed` ou Python via `execute_code`.
- **Número da despesa:** o campo é "Número da despesa", não é número da linha.
- **Recursos vinculados:** FUNDEB, saúde, etc. não podem ser remanejados para ações fora da área. Só use Ordinários (Livres) ou o mesmo recurso vinculado.
- **Ficha vs. Decreto:** Quando o usuário pede "ficha", ele quer o documento operacional de requisição (template `ficha-empenho.md`). Quando pede "decreto", aí sim é o documento jurídico formal (skill `decreto-alteracoes-orcamentarias`).