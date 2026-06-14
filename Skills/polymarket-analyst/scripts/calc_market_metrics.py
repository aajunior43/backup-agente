#!/usr/bin/env python3
"""
calc_market_metrics.py — Calcula métricas padrão para séries temporais de mercados Polymarket.

Uso:
  python calc_market_metrics.py <arquivo.csv> [--window HORAS]
  python calc_market_metrics.py <arquivo.json> [--field price] [--window HORAS]

Entrada esperada:
  CSV: colunas timestamp (ISO8601) e price (float)
  JSON: lista de objetos com campos `timestamp` e `price` (ou outro via --field)

Saída (JSON):
  {
    "latest": float,
    "change_abs": float,
    "change_pct": float,
    "window_hours": float,
    "range": float,
    "trend": "up|down|flat"
  }
"""

import argparse
import json
import csv
import sys
from datetime import datetime, timezone
from typing import List, Dict, Any

def parse_args():
    p = argparse.ArgumentParser(description="Calcula métricas de série temporal de mercado")
    p.add_argument("file", help="Arquivo CSV ou JSON")
    p.add_argument("--field", default="price", help="Campo do JSON que contém o preço (default: price)")
    p.add_argument("--window", type=float, default=24.0, help="Janela em horas para cálculo (default: 24)")
    return p.parse_args()

def load_series(file: str, field: str) -> List[Dict[str, Any]]:
    if file.endswith(".csv"):
        with open(file, newline="") as f:
            reader = csv.DictReader(f)
            rows = []
            for r in reader:
                rows.append({
                    "ts": datetime.fromisoformat(r["timestamp"].replace("Z", "+00:00")),
                    "value": float(r["price"])
                })
            return rows
    else:  # JSON
        with open(file) as f:
            data = json.load(f)
        rows = []
        for item in data:
            ts = datetime.fromisoformat(item["timestamp"].replace("Z", "+00:00")) if isinstance(item["timestamp"], str) else item["timestamp"]
            rows.append({
                "ts": ts,
                "value": float(item[field])
            })
        return rows

def main():
    args = parse_args()
    series = load_series(args.file, args.field)
    if not series:
        print(json.dumps({"error": "empty series"}))
        sys.exit(1)

    series.sort(key=lambda x: x["ts"])
    now = series[-1]["ts"]
    window_seconds = args.window * 3600
    cutoff = now.timestamp() - window_seconds

    window_data = [x["value"] for x in series if x["ts"].timestamp() >= cutoff]
    if len(window_data) < 2:
        print(json.dumps({"error": "insufficient data in window"}))
        sys.exit(1)

    latest = window_data[-1]
    oldest = window_data[0]
    change_abs = latest - oldest
    change_pct = (change_abs / oldest) * 100 if oldest != 0 else None
    value_range = max(window_data) - min(window_data)
    trend = "up" if change_abs > 0 else ("down" if change_abs < 0 else "flat")

    out = {
        "latest": round(latest, 4),
        "change_abs": round(change_abs, 4),
        "change_pct": round(change_pct, 4) if change_pct is not None else None,
        "window_hours": args.window,
        "range": round(value_range, 4),
        "trend": trend,
        "samples": len(window_data)
    }
    print(json.dumps(out, indent=2))

if __name__ == "__main__":
    main()
