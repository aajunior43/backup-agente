#!/usr/bin/env python3
"""Preenche templates LaTeX com dados de um JSON.

Uso:
    python3 fill-template.py template.tex dados.json [--output saida.tex]
    python3 fill-template.py --list-templates
    python3 fill-template.py --help

Formato do JSON:
    {
      "numeroOficio": "001/2026",
      "destinatarioNome": "Fulano",
      "assuntoOficio": "Assunto aqui",
      ...
    }
"""

import argparse
import json
import re
import sys
from pathlib import Path

SKILL_DIR = Path(__file__).parent.parent
TEMPLATES_DIR = SKILL_DIR / "references"
CONFIG_FILE = SKILL_DIR / "config" / "municipio.json"


def load_config() -> dict:
    if CONFIG_FILE.exists():
        return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    return {}


def list_templates():
    print("📄 Templates disponíveis:\n")
    for f in sorted(TEMPLATES_DIR.glob("*.tex")):
        name = f.stem.replace("modelo_", "").replace("_", " ").title()
        print(f"  • {f.name}  ({name})")
    print()


def fill_template(template_path: str, data: dict, output_path: str | None = None) -> str:
    """Preenche um template LaTeX substituindo \\command{...} pelos valores do JSON."""
    template = Path(template_path).read_text(encoding="utf-8")

    # Carrega config do município como fallback
    config = load_config()

    # Merge: dados do JSON sobrescrevem config
    merged = {**config, **data}

    # Substitui \newcommand{\chave}{valor_antigo} -> \newcommand{\chave}{valor_novo}
    def replace_command(match):
        cmd = match.group(1)
        old_val = match.group(2)
        # Mapeia nomes de comandos para chaves do JSON
        key_map = {
            "numeroOfício": "numeroOficio",
            "numeroOficio": "numeroOficio",
            "assuntoOfício": "assuntoOficio",
            "assuntoOficio": "assuntoOficio",
            "destinatarioNome": "destinatarioNome",
            "destinatarioCargo": "destinatarioCargo",
            "remetenteNome": "remetenteNome",
            "remetenteCargo": "remetenteCargo",
            "municipio": "municipio",
            "uf": "uf",
            "prefeitoAtual": "prefeitoAtual",
            "tituloRelatorio": "tituloRelatorio",
            "responsavel": "responsavel",
            "periodo": "periodo",
            "declarante": "declarante",
            "declaranteCargo": "declaranteCargo",
            "declaranteCPF": "declaranteCPF",
            "textoDeclaracao": "textoDeclaracao",
            "tipoDocumento": "tipoDocumento",
        }
        json_key = key_map.get(cmd, cmd)
        if json_key in merged:
            return f"\\newcommand{{\\{cmd}}}{{{merged[json_key]}}}"
        return match.group(0)

    # Padrão: \newcommand{\nome}{valor}
    filled = re.sub(
        r"\\newcommand\{\\([^}]+)\}\{([^}]*)\}",
        replace_command,
        template,
    )

    # Substitui \localData se não existir no template
    if "localData" in merged and "\\localData" in filled:
        filled = filled.replace("\\localData", merged["localData"])

    # Determina caminho de saída
    if output_path:
        out = Path(output_path)
    else:
        out = Path(template_path).with_suffix("").with_name(
            Path(template_path).stem.replace("modelo_", "") + "_preenchido.tex"
        )

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(filled, encoding="utf-8")
    return str(out)


def main():
    parser = argparse.ArgumentParser(
        description="Preenche templates LaTeX com dados JSON"
    )
    parser.add_argument("template", nargs="?", help="Caminho do template .tex")
    parser.add_argument("dados", nargs="?", help="Caminho do arquivo JSON com dados")
    parser.add_argument("--output", "-o", help="Caminho de saída (opcional)")
    parser.add_argument("--list-templates", action="store_true", help="Lista templates")
    args = parser.parse_args()

    if args.list_templates:
        list_templates()
        return

    if not args.template or not args.dados:
        parser.print_help()
        sys.exit(1)

    if not Path(args.template).exists():
        print(f"❌ Template não encontrado: {args.template}", file=sys.stderr)
        sys.exit(1)

    if not Path(args.dados).exists():
        print(f"❌ Arquivo de dados não encontrado: {args.dados}", file=sys.stderr)
        sys.exit(1)

    data = json.loads(Path(args.dados).read_text(encoding="utf-8"))
    output = fill_template(args.template, data, args.output)
    print(f"✅ Template preenchido: {output}")


if __name__ == "__main__":
    main()
