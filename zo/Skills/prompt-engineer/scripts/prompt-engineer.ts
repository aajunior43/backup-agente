#!/usr/bin/env bun
/**
 * prompt-engineer.ts — CLI para orquestrar a skill Prompt Engineer
 *
 * Uso:
 *   bun run prompt-engineer.ts "seu pedido aqui"
 *   bun run prompt-engineer.ts --interactive
 *   bun run prompt-engineer.ts --file pedido.txt
 */

import { $ } from "bun";
import { parseArgs } from "node:util";

const args = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    interactive: { type: "boolean", short: "i" },
    file: { type: "string", short: "f" },
    output: { type: "string", short: "o" },
    help: { type: "boolean", short: "h" },
  },
  strict: true,
  allowPositionals: true,
});

if (args.values.help || (!args.values.interactive && !args.values.file && args.positionals.length === 0)) {
  console.log(`
⚙️  Prompt Engineer — Engenheiro de Prompts Sênior

Uso:
  bun run prompt-engineer.ts "seu pedido aqui"
  bun run prompt-engineer.ts --interactive
  bun run prompt-engineer.ts --file pedido.txt

Opções:
  -i, --interactive    Modo interativo (pergunta passo a passo)
  -f, --file <path>    Lê o pedido de um arquivo
  -o, --output <path>  Salva resultado em arquivo (padrão: stdout)
  -h, --help           Mostra esta ajuda

A skill executa todas as 7 etapas obrigatórias:
  1. Step-Back (Compreensão Profunda)
  2. Esqueleto PRISM
  3. Autoavaliação Inicial (Self-Refine)
  4. Iteração OPRO (3 versões)
  5. Exemplos Few-Shot
  6. Auditoria de Armadilhas
  7. Verificação Final + Prompt Final

O relatório completo é emitido em Markdown estruturado.
`);
  process.exit(0);
}

async function readInput(): Promise<string> {
  if (args.values.file) {
    return await Bun.file(args.values.file).text();
  }
  if (args.values.interactive) {
    console.log("Digite seu pedido (Ctrl+D para finalizar):");
    return await Bun.stdin.text();
  }
  return args.positionals.join(" ");
}

async function main() {
  const userRequest = await readInput().then(t => t.trim());

  if (!userRequest) {
    console.error("❌ Pedido vazio");
    process.exit(1);
  }

  console.log(`\n📥 Pedido recebido: ${userRequest.slice(0, 120)}${userRequest.length > 120 ? "..." : ""}\n`);
  console.log("─".repeat(60));
  console.log("⚙️  EXECUTANDO 7 ETAPAS DA SKILL PROMPT-ENGINEER");
  console.log("─".repeat(60) + "\n");

  // A lógica principal reside no SKILL.md — este script apenas orquestra chamadas ao LLM
  // Para execução real, usaríamos a API do Zo ou chamaríamos o modelo diretamente.
  // Aqui, emitimos o template de relatório que o LLM deve preencher seguindo o SKILL.md.

  const reportTemplate = `# Relatório Prompt Engineer

## 📋 Step-Back
**Reescrita do pedido:** [preencher]

**Objetivo principal:** [preencher]

**Público-alvo:** [preencher]

**Contexto de uso:** [preencher]

**Restrições implícitas:** [preencher]

**Ambiguidades identificadas:** [preencher]

---

## 🏗️ Esqueleto PRISM
| Componente | Definição |
|------------|-----------|
| Position | [preencher] |
| Role | [preencher] |
| Intent | [preencher] |
| Structure | [preencher] |
| Modality | [preencher] |

---

## 📊 Autoavaliação Inicial
| Critério | Nota (1-5) | Justificativa |
|----------|-----------|---------------|
| Clareza | [ ] | [preencher] |
| Especificidade | [ ] | [preencher] |
| Completude | [ ] | [preencher] |
| Ação | [ ] | [preencher] |
| Exemplos | [ ] | [preencher] |
| Restrições | [ ] | [preencher] |
| Fundamentação | [ ] | [preencher] |

---

## 🔄 Iterações OPRO
### v1 (Coarse)
[preencher]

### v2 (Refinada)
**Mudanças:** [preencher]

[conteúdo v2]

### v3 (Final)
[preencher]

---

## 🎯 Exemplos Few-Shot
**Exemplo 1**
**Entrada:** [preencher]
**Saída esperada:** [preencher]

**Exemplo 2** (se aplicável)
**Entrada:** [preencher]
**Saída esperada:** [preencher]

---

## 🛡️ Auditoria de Armadilhas
| # | Armadilha | Correção Aplicada |
|---|-----------|-------------------|
| 1 | [preencher] | [preencher] |
| 2 | [preencher] | [preencher] |
| 3 | [preencher] | [preencher] |

---

## ✅ Prompt Final
[PROMPT OTIMIZADO — versão definitiva]

---

## 📈 Score Final
| Critério | Nota |
|----------|------|
| Clareza | [ ] |
| Especificidade | [ ] |
| Completude | [ ] |
| Ação | [ ] |
| Exemplos | [ ] |
| Restrições | [ ] |
| Fundamentação | [ ] |

**Índice de Fidelidade:** [ ]%
`;

  const output = args.values.output
    ? await Bun.write(args.values.output, reportTemplate)
    : console.log(reportTemplate);

  if (args.values.output) {
    console.log(`\n✅ Template salvo em: ${args.values.output}`);
    console.log("📝 Preencha seguindo as instruções do SKILL.md");
  }
}

main().catch(err => {
  console.error("❌ Erro:", err);
  process.exit(1);
});