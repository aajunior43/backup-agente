---
name: auditoria-perguntas
description: >
  Prevê as perguntas mais difíceis que uma banca, auditoria ou avaliador
  faria sobre um documento ou tema. Mapeia os 3 pontos mais vulneráveis,
  gera 5 perguntas ordenadas da mais provável à mais difícil, sugere
  respostas defensáveis (marcando em vermelho as que não têm boa resposta)
  e recomenda ajustes prioritários no documento original. Use antes de
  apresentar planos, relatórios, prestações de contas, projetos,
  defesas de TCC, apresentações a superiores ou qualquer material que
  será avaliado criticamente.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  display-name: 🎯 Auditoria de Perguntas
  version: "1.0"
  tags: [auditoria, banca, avaliação, revisão, perguntas, defesa, relatório]
---

# 🎯 Skill: Auditoria de Perguntas

Esta skill aplica uma técnica de **preparação defensiva** sobre qualquer documento ou tema: simula o que uma banca, auditoria ou avaliador rigoroso perguntaria, identifica vulnerabilidades concretas e sugere como blindar o material antes da avaliação.

## Quando usar

- Antes de apresentar um **plano, relatório, projeto ou prestação de contas**
- Ao preparar **defesa de TCC, mestrado, doutorado ou concurso**
- Antes de submeter material a um **tribunal de contas, controle interno ou auditoria externa**
- Ao revisar uma **proposta, edital, política pública ou estudo técnico**
- Quando quiser "testar a temperatura" de um documento sob olhar crítico

## Como usar

Você pode usar a skill de três formas:

### 1. Tema solto (sem arquivo)

Peça direto no chat, por exemplo:

> Use a skill `auditoria-perguntas` para o tema: "Plano de Transparência do Município de Inajá/PR para 2026"

### 2. Arquivo do workspace

Passe o caminho do arquivo:

> Use a skill `auditoria-perguntas` para o documento `Prefeitura/plano_transparencia_2026.md`

### 3. Texto colado

Cole o conteúdo direto na mensagem e peça a análise.

A skill lê o material (ou usa o tema), aplica o framework abaixo e devolve a análise completa em Markdown.

## Framework (4 etapas)

### Etapa 0 — Identificação dos 3 pontos mais frágeis
Antes de tudo, a skill deve identificar os **3 pontos mais vulneráveis** do material. Esses pontos guiam toda a geração de perguntas e respostas — não são genéricos, são específicos ao documento em questão.

### Etapa 1 — Mapeamento de Vulnerabilidades
Listar os pontos atacáveis (lacunas, ambiguidades, justificativas fracas, dados ausentes). Para cada ponto, explicar **por que é vulnerável** — o que falta e por que isso importa, não apenas "está incompleto".

### Etapa 2 — Geração das Perguntas
Gerar **5 perguntas**, ordenadas da **mais provável** para a **mais difícil de responder**. Cada pergunta deve:
- Ser formulada como um avaliador real formularia (direta, específica, sem rodeios)
- Apontar para uma fragilidade concreta identificada na Etapa 1
- Nunca ser genérica do tipo "você pode explicar melhor?"

### Etapa 3 — Respostas Sugeridas
Para cada pergunta, fornecer uma **resposta defensável**:
- Se a resposta exige reconhecer uma falha real, não disfarçar — sugerir como mitigar ou contextualizar honestamente
- Marcar com 🔴 as perguntas para as quais **não há boa resposta disponível** (são as que precisam de ajuste no documento **antes** da avaliação)

### Etapa 4 — Recomendação de Reforço
Listar, em **ordem de prioridade**, o que deve ser ajustado no documento original para neutralizar as perguntas 🔴 antes que sejam feitas.

## Restrições (obrigatórias)

- **Não inventar perguntas** sobre aspectos não presentes no documento
- As perguntas devem ser as que de fato surgiriam para **esse material específico**, não perguntas-padrão de qualquer auditoria
- Toda pergunta precisa estar ancorada numa fragilidade concreta identificada na Etapa 1
- Toda resposta precisa ser defensável, não evasiva

## Formato de saída

A skill deve devolver a análise em Markdown com esta estrutura:

```markdown
# Auditoria de Perguntas — [nome do documento/tema]

> Material analisado: `caminho/do/arquivo.md` (ou "tema livre")
> Data: YYYY-MM-DD

## 🎯 3 Pontos Mais Vulneráveis
1. **[Ponto 1]** — por que é vulnerável em 1-2 frases
2. **[Ponto 2]** — por que é vulnerável em 1-2 frases
3. **[Ponto 3]** — por que é vulnerável em 1-2 frases

## 🩺 Etapa 1 — Mapeamento de Vulnerabilidades
- **[V-1] [Título curto]:** descrição do ponto + por que importa
- **[V-2] ...**

## ❓ Etapa 2 — Perguntas Prováveis
### P1 — [Pergunta mais provável]
### P2 — ...
### P3 — ...
### P4 — ...
### P5 — [Pergunta mais difícil]

## 💬 Etapa 3 — Respostas Sugeridas
### P1 — Resposta
> [resposta defensável]

### P3 — 🔴 Sem boa resposta
> [honestidade sobre a lacuna]

## 🛠️ Etapa 4 — Reforço Prioritário
1. **[Prioridade 1]** — ajuste sugerido para neutralizar perguntas 🔴
2. **[Prioridade 2]**
3. **[Prioridade 3]**
```

## Boas práticas

- **Seja específico**: se o documento tem dados numéricos, as perguntas devem cobri-los; se tem prazos, as perguntas devem testar cumprimento; se tem metas, as perguntas devem testar indicadores
- **Seja honesto nas 🔴**: marcar algo como vermelho não é fraqueza da análise, é a maior entrega da skill — aponta onde o documento precisa melhorar
- **Use o resultado como checklist**: depois de aplicar a Etapa 4, revise o documento e rode a skill de novo para confirmar que as 🔴 foram neutralizadas

## Arquivos de referência

- `references/template_analise.md` — Template em branco da estrutura de saída (pode ser copiado e preenchido)
- `references/exemplo_prestacao_contas.md` — Exemplo completo aplicado a uma prestação de contas fictícia

## Variações úteis

| Variação | Quando pedir |
|----------|--------------|
| `auditoria-perguntas --perfil=tribunal-de-contas` | Adaptar tom e rigor ao perfil específico do avaliador |
| `auditoria-perguntas --perfil=banca-academica` | Para defesas de TCC, mestrado, doutorado |
| `auditoria-perguntas --perfil=auditoria-interna` | Para controle interno municipal |
| `auditoria-perguntas --perfil=superior-hierarquico` | Para apresentação a prefeito, secretário, diretor |
| `auditoria-perguntas --nivel=rigoroso` | Aumenta o nível de questionamento (assume avaliador hostil) |
| `auditoria-perguntas --nivel=standard` | Padrão (default), equilibrando razoabilidade e rigor |
| `auditoria-perguntas --nivel=consultivo` | Perguntas mais abertas, voltadas a melhorar o material |

Combine livremente, ex.: `auditoria-perguntas --perfil=tribunal-de-contas --nivel=rigoroso`.
