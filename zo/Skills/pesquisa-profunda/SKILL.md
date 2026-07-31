---
name: pesquisa-profunda
description: "Skill de pesquisa abrangente em duas fases: geração de outline + investigação profunda com múltiplos agentes paralelos. Use para pesquisas acadêmicas, análise de mercado, due diligence, relatórios técnicos, ou qualquer tópico que exija investigação multi-fontes com validação e citações."
metadata:
  author: aleksandro.zo.computer
  source: "Weizhena/Deep-Research-skills (1.8k★ GitHub)"
  version: "1.0.0"
---

# Pesquisa Profunda

Skill de pesquisa estruturada em duas fases: geração de outline e investigação profunda com agentes paralelos. Ideal para pesquisas que exigem cobertura sistemática de múltiplas dimensões com validação de fontes.

## Pipeline de Pesquisa

### Fase 1: Pesquisa Preliminar
Use a sub-skill `Skills/pesquisa-profunda/skills/research-en/research/SKILL.md`:
1. Gere uma lista inicial de itens e campos de pesquisa com base no conhecimento do modelo
2. Faça complementação via web search
3. Pergunte ao usuário se há definições de campos existentes
4. Gere `outline.yaml` (itens + config) e `fields.yaml` (definições de campos)

### Fase 2: Expandir Itens/Campos (opcional)
- `Skills/pesquisa-profunda/skills/research-en/research-add-items/SKILL.md` — Adicionar mais itens
- `Skills/pesquisa-profunda/skills/research-en/research-add-fields/SKILL.md` — Adicionar mais campos

### Fase 3: Investigação Profunda
Use `Skills/pesquisa-profunda/skills/research-en/research-deep/SKILL.md`:
- Lê o outline.yaml gerado
- Lança agentes paralelos para cada item de pesquisa
- Coleta dados estruturados conforme fields.yaml
- Cada agente faz web search + síntese

### Fase 4: Relatório Final
Use `Skills/pesquisa-profunda/skills/research-en/research-report/SKILL.md`:
- Compila resultados de todos os agentes
- Gera relatório em markdown com fontes e níveis de confiança
- Cobre todos os campos definidos

## Estrutura de Saída
```
{topic_slug}/
├── outline.yaml       # Itens de pesquisa + config de execução
├── fields.yaml        # Definições de campos
└── results/           # Resultados individuais por item
```

## Exemplo de Uso
"Use a skill pesquisa-profunda para fazer uma pesquisa sobre IA na gestão pública municipal no Brasil. Vamos gerar o outline primeiro."
