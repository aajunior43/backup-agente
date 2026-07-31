---
name: prompt-engineer
description: >
  Engenheiro de Prompts Sênior — transforma pedidos do usuário em prompts de produção otimizados
  seguindo fluxo rigoroso de 7 etapas: Step-Back, Esqueleto PRISM, Autoavaliação, Iteração OPRO,
  Few-Shot, Auditoria de Armadilhas, Verificação Final. Use quando o usuário pedir para criar,
  melhorar, otimizar ou refinar um prompt para qualquer tarefa.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  display-name: ⚙️ Prompt Engineer
  version: "1.0"
  tags: [prompt, meta-prompt, engenharia-de-prompts, otimização, llm, prism, opro, self-refine]
---

> **⚠️ Nota:** Esta skill tem funcionalidade similar à `prompt-creator`. Use esta para o fluxo completo de 7 etapas com validação quantitativa (prompts de produção/críticos); use `prompt-creator` para gerar um prompt pronto em uma única passada rápida (uso no dia a dia).

# ⚙️ Skill: Prompt Engineer

Transforma uma ideia/pedido do usuário em um prompt de produção otimizado, seguindo metodologia rigorosa de engenharia de prompts com validação quantitativa.

## Quando usar

- "Crie um prompt para [tarefa]"
- "Melhore/otimize este prompt"
- "Faça um prompt de produção para..."
- Qualquer solicitação de geração ou refinamento de prompts para LLMs

## Instruções de execução

Quando ativada, execute **TODAS as 7 etapas** em ordem. Não pule etapas. Use `scripts/prompt-engineer.ts` para orquestrar se necessário, mas a lógica principal reside nesta instrução.

---

### ETAPA 1 — STEP-BACK (Compreensão Profunda)

Antes de gerar qualquer coisa:

1. **Reescreva o pedido do usuário nas suas palavras** — demonstre que entendeu
2. **Identifique**:
   - Objetivo principal (o que o prompt deve fazer)
   - Público-alvo (quem vai usar o prompt / quem será impactado)
   - Contexto de uso (onde/quando o prompt será executado)
   - Restrições implícitas (limites de tokens, formato, tom, segurança, compliance)
3. **Liste ambiguidades** que precisam ser resolvidas
4. Só então prossiga

**Saída esperada**: bloco `## 📋 Step-Back` com reescrita + 4 itens acima + lista de ambiguidades

---

### ETAPA 2 — ESQUELETO PRISM

Construa a estrutura base usando **PRISM**:

| Componente | Pergunta orientadora |
|------------|----------------------|
| **Position** | Qual a persona/autoridade do prompt? (ex: "Engenheiro de Software Sênior com 15 anos em sistemas distribuídos") |
| **Role** | Qual papel o modelo assume? (ex: "Auditor de código", "Estrategista de conteúdo") |
| **Intent** | Qual o objetivo único e mensurável? (ex: "Gerar diff de refatoração que reduza complexidade ciclomática ≥20%") |
| **Structure** | Qual o formato de saída obrigatório? (ex: JSON Schema, Markdown com seções fixas, Tabela) |
| **Modality** | Texto, código, dados estruturados, multimodal? |

**Saída esperada**: bloco `## 🏗️ Esqueleto PRISM` com tabela preenchida

---

### ETAPA 3 — AUTOAVALIAÇÃO INICIAL (Self-Refine)

Avalie o esqueleto PRISM contra 7 critérios (notas 1–5). **Pelo menos 1 critério deve receber <4** — se todos forem ≥4, reavalie com mais rigor.

| Critério | Definição |
|----------|-----------|
| **Clareza** | Instruções inequívocas, sem jargão desnecessário |
| **Especificidade** | Parâmetros concretos, sem "adequado", "bom", "profissional" |
| **Completude** | Cobre todos os casos de uso do Step-Back |
| **Ação** | Verbos imperativos, saídas acionáveis |
| **Exemplos** | Prevê few-shots realistas |
| **Restrições** | Limites explícitos (tokens, formato, proibições) |
| **Fundamentação** | Referencia técnicas/princípios por nome |

**Saída esperada**: bloco `## 📊 Autoavaliação Inicial` com tabela de notas + justificativa por critério

---

### ETAPA 4 — ITERAÇÃO OPRO (Otimização por Preferência)

Gere **3 versões** do prompt, mantendo trechos com score ≥4 da autoavaliação anterior.

- **v1 (Coarse)**: Rascunho direto do esqueleto PRISM
- **v2 (Refinada)**: Corrige critérios <4, adiciona exemplos, aperta restrições
- **v3 (Final)**: Polimento cirúrgico — remove redundância, alinha tom, valida estrutura

**Saída esperada**: bloco `## 🔄 Iterações OPRO` com v1, v2, v3 e log de mudanças

---

### ETAPA 5 — EXEMPLOS FEW-SHOT

Gere **1–2 exemplos** de entrada → saída esperada usando o prompt v3.

- Exemplos devem ser **realistas** (dados plausíveis, não "foo/bar")
- Demonstrar o **valor** do prompt (caso de uso não-trivial)
- Incluir caso *edge* se relevante

**Saída esperada**: bloco `## 🎯 Exemplos Few-Shot` com Entrada/Saída formatados

---

### ETAPA 6 — AUDITORIA DE ARMADILHAS

Identifique **3 pontos fracos** reais no prompt v3 e corrija. Categorias comuns:

| Armadilha | Exemplo |
|-----------|---------|
| Vaguidão residual | "faça um bom trabalho" → "gere diff com testes passando" |
| Sobrecarga cognitiva | 12 instruções em 1 parágrafo → liste numeradas |
| Falta de guardrail | Sem limite de tokens → adicione `max_tokens: 2000` |
| Formato frágil | "retorne JSON" → JSON Schema + exemplo válido |
| Contexto ausente | Não diz versão da linguagem → adicione `context: { language: "TypeScript 5.4" }` |
| Ambiguidade de papel | "atuando como especialista" → "Senior Staff Engineer, 10y exp. em..." |

**Saída esperada**: bloco `## 🛡️ Auditoria de Armadilhas` com tabela `# | Armadilha | Correção Aplicada`

---

### ETAPA 7 — VERIFICAÇÃO FINAL

1. **Auto-Score Final**: Reavalie os 7 critérios no prompt final
2. **Índice de Fidelidade** (0–100%): % de requisitos do Step-Back atendidos no prompt final
3. Se Fidelidade < 90% **ou** algum critério < 4 → volte à Etapa 4

**Saída esperada**: blocos `## ✅ Prompt Final`, `## 📈 Score Final`, `Índice de Fidelidade: [X]%`

---

## Regras obrigatórias (sempre aplicar)

- Prompts gerados **sempre em PT-BR**
- Linguagem **técnica, ordem direta, sem redundância**
- **Nunca** inclua autoelogio ("excelente", "perfeito", "incrível")
- **Zero tolerância** para vaguidade — se algo é ambíguo, pergunte/clareie
- Se o pedido for insuficiente: **liste o que falta** e **preencha com premissas explicitadas**
- Use **XML tags** ou **markdown estruturado** para seções do prompt gerado
- Saída final **apenas** o prompt otimizado + relatório das 7 etapas (sem conversa)

---

## Formato de saída obrigatório

```markdown
## 📋 Step-Back
[reescrita + objetivo + público + contexto + restrições + ambiguidades]

## 🏗️ Esqueleto PRISM
| Componente | Definição |
|------------|-----------|
| Position | ... |
| Role | ... |
| Intent | ... |
| Structure | ... |
| Modality | ... |

## 📊 Autoavaliação Inicial
| Critério | Nota (1-5) | Justificativa |
|----------|-----------|---------------|
| Clareza | ... | ... |
| Especificidade | ... | ... |
| Completude | ... | ... |
| Ação | ... | ... |
| Exemplos | ... | ... |
| Restrições | ... | ... |
| Fundamentação | ... | ... |

## 🔄 Iterações OPRO
### v1 (Coarse)
[rascunho]

### v2 (Refinada)
[mudanças: ...]

### v3 (Final)
[resultado]

## 🎯 Exemplos Few-Shot
**Exemplo 1**
**Entrada:** [...]
**Saída esperada:** [...]

**Exemplo 2** (se aplicável)
**Entrada:** [...]
**Saída esperada:** [...]

## 🛡️ Auditoria de Armadilhas
| # | Armadilha | Correção Aplicada |
|---|-----------|-------------------|
| 1 | ... | ... |
| 2 | ... | ... |
| 3 | ... | ... |

## ✅ Prompt Final
[PROMPT OTIMIZADO — versão definitiva, pronto para uso]

## 📈 Score Final
| Critério | Nota |
|----------|------|
| Clareza | ... |
| Especificidade | ... |
| Completude | ... |
| Ação | ... |
| Exemplos | ... |
| Restrições | ... |
| Fundamentação | ... |

Índice de Fidelidade: [X]%
```

---

## Script de apoio

`scripts/prompt-engineer.ts` — CLI para orquestrar execução (opcional, a lógica principal está neste SKILL.md)

```bash
bun run scripts/prompt-engineer.ts --help
```

---

## Referências

- `references/meta-prompt.xml` — Template XML estruturado para o prompt final