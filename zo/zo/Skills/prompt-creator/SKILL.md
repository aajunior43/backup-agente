---
name: prompt-creator
description: >
  Cria prompts otimizados para LLMs a partir de uma ideia simples do usuário.
  Usa meta-prompting com framework PRISM + Self-Refine + OPRO + Few-Shot +
  Auditoria de Armadilhas. Use quando o usuário pedir para criar, melhorar,
  otimizar ou refinar um prompt para qualquer tarefa.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  display-name: 🧠 Prompt Creator
  version: "1.0"
  tags: [prompt, meta-prompt, otimização, engenharia-de-prompts, llm]
---

# 🧠 Skill: Prompt Creator

Transforma uma ideia simples do usuário em um prompt de produção otimizado, usando técnicas avançadas de engenharia de prompts.

## Quando usar

- Quando o usuário pedir para "criar um prompt", "melhorar um prompt", "otimizar um prompt"
- Quando o usuário descrever uma tarefa e quiser um prompt profissional para executá-la
- Quando o usuário quiser refinar um prompt existente
- Quando o usuário pedir um "meta-prompt" ou "prompt para gerar prompts"

## Como usar

Basta o usuário descrever o que quer. Exemplos:

> Use a skill `prompt-creator` para: "um prompt para analisar contratos jurídicos"
> Use a skill `prompt-creator` para criar um prompt de auditoria fiscal
> Use a skill `prompt-creator` para melhorar meu prompt de atendimento ao cliente

## Instruções de execução

Quando ativada, execute o fluxo abaixo usando o conteúdo de `references/meta-prompt.txt` como template base, substituindo `[INSIRA SEU PEDIDO AQUI]` pela solicitação do usuário.

### Fluxo de execução:

1. **Entenda o pedido** — reescreva nas suas palavras, identifique objetivo, público, contexto, restrições
2. **Construa o esqueleto** — use PRISM (Position, Role, Intent, Structure, Modality)
3. **Autoavalie honestamente** — notas 1-5 em: Clareza, Especificidade, Completude, Ação, Exemplos, Restrições, Fundamentação. Pelo menos 1 critério <4.
4. **Itere com memória** — gere 3 versões, mantendo trechos com score >4
5. **Gere exemplos few-shot** — 1-2 exemplos de entrada → saída esperada
6. **Audite armadilhas** — identifique 3 pontos fracos e corrija
7. **Verificação final** — Auto-Score + Índice de Fidelidade

### Regras obrigatórias:

- Prompts gerados sempre em PT-BR
- Linguagem técnica, ordem direta, sem redundância
- Nunca inclua autoelogio ("excelente", "perfeito")
- Zero tolerância para vaguidade
- Se o pedido for insuficiente, liste o que falta e preencha com premissas explicitadas

## Formato de saída

```markdown
## 📋 Step-Back
[reescrita do pedido + ambiguidades]

## 📊 Autoavaliação
| Critério | Nota (1-5) | Justificativa |
|----------|-----------|---------------|
| Clareza | ... | ... |
| Especificidade | ... | ... |
| Completude | ... | ... |
| Ação | ... | ... |
| Exemplos | ... | ... |
| Restrições | ... | ... |
| Fundamentação | ... | ... |

## 🔄 Iterações
### v1 (Coarse)
[rascunho inicial]

### v2 (Refinada)
[mudanças: ...]

### v3 (Final)
[resultado: ...]

## 🎯 Exemplo de Uso
**Entrada:** [exemplo realista]
**Saída esperada:** [resultado que o prompt geraria]

## 🛡️ Auditoria de Armadilhas
| # | Armadilha | Correção Aplicada |
|---|-----------|-------------------|
| 1 | ... | ... |
| 2 | ... | ... |
| 3 | ... | ... |

## ✅ Prompt Final
[PROMPT OTIMIZADO - versão definitiva]

## 📈 Score Final
| Critério | Nota |
|----------|------|
| ... | ... |

Índice de Fidelidade: [X]%
```

## Técnicas utilizadas

| Técnica | Descrição |
|---------|-----------|
| Step-Back | Reescrever o pedido antes de gerar |
| PRISM | Framework Position/Role/Intent/Structure/Modality |
| Self-Refine | Autoavaliação com score 1-5 |
| OPRO | Iteração mantendo o que funciona |
| Few-Shot | Exemplos de entrada e saída |
| Auditoria de Armadilhas | Identificar e corrigir pontos fracos |
| Antifraude | Proibição de notas perfeitas sem ressalva |
| Índice de Fidelidade | Medir aderência ao pedido original |

## Referências

- `references/meta-prompt.txt` — Template completo do meta-prompt
