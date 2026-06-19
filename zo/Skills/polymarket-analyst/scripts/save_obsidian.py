#!/usr/bin/env python3
"""
save_obsidian.py — Salva análise Polymarket no Obsidian.

Uso:
  python3 save_obsidian.py <arquivo.csv|json> --market "NOME" --chart-path [IMG]
  python3 save_obsidian.py dados.csv --market "Bitcoin" --chart-path charts/btc.png
"""

import argparse
import json
import csv
from datetime import datetime
from pathlib import Path
import math

def parse_args():
    p = argparse.ArgumentParser(description="Salva análise Polymarket no Obsidian")
    p.add_argument("file", help="Arquivo CSV ou JSON com dados temporais")
    p.add_argument("--market", required=True, help="Nome do mercado")
    p.add_argument("--chart-path", help="Caminho para imagem do gráfico")
    p.add_argument("--pdf-path", help="Caminho para arquivo PDF")
    p.add_argument("--obsidian-dir", default="/home/administrator/obsidian/vaults/MeuCofre/EVA/dados/polymarket",
                   help="Diretório base do Obsidian")
    p.add_argument("--period", type=int, default=30, help="Período em dias")
    p.add_argument("--price-col", default="price", help="Nome da coluna de preço")
    p.add_argument("--ts-col", default="timestamp", help="Nome da coluna de tempo")
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

def save_to_obsidian(data, market, obsidian_dir, chart_path=None, pdf_path=None, period=30):
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
    momentum_30d = ((prices[-1] - prices[-30]) / prices[-30] * 100) if len(prices) >= 30 else 0
    volatility = calc_std(prices)
    
    change_24h = ((prices[-1] - prices[-2]) / prices[-2] * 100) if len(prices) >= 2 else 0
    change_7d = ((prices[-1] - prices[-7]) / prices[-7] * 100) if len(prices) >= 7 else 0
    change_period = ((prices[-1] - prices[0]) / prices[0] * 100) if prices[0] > 0 else 0
    
    trend = detect_trend(momentum_7d, ma7, ma30, prices)
    
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M")
    
    # Create directory structure
    market_dir = Path(obsidian_dir) / market.replace(" ", "-").lower()
    market_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate markdown content
    md_content = f"""# 📊 Análise — {market}

**Data:** {date_str} às {time_str}  
**Período:** {dates[0].strftime('%Y-%m-%d')} → {dates[-1].strftime('%Y-%m-%d')}

---

## 🎯 Dados Atuais

| Métrica | Valor |
|---------|-------|
| **Preço atual** | {latest*100:.2f}% |
| Volume de dados | {len(data)} pontos |

---

## 📈 Análise de Preço

### Gráfico
"""

    # Add chart if available
    if chart_path and Path(chart_path).exists():
        md_content += f"\n![Gráfico de Preço]({Path(chart_path).name})\n"
    
    md_content += f"""
### Estatísticas
| Métrica | Valor |
|---------|-------|
| Máximo histórico | {max_price*100:.2f}% |
| Mínimo histórico | {min_price*100:.2f}% |
| Média (todos) | {avg_price*100:.2f}% |
| Range (máx-mín) | {(max_price-min_price)*100:.2f}% |
| Volatilidade (std) | {volatility*100:.2f}% |

---

## 📊 Variação

| Período | Variação | Direção |
|---------|---------|---------|
| 24h | {change_24h:+.2f}% | {'📈' if change_24h > 2 else '📉' if change_24h < -2 else '→'} |
| 7 dias | {change_7d:+.2f}% | {'📈' if change_7d > 5 else '📉' if change_7d < -5 else '→'} |
| Período total | {change_period:+.2f}% | {'📈' if change_period > 5 else '📉' if change_period < -5 else '→'} |

---

## 📉 Médias Móveis

| Média | Valor |
|-------|-------|
| MA7 (curto prazo) | {ma7_latest*100:.2f}% |
| MA30 (longo prazo) | {ma30_latest*100:.2f}% |

---

## 🔮 Momentum e Tendência

| Métrica | Valor |
|---------|-------|
| Momentum 7 dias | {momentum_7d:+.2f}% |
| Momentum 30 dias | {momentum_30d:+.2f}% |
| **Tendência** | **{trend}** |

---

## 🔮 Signal

**Tendência:** {trend}

{momentum_7d > 5 and ma7_latest > ma30_latest and '📈 Força compradora - momentum positivo com médias alinhadas' or ''}
{momentum_7d > 10 and '📈 Movimento forte - considerar extensão do rally' or ''}
{momentum_7d < -5 and '📉 Pressão vendedora domina' or ''}
{momentum_7d > -5 and momentum_7d < 5 and '→ Consolidando - esperar breakout' or ''}

---

## ⚠️ Riscos e Limitações

- Dados refletem probabilidade implícita, não certeza
- Mercado pode corrigir rapidamente
- Volatilidade: {volatility*100:.1f}% ({(volatility*100/avg_price*100):.1f}% do preço médio)
- Análise não é recomendação de investimento

---

## 📝 Notes

- _{{PENDENTE: observações}}_

---

**Fontes:** Tavily + Firecrawl (dados em tempo real)  
**Gerado:** {now.strftime('%Y-%m-%d %H:%M:%S')}

"""

    # Add PDF link if available
    if pdf_path and Path(pdf_path).exists():
        md_content += f"\n**PDF:** [[{Path(pdf_path).name}]]\n"
    
    # Save files
    # Daily summary file
    daily_file = Path(obsidian_dir) / f"{date_str}-{market.replace(' ', '-').lower()}.md"
    with open(daily_file, 'w') as f:
        f.write(md_content)
    print(f"✅ Análise salva: {daily_file}")
    
    # Market-specific file (latest)
    latest_file = market_dir / "latest-analysis.md"
    with open(latest_file, 'w') as f:
        f.write(md_content)
    print(f"✅ Latest salvo: {latest_file}")
    
    # JSON summary for programmatic access
    summary_file = market_dir / f"analysis-{date_str}.json"
    summary = {
        "market": market,
        "date": date_str,
        "time": time_str,
        "current_price": round(latest * 100, 2),
        "change_24h": round(change_24h, 2),
        "change_7d": round(change_7d, 2),
        "change_period_pct": round(change_period, 2),
        "momentum_7d": round(momentum_7d, 2),
        "momentum_30d": round(momentum_30d, 2),
        "ma7": round(ma7_latest * 100, 2),
        "ma30": round(ma30_latest * 100, 2),
        "volatility_pct": round(volatility * 100, 2),
        "max_price": round(max_price * 100, 2),
        "min_price": round(min_price * 100, 2),
        "range": round((max_price - min_price) * 100, 2),
        "trend": trend,
        "data_points": len(data)
    }
    with open(summary_file, 'w') as f:
        json.dump(summary, f, indent=2)
    print(f"✅ JSON salvo: {summary_file}")
    
    return str(daily_file)

def main():
    args = parse_args()
    data = load_data(args.file, args.price_col, args.ts_col)
    save_to_obsidian(data, args.market, args.obsidian_dir, args.chart_path, args.pdf_path, args.period)

if __name__ == "__main__":
    main()