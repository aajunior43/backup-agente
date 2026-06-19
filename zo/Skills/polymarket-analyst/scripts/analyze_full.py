#!/usr/bin/env python3
"""
analyze_full.py — Análise completa de mercados Polymarket.

Calcula todas as métricas: preço atual, variações, médias móveis,
volatilidade, momentum, sinais de tendência.

Uso:
  python3 analyze_full.py <arquivo.csv|json> [--period dias]
"""

import argparse
import json
import csv
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Any
import math

def parse_args():
    p = argparse.ArgumentParser(description="Análise completa de mercado Polymarket")
    p.add_argument("file", help="Arquivo CSV ou JSON com dados temporais")
    p.add_argument("--period", type=int, default=30, help="Período em dias para métricas")
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

def calc_avg(data: List[float], window: int) -> List[float]:
    result = []
    for i in range(len(data)):
        start = max(0, i - window + 1)
        result.append(sum(data[start:i+1]) / min(window, i + 1))
    return result

def calc_std(data: List[float]) -> float:
    if len(data) < 2:
        return 0.0
    avg = sum(data) / len(data)
    variance = sum((x - avg) ** 2 for x in data) / len(data)
    return math.sqrt(variance)

def calc_momentum(prices: List[float], window: int = 7) -> float:
    if len(prices) < window:
        return 0.0
    return ((prices[-1] - prices[-window]) / prices[-window]) * 100

def detect_trend(prices: List[float], ma7: List[float], ma30: List[float], momentum: float) -> str:
    if len(prices) < 30:
        # Use only short-term indicators
        if momentum > 10 and ma7[-1] > prices[-1]:
            return "📈 FORTE (curto prazo)"
        elif momentum > 5:
            return "📈 MODERADO"
        elif momentum < -10:
            return "📉 FORTE (curto prazo)"
        elif momentum < -5:
            return "📉 MODERADO"
        else:
            return "→ LATERAL"
    
    # Full analysis with MA30
    if momentum > 10 and ma7[-1] > ma30[-1]:
        return "📈 FORTE"
    elif momentum > 5 and ma7[-1] > ma30[-1]:
        return "📈 MODERADO"
    elif momentum < -10 and ma7[-1] < ma30[-1]:
        return "📉 FORTE"
    elif momentum < -5 and ma7[-1] < ma30[-1]:
        return "📉 MODERADO"
    else:
        return "→ LATERAL"

def analyze(file: str, period: int, price_col: str, ts_col: str):
    data = load_data(file, price_col, ts_col)
    
    if len(data) == 0:
        print(json.dumps({"error": "No data found"}))
        return
    
    prices = [d["price"] for d in data]
    now = datetime.now()
    
    # Filter to period
    cutoff = now - timedelta(days=period)
    period_data = [d for d in data if d["ts"] >= cutoff]
    period_prices = [d["price"] for d in period_data]
    
    if len(period_prices) == 0:
        period_prices = prices
        period_data = data
    
    # Basic metrics
    latest = prices[-1]
    earliest = prices[0]
    
    # All data stats
    all_prices = prices
    max_price = max(all_prices)
    min_price = min(all_prices)
    avg_price = sum(all_prices) / len(all_prices)
    
    # Period stats
    period_max = max(period_prices)
    period_min = min(period_prices)
    
    # Moving averages
    ma7 = calc_avg(prices, 7)
    ma30 = calc_avg(prices, 30)
    ma7_latest = ma7[-1] if ma7 else latest
    ma30_latest = ma30[-1] if len(ma30) >= 30 else avg_price
    
    # Volatility
    stddev = calc_std(period_prices)
    volatility_pct = (stddev / avg_price * 100) if avg_price > 0 else 0
    
    # Momentum
    momentum_7d = calc_momentum(prices, 7)
    momentum_30d = calc_momentum(prices, 30) if len(prices) >= 30 else 0
    
    # Changes
    change_24h = 0
    if len(prices) >= 2:
        change_24h = ((prices[-1] - prices[-2]) / prices[-2]) * 100
    
    change_period = ((latest - earliest) / earliest * 100) if earliest > 0 else 0
    
    # Range
    range_val = max_price - min_price
    
    # Trend
    trend = detect_trend(prices, ma7, ma30, momentum_7d)
    
    # Confidence
    liquidity = "🟢 Alta" if len(period_data) > 20 else "🟡 Média" if len(period_data) > 5 else "🔴 Baixa"
    
    result = {
        "current": round(latest * 100, 2),
        "change_24h": round(change_24h, 2),
        "change_period_pct": round(change_period, 2),
        "momentum_7d": round(momentum_7d, 2),
        "momentum_30d": round(momentum_30d, 2),
        "ma7": round(ma7_latest * 100, 2),
        "ma30": round(ma30_latest * 100, 2) if len(ma30) >= 30 else None,
        "range": round(range_val * 100, 2),
        "volatility_pct": round(volatility_pct, 2),
        "max_hist": round(max_price * 100, 2),
        "min_hist": round(min_price * 100, 2),
        "avg_price": round(avg_price * 100, 2),
        "stddev": round(stddev * 100, 2),
        "trend": trend,
        "data_points": len(period_data),
        "liquidity": liquidity,
        "period_days": period,
        "earliest_price": round(earliest * 100, 2),
        "latest_price": round(latest * 100, 2),
    }
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    args = parse_args()
    analyze(args.file, args.period, args.price_col, args.ts_col)