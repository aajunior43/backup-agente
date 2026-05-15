#!/usr/bin/env bun
/**
 * Gerador de Planos de Estudos
 * Uso: bun run plano-estudos.ts "tema" --nivel=basic|intermediate|advanced
 */

import { writeFileSync, existsSync, mkdirSync } from "fs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

function printHelp() {
  console.log(`
Gerador de Planos de Estudos

Uso:
  bun run plano-estudos.ts "Tema do estudo" --nivel=NIVEL

Níveis:
  basic        — Conceitos essenciais, iniciante
  intermediate — Aprofundamento, casos práticos
  advanced     — Especialista, jurisprudência, nuances

Exemplos:
  bun run plano-estudos.ts "Secretário Municipal de Finanças" --nivel=advanced
  bun run plano-estudos.ts "Direito Constitucional" --nivel=intermediate
  bun run plano-estudos.ts "Gestão Pública" --nivel=basic

Opções:
  --output=CAMINHO   Pasta de saída (padrão: /home/workspace/estudos/)
  --help             Mostra esta ajuda
`);
}

async function gerarPlano(tema: string, nivel: string, outputDir: string) {
  const prompt = `Crie um plano de estudos completo e estruturado sobre: "${tema}"

Nível de profundidade: ${nivel.toUpperCase()}

Regras:
1. Estruture em tópicos numerados (1, 2, 3...) com subtópicos (1.1, 1.2...)
2. Inclua legislação relevante quando aplicável
3. Adicione exercícios práticos por tópico
4. Inclua um cronograma sugestivo (semanal ou mensal)
5. Use linguagem clara e objetiva
6. Formate em Markdown com títulos, listas e tabelas

Estrutura obrigatória:
# PLANO DE ESTUDOS — [TEMA]

## 1. FUNDAMENTOS
### 1.1 Conceitos básicos
### 1.2 Histórico e evolução
### 1.3 Marcos legais principais

## 2. LEGISLAÇÃO APLICÁVEL
### 2.1 Leis federais
### 2.2 Leis estaduais/municipais
### 2.3 Decretos e portarias

## 3. PRÁTICA E APLICAÇÃO
### 3.1 Procedimentos operacionais
### 3.2 Casos práticos
### 3.3 Exercícios resolvidos

## 4. FERRAMENTAS E SISTEMAS
### 4.1 Softwares e plataformas
### 4.2 Planilhas e modelos
### 4.3 Fontes de consulta

## 5. ATUALIDADES E JURISPRUDÊNCIA
### 5.1 Mudanças recentes
### 5.2 Decisões relevantes
### 5.3 Tendências

## 6. CRONOGRAMA DE ESTUDOS
### 6.1 Divisão semanal
### 6.2 Revisões programadas
### 6.3 Simulados

## 7. EXERCÍCIOS POR TÓPICO
### 7.1 Questões objetivas
### 7.2 Questões discursivas
### 7.3 Gabarito comentado

Gere o conteúdo completo para cada seção.`;

  if (!OPENAI_API_KEY) {
    console.log("⚠️  OPENAI_API_KEY não configurada. Usando modo offline (template básico).");
    return gerarTemplateOffline(tema, nivel);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um especialista em educação e preparação de materiais didáticos para servidores públicos." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.choices[0].message.content;
  } catch (err: any) {
    console.log(`⚠️  Erro na API: ${err.message}. Usando modo offline.`);
    return gerarTemplateOffline(tema, nivel);
  }
}

function gerarTemplateOffline(tema: string, nivel: string): string {
  return `# PLANO DE ESTUDOS — ${tema.toUpperCase()}

**Nível:** ${nivel.toUpperCase()}  
**Gerado em:** ${new Date().toLocaleDateString("pt-BR")}  
**Ferramenta:** plano-estudos (Zo Computer)

---

## 1. FUNDAMENTOS

### 1.1 Conceitos básicos
- [ ] Definição e escopo do tema
- [ ] Terminologia técnica essencial
- [ ] Diferença entre conceitos correlatos

### 1.2 Histórico e evolução
- [ ] Origem e desenvolvimento histórico
- [ ] Principais reformas e mudanças
- [ ] Contexto atual

### 1.3 Marcos legais principais
- [ ] Legislação fundamental
- [ ] Alterações recentes
- [ ] Regulamentação em vigor

---

## 2. LEGISLAÇÃO APLICÁVEL

### 2.1 Leis federais
- [ ] Lei principal (artigos essenciais)
- [ ] Leis complementares
- [ ] Decretos federais

### 2.2 Leis estaduais/municipais
- [ ] Legislação estadual aplicável
- [ ] Decretos municipais
- [ ] Portarias e instruções normativas

### 2.3 Jurisprudência
- [ ] Súmulas relevantes
- [ ] Decisões dos tribunais superiores
- [ ] Entendimentos consolidados

---

## 3. PRÁTICA E APLICAÇÃO

### 3.1 Procedimentos operacionais
- [ ] Passo a passo dos processos
- [ ] Fluxogramas e diagramas
- [ ] Boas práticas

### 3.2 Casos práticos
- [ ] Caso 1: [descrição]
- [ ] Caso 2: [descrição]
- [ ] Caso 3: [descrição]

### 3.3 Exercícios resolvidos
- [ ] Exercício 1 — [tema]
- [ ] Exercício 2 — [tema]
- [ ] Exercício 3 — [tema]

---

## 4. FERRAMENTAS E SISTEMAS

### 4.1 Softwares e plataformas
- [ ] Sistemas oficiais (SIAFI, SICONFI, etc.)
- [ ] Planilhas e modelos
- [ ] Ferramentas de apoio

### 4.2 Fontes de consulta
- [ ] Sites oficiais
- [ ] Bibliografia recomendada
- [ ] Cursos e videoaulas

---

## 5. ATUALIDADES

### 5.1 Mudanças recentes
- [ ] Últimas alterações legislativas
- [ ] Novas jurisprudências
- [ ] Tendências e debates

---

## 6. CRONOGRAMA DE ESTUDOS

| Semana | Tópico | Horas | Revisão |
|--------|--------|-------|---------|
| 1 | Fundamentos | 10h | Sábado |
| 2 | Legislação I | 10h | Sábado |
| 3 | Legislação II | 10h | Sábado |
| 4 | Prática e Casos | 12h | Sábado |
| 5 | Ferramentas | 8h | Sábado |
| 6 | Atualidades + Revisão | 10h | Simulado |
| 7 | Simulados e Ajustes | 10h | Final |

**Total:** ~70 horas de estudo

---

## 7. EXERCÍCIOS

### 7.1 Questões objetivas
1. [Inserir questão]
2. [Inserir questão]
3. [Inserir questão]

### 7.2 Gabarito
1. Alternativa [X] — Justificativa...
2. Alternativa [X] — Justificativa...
3. Alternativa [X] — Justificativa...

---

> 📌 **Nota:** Este é um template gerado offline. Para conteúdo completo e personalizado, configure a OPENAI_API_KEY e execute novamente.
> 
> Exemplo: \`OPENAI_API_KEY=sk-... bun run plano-estudos.ts "${tema}" --nivel=${nivel}\`
`;
}

// === MAIN ===
const args = process.argv.slice(2);

if (args.includes("--help") || args.length === 0) {
  printHelp();
  process.exit(0);
}

const tema = args[0];
const nivelArg = args.find((a) => a.startsWith("--nivel="));
const nivel = nivelArg ? nivelArg.split("=")[1] : "intermediate";
const outputArg = args.find((a) => a.startsWith("--output="));
const outputDir = outputArg ? outputArg.split("=")[1] : "/home/workspace/estudos/";

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const slug = tema.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const filename = `plano_${slug}_${nivel}.md`;
const filepath = `${outputDir}/${filename}`;

console.log(`🎯 Tema: ${tema}`);
console.log(`📊 Nível: ${nivel}`);
console.log(`💾 Saída: ${filepath}`);
console.log("⏳ Gerando plano...\n");

const conteudo = await gerarPlano(tema, nivel, outputDir);
writeFileSync(filepath, conteudo, "utf-8");

console.log(`✅ Plano salvo em: ${filepath}`);
