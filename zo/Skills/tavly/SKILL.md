---
name: tavly
description: Skill para realizar pesquisas na web usando a API do Tavily. Permite buscar informações atualizadas na internet com resultados estruturados e sumarizados.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
---

# Tavily Search Skill

Esta skill permite realizar pesquisas na web usando a API do Tavily.

## Uso

```bash
bun /home/workspace/Skills/tavly/scripts/tavly.ts "sua pergunta de pesquisa"
```

Ou com opções avançadas:

```bash
bun /home/workspace/Skills/tavly/scripts/tavly.ts "sua pergunta" --depth advanced --max-results 10
```

## Configuração

A API key do Tavily deve estar configurada nas secrets do Zo:
- Vá em [Settings > Advanced](/?t=settings&s=advanced)
- Adicione a secret `TAVILY_API_KEY` com sua chave

## Opções do script

- `--depth` | `-d`: Nível de profundidade (`basic` ou `advanced`). Padrão: `basic`
- `--max-results` | `-n`: Número máximo de resultados (1-20). Padrão: `5`
- `--include-answer` | `-a`: Incluir resposta sumarizada (`true` ou `false`). Padrão: `true`
- `--include-images` | `-i`: Incluir imagens nos resultados (`true` ou `false`). Padrão: `false`
- `--include-raw-content` | `-r`: Incluir conteúdo bruto das páginas (`true` ou `false`). Padrão: `false`
- `--search-depth` | `-s`: Profundidade da busca (`basic` ou `advanced`). Padrão: `basic`
- `--output` | `-o`: Formato de saída (`json`, `markdown`, `text`). Padrão: `markdown`

## Exemplos

```bash
# Busca básica
bun /home/workspace/Skills/tavly/scripts/tavly.ts "últimas notícias sobre inteligência artificial"

# Busca avançada com mais resultados
bun /home/workspace/Skills/tavly/scripts/tavly.ts "previsão do tempo Inajá PR" --depth advanced --max-results 10

# Saída em JSON
bun /home/workspace/Skills/tavly/scripts/tavly.ts "dólar hoje" --output json
```
