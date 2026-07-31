#!/usr/bin/env python3
"""Gera PDF de dotação orçamentária a partir do template HTML."""

import argparse
import sys
from datetime import date
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
ASSETS_DIR = SKILL_DIR / "assets"
TEMPLATE = ASSETS_DIR / "modelo-dotacao.html"
BRASAO = Path("/home/workspace/Prefeitura/brasao-inaja.png")
OUTPUT_DIR = Path("/home/workspace/Prefeitura/Documentos")


def moeda(valor: float) -> str:
    if valor == int(valor):
        return f"R$ {valor:,.0f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def gerar_pdf(
    orgao: str,
    unidade: str,
    programa: str,
    acao: str,
    desc_acao: str,
    classificacao: str,
    desc_natureza: str,
    id_dotacao: str,
    fonte: str,
    desc_fonte: str,
    saldo: float,
    finalidade: str,
    ano: str = "2026",
    output: str = "",
) -> str:
    if not output:
        output = str(OUTPUT_DIR / f"dotacao-{id_dotacao}-{date.today().strftime('%Y-%m-%d')}.pdf")

    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Ler template
    html = TEMPLATE.read_text(encoding="utf-8")

    brasao_path = str(BRASAO.resolve())
    if not BRASAO.exists():
        brasao_path = ""

    # Preencher placeholders
    html = html.replace("{{BRASAO_PATH}}", brasao_path)
    html = html.replace("{{ORGAO}}", orgao)
    html = html.replace("{{UNIDADE}}", unidade)
    html = html.replace("{{PROGRAMA}}", programa)
    html = html.replace("{{ACAO}}", acao)
    html = html.replace("{{DESC_ACAO}}", desc_acao)
    html = html.replace("{{CLASSIFICACAO}}", classificacao)
    html = html.replace("{{DESC_NATUREZA}}", desc_natureza)
    html = html.replace("{{ID_DOTACAO}}", id_dotacao)
    html = html.replace("{{FONTE}}", fonte)
    html = html.replace("{{DESC_FONTE}}", desc_fonte)
    html = html.replace("{{SALDO}}", moeda(saldo))
    html = html.replace("{{FINALIDADE}}", finalidade)
    html = html.replace("{{ANO}}", ano)
    html = html.replace("{{DATA}}", date.today().strftime("%d/%m/%Y"))

    # Gerar PDF com weasyprint
    from weasyprint import HTML as WeasyHTML

    WeasyHTML(string=html).write_pdf(str(output_path))

    return str(output_path)


def main():
    parser = argparse.ArgumentParser(description="Gerar PDF de dotação orçamentária")
    parser.add_argument("--orgao", required=True)
    parser.add_argument("--unidade", required=True)
    parser.add_argument("--programa", default="")
    parser.add_argument("--acao", required=True)
    parser.add_argument("--desc-acao", required=True)
    parser.add_argument("--classificacao", required=True)
    parser.add_argument("--desc-natureza", required=True)
    parser.add_argument("--id-dotacao", required=True)
    parser.add_argument("--fonte", required=True)
    parser.add_argument("--desc-fonte", required=True)
    parser.add_argument("--saldo", type=float, required=True)
    parser.add_argument("--finalidade", required=True)
    parser.add_argument("--ano", default="2026")
    parser.add_argument("--output", default="")

    args = parser.parse_args()

    path = gerar_pdf(
        orgao=args.orgao,
        unidade=args.unidade,
        programa=args.programa,
        acao=args.acao,
        desc_acao=args.desc_acao,
        classificacao=args.classificacao,
        desc_natureza=args.desc_natureza,
        id_dotacao=args.id_dotacao,
        fonte=args.fonte,
        desc_fonte=args.desc_fonte,
        saldo=args.saldo,
        finalidade=args.finalidade,
        ano=args.ano,
        output=args.output,
    )
    print(path)


if __name__ == "__main__":
    main()
