---
name: deepresearch
description: >
  Ferramenta de pesquisa profunda que vasculha múltiplas fontes, cruza informações,
  verifica fatos e produz relatórios detalhados e estruturados sobre qualquer tema.
  Use quando o usuário pedir "pesquisa profunda", "deep research", "investigue",
  "apure os fatos", "relatório detalhado", "saiba tudo sobre", ou quando for
  necessário esgotar um assunto com profundidade jornalística e analítica.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  created: "2026-05-16"
  version: "1.0"
---

# DeepResearch — Pesquisa Profunda e Estruturada

## Objetivo

Realizar investigações completas sobre qualquer tema — acidentes, eventos, pessoas, empresas, políticas, decisões judiciais, fenômenos, controvérsias — cruzando múltiplas fontes, verificando consistência, identificando contradições e produzindo relatórios com profundidade de agência de notícias investigativa.

## Quando usar

Ative esta skill quando o usuário pedir:

- "Faça uma deep research sobre X"
- "Pesquisa profunda sobre Y"
- "Investigue Z"
- "Apure os fatos sobre..."
- "Relatório detalhado de..."
- "Saiba tudo sobre..."
- "Me dê todos os detalhes de..."
- Qualquer pedido que exija esgotar um tema com profundidade, cruzando múltiplas fontes

## Princípios fundamentais

1. **Exaustão**: Buscar até não encontrar mais informações relevantes. Não parar na primeira página de resultados.
2. **Triangulação**: Toda informação importante deve ser confirmada por pelo menos 2 fontes independentes.
3. **Atualidade**: Priorizar informações mais recentes, mas contextualizar com histórico quando relevante.
4. **Transparência**: Separar claramente fatos confirmados de hipóteses, rumores e especulações.
5. **Precisão**: Nunca inventar dados. Se não encontrou, declarar "não confirmado" ou "não localizado".

---

## Fluxo de trabalho obrigatório

### FASE 1 — VARREDURA INICIAL (3-4 buscas paralelas)

Lançar múltiplas buscas simultâneas com queries diferentes para mapear o terreno:

```
Query 1: "[tema]" + notícias recentes (time_range=day ou week, topic=news)
Query 2: "[tema]" + termo específico/alternativo (time_range=week)
Query 3: "[tema]" + fontes locais/regionais relevantes
Query 4: "[tema]" + termo técnico/nome próprio/variação
```

**Regra**: Queries devem ser significativamente diferentes entre si. Variar termos, sinônimos, nomes alternativos.

### FASE 2 — LEITURA DAS FONTES PRIMÁRIAS

Identificar as 3-6 fontes mais relevantes da varredura e ler os artigos completos com `read_webpage`. Priorizar:

- Portais de notícias locais/regionais (para eventos geográficos)
- Fontes oficiais (Polícia, Bombeiros, Governo, Justiça)
- Jornais de grande circulação
- Especialistas no tema

### FASE 3 — PESQUISA DE APROFUNDAMENTO

Com base no que foi encontrado, fazer buscas direcionadas para:

- **Identificar pessoas citadas** (vítimas, autores, autoridades)
- **Linha do tempo**: "X [data específica]" para cada evento
- **Contexto histórico**: "[tema] histórico" ou "[local] histórico acidentes"
- **Dados oficiais**: "[tema] boletim oficial" ou "[órgão] nota"
- **Controvérsias/dissonâncias**: "[tema] polêmica" ou "[tema] questionamento"
- **Atualizações**: buscas com time_range=day para verificar novos desdobramentos

### FASE 4 — VERIFICAÇÃO CRUZADA

Para cada fato importante:
- Verificar se aparece em pelo menos 2 fontes independentes
- Anotar contradições entre fontes (ex: site A diz 3 mortos, site B diz 4)
- Quando houver contradição, buscar uma terceira fonte ou fonte oficial
- Sinalizar no relatório: "Fontes divergem quanto a..."

### FASE 5 — PRODUÇÃO DO RELATÓRIO

Gerar o relatório completo em Markdown seguindo a estrutura abaixo.

---

## Estrutura do relatório

```markdown
# 🔍 Deep Research: [TÍTULO PRINCIPAL]

---

### 📋 Resumo do Ocorrido / Contexto

[2-4 parágrafos com a essência do tema — o que, quem, quando, onde, por quê (se souber)]

---

### 🧩 Análise Detalhada

[Seções adaptadas ao tipo de pesquisa. Modelos abaixo:]

#### Para acidentes/eventos:
- **🚛 Dinâmica do Evento**: Descrição cronológica de como ocorreu
- **💀 Vítimas / Envolvidos**: Tabela com nomes, situações, status (se aplicável)
- **🚒 Operação de Resgate / Resposta**: Quem atuou, como, duração
- **🔎 Investigação / Causas**: O que se sabe, hipóteses, responsáveis pela investigação

#### Para pessoas/empresas:
- **Perfil / Histórico**: Quem é, trajetória, relevância
- **Controvérsias / Processos**: O que está em jogo
- **Posicionamentos / Defesas**: O que a parte envolvida diz
- **Repercussão**: Como a mídia e o público reagiram

#### Para temas/polêmicas:
- **Contexto Histórico**: Como chegamos até aqui
- **Argumentos dos Dois Lados**: Tabela prós/contras ou posição A vs. B
- **Dados e Estatísticas**: Números concretos
- **O Que Está em Jogo**: Implicações práticas

#### Adapte as seções conforme o tema. O importante é organizar a informação de forma lógica e acessível.

---

### 🗣️ Repercussão / Reações

- O que autoridades, especialistas, comunidade local disseram
- Declarações oficiais
- Mobilização social, se houver

---

### 📰 Linha do Tempo

| Data/Hora | Evento |
|-----------|--------|
| [data] — [hora se disponível] | [evento] |
| ... | ... |

---

### 🔢 Dados Consolidados

| Métrica | Valor |
|---------|-------|
| [ex: Total de mortos] | [X] |
| [ex: Feridos] | [Y] |
| [ex: Data do ocorrido] | [data] |
| ... | ... |

---

### ⚠️ Contradições e Lacunas

- **Divergência 1**: Fonte A diz X; Fonte B diz Y. [Fonte oficial ainda não confirmou]
- **Lacuna 1**: Não foi possível confirmar [informação específica]
- ...

---

### 🧠 Análise e Contexto

[Interpretação do que os fatos significam — causas estruturais, padrões, implicações mais amplas. Esta seção é opinativa mas baseada em evidências.]

---

### 🔮 Desdobramentos Esperados

- O que deve acontecer a seguir
- Prazos para próximos marcos (ex: conclusão de investigação em X dias)
- Como acompanhar atualizações

---

### 📚 Fontes Consultadas

[Listar TODAS as fontes com links. Ordenar por relevância.]

1. [Nome do portal] — [título da matéria] — [URL]
2. ...
```

---

## Estilo e tom

- **Jornalístico-analítico**: Precisão factual + profundidade analítica
- **Tom**: Sóbrio, profissional, sem sensacionalismo
- **Linguagem**: Clara, direta, sem jargão desnecessário
- **Citações**: Sempre com fonte. Usar `[^1]`, `[^2]` no formato de footnote
- **Imparcialidade**: Apresentar todos os lados quando houver controvérsia
- **Humanidade**: Em tragédias, tratar vítimas com respeito. Não especular sobre sofrimento.

---

## Regras de ouro

1. **Nunca pare na primeira página de resultados.** Varredura inicial mínima: 3-4 queries diferentes.
2. **Toda afirmação de peso precisa de fonte.** Se não tiver fonte, marcar como "não confirmado".
3. **Leia os artigos completos**, não apenas os snippets de busca. Detalhes importantes estão no corpo do texto.
4. **Busque a fonte oficial** sempre que disponível (nota da polícia, boletim do corpo de bombeiros, comunicado de empresa, decisão judicial).
5. **Atualize se houver novos desdobramentos.** Buscar novamente com time_range=day antes de finalizar o relatório para capturar updates de última hora.
6. **Adapte a estrutura ao tema.** As seções do template são sugestões — use o bom senso para organizar a informação da forma mais clara possível.
7. **Seja honesto sobre limitações.** Se não encontrou algo, diga. Não preencha lacunas com especulação.
8. **Entregue o relatório diretamente na conversa** em Markdown formatado. Se o relatório for muito extenso, salve também como arquivo `.md` no workspace.
9. **Salve o relatório** em `/home/workspace/Relatorios/deepresearch/YYYY-MM-DD_[slug-do-tema].md` para referência futura.
10. **Se o usuário estiver no Telegram**, enviar o relatório completo. Se exceder o limite de caracteres, dividir em partes ou enviar o arquivo.

---

## Exemplos de uso

- "Faça uma deep research sobre o acidente na PR-545" → relatório completo do acidente
- "Deep research: Elon Musk e o Departamento de Eficiência Governamental (DOGE)" → perfil + controvérsias + cronologia
- "Investigue a decisão do STF sobre o marco temporal" → contexto histórico + argumentos + repercussão
- "Relatório detalhado sobre as chuvas em Inajá PR nos últimos 30 dias" → dados + impactos + previsão
- "Apure tudo sobre a nova legislação de criptomoedas no Brasil" → análise + cronologia + implicações
