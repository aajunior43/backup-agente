---
name: agent
description: >-
  Cria e gerencia subagentes via a API /zo/ask — spawna sessões Zo
  independentes para processamento paralelo, tarefas em lote ou
  orquestração de workflows multi-etapa. Cada subagente tem acesso
  total às mesmas ferramentas, arquivos e capacidade do agente pai.
compatibility: Zo Computer
metadata:
  author: aleksandro.zo.computer
---

# Agent — Subagentes via /zo/ask

Skill para spawnar subagentes independentes. Cada subagente é uma
sessão Zo completa com as mesmas ferramentas e acesso a arquivos.

## Quando usar

- **Processamento paralelo:** pesquisar vários tópicos ao mesmo tempo
- **Tarefas em lote:** rodar o mesmo prompt para cada linha de um CSV
- **Orquestração:** quebrar um problema grande em partes e sintetizar depois
- **Workflows multi-etapa:** delegar subtarefas autocontidas a agentes filhos

## Como funciona

O script `scripts/subagent.ts` é um CLI que chama a API `/zo/ask`
para criar subagentes. Três modos de uso:

### 1. Simples — um subagente

```bash
bun run Skills/agent/scripts/subagent.ts run "Pesquise sobre tópico X e me dê um resumo em 3 parágrafos"
```

### 2. Paralelo — múltiplos prompts simultâneos

```bash
bun run Skills/agent/scripts/subagent.ts parallel \
  "Pesquise sobre tópico A" \
  "Pesquise sobre tópico B" \
  "Pesquise sobre tópico C"
```

### 3. Batch — de um arquivo (uma linha = um prompt)

```bash
bun run Skills/agent/scripts/subagent.ts batch -f prompts.txt
```

## Modelo

O modelo padrão é o mesmo do agente atual. Para usar outro:

```bash
bun run Skills/agent/scripts/subagent.ts run --model "model-name" "prompt"
```

## Como escrever prompts para subagentes

Cada subagente **não vê o histórico da conversa atual**. O prompt precisa
ser autocontido com TODO o contexto necessário:

- Descreva a tarefa completa e o resultado esperado
- Inclua dados, caminhos de arquivos, URLs ou identificadores relevantes
- Especifique formato de saída (ex: "responda em 2 parágrafos", "lista de 3 pontos")
- Subagentes têm acesso aos mesmos arquivos do workspace (/home/workspace)

### Exemplo de prompt bem construído

> Você é um analista financeiro. Leia o arquivo /home/workspace/financeiro/gastos_detalhados.md
> e identifique os 5 maiores gastos de julho/2026. Para cada um, diga categoria, valor e data.
> Responda em formato de tabela markdown.

## Saída

Os subagentes retornam texto puro no stdout. No modo `parallel` e `batch`,
os resultados são exibidos com cabeçalhos separadores.

## Notas

- Cada subagente é uma sessão isolada — não esgota recursos do agente pai
- O script usa o token de identidade do ambiente (`ZO_CLIENT_IDENTITY_TOKEN`)
- Limite prático de concorrência: ~20 requisições simultâneas
- Não crie loops onde subagentes spawnam outros subagentes sem supervisão
