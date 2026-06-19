---
name: plano-estudos
description: Cria planos de estudos personalizados e completos para qualquer área de conhecimento. Gera estrutura hierárquica com tópicos, subtópicos, exercícios práticos e cronograma de estudos. Ideal para concursos, capacitações profissionais e aprendizado contínuo.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  version: "1.0"
  tags: [estudos, educação, plano, aprendizado, concurso]
---

# Skill: Plano de Estudos

## O que faz

Esta skill cria planos de estudos estruturados e completos a partir de um tema, cargo ou área de conhecimento fornecido pelo usuário.

## Como usar

### Método 1: Gerar plano completo via script

```bash
cd /home/workspace/Skills/plano-estudos/scripts
bun run plano-estudos.ts "tema" --nivel=basic|intermediate|advanced
```

Exemplos:
```bash
bun run plano-estudos.ts "Secretário Municipal de Finanças" --nivel=advanced
bun run plano-estudos.ts "Direito Constitucional" --nivel=intermediate
bun run plano-estudos.ts "Gestão Pública" --nivel=basic
```

### Método 2: Usar template base

1. Copie o template base:
   ```bash
   cp /home/workspace/Skills/plano-estudos/references/template_plano.md /home/workspace/estudos/meu_plano.md
   ```

2. Edite o template com seu tema específico

3. Peça ao Zo para completar cada seção

### Método 3: Gerar via API OpenAI (requer OPENAI_API_KEY)

```bash
cd /home/workspace/Skills/plano-estudos/scripts
OPENAI_API_KEY=sk-... bun run plano-estudos-ai.ts "tema" --nivel=advanced --output=/home/workspace/estudos/
```

## Estrutura do plano gerado

Todo plano inclui:

1. **Fundamentos** — conceitos básicos e teoria
2. **Legislação** — leis, decretos e normas aplicáveis
3. **Prática** — exercícios, casos e simulações
4. **Ferramentas** — sistemas, softwares e recursos
5. **Atualidades** — jurisprudência e mudanças recentes
6. **Cronograma** — sugestão de divisão semanal/mensal
7. **Exercícios** — questões por tópico com gabarito

## Níveis de profundidade

| Nível | Público-alvo | Conteúdo |
|-------|-------------|----------|
| basic | Iniciante | Conceitos essenciais, vocabulário base |
| intermediate | Intermediário | Aprofundamento, casos práticos |
| advanced | Especialista | Jurisprudência, nuances, atualizações |

## Arquivos de referência

- `references/template_plano.md` — Template base em Markdown
- `references/exemplo_secretario.md` — Exemplo completo (Secretário de Finanças)
- `references/checklist_estudo.md` — Checklist de acompanhamento

## Dicas de uso

- Especifique o cargo/função para planos mais direcionados
- Use `--nivel=advanced` para concursos de alto nível
- Combine com automações para lembretes de estudo
- Salve planos na pasta `estudos/` do workspace
