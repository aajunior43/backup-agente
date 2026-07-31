---
name: descricao-empenho
description: Gera descricoes de empenho orcamentario da administracao publica municipal no padrao exigido pela Prefeitura de Inaja/PR. A descricao comeca sempre com "PELA DESPESA EMPENHADA REFERENTE A" e e escrita toda em caixa alta, sem acentos, incluindo objeto, especificacoes tecnicas, documento de origem, valor numerico e por extenso, fornecedor e CNPJ quando aplicaveis.
metadata:
  author: aleksandro.zo.computer
---

# descricao-empenho

Gera a descricao de empenho no padrao da Prefeitura de Inaja/PR.

## Padrao obrigatorio

- Inicia **sempre** com: `PELA DESPESA EMPENHADA REFERENTE A `
- Toda em **caixa alta**, **sem acentos**, pontuacao limpa
- Em frase unica, separando os elementos por virgula e finalizando com ponto
- Inclui, quando aplicavel, na ordem:
  1. Objeto da despesa
  2. Especificacoes tecnicas (chassi, modelo, quantidade, etc.)
  3. Finalidade / justificativa
  4. Documento de origem (orcamento, contrato, ATA, dispensa, etc.)
  5. Valor numerico (R$ 22.412,14) seguido do valor por extenso entre parenteses
  6. Fornecedor e CNPJ, quando houver

## Exemplos

**Generica:**
> PELA DESPESA EMPENHADA REFERENTE A AQUISICAO DE GENEROS ALIMENTICIOS PARA A MERENDA ESCOLAR, CONFORME ATA DE REGISTRO DE PRECOS Nº 12/2026, NO VALOR DE R$ 15.000,00 (QUINZE MIL REAIS), EM FAVOR DE DISTRIBUIDORA EXEMPLO LTDA, CNPJ 12.345.678/0001-90.

**Com especificacoes e finalidade (veiculo):**
> PELA DESPESA EMPENHADA REFERENTE A SERVICOS DE MANUTENCAO CORRETIVA E FORNECIMENTO DE PECAS DE REPOSICAO DO SISTEMA DE EMBREAGEM DO VEICULO MERCEDES-BENZ ATEGO 2730 K/36 6X4, CHASSI 9BM951514TB435681, ANO FABRICACAO/MODELO 2025/2026, COR BRANCA, KM 701, VISANDO SOLUCIONAR A DIFICULDADE DE ENGATE DA CAIXA DE CAMBIO, CONFORME ORCAMENTO Nº 16376 DE 10/06/2026, NO VALOR DE R$ 22.412,14 (VINTE E DOIS MIL, QUATROCENTOS E DOZE REAIS E QUATORZE CENTAVOS), EM FAVOR DE INGA VEICULOS PARANAVAI, CNPJ 01.994.951/0011-68.

## Fluxo

Quando Aleksandro pedir a descricao de um empenho:

1. Ler o documento enviado (PDF, DOCX, TXT ou mensagem livre).
2. Extrair: objeto, especificacoes (se houver), finalidade (se houver),
   documento de origem, valor, fornecedor, CNPJ.
3. Normalizar tudo: caixa alta, sem acento, espacamento simples.
4. Compor a frase na ordem canonica, com virgulas entre elementos
   e ponto final.
5. Entregar a frase pronta e limpa.

## CLI auxiliar (opcional)

Existe um script em `scripts/descricao-empenho.ts` para gerar a descricao
via terminal, util quando o mesmo orcamento sera usado varias vezes:

```bash
bun run Skills/descricao-empenho/scripts/descricao-empenho.ts gerar \
  --objeto="SERVICOS DE MANUTENCAO CORRETIVA" \
  --especificacoes="CHASSI 9BM951514TB435681" \
  --finalidade="VISANDO SOLUCIONAR ENGATE DA CAIXA DE CAMBIO" \
  --documento="ORCAMENTO Nº 16376 DE 10/06/2026" \
  --valor=22412.14 \
  --fornecedor="INGA VEICULOS PARANAVAI" \
  --cnpj="01.994.951/0011-68"
```

Tambem aceita um JSON com `--arquivo` (veja o help com `--help`) e o
subcomando `ajustar` para normalizar uma descricao ja escrita.
