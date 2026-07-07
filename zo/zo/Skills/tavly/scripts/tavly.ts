#!/usr/bin/env bun

/**
 * Tavily Search CLI
 * Pesquisa na web usando a API do Tavily
 */

const API_BASE = "https://api.tavily.com";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  raw_content?: string;
  score: number;
}

interface TavilyResponse {
  answer?: string;
  query: string;
  results: TavilyResult[];
  images?: string[];
  response_time: number;
}

interface Options {
  query: string;
  depth: "basic" | "advanced";
  maxResults: number;
  includeAnswer: boolean;
  includeImages: boolean;
  includeRawContent: boolean;
  output: "json" | "markdown" | "text";
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    query: "",
    depth: "basic",
    maxResults: 5,
    includeAnswer: true,
    includeImages: false,
    includeRawContent: false,
    output: "markdown",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "-d":
      case "--depth":
      case "--search-depth":
      case "-s":
        if (next === "basic" || next === "advanced") {
          options.depth = next;
          i++;
        }
        break;
      case "-n":
      case "--max-results":
        if (next) {
          options.maxResults = Math.min(20, Math.max(1, parseInt(next, 10) || 5));
          i++;
        }
        break;
      case "-a":
      case "--include-answer":
        if (next === "true" || next === "false") {
          options.includeAnswer = next === "true";
          i++;
        }
        break;
      case "-i":
      case "--include-images":
        if (next === "true" || next === "false") {
          options.includeImages = next === "true";
          i++;
        }
        break;
      case "-r":
      case "--include-raw-content":
        if (next === "true" || next === "false") {
          options.includeRawContent = next === "true";
          i++;
        }
        break;
      case "-o":
      case "--output":
        if (next === "json" || next === "markdown" || next === "text") {
          options.output = next;
          i++;
        }
        break;
      default:
        if (!arg.startsWith("-") && !options.query) {
          options.query = arg;
        } else if (!arg.startsWith("-")) {
          options.query += " " + arg;
        }
        break;
    }
  }

  return options;
}

async function searchTavily(options: Options): Promise<TavilyResponse> {
  let apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    try {
      const configFile = Bun.file("/home/workspace/Skills/tavly/config.json");
      if (await configFile.exists()) {
        const config = await configFile.json();
        apiKey = config.api_key;
      }
    } catch {
      // ignora erro de leitura do arquivo
    }
  }

  if (!apiKey) {
    throw new Error(
      "TAVILY_API_KEY não configurada. Adicione nas secrets do Zo em Settings > Advanced, ou no arquivo config.json da skill."
    );
  }

  const payload = {
    api_key: apiKey,
    query: options.query,
    search_depth: options.depth,
    max_results: options.maxResults,
    include_answer: options.includeAnswer,
    include_images: options.includeImages,
    include_raw_content: options.includeRawContent,
  };

  const response = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na API do Tavily (${response.status}): ${errorText}`);
  }

  return await response.json();
}

function formatMarkdown(data: TavilyResponse): string {
  let output = `# Resultados da Pesquisa\n\n`;
  output += `**Query:** ${data.query}\n\n`;
  output += `**Tempo de resposta:** ${data.response_time.toFixed(2)}s\n\n`;

  if (data.answer) {
    output += `## Resposta Sumarizada\n\n${data.answer}\n\n`;
  }

  if (data.images && data.images.length > 0) {
    output += `## Imagens\n\n`;
    for (const img of data.images) {
      output += `- ${img}\n`;
    }
    output += `\n`;
  }

  output += `## Resultados (${data.results.length})\n\n`;

  for (let i = 0; i < data.results.length; i++) {
    const r = data.results[i];
    output += `### ${i + 1}. ${r.title}\n\n`;
    output += `- **URL:** ${r.url}\n`;
    output += `- **Relevância:** ${(r.score * 100).toFixed(1)}%\n`;
    output += `- **Conteúdo:** ${r.content}\n`;
    if (r.raw_content) {
      output += `- **Conteúdo Bruto:** ${r.raw_content.substring(0, 500)}...\n`;
    }
    output += `\n`;
  }

  return output;
}

function formatText(data: TavilyResponse): string {
  let output = `Resultados da Pesquisa: ${data.query}\n`;
  output += `Tempo: ${data.response_time.toFixed(2)}s\n\n`;

  if (data.answer) {
    output += `RESPOSTA: ${data.answer}\n\n`;
  }

  for (let i = 0; i < data.results.length; i++) {
    const r = data.results[i];
    output += `${i + 1}. ${r.title}\n`;
    output += `   URL: ${r.url}\n`;
    output += `   Relevância: ${(r.score * 100).toFixed(1)}%\n`;
    output += `   ${r.content}\n\n`;
  }

  return output;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`Uso: bun tavly.ts "sua pergunta" [opções]

Opções:
  -d, --depth, --search-depth <basic|advanced>  Profundidade da busca (padrão: basic)
  -n, --max-results <1-20>                       Número máximo de resultados (padrão: 5)
  -a, --include-answer <true|false>              Incluir resposta sumarizada (padrão: true)
  -i, --include-images <true|false>              Incluir imagens (padrão: false)
  -r, --include-raw-content <true|false>         Incluir conteúdo bruto (padrão: false)
  -o, --output <json|markdown|text>              Formato de saída (padrão: markdown)
  -h, --help                                     Mostrar esta ajuda

Exemplos:
  bun tavly.ts "últimas notícias de tecnologia"
  bun tavly.ts "previsão do tempo SP" --depth advanced --max-results 10
  bun tavly.ts "dólar hoje" --output json
`);
    process.exit(0);
  }

  const options = parseArgs(args);

  if (!options.query) {
    console.error("Erro: Forneça uma query de pesquisa.");
    process.exit(1);
  }

  try {
    const data = await searchTavily(options);

    switch (options.output) {
      case "json":
        console.log(JSON.stringify(data, null, 2));
        break;
      case "text":
        console.log(formatText(data));
        break;
      case "markdown":
      default:
        console.log(formatMarkdown(data));
        break;
    }
  } catch (error) {
    console.error(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
