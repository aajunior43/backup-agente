#!/usr/bin/env python3
"""Verifica se o ambiente LaTeX está funcionando corretamente.

Uso:
    python3 check-latex.py
    python3 check-latex.py --help
"""

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

CHECKS = [
    ("lualatex", "Compilador LuaLaTeX"),
    ("xelatex", "Compilador XeLaTeX"),
    ("pdflatex", "Compilador pdfLaTeX"),
]

REQUIRED_PACKAGES = [
    "babel",
    "geometry",
    "fancyhdr",
    "fontspec",
    "graphicx",
    "hyperref",
    "parskip",
    "setspace",
    "titlesec",
    "lmodern",
]

TEX_TEST = r"""
\documentclass[12pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[brazil]{babel}
\usepackage{geometry}
\usepackage{fontspec}
\begin{document}
Teste OK — ambiente LaTeX funcionando.
\end{document}
"""


def check_binaries():
    print("🔧 Verificando compiladores:\n")
    ok = False
    for binary, label in CHECKS:
        path = shutil.which(binary)
        if path:
            result = subprocess.run(
                [binary, "--version"], capture_output=True, text=True, timeout=10
            )
            version = result.stdout.strip().split("\n")[0] if result.stdout else "?"
            print(f"  ✅ {label}: {path}")
            print(f"     {version[:80]}")
            ok = True
        else:
            print(f"  ❌ {label}: não encontrado")
    return ok


def check_compilation():
    print("\n📄 Testando compilação mínima:\n")
    with tempfile.TemporaryDirectory() as tmp:
        tex_file = Path(tmp) / "test.tex"
        tex_file.write_text(TEX_TEST, encoding="utf-8")
        try:
            result = subprocess.run(
                ["lualatex", "-interaction=nonstopmode", str(tex_file)],
                capture_output=True,
                text=True,
                timeout=30,
                cwd=tmp,
            )
            pdf_file = Path(tmp) / "test.pdf"
            if pdf_file.exists():
                size = pdf_file.stat().st_size
                print(f"  ✅ Compilação OK ({size} bytes)")
                return True
            else:
                print(f"  ❌ Compilação falhou (sem PDF gerado)")
                if result.stderr:
                    for line in result.stderr.strip().split("\n")[:5]:
                        print(f"     {line}")
                return False
        except subprocess.TimeoutExpired:
            print("  ❌ Timeout na compilação")
            return False
        except Exception as e:
            print(f"  ❌ Erro: {e}")
            return False


def main():
    print("=" * 50)
    print("🩺 Diagnóstico do ambiente LaTeX")
    print("=" * 50 + "\n")

    bins_ok = check_binaries()
    if not bins_ok:
        print("\n❌ Nenhum compilador LaTeX encontrado.")
        print("   Instale com: sudo apt install texlive-full")
        sys.exit(1)

    compile_ok = check_compilation()

    print("\n" + "=" * 50)
    if compile_ok:
        print("✅ Ambiente LaTeX OK — pronto para uso.")
    else:
        print("⚠️  Compilação falhou. Verifique os pacotes instalados.")
        print("   sudo apt install texlive-latex-extra texlive-fonts-recommended")
    print("=" * 50)


if __name__ == "__main__":
    main()
