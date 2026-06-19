#!/usr/bin/env python3
"""
run_full_analysis.py — Executa análise completa de uma vez.

Executa: análise + gráfico + PDF + Obsidian

Uso:
  python3 run_full_analysis.py <arquivo.csv|json> --market "Bitcoin"
  python3 run_full_analysis.py dados.csv --market "Ethereum"
"""

import sys
import os
from pathlib import Path
from datetime import datetime

# Add skill scripts to path
SCRIPT_DIR = Path(__file__).parent
SKILL_DIR = SCRIPT_DIR.parent

def run_analysis(file_path, market, period=30, price_col="price", ts_col="timestamp"):
    print(f"📊 Análise Polymarket — {market}")
    print("=" * 50)
    
    # 1. Analyze
    print("\n1️⃣ Analisando dados...")
    import subprocess
    
    # Analyze
    result = subprocess.run(
        ["python3", str(SCRIPT_DIR / "analyze_full.py"), file_path, "--period", str(period)],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        metrics = result.stdout
        print("✅ Análise concluída")
        try:
            import json
            data = json.loads(metrics)
            print(f"   Preço atual: {data['current']}%")
            print(f"   Tendência: {data['trend']}")
            print(f"   Momentum 7d: {data['momentum_7d']}%")
        except:
            print(metrics[:200])
    else:
        print(f"⚠️ Análise: {result.stderr[:200]}")
    
    # 2. Generate chart
    print("\n2️⃣ Gerando gráfico...")
    chart_dir = SKILL_DIR / "charts"
    chart_dir.mkdir(exist_ok=True)
    chart_path = chart_dir / f"{market.replace(' ', '-').lower()}-{datetime.now().strftime('%Y%m%d')}.png"
    
    result = subprocess.run([
        "python3", str(SCRIPT_DIR / "plot_chart.py"), file_path,
        "--output", str(chart_path), "--ma7", "--ma30"
    ], capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"✅ Gráfico: {chart_path}")
    else:
        print(f"⚠️ Gráfico: {result.stderr[:100] if result.stderr else result.stdout[:100]}")
        chart_path = None
    
    # 3. Generate PDF
    print("\n3️⃣ Gerando PDF...")
    pdf_dir = SKILL_DIR / "pdfs"
    pdf_dir.mkdir(exist_ok=True)
    pdf_path = pdf_dir / f"{market.replace(' ', '-').lower()}-{datetime.now().strftime('%Y%m%d')}.pdf"
    
    result = subprocess.run([
        "python3", str(SCRIPT_DIR / "generate_pdf.py"), file_path,
        "--market", market, "--output", str(pdf_path), "--period", str(period)
    ], capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"✅ PDF: {pdf_path}")
    else:
        print(f"⚠️ PDF: {result.stderr[:100] if result.stderr else result.stdout[:100]}")
        pdf_path = None
    
    # 4. Save to Obsidian
    print("\n4️⃣ Salvando no Obsidian...")
    result = subprocess.run([
        "python3", str(SCRIPT_DIR / "save_obsidian.py"), file_path,
        "--market", market,
        "--period", str(period)
    ], capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✅ Obsidian atualizado")
    else:
        print(f"⚠️ Obsidian: {result.stderr[:100] if result.stderr else result.stdout[:100]}")
    
    print("\n" + "=" * 50)
    print("✅ Análise completa!")
    print(f"📁 Gráfico: {chart_path}")
    print(f"📄 PDF: {pdf_path}")
    print(f"📓 Obsidian: ~/obsidian/.../dados/polymarket/")

def main():
    if len(sys.argv) < 3 or sys.argv[1] in ["-h", "--help"]:
        print("Uso: python3 run_full_analysis.py <arquivo.csv|json> --market 'NOME'")
        print("Ex: python3 run_full_analysis.py bitcoin.csv --market 'Bitcoin' --period 30")
        sys.exit(1)
    
    file_path = sys.argv[1]
    market = "Polymarket"
    period = 30
    
    # Parse args
    for i, arg in enumerate(sys.argv[2:]):
        if arg == "--market" and i + 2 < len(sys.argv):
            market = sys.argv[sys.argv.index(arg) + 2]
        elif arg == "--period" and i + 2 < len(sys.argv):
            period = int(sys.argv[sys.argv.index(arg) + 2])
    
    run_analysis(file_path, market, period)

if __name__ == "__main__":
    main()