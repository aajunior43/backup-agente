---
name: polymarket-intelligence
description: >
  Analisa tendências atuais no Polymarket — mercados de previsão, probabilidades
  de eventos, volume, liquidez e sentimento dos apostadores. Gera relatórios
  executivos de inteligência de mercado com análise quantitativa e qualitativa.
  Use quando precisar entender para onde a inteligência coletiva do Polymarket
  está convergindo.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  source: https://polymarket.com
  api: https://docs.polymarket.com/api
---

# Polymarket Intelligence

Skill para análise profunda de tendências no Polymarket. Busca dados ao vivo via API pública (Gamma API), analisa probabilidades, volume e sentimento, e entrega um relatório executivo.

## Fluxo de execução

1. **Seleção de categoria** — O analisador escolhe uma categoria de alta relevância (Eleições, Economia, Geopolítica, Cripto, Esportes) com base nos mercados mais ativos do momento.

2. **Coleta de dados** — Execute o script abaixo para buscar os mercados mais líquidos, com volume das últimas 24h, probabilidades atuais e metadata.

3. **Análise quantitativa** — Examine os mercados com maior volume de liquidez. Identifique oscilações recentes de probabilidade e correlações entre mercados.

4. **Análise qualitativa** — Interprete o sentimento dos apostadores: o que está impulsionando a confiança? Discrepâncias com a mídia tradicional? Eventos disparadores?

5. **Relatório executivo** — Apresente os dados no formato abaixo para cada tendência identificada.

## Formato de entrega

Para cada tendência identificada, apresente:

```
• Tendência Identificada: [nome]
  Probabilidade Atual: [XX%]
  Gatilhos Principais: [eventos disparadores]
  Risco de Volatilidade: [Alto/Médio/Baixo]
```

Inclua ao final uma seção de **Síntese Estratégica** com:
- Direção dominante da inteligência coletiva
- Discrepâncias relevantes entre mercados e mídia tradicional
- Sinais de alerta ou mudanças de momentum
- Recomendações de monitoramento

## Script de coleta

O script `scripts/polymarket-analysis.ts` busca dados ao vivo da Gamma API do Polymarket. Execute com:

```bash
bun Skills/polymarket-intelligence/scripts/polymarket-analysis.ts
```

Opções disponíveis:
- `--category <slug>` — Filtrar por categoria (ex: politics, crypto, sports)
- `--limit <n>` — Número de mercados a buscar (padrão: 15)
- `--help` — Ajuda

## Diretrizes

- Seja crítico e imparcial. Foque em dados de volume e oscilações recentes.
- Se a informação for ambígua, exponha os dois lados do mercado.
- Evite especulações sem base. Prefira "dados insuficientes" a uma conclusão forçada.
- Mantenha tom profissional e foco em inteligência estratégica.
