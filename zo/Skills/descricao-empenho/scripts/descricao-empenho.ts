#!/usr/bin/env bun
/**
 * descricao-empenho.ts
 *
 * Gera descricoes de empenho orcamentario no padrao exigido pela
 * Prefeitura de Inaja/PR:
 *   - Inicia com "PELA DESPESA EMPENHADA REFERENTE A "
 *   - Toda em caixa alta, sem acentos
 *   - Inclui objeto, especificacoes, finalidade, documento de origem,
 *     valor (numerico + por extenso), fornecedor e CNPJ
 *
 * Uso:
 *   bun run descricao-empenho.ts gerar --objeto="..." --documento="..." --valor=1234.56 [opcoes]
 *   bun run descricao-empenho.ts gerar --arquivo dados.json
 *   bun run descricao-empenho.ts ajustar --texto="..."
 */

type DadosEmpenho = {
  objeto: string;
  especificacoes?: string;
  finalidade?: string;
  documento: string;
  valor: number;
  fornecedor?: string;
  cnpj?: string;
};

const UNIDADES = [
  "", "UM", "DOIS", "TRES", "QUATRO", "CINCO", "SEIS", "SETE", "OITO", "NOVE",
  "DEZ", "ONZE", "DOZE", "TREZE", "QUATORZE", "QUINZE", "DEZESSEIS", "DEZESSETE",
  "DEZOITO", "DEZENOVE",
];
const DEZENAS = [
  "", "", "VINTE", "TRINTA", "QUARENTA", "CINQUENTA",
  "SESSENTA", "SETENTA", "OITENTA", "NOVENTA",
];
const CENTENAS = [
  "", "CENTO", "DUZENTOS", "TREZENTOS", "QUATROCENTOS", "QUINHENTOS",
  "SEISCENTOS", "SETECENTOS", "OITOCENTOS", "NOVECENTOS",
];

function trezentos99(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "CEM";
  const c = Math.floor(n / 100);
  const d = n % 100;
  const cTxt = CENTENAS[c];
  const dTxt = d === 0 ? "" : (d < 20 ? UNIDADES[d] : DEZENAS[Math.floor(d / 10)] + (d % 10 ? " E " + UNIDADES[d % 10] : ""));
  if (cTxt && dTxt) return cTxt + " E " + dTxt;
  return cTxt + dTxt;
}

function numeroPorExtenso(n: number): string {
  if (n === 0) return "ZERO";
  const partes: string[] = [];
  const milhoes = Math.floor(n / 1_000_000);
  const resto1 = n % 1_000_000;
  const milhares = Math.floor(resto1 / 1_000);
  const resto2 = resto1 % 1_000;
  const unidades = resto2;

  if (milhoes) {
    if (milhoes === 1) partes.push("UM MILHAO");
    else partes.push(trezentos99(milhoes) + " MILHOES");
  }
  if (milhares) {
    if (milhares === 1) partes.push("UM MIL");
    else partes.push(trezentos99(milhares) + " MIL");
  }
  if (unidades) partes.push(trezentos99(unidades));
  return partes.join(" E ");
}

function valorPorExtenso(valor: number): string {
  const reais = Math.floor(valor);
  const centavos = Math.round((valor - reais) * 100);
  const rTxt = numeroPorExtenso(reais);
  const cTxt = numeroPorExtenso(centavos);
  let saida = rTxt + " REAIS";
  if (centavos > 0) saida += " E " + cTxt + " CENTAVOS";
  return saida;
}

function limpar(txt: string): string {
  return (txt || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

function valorFormatado(valor: number): string {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseArg(flag: string, args: string[]): string | undefined {
  const pref = flag + "=";
  const found = args.find((a) => a.startsWith(pref));
  return found ? found.slice(pref.length) : undefined;
}

function carregarDados(args: string[]): DadosEmpenho {
  const arquivo = parseArg("--arquivo", args);
  let dados: Partial<DadosEmpenho> = {};
  if (arquivo) {
    const path = arquivo.startsWith("/") ? arquivo : `${process.cwd()}/${arquivo}`;
    dados = JSON.parse(require("fs").readFileSync(path, "utf-8"));
  } else {
    const valorStr = parseArg("--valor", args);
    if (!valorStr) throw new Error("--valor obrigatorio (use numero, ex: 1234.56)");
    dados = {
      objeto: parseArg("--objeto", args),
      especificacoes: parseArg("--especificacoes", args),
      finalidade: parseArg("--finalidade", args),
      documento: parseArg("--documento", args),
      valor: Number(valorStr),
      fornecedor: parseArg("--fornecedor", args),
      cnpj: parseArg("--cnpj", args),
    };
  }
  if (!dados.objeto || !dados.documento || dados.valor === undefined) {
    throw new Error("--objeto, --documento e --valor sao obrigatorios");
  }
  return dados as DadosEmpenho;
}

export function gerarDescricao(d: DadosEmpenho): string {
  const partes: string[] = ["PELA DESPESA EMPENHADA REFERENTE A " + limpar(d.objeto)];
  if (d.especificacoes) partes.push(limpar(d.especificacoes));
  if (d.finalidade) partes.push(limpar(d.finalidade));
  partes.push("CONFORME " + limpar(d.documento));
  partes.push("NO VALOR DE R$ " + valorFormatado(d.valor) + " (" + valorPorExtenso(d.valor) + ")");
  if (d.fornecedor) {
    let fav = "EM FAVOR DE " + limpar(d.fornecedor);
    if (d.cnpj) fav += ", CNPJ " + limpar(d.cnpj);
    partes.push(fav);
  }
  return partes.join(", ") + ".";
}

function ajustarDescricao(texto: string): string {
  let t = limpar(texto);
  // remove prefixos comuns que nao fazem parte do padrao
  t = t.replace(/^(EMPENHO REFERENTE A |REF\.\s*|REFERENTE A )/, "");
  if (!t.startsWith("PELA DESPESA EMPENHADA REFERENTE A ")) {
    t = "PELA DESPESA EMPENHADA REFERENTE A " + t;
  }
  if (!t.endsWith(".")) t += ".";
  return t;
}

function help(): void {
  console.log(`\nUso: bun run descricao-empenho.ts <comando> [opcoes]

Comandos:
  gerar     Gera uma descricao padronizada de empenho
  ajustar   Recebe um texto livre e normaliza para o padrao (caixa alta, prefixo correto)

Opcoes de "gerar":
  --objeto         Objeto da despesa (obrigatorio)
  --especificacoes Especificacoes tecnicas (opcional)
  --finalidade     Finalidade / justificativa (opcional)
  --documento      Documento de origem: orcamento, contrato, etc. (obrigatorio)
  --valor          Valor numerico, ex: 22412.14 (obrigatorio)
  --fornecedor     Nome do fornecedor (opcional)
  --cnpj           CNPJ do fornecedor (opcional)
  --arquivo        Caminho para JSON com todos os campos acima
  --saida          Caminho para salvar a descricao em arquivo .md

Exemplo:
  bun run descricao-empenho.ts gerar \\
    --objeto="SERVICOS DE MANUTENCAO" \\
    --documento="ORCAMENTO Nº 16376 DE 10/06/2026" \\
    --valor=22412.14
`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    help();
    return;
  }
  const cmd = args[0];
  const sub = args.slice(1);

  if (cmd === "gerar") {
    const dados = carregarDados(sub);
    const saida = gerarDescricao(dados);
    console.log(saida);
    const arquivo = parseArg("--saida", sub);
    if (arquivo) {
      const path = arquivo.startsWith("/") ? arquivo : `${process.cwd()}/${arquivo}`;
      require("fs").writeFileSync(path, saida + "\n");
      console.log(`\nSalvo em: ${path}`);
    }
  } else if (cmd === "ajustar") {
    const texto = sub.filter((a) => !a.startsWith("--"))[0];
    if (!texto) throw new Error("informe o texto apos o comando ajustar");
    console.log(ajustarDescricao(texto));
  } else {
    help();
  }
}

if (import.meta.main) {
  try {
    await main();
  } catch (e: any) {
    console.error("Erro: " + e.message);
    process.exit(1);
  }
}
