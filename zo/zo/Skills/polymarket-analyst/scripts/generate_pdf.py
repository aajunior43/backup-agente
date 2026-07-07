#!/usr/bin/env python3
"""
generate_pdf.py — Gera PDF de análise Polymarket.

Uso:
  python3 generate_pdf.py <arquivo.csv|json> --market "NOME" --output arquivo.pdf
  python3 generate_pdf.py dados.csv --market "Bitcoin" --output relatorio.pdf
"""

import argparse
import json
import csv
from datetime import datetime
from pathlib import Path
import math

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
    from reportlab.lib.units import cm
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

def parse_args():
    p = argparse.ArgumentParser(description="Gera PDF de análise Polymarket")
    p.add_argument("file", help="Arquivo CSV ou JSON com dados temporais")
    p.add_argument("--market", required=True, help="Nome do mercado")
    p.add_argument("--output", required=True, help="Arquivo PDF de saída")
    p.add_argument("--period", type=int, default=30, help="Período em dias")
    p.add_argument("--price-col", default="price", help="Nome da coluna de preço")
    p.add_argument("--ts-col", default="timestamp", help="Nome da coluna de tempo")
    p.add_argument("--chart", help="Caminho para imagem do gráfico (opcional)")
    return p.parse_args()

def load_data(file: str, price_col: str, ts_col: str):
    if file.endswith(".csv"):
        with open(file, newline="") as f:
            reader = csv.DictReader(f)
            rows = []
            for r in reader:
                rows.append({
                    "ts": datetime.fromisoformat(r[ts_col].replace("Z", "+00:00")),
                    "price": float(r[price_col])
                })
            return sorted(rows, key=lambda x: x["ts"])
    else:
        with open(file) as f:
            data = json.load(f)
            rows = []
            for r in data:
                ts_str = r.get(ts_col, r.get("date", r.get("time", "")))
                rows.append({
                    "ts": datetime.fromisoformat(ts_str.replace("Z", "+00:00")),
                    "price": float(r.get(price_col, r.get("value", 0)))
                })
            return sorted(rows, key=lambda x: x["ts"])

def calc_ma(data, window):
    result = []
    for i in range(len(data)):
        start = max(0, i - window + 1)
        result.append(sum(data[start:i+1]) / min(window, i + 1))
    return result

def calc_std(data):
    if len(data) < 2:
        return 0.0
    avg = sum(data) / len(data)
    variance = sum((x - avg) ** 2 for x in data) / len(data)
    return math.sqrt(variance)

def detect_trend(momentum, ma7, ma30, prices):
    if len(prices) < 30:
        if momentum > 5: return "📈 MODERADO (curto prazo)"
        if momentum < -5: return "📉 MODERADO (curto prazo)"
        return "→ LATERAL"
    
    if momentum > 10 and ma7[-1] > ma30[-1]:
        return "📈 FORTE"
    elif momentum > 5 and ma7[-1] > ma30[-1]:
        return "📈 MODERADO"
    elif momentum < -10 and ma7[-1] < ma30[-1]:
        return "📉 FORTE"
    elif momentum < -5 and ma7[-1] < ma30[-1]:
        return "📉 MODERADO"
    return "→ LATERAL"

def generate_pdf(data, market, output, period, chart_path=None):
    if not PDF_AVAILABLE:
        print("[ERROR] reportlab not available. Install with: pip install reportlab")
        print("[FALLBACK] Generating markdown report instead...")
        return generate_markdown(data, market, output.replace(".pdf", ".md"))
    
    prices = [d["price"] for d in data]
    dates = [d["ts"] for d in data]
    
    # Calculate metrics
    latest = prices[-1]
    max_price = max(prices)
    min_price = min(prices)
    avg_price = sum(prices) / len(prices)
    
    ma7 = calc_ma(prices, 7)
    ma30 = calc_ma(prices, 30) if len(prices) >= 30 else calc_ma(prices, len(prices)//2)
    ma7_latest = ma7[-1]
    ma30_latest = ma30[-1] if len(ma30) >= 30 else avg_price
    
    momentum_7d = ((prices[-1] - prices[-7]) / prices[-7] * 100) if len(prices) >= 7 else 0
    volatility = calc_std(prices)
    
    change_24h = ((prices[-1] - prices[-2]) / prices[-2] * 100) if len(prices) >= 2 else 0
    change_7d = ((prices[-1] - prices[-7]) / prices[-7] * 100) if len(prices) >= 7 else 0
    change_period = ((prices[-1] - prices[0]) / prices[0] * 100) if prices[0] > 0 else 0
    
    trend = detect_trend(momentum_7d, ma7, ma30, prices)
    
    # Create PDF
    doc = SimpleDocTemplate(output, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Colors
    yellow = colors.HexColor("#FFD600")
    black = colors.black
    bg = colors.HexColor("#000000")
    
    # Title
    title_style = ParagraphStyle('Title', parent=styles['Heading1'],
                                  fontSize=20, textColor=yellow, spaceAfter=30,
                                  alignment=1, fontName='Helvetica-Bold')
    story.append(Paragraph(f"📊 ANÁLISE — {market.upper()}", title_style))
    story.append(Spacer(1, 12))
    
    # Meta
    meta_style = ParagraphStyle('Meta', parent=styles['Normal'], fontSize=10,
                                  textColor=colors.gray, alignment=1)
    story.append(Paragraph(f"Gerado em: {datetime.now().strftime('%Y-%m-%d %H:%M')}", meta_style))
    story.append(Paragraph(f"Período: {dates[0].strftime('%Y-%m-%d')} → {dates[-1].strftime('%Y-%m-%d')}", meta_style))
    story.append(Spacer(1, 24))
    
    # Current data
    data_style = ParagraphStyle('Data', parent=styles['Normal'], fontSize=12, textColor=yellow)
    story.append(Paragraph(f"🎯 Preço Atual: {latest*100:.2f}%", data_style))
    story.append(Spacer(1, 8))
    
    # Variations table
    var_data = [
        ['Período', 'Variação', 'Direção'],
        ['24 horas', f'{change_24d:+.2f}%', '📈' if change_24h > 2 else '📉' if change_24h < -2 else '→'],
        ['7 dias', f'{change_7d:+.2f}%', '📈' if change_7d > 5 else '📉' if change_7d < -5 else '→'],
        ['Período total', f'{change_period:+.2f}%', '📈' if change_period > 5 else '📉' if change_period < -5 else '→'],
    ]
    
    var_table = Table(var_data, colWidths=[5*cm, 4*cm, 3*cm])
    var_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), yellow),
        ('TEXTCOLOR', (0, 0), (-1, 0), black),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 1, yellow),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#111111")),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#111111"), colors.HexColor("#1a1a1a")]),
    ]))
    story.append(var_table)
    story.append(Spacer(1, 20))
    
    # Metrics table
    metrics_data = [
        ['Métrica', 'Valor'],
        ['Média Móvel 7 dias', f'{ma7_latest*100:.2f}%'],
        ['Média Móvel 30 dias', f'{ma30_latest*100:.2f}%'],
        ['Volatilidade (Std)', f'{volatility*100:.2f}%'],
        ['Momentum 7 dias', f'{momentum_7d:+.2f}%'],
        ['Máximo histórico', f'{max_price*100:.2f}%'],
        ['Mínimo histórico', f'{min_price*100:.2f}%'],
        ['Range (máx-mín)', f'{(max_price-min_price)*100:.2f}%'],
    ]
    
    metrics_table = Table(metrics_data, colWidths=[7*cm, 5*cm])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), yellow),
        ('TEXTCOLOR', (0, 0), (-1, 0), black),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 1, yellow),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#111111"), colors.HexColor("#1a1a1a")]),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.white),
    ]))
    story.append(metrics_table)
    story.append(Spacer(1, 20))
    
    # Trend
    trend_style = ParagraphStyle('Trend', parent=styles['Heading2'], fontSize=14, textColor=yellow)
    story.append(Paragraph(f"{trend}", trend_style))
    story.append(Spacer(1, 20))
    
    # Chart image
    if chart_path and Path(chart_path).exists():
        story.append(Spacer(1, 12))
        img = Image(chart_path, width=15*cm, height=8*cm)
        story.append(img)
    
    # Disclaimer
    story.append(Spacer(1, 30))
    disc_style = ParagraphStyle('Disc', parent=styles['Normal'], fontSize=8, textColor=colors.gray,
                                 alignment=1)
    story.append(Paragraph("⚠️ Análise informativa. Não é recomendação de investimento.", disc_style))
    
    doc.build(story)
    print(f"PDF gerado: {output}")

def generate_markdown(data, market, output):
    prices = [d["price"] for d in data]
    latest = prices[-1]
    ma7 = calc_ma(prices, 7)
    
    momentum = ((prices[-1] - prices[-7]) / prices[-7] * 100) if len(prices) >= 7 else 0
    
    md = f"""# 📊 ANÁLISE — {market}

**Gerado:** {datetime.now().strftime('%Y-%m-%d %H:%M')}

## 🎯 Dados Atuais
- **Preço atual:** {latest*100:.2f}%
- **Momentum 7d:** {momentum:+.2f}%

## 📈 Métricas
- Máximo: {max(prices)*100:.2f}%
- Mínimo: {min(prices)*100:.2f}%
- MA7: {ma7[-1]*100:.2f}%
- Volatilidade: {calc_std(prices)*100:.2f}%

## 🔮 Tendência
{detect_trend(momentum, ma7, ma7, prices)}

---
*Análise Polymarket — não é recomendação financeira*
"""
    
    with open(output, 'w') as f:
        f.write(md)
    print(f"Markdown gerado: {output}")

def main():
    args = parse_args()
    data = load_data(args.file, args.price_col, args.ts_col)
    generate_pdf(data, args.market, args.output, args.period, args.chart)

if __name__ == "__main__":
    main()