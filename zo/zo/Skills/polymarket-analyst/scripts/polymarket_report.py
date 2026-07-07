#!/usr/bin/env python3
"""
polymarket_report.py — Relatório real de mercados Polymarket.

Busca os top eventos por volume 24h via Gamma API, baixa histórico de preços
via CLOB API e calcula métricas (probabilidade implícita, variação 24h, tendência,
dias até encerramento, liquidez). Saída em texto pronto para Telegram.

Uso:
  python3 polymarket_report.py [--top N] [--category CAT]
"""

import argparse
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

GAMMA = "https://gamma-api.polymarket.com"
CLOB = "https://clob.polymarket.com"
UA = {"User-Agent": "OpenClaw-Polymarket/1.0"}


def http_get(url, tries=3, timeout=20):
    for i in range(1, tries + 1):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode())
        except Exception as e:
            if i == tries:
                return None
            time.sleep(1.5 ** i)
    return None


def fetch_events(limit=50, order="volume24hr"):
    qs = urllib.parse.urlencode({
        "active": "true",
        "closed": "false",
        "archived": "false",
        "limit": limit,
        "order": order,
        "ascending": "false",
    })
    return http_get(f"{GAMMA}/events?{qs}") or []


def fetch_price_history(token_id, interval="1d", fidelity=60):
    qs = urllib.parse.urlencode({"market": token_id, "interval": interval, "fidelity": fidelity})
    data = http_get(f"{CLOB}/prices-history?{qs}")
    if not data:
        return []
    return data.get("history", [])


def metrics_from_history(history):
    if not history or len(history) < 2:
        return None
    prices = [float(p["p"]) for p in history if "p" in p]
    if len(prices) < 2:
        return None
    latest = prices[-1]
    oldest = prices[0]
    change_abs = latest - oldest
    change_pct = (change_abs / oldest * 100) if oldest else 0
    hi = max(prices)
    lo = min(prices)
    trend = "📈" if change_abs > 0.005 else ("📉" if change_abs < -0.005 else "➖")
    return {
        "latest": latest,
        "open": oldest,
        "change_pct": change_pct,
        "hi": hi,
        "lo": lo,
        "trend": trend,
        "samples": len(prices),
    }


def days_until(iso):
    if not iso:
        return None
    try:
        end = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        delta = end - datetime.now(timezone.utc)
        return max(0, delta.days)
    except Exception:
        return None


def fmt_money(v):
    try:
        v = float(v)
    except Exception:
        return "—"
    if v >= 1e6:
        return f"${v/1e6:.2f}M"
    if v >= 1e3:
        return f"${v/1e3:.1f}k"
    return f"${v:.0f}"


def analyze_event(ev):
    title = (ev.get("title") or "").strip()
    vol_total = float(ev.get("volume") or 0)
    vol_24h = float(ev.get("volume24hr") or 0)
    liquidity = float(ev.get("liquidity") or 0)
    end_iso = ev.get("endDate") or ""
    days = days_until(end_iso)
    markets = ev.get("markets") or []
    if not markets:
        return None

    # Para eventos multi-mercado: ranquear cada mercado pelo preço de "Yes"
    # e mostrar os 4 favoritos. Para evento single: usar o único mercado.
    parsed = []
    for mk in markets:
        try:
            os_ = json.loads(mk.get("outcomes") or "[]")
            ps_ = [float(x) for x in json.loads(mk.get("outcomePrices") or "[]")]
            ts_ = json.loads(mk.get("clobTokenIds") or "[]")
        except Exception:
            continue
        if not os_ or not ps_:
            continue
        # Identificar o índice do "Yes" (ou maior prob se não for binário Yes/No)
        yes_idx = next((i for i, o in enumerate(os_) if str(o).lower() == "yes"), None)
        if yes_idx is None:
            yes_idx = max(range(len(ps_)), key=lambda i: ps_[i])
        parsed.append({
            "market": mk,
            "outcomes": os_,
            "prices": ps_,
            "tokens": ts_,
            "yes_idx": yes_idx,
            "yes_price": ps_[yes_idx],
            "label": mk.get("groupItemTitle") or mk.get("question") or "",
        })

    if not parsed:
        return None

    is_multi = len(parsed) > 1
    parsed.sort(key=lambda x: x["yes_price"], reverse=True)
    top = parsed[0]
    m = top["market"]
    outcomes = top["outcomes"]
    prices = top["prices"]
    token_ids = top["tokens"]
    idx = top["yes_idx"]
    favorite = str(outcomes[idx])
    fav_prob = prices[idx]

    history_metrics = None
    if idx < len(token_ids) and token_ids[idx]:
        hist = fetch_price_history(token_ids[idx], interval="1d", fidelity=60)
        history_metrics = metrics_from_history(hist)

    # Para eventos multi-mercado, montar ranking dos top candidatos
    if is_multi:
        ranking = [(p["label"] or str(p["outcomes"][p["yes_idx"]]), round(p["yes_price"] * 100, 1)) for p in parsed[:4]]
    else:
        ranking = list(zip([str(o) for o in outcomes], [round(p * 100, 1) for p in prices]))

    return {
        "title": title,
        "question": (m.get("question") or title)[:140],
        "favorite": favorite,
        "fav_prob": round(fav_prob * 100, 1),
        "is_multi": is_multi,
        "all_outcomes": ranking,
        "vol_total": vol_total,
        "vol_24h": vol_24h,
        "liquidity": liquidity,
        "days_left": days,
        "end_date": end_iso[:10] if end_iso else "—",
        "slug": ev.get("slug") or "",
        "history": history_metrics,
    }


def render(report, top_n):
    out = []
    out.append("📊 *Polymarket — Relatório Real*")
    out.append(f"⏰ {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M UTC')}")
    out.append(f"🏆 Top {len(report)} mercados por volume 24h\n")

    for i, r in enumerate(report[:top_n], 1):
        out.append(f"*{i}. {r['title'][:80]}*")
        out.append(f"❓ {r['question']}")
        # Outcomes (até 4)
        outs = r["all_outcomes"][:4]
        out.append("📈 " + " | ".join(f"{o}: {p}%" for o, p in outs))
        h = r["history"]
        if h:
            out.append(
                f"🕘 24h: abriu {h['open']*100:.1f}% → {h['latest']*100:.1f}% "
                f"({h['change_pct']:+.1f}%) {h['trend']}  | range {h['lo']*100:.0f}–{h['hi']*100:.0f}%"
            )
        out.append(
            f"💰 Vol total: {fmt_money(r['vol_total'])} | 24h: {fmt_money(r['vol_24h'])} "
            f"| Liq: {fmt_money(r['liquidity'])}"
        )
        days = r["days_left"]
        days_txt = f"{days}d restantes" if days is not None else "—"
        out.append(f"📅 Encerra: {r['end_date']} ({days_txt})")
        if r["slug"]:
            out.append(f"🔗 polymarket.com/event/{r['slug']}")
        out.append("")

    out.append("─" * 30)
    out.append("✅ Dados via Gamma API + CLOB price-history. Probabilidades = preços de mercado.")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--top", type=int, default=8)
    ap.add_argument("--fetch", type=int, default=30, help="Quantos eventos buscar antes de analisar")
    args = ap.parse_args()

    events = fetch_events(limit=args.fetch, order="volume24hr")
    if not events:
        print("⚠️ Falha ao buscar eventos da Gamma API.")
        sys.exit(1)

    analyzed = []
    for ev in events:
        a = analyze_event(ev)
        if a and a["vol_24h"] > 0:
            analyzed.append(a)

    analyzed.sort(key=lambda r: r["vol_24h"], reverse=True)
    print(render(analyzed, args.top))


if __name__ == "__main__":
    main()
