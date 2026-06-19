#!/usr/bin/env python3
"""
plot_chart.py — Gera gráficos de mercados Polymarket.

Uso:
  python3 plot_chart.py <arquivo.csv|json> --output saida.png [--type line|area|candlestick]
  python3 plot_chart.py <arquivo.csv|json> --output saida.png --ma7 --ma30 --volatility
"""

import argparse
import json
import csv
import sys
from datetime import datetime
from typing import List, Dict, Tuple

def parse_args():
    p = argparse.ArgumentParser(description="Gera gráfico de mercado Polymarket")
    p.add_argument("file", help="Arquivo CSV ou JSON com dados temporais")
    p.add_argument("--output", default="chart.png", help="Arquivo de saída")
    p.add_argument("--type", choices=["line", "area", "candlestick", "ascii"], default="line")
    p.add_argument("--width", type=int, default=80, help="Largura do gráfico ASCII")
    p.add_argument("--height", type=int, default=20, help="Altura do gráfico ASCII")
    p.add_argument("--ma7", action="store_true", help="Incluir média móvel 7 dias")
    p.add_argument("--ma30", action="store_true", help="Incluir média móvel 30 dias")
    p.add_argument("--volatility", action="store_true", help="Incluir bandas de volatilidade")
    p.add_argument("--price-col", default="price", help="Nome da coluna de preço")
    p.add_argument("--ts-col", default="timestamp", help="Nome da coluna de tempo")
    return p.parse_args()

def load_data(file: str, price_col: str, ts_col: str) -> List[Dict]:
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

def calc_ma(data: List[float], window: int) -> List[float]:
    result = []
    for i in range(len(data)):
        start = max(0, i - window + 1)
        result.append(sum(data[start:i+1]) / min(window, i + 1))
    return result

def normalize(data: List[float], min_val: float, max_val: float) -> List[float]:
    if max_val == min_val:
        return [0.5] * len(data)
    return [(x - min_val) / (max_val - min_val) for x in data]

def plot_ascii(data: List[Dict], width: int, height: int, show_ma7: bool = False, show_ma30: bool = False) -> str:
    prices = [d["price"] for d in data]
    
    # Calculate MA if needed
    ma7_data = calc_ma(prices, 7) if show_ma7 else None
    ma30_data = calc_ma(prices, 30) if show_ma30 else None
    
    # Normalize all values to 0-1
    all_vals = prices.copy()
    if ma7_data:
        all_vals.extend(ma7_data)
    if ma30_data:
        all_vals.extend(ma30_data)
    
    min_price = min(all_vals)
    max_price = max(all_vals)
    price_range = max_price - min_price if max_price > min_price else 0.01
    
    # Create grid
    grid = [[" " for _ in range(width)] for _ in range(height)]
    
    # Plot price line
    norm_prices = normalize(prices, min_price, max_price)
    for i, norm in enumerate(norm_prices):
        x = int(i * (width - 1) / max(len(prices) - 1, 1))
        y = int((1 - norm) * (height - 1))
        y = max(0, min(height - 1, y))
        grid[y][x] = "●"
    
    # Plot MA7
    if ma7_data:
        norm_ma7 = normalize(ma7_data, min_price, max_price)
        for i, norm in enumerate(norm_ma7):
            x = int(i * (width - 1) / max(len(ma7_data) - 1, 1))
            y = int((1 - norm) * (height - 1))
            y = max(0, min(height - 1, y))
            if grid[y][x] == " ":
                grid[y][x] = "○"
    
    # Plot MA30
    if ma30_data:
        norm_ma30 = normalize(ma30_data, min_price, max_price)
        for i, norm in enumerate(norm_ma30):
            x = int(i * (width - 1) / max(len(ma30_data) - 1, 1))
            y = int((1 - norm) * (height - 1))
            y = max(0, min(height - 1, y))
            if grid[y][x] == " ":
                grid[y][x] = "◐"
    
    # Build output
    lines = []
    for row in grid:
        lines.append("".join(row))
    
    # Add legend
    legend = []
    legend.append(f"Preço: ●  (${min_price:.2f} - ${max_price:.2f})")
    if show_ma7:
        legend.append("MA7: ○")
    if show_ma30:
        legend.append("MA30: ◐")
    legend.append(f"Período: {data[0]['ts'].strftime('%Y-%m-%d')} → {data[-1]['ts'].strftime('%Y-%m-%d')}")
    legend.append(f"Pontos: {len(data)}")
    
    return "\n".join(lines) + "\n" + "\n".join(legend)

def save_chart(data: List[Dict], output: str, chart_type: str, show_ma7: bool, show_ma30: bool, show_vol: bool):
    """Try to use matplotlib, fallback to ASCII."""
    try:
        import matplotlib.pyplot as plt
        import matplotlib.dates as mdates
        
        prices = [d["price"] for d in data]
        dates = [d["ts"] for d in data]
        
        fig, ax = plt.subplots(figsize=(12, 6))
        
        if chart_type == "area":
            ax.fill_between(dates, prices, alpha=0.3, color="cyan")
            ax.plot(dates, prices, color="cyan", linewidth=1.5)
        else:
            ax.plot(dates, prices, color="cyan", linewidth=1.5, marker="o", markersize=2)
        
        # MA
        if show_ma7:
            ma7 = calc_ma(prices, 7)
            ax.plot(dates[-len(ma7):], ma7, color="yellow", linewidth=1, label="MA7", linestyle="--")
        
        if show_ma30:
            ma30 = calc_ma(prices, 30)
            ax.plot(dates[-len(ma30):], ma30, color="red", linewidth=1, label="MA30", linestyle="--")
        
        # Volatility bands
        if show_vol and len(prices) > 7:
            ma7_vals = calc_ma(prices, 7)
            std = sum((p - m)**2 for p, m in zip(prices[-len(ma7_vals):], ma7_vals)) ** 0.5 / len(ma7_vals)
            upper = [m + 2*std for m in ma7_vals]
            lower = [m - 2*std for m in ma7_vals]
            ax.fill_between(dates[-len(ma7_vals):], lower, upper, alpha=0.1, color="orange")
        
        ax.set_facecolor("#000000")
        fig.patch.set_facecolor("#000000")
        ax.tick_params(colors="yellow")
        ax.yaxis.label.set_color("yellow")
        ax.xaxis.label.set_color("yellow")
        ax.set_title("Polymarket — Análise de Preço", color="yellow", fontsize=14)
        ax.grid(True, alpha=0.2, color="yellow")
        
        plt.tight_layout()
        plt.savefig(output, facecolor="black", dpi=100)
        print(f"Chart saved to {output}")
        
    except ImportError:
        # Fallback to ASCII
        ascii_chart = plot_ascii(data, 80, 20, show_ma7, show_ma30)
        print(ascii_chart)
        print(f"\n[Matplotlib not available — ASCII output above]")

def main():
    args = parse_args()
    data = load_data(args.file, args.price_col, args.ts_col)
    
    if len(data) == 0:
        print("No data found in file")
        sys.exit(1)
    
    save_chart(data, args.output, args.type, args.ma7, args.ma30, args.volatility)

if __name__ == "__main__":
    main()