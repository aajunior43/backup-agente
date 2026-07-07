---
name: polymarket-intel
description: Gera relatórios de inteligência geopolítica e análise de prediction markets baseados em dados ao vivo do Polymarket. Inclui tendências políticas, probabilidades, volumes, catalisadores e cenários estratégicos.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  created: "2026-05-09"
  version: "1.0"
---

# Polymarket Intel — Análise de Prediction Markets

## Objetivo
Gerar relatórios estratégicos de inteligência geopolítica baseados em dados do Polymarket, com profundidade analítica comparável a analistas políticos de elite, traders de prediction markets e pesquisadores geopolíticos.

## Quando usar
Ative esta skill quando o usuário pedir:
- "Análise do Polymarket"
- "Relatório de prediction markets"
- "O que o mercado está dizendo sobre política"
- "Análise geopolítica do Polymarket"
- Qualquer variação sobre análise de mercados preditivos políticos/geopolíticos

## Passos de execução

### 1. COLETA DE DADOS (obrigatório)
Navegar no Polymarket e coletar dados dos principais mercados ativos. Usar web_search e browser tools para acessar:

**Mercados prioritários (sempre coletar):**
- https://polymarket.com/event/presidential-election-winner-2028
- https://polymarket.com/event/democratic-presidential-nominee-2028
- https://polymarket.com/event/republican-presidential-nominee-2028
- https://polymarket.com/predictions/politics (trending)
- https://polymarket.com/geopolitics
- https://polymarket.com/iran

**Mercados secundários (coletar conforme relevância):**
- Eleição Brasil: https://polymarket.com/event/brazil-presidential-election
- Eleição França: https://polymarket.com/event/france-presidential-election
- Eleição Peru: https://polymarket.com/event/peru-presidential-election
- Israel-Irã: https://polymarket.com/event/israel-strikes-iran-by-june-30-2026 (ou equivalente atual)
- Rússia-Ucrânia: mercados de cessar-fogo
- China-Taiwan: mercados de conflito
- Fed / economia: mercados de taxa de juros, inflação, recessão

### 2. PESQUISA DE CONTEXTO
Buscar notícias recentes (últimas 24-72h) sobre os eventos mais relevantes dos mercados coletados. Usar web_search com time_range="day" para:
- Notícias sobre conflitos ativos (Israel, Irã, Ucrânia, Rússia)
- Notícias políticas dos EUA (Trump, Congresso, eleições 2026/2028)
- Notícias econômicas (Fed, inflação, tarifas)
- Notícias sobre eleições no Brasil, França, Peru, etc.

### 3. ESTRUTURA DO RELATÓRIO
Gerar um relatório em português (pt-BR) com a seguinte estrutura obrigatória:

```
1. RESUMO EXECUTIVO (3-5 parágrafos)
   → Visão geral do momento geopolítico segundo os mercados
   → Principais movimentações de capital e probabilidades
   → Tese central da análise

2. PRINCIPAIS TENDÊNCIAS POLÍTICAS (4-6 tópicos)
   → Para cada tendência: nome, probabilidade atual, volume, análise estratégica
   → Ex: "Realinhamento da Sucessão Americana", "Conflito Israel-Irã", etc.

3. MERCADOS MAIS RELEVANTES (tabela)
   → Mercado | Volume | Prob. Líder | Significado Estratégico

4. MUDANÇAS RECENTES MAIS IMPORTANTES
   → Últimas 24-72h (eventos que mexeram com os mercados)
   → Últimos 30 dias (tendências de médio prazo)

5. EVENTOS SUBESTIMADOS PELO MERCADO (3-5 itens)
   → O que o mercado pode estar subprecificando
   → Por quê e qual o catalisador potencial

6. EVENTOS SUPESTIMADOS PELO MERCADO (3-5 itens)
   → O que o mercado pode estar superestimando
   → Viés cognitivo ou narrativa por trás do preço

7. ANÁLISE GEOPOLÍTICA ESTRATÉGICA
   → Eixo EUA-Médio Oriente
   → Eixo Rússia-OTAN-Ucrânia
   → China e Indo-Pacífico
   → América Latina
   → Cada eixo com: situação atual, leitura estratégica, catalisador a observar

8. CENÁRIOS PROVÁVEIS
   → Curto prazo (até 3-6 meses): 3 cenários com probabilidades
   → Médio prazo (6-24 meses): 3 cenários
   → Longo prazo (2-5 anos): 2-3 cenários

9. RISCOS CRÍTICOS (5 itens)
   → Eventos de cauda que poderiam reconfigurar tudo
   → Probabilidade estimada e impacto potencial

10. INSIGHTS ESTRATÉGICOS ACIONÁVEIS
    → Para traders: onde há assimetria positiva, arbitragens, eventos de cauda com payoff
    → Para tomadores de decisão: o que o mercado está dizendo sobre o futuro

11. CONCLUSÃO FINAL
    → Síntese da tese central
    → Pergunta estratégica final que resume o momento
```

### 4. ESTILO E TOM
- Analítico, profundo, preciso e estratégico
- Cruzamento entre: analista político internacional + trader profissional de prediction markets + pesquisador geopolítico + analista de inteligência
- Evitar respostas superficiais. Priorizar profundidade, contexto, interpretação estratégica e nuance
- Usar linguagem clara mas sofisticada
- Incluir probabilidades estimadas quando apropriado
- Diferenciar ruído de mudança estrutural
- Comparar com comportamento histórico semelhante quando relevante
- Destacar riscos e incertezas explicitamente

### 5. ENTREGA
- Salvar o relatório completo em um arquivo Markdown em `/home/workspace/Relatorios/polymarket/YYYY-MM-DD_relatorio_polymarket.md`
- **Gerar PDF:** Após salvar o .md, usar a skill `zo-generate-pdf` para converter o relatório em PDF. Salvar o PDF no mesmo diretório com o nome `YYYY-MM-DD_relatorio_polymarket.pdf`
- Se o usuário estiver no Telegram, enviar o relatório completo via `send_telegram_message`
- Se o relatório for muito longo para uma única mensagem do Telegram, dividir em partes ou enviar como arquivo
- Referenciar o arquivo salvo no workspace (tanto o .md quanto o .pdf)

### 6. ATUALIZAÇÃO DOS DADOS
Os dados do Polymarket mudam rapidamente. Sempre coletar dados atualizados no momento da solicitação. Nunca usar dados de análises anteriores sem rechecar.
