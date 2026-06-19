#!/usr/bin/env python3
"""
siconfi-consulta.py
Script para consultar dados do SICONFI (Sistema de Informações Contábeis e Fiscais
do Setor Público Brasileiro) da Prefeitura Municipal de Inajá/PR.

Uso:
    python3 siconfi-consulta.py --rreo 2026 2        # RREO do 2º bimestre/2026
    python3 siconfi-consulta.py --rgf 2026 1         # RGF do 1º semestre/2026
    python3 siconfi-consulta.py --dca 2025           # DCA de 2025
    python3 siconfi-consulta.py --msc 2026 1         # MSC mensal jan/2026
    python3 siconfi-consulta.py --extrato 2026       # Extrato de declarações
    python3 siconfi-consulta.py --resumo 2025        # Resumo fiscal de 2025

Não exige certificado digital (SICONFI API é pública).
Salva resultados em /home/workspace/Prefeitura/siconfi_output/
"""

import argparse
import json
import sys
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

BASE = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt"
CODIGO_IBGE = "4110300"  # Inajá/PR
ESFERA = "M"  # M = Município
ESFERA_ACAO = "M"  # M = Executivo Municipal (ou "M - Todos" para consolidado)
OUTPUT_DIR = Path("/home/workspace/Prefeitura/siconfi_output")
TIMEOUT = 30


def fetch(endpoint: str, params: dict) -> dict | list:
    """Faz requisição GET à API SICONFI e retorna JSON."""
    params_clean = {k: v for k, v in params.items() if v is not None}
    qs = urlencode(params_clean)
    url = f"{BASE}/{endpoint}?{qs}"
    print(f"GET {url}")
    req = Request(url, headers={"Accept": "application/json",
                                 "User-Agent": "PrefInaja-SICONFI/1.0"})
    for attempt in range(3):
        try:
            with urlopen(req, timeout=TIMEOUT) as r:
                payload = json.loads(r.read().decode("utf-8"))
            return payload
        except HTTPError as e:
            print(f"  → HTTP {e.code} (tentativa {attempt + 1}/3)", file=sys.stderr)
            if e.code in (400, 404, 422):
                err = e.read().decode("utf-8", "ignore")
                print(f"  → Body: {err[:500]}", file=sys.stderr)
                return {"erro": err, "status": e.code}
            time.sleep(2 ** attempt)
        except URLError as e:
            print(f"  → URL Error: {e.reason} (tentativa {attempt + 1}/3)", file=sys.stderr)
            time.sleep(2 ** attempt)
    return {"erro": "falha após 3 tentativas"}


def save(name: str, data: dict | list) -> Path:
    """Salva JSON em disco e retorna o caminho."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUTPUT_DIR / f"{name}.json"
    out.write_text(json.dumps(data, ensure_ascii=False, indent=2),
                   encoding="utf-8")
    print(f"  ✓ Salvo: {out}")
    return out


def show_summary(data: dict | list, top: int = 5) -> None:
    """Mostra resumo de até N primeiros itens da resposta."""
    items = data.get("items", data) if isinstance(data, dict) else data
    if not isinstance(items, list):
        items = [items]
    if not items:
        print("  (sem itens retornados)")
        return
    print(f"  → {len(items)} item(ns) retornado(s); exibindo {min(top, len(items))}:")
    for i, item in enumerate(items[:top], 1):
        if not isinstance(item, dict):
            print(f"    {i}. {item}")
            continue
        cols = ["an_exercicio", "nr_periodo", "no_anexo", "co_tipo_demonstrativo",
                "in_periodicidade", "dt_homologacao", "in_homologado"]
        line = " | ".join(f"{k}={item.get(k, '-')}" for k in cols if k in item)
        print(f"    {i}. {line}")


def cmd_rreo(args):
    """Consulta RREO — Relatório Resumido de Execução Orçamentária."""
    print(f"\n══ RREO {args.exercicio}, {args.bimestre}º bimestre ══")
    params = {
        "an_exercicio": args.exercicio,
        "nr_periodo": args.bimestre,
        "id_ente": CODIGO_IBGE,
        "in_periodicidade": "B",  # B = Bimestral
        "no_anexo": args.anexo or "RREO-Anexo 01",
        "esfera": ESFERA_ACAO,
    }
    data = fetch("rreo", params)
    save(f"rreo_{args.exercicio}_bim{args.bimestre}_{args.anexo or 'anexo01'}", data)
    show_summary(data)


def cmd_rgf(args):
    """Consulta RGF — Relatório de Gestão Fiscal."""
    print(f"\n══ RGF {args.exercicio}, {args.semestre}º semestre (Q{args.semestre}) ══")
    params = {
        "an_exercicio": args.exercicio,
        "in_periodicidade": "S",  # S = Semestral
        "nr_periodo": args.semestre,
        "id_ente": CODIGO_IBGE,
        "no_anexo": args.anexo or "RGF-Anexo 01",
        "esfera": ESFERA_ACAO,
    }
    data = fetch("rgf", params)
    save(f"rgf_{args.exercicio}_sem{args.semestre}_{args.anexo or 'anexo01'}", data)
    show_summary(data)


def cmd_dca(args):
    """Consulta DCA — Declaração de Contas Anuais."""
    print(f"\n══ DCA {args.exercicio} ══")
    params = {
        "an_exercicio": args.exercicio,
        "no_anexo": args.anexo or "DCA-Anexo I-ED",
        "id_ente": CODIGO_IBGE,
    }
    data = fetch("dca", params)
    save(f"dca_{args.exercicio}_{args.anexo or 'anexoIED'}", data)
    show_summary(data)


def cmd_msc(args):
    """Consulta MSC — Matriz de Saldos Contábeis."""
    print(f"\n══ MSC {args.exercicio}, mês {args.mes:02d} ══")
    params = {
        "an_exercicio": args.exercicio,
        "nr_periodo": args.mes,
        "id_ente": CODIGO_IBGE,
        "co_tipo_matriz": args.tipo or "MSCC",
    }
    data = fetch("msc", params)
    save(f"msc_{args.exercicio}_mes{args.mes:02d}_{args.tipo or 'MSCC'}", data)
    show_summary(data)


def cmd_extrato(args):
    """Consulta Extrato de declarações homologadas."""
    print(f"\n══ Extrato de declarações {args.exercicio} ══")
    params = {
        "an_exercicio": args.exercicio,
        "id_ente": CODIGO_IBGE,
    }
    data = fetch("extrato-entes-federados", params)
    save(f"extrato_{args.exercicio}", data)
    show_summary(data, top=20)


def cmd_resumo(args):
    """Consulta dados resumidos do município (entes federados)."""
    print(f"\n══ Resumo do ente {CODIGO_IBGE} ══")
    data = fetch(f"ente/{CODIGO_IBGE}", {})
    save(f"resumo_ente_{CODIGO_IBGE}", data)
    show_summary(data)


def main():
    p = argparse.ArgumentParser(
        description="Consulta dados fiscais de Inajá/PR no SICONFI (Tesouro Nacional).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("rreo", help="RREO — Relatório Resumido de Execução Orçamentária")
    s.add_argument("exercicio", type=int)
    s.add_argument("bimestre", type=int, help="1 a 6")
    s.add_argument("--anexo", default=None, help="Ex.: 'RREO-Anexo 01' (default: 01)")
    s.set_defaults(func=cmd_rreo)

    s = sub.add_parser("rgf", help="RGF — Relatório de Gestão Fiscal")
    s.add_argument("exercicio", type=int)
    s.add_argument("semestre", type=int, help="1 ou 2")
    s.add_argument("--anexo", default=None, help="Ex.: 'RGF-Anexo 01' (default: 01)")
    s.set_defaults(func=cmd_rgf)

    s = sub.add_parser("dca", help="DCA — Declaração de Contas Anuais")
    s.add_argument("exercicio", type=int)
    s.add_argument("--anexo", default=None, help="Ex.: 'DCA-Anexo I-ED' (default)")
    s.set_defaults(func=cmd_dca)

    s = sub.add_parser("msc", help="MSC — Matriz de Saldos Contábeis")
    s.add_argument("exercicio", type=int)
    s.add_argument("mes", type=int, help="1 a 13 (13 = encerramento)")
    s.add_argument("--tipo", default=None, help="MSCC, MSCE, MSCP, MSCO (default MSCC)")
    s.set_defaults(func=cmd_msc)

    s = sub.add_parser("extrato", help="Extrato de declarações homologadas")
    s.add_argument("exercicio", type=int)
    s.set_defaults(func=cmd_extrato)

    s = sub.add_parser("resumo", help="Resumo do ente federado")
    s.add_argument("--exercicio", type=int, default=2026)
    s.set_defaults(func=cmd_resumo)

    args = p.parse_args()
    args.func(args)
    print(f"\n✓ Arquivos salvos em: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
