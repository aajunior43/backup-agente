---
name: polymarket-analyst
description: Análise profissional de mercados Polymarket com busca automática na web, cálculos avançados, gráficos, PDFs completos com imagens, previsões interpretativas e preservação no Obsidian. Gera relatórios profissionais categorizados com imagens relacionadas e texto "Dev Aleksandro Alves" no rodapé. Use quando o usuário pedir análise de odds, comparação entre mercados, ou resumo de tendências. **TRADUZA TUDO PARA PORTUGUÊS** — nunca responda em inglês. NÃO usar para executar trades, prometer resultado ou dar aconselhamento financeiro definitivo.
---

# Polymarket Analyst — Versão Final v3

Análise profissional de mercados Polymarket com geração automática de PDFs completos.

## 🚀 FLUXO PRINCIPAL (SEMPRE EXECUTAR)

### Quando o usuário pedir análise, SIGA ESTA SEQUÊNCIA:

#### 1️⃣ Gerar PDF completo (OBRIGATÓRIO)
```bash
python3 ~/.openclaw/workspace/skills/polymarket-analyst/scripts/generate_professional_pdf.py --tema "tudo"
```

#### 2️⃣ Enviar para o Telegram
```bash
curl -s -F document=@/tmp/analise-polymarket-final.pdf \
  -F caption="📊 Análise Polymarket — Completa" \
  "https://api.telegram.org/bot8540151491:AAGsHITvjM65F4JxvrDlz-RkXrYxOnOHwvU/sendDocument?chat_id=942288759"
```

#### 3️⃣ Salvar no Obsidian
```bash
python3 ~/.openclaw/workspace/skills/polymarket-analyst/scripts/save_obsidian.py --market "[TEMA]"
```

---

## 📋 ESTRUTURA DO PDF PROFISSIONAL (v3)

O PDF **SEMPRE** deve conter:

### 1. Cabeçalho
- Título: "📊 ANÁLISE COMPLETA — MERCADOS POLYMARKET"
- Data e hora (formato: 19 de Abril de 2026 — 14:30 BRT)
- Fonte: Polymarket.com

### 2. Seções por Categoria (4 categorias principais)
Cada categoria:
- 🌍 **GEOPOLÍTICO** — Paz US-Irã, Hormuz, Urânio
- ₿ **CRYPTOMOEDAS** — Bitcoin, Ethereum
- 🛢️ **COMMODITIES** — Petróleo, Commodities
- 🤖 **INTELIGÊNCIA ARTIFICIAL** — Mercados de IA

### 3. Cada Seção Contém
1. **Header** com ícone e nome da categoria
2. **Tabela** com colunas: Mercado | Probabilidade | Tendência | Volume
3. **Imagem relacionada** (obrigatório — buscar em `images/`)
4. **Caixa de Previsão** com texto interpretativo de 3-4 frases

### 4. Resumo Geral
- Tabela comparativa de todas as categorias
- Tendência geral

### 5. Considerações Finais
- Texto de 2-3 frases com análise do contexto

### 6. Rodapé (OBRIGATÓRIO)
- **"Desenvolvido por Dev Aleksandro Alves"** — em destaque
- Disclaimer: "Análise informativa. Não é recomendação de investimento."
- Data/hora de geração

---

## 📁 ESTRUTURA DE ARQUIVOS

```
~/.openclaw/workspace/skills/polymarket-analyst/
├── SKILL.md                          # Este arquivo
├── scripts/
│   ├── generate_professional_pdf.py  # PDF principal (v3 com Dev)
│   ├── analyze_full.py               # Métricas
│   ├── plot_chart.py                # Gráficos
│   ├── save_obsidian.py             # Obsidian
│   └── fetch_and_analyze.py          # Busca dados
├── images/                          # Imagens para PDF
│   ├── geopolitico.jpg
│   ├── bitcoin.jpg
│   ├── petroleo.jpg
│   └── ia.jpg
├── pdfs/                            # PDFs salvos
├── data/                            # Dados brutos
└── references/
    ├── polymarket-metrics.md
    └── source-priority.md

Obsidian:
~/obsidian/vaults/MeuCofre/EVA/dados/polymarket/
└── [tema]/
    ├── analysis-[data].md
    └── pdf-[data].pdf
```

---

## 🎨 DESIGN DO PDF

### Cores
- **Tema:** Fundo branco com texto escuro
- **Header categorias:** `#1a1a1a` (fundo escuro)
- **Texto categorias:** `#FFD600` (amarelo)
- **Texto principal:** `#1a1a1a` (preto)
- **Previsão:** Caixa `#FFFDE7` (amarelo claro)
- **Dev:** Caixa `#FFF9C4` com borda amarela

### Tipografia
- Título: 22px, Helvetica-Bold, amarelo
- Subtítulos: 14px, amarelo
- Texto: 9px, escuro
- Dev: 12px, bold, centralizado

---

## 🛠️ COMANDOS RÁPIDOS

| Situação | Comando |
|---------|---------|
| PDF completo | `python3 scripts/generate_professional_pdf.py --tema "tudo"` |
| PDF categoria | `python3 scripts/generate_professional_pdf.py --tema "IA"` |
| Listar temas | Edite o script para ver categorias |

---

## ❌ REGRAS OBRIGATÓRIAS

1. **TRADUZA TUDO** — NUNCA inglês
2. **SEMPRE gere PDF** — com categorias, imagens e previsões
3. **SEMPRE inclua imagens** — nas 4 categorias
4. **SEMPRE adicione previsão** — 3-4 frases interpretativas
5. **SEMPRE inclua "Dev Aleksandro Alves"** — no rodapé
6. **NUNCA invente preços** — use dados reais
7. **NUNCA call de trade** — análise não é recomendação
8. **Salve no Obsidian** — mantenha histórico
9. **Cite fontes** — Tavily, Firecrawl, Polymarket

---

## 📊 EXEMPLO DE PREVISÃO

**Categoria: GEOPOLÍTICO**
> "O mercado acredita que há 70% de chance de um acordo de paz entre EUA e Irã até junho de 2026. Esse otimismo reflete as negociações diplomáticas em curso e a pressão internacional. Porém, a diferença para maio (62%) sugere incerteza sobre o cronograma exato."

**Categoria: CRYPTOMOEDAS**
> "O Bitcoin segue em compasso de espera, com chances praticamente iguais para alta e baixa. A probabilidade de apenas 21% para Bitcoin atingindo $150k até 2027 reflete ceticismo. O mercado aguarda catalysts externos para movimentos definitivos."

---

## 🔍 COMO OBTER IMAGENS

As imagens já estão pré-baixadas em `images/`:
- `geopolitico.jpg` — EUA/Irã
- `bitcoin.jpg` — Bitcoin
- `petroleo.jpg` — Petróleo
- `ia.jpg` — Inteligência Artificial

Para atualizar imagens:
```bash
cd ~/.openclaw/workspace/skills/polymarket-analyst/images/
curl -sL -o bitcoin.jpg "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400"
```

---

*Atualizado em: 19/04/2026 — v3 com Dev Aleksandro Alves + design melhorado*
