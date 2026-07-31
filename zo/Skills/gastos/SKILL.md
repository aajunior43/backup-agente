---
name: gastos
description: "Registra e consulta gastos e compras pessoais de Aleksandro — alimenta o arquivo financeiro/gastos_detalhados.md com histórico cronológico, totais por mês/categoria, suporte a múltiplas moedas (BRL, USD, EUR) e backup pro GitHub. Use sempre que Aleksandro quiser anotar uma compra, registrar um gasto, perguntar \"quanto gastei\", pedir histórico de gastos, totais do mês, ou mencionar valores pagos em reais, dólares, euros ou qualquer outra moeda."
metadata: {"author":"aleksandro.zo.computer","version":"2.0.0","category":"financeiro"}
compatibility: "Criado para o Zo Computer. Requer Bun para executar o CLI. Opcional: pandoc para exportação em texto puro."
---

# Gastos

Skill para registrar e consultar gastos e compras pessoais de Aleksandro. Mantém um histórico cronológico em `financeiro/gastos_detalhados.md` com totais automáticos por mês e por categoria. Suporta múltiplas moedas (BRL, USD, EUR e outras) com conversão automática para reais.

## Funcionalidades

1. **Registro**: Adiciona um gasto ao histórico com data, descrição, categoria, valor, moeda e forma de pagamento
2. **Consulta**: Exibe o histórico completo ou filtrado (por mês, categoria, busca textual)
3. **Totais**: Calcula totais por mês e por categoria automaticamente
4. **Exportação**: Gera versão em texto simples (`.txt`) do registro, via pandoc quando disponível
5. **Backup**: Envia as alterações para o repositório de backup no GitHub

## Quando usar

Ative esta skill quando Aleksandro:
- Disser que pagou/comprou algo ("Paguei R$ 349 no fone", "Comprei um domínio por $11")
- Pedir para anotar/registrar um gasto ou despesa
- Perguntar quanto gastou ("Quanto gastei esse mês?", "Quanto gastei com software?")
- Pedir o histórico de gastos ou compras
- Perguntar totais por mês ou categoria
- Mencionar qualquer valor pago em qualquer moeda (R$, $, €, £, etc.)
- Pedir para salvar/compartilhar/exportar o registro de gastos
- Pedir backup dos gastos no GitHub

## Dados

**Arquivo principal:** `financeiro/gastos_detalhados.md`

## Instruções

### 1. Registrar um gasto

Execute:

```bash
bun run Skills/gastos/scripts/registro-gastos.ts adicionar --descricao="..." --valor=N [--moeda=XXX] [--categoria="..."] [--pagamento="..."] [--obs="..."] [--data=DD/MM]
```

Parâmetros:
- `--descricao` (obrigatório): Descrição curta do gasto
- `--valor` (obrigatório): Valor numérico (use ponto para decimais: 11.50)
- `--moeda`: Código da moeda (BRL, USD, EUR, GBP...). Padrão: BRL. Aceita símbolos: R$→BRL, $→USD, €→EUR, £→GBP
- `--categoria`: Categoria do gasto (ver lista abaixo). Se não informada, o agente DEVE inferir pelo contexto
- `--pagamento`: Forma de pagamento (Cartão de crédito, Pix, Dinheiro, Boleto, Débito)
- `--obs`: Observação livre
- `--data`: Data no formato DD/MM (padrão: hoje, fuso de São Paulo). Para ano diferente do atual, use DD/MM/AAAA

**Inferência de categoria:** Quando Aleksandro não especificar a categoria, o agente DEVE escolher a mais apropriada com base na descrição:
- Pedágio, combustível, passagem → Transporte
- Restaurante, lanche, mercado, comida → Alimentação
- Software, assinatura, domínio, API → Software/Serviços
- Fone, celular, computador, hardware → Eletrônicos
- Remédio, médico, exame → Saúde
- Curso, livro, treinamento → Educação
- Aluguel, conta, condomínio → Moradia

**Inferência de moeda:** Se Aleksandro mencionar "$11", "11 dólares", "US$" → use USD. Se "€", "euros" → EUR. Se "R$", "reais" ou não especificar → BRL.

### 2. Consultar gastos

```bash
# Histórico completo
bun run Skills/gastos/scripts/registro-gastos.ts listar

# Por mês
bun run Skills/gastos/scripts/registro-gastos.ts listar --mes=07

# Por categoria
bun run Skills/gastos/scripts/registro-gastos.ts listar --categoria="Transporte"

# Busca textual
bun run Skills/gastos/scripts/registro-gastos.ts listar --busca="pedágio"
```

### 3. Totais por mês e categoria

```bash
bun run Skills/gastos/scripts/registro-gastos.ts totais
```

### 4. Exportar registro

```bash
bun run Skills/gastos/scripts/registro-gastos.ts export [--formato=txt|md]
```

Gera `financeiro/gastos_detalhados.txt` em texto simples. Usa `pandoc` quando disponível; caso contrário, faz conversão simples removendo pipes e formatando como lista.

### 5. Backup no GitHub

Após qualquer alteração, o agente DEVE enviar para o GitHub:

```bash
bun run Skills/backup-github/scripts/backup.ts
```

## Categorias sugeridas

- Alimentação
- Transporte
- Moradia
- Saúde
- Educação
- Lazer
- Vestuário
- Software/Serviços
- Eletrônicos
- Outros

## Formato do arquivo

O arquivo `financeiro/gastos_detalhados.md` usa tabelas Markdown:

```markdown
| Data | Descrição | Categoria | Valor | Pagamento | Obs |
|------|-----------|-----------|-------|-----------|-----|
| 05/07 | Pedágio EPR | Transporte | R$ 13,50 | Pix | — |
| 04/07 | Domínio .com | Software | USD 11,00 (R$ 61,49) | Cartão | — |
```

Valores em moeda estrangeira aparecem como `USD 11,00 (R$ 61,49)` — valor original + equivalente em reais.

## Conversão de moedas

O script busca cotações atuais via AwesomeAPI (economia.awesomeapi.com.br). Se a API estiver indisponível, usa cotações de fallback razoáveis. O valor em reais (equivalente) é o que conta para os totais.

## Notas

- Todas as datas são gravadas no fuso de São Paulo (`America/Sao_Paulo`), com ano completo (`DD/MM/AAAA`) internamente — exibido como `DD/MM`. Isso evita erro de data entre 21h e meia-noite (quando o UTC já virou o dia) e ambiguidade na virada de ano.
- **Proteção contra duplicatas**: registrar o mesmo gasto (mesma descrição, valor e categoria, no mesmo dia) é bloqueado com aviso. Use `--forcar-duplicato` para permitir (ex.: dois pedágios idênticos no mesmo dia).
- Os totais por mês e categoria são sempre em **reais** (valor convertido)
- Se Aleksandro não informar a data, use hoje (`America/Sao_Paulo`)
- Se Aleksandro não informar a moeda, assuma BRL
- Se Aleksandro não informar a categoria, o agente DEVE inferir a mais adequada pelo contexto
- Após registrar, SEMPRE confirme o valor, a categoria e o total do mês em curso
- Após registrar, SEMPRE faça backup no GitHub
