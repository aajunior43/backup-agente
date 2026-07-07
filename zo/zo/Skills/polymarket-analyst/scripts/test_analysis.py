#!/usr/bin/env python3
"""
Teste da skill polymarket-analyst — Análise de mercados em tempo real.

Uso:
  python test_analysis.py          # Analisa os top 5 mercados
  python test_analysis.py --tema brasil  # Filtra por tema
"""

import sys
import json
import urllib.request
import urllib.parse
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any

GAMMA_BASE = "https://gamma-api.polymarket.com"

def fetch(endpoint, params=None, tries=3):
    url = f"{GAMMA_BASE}/{endpoint}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    for i in range(1, tries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "OpenClaw/1.0"})
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.loads(r.read().decode())
        except Exception as e:
            if i == tries: return None
            time.sleep(2 ** (i - 1))
    return None

def get_events(limit=50, order="volume", featured=False):
    params = {"active": "true", "closed": "false", "limit": limit,
              "order": order, "direction": "desc"}
    if featured:
        params["featured"] = "true"
    return fetch("events", params) or []

def prob_label(pct: float) -> str:
    if pct >= 95: return "🟢 QUASE CERTO"
    if pct >= 80: return "🟡 MUITO PROVÁVEL"
    if pct >= 60: return "🟠 LEVE FAVORITO"
    if pct >= 45: return "⚪ INDEFINIDO"
    if pct >= 20: return "🔴 IMPROVÁVEL"
    return "⚫ MUITO IMPROVÁVEL"

def analyze_market(event: Dict[str, Any]) -> Dict[str, Any]:
    """Analisa um evento seguindo as regras da skill polymarket-analyst."""
    title = event.get("title") or event.get("slug") or "Desconhecido"
    volume = float(event.get("volume") or 0)
    volume24h = float(event.get("volume24hr") or 0)
    end_date = event.get("endDate")

    markets = event.get("markets") or []
    if not markets:
        return None

    # Pegar o primeiro mercado (mais relevante)
    m = markets[0]
    try:
        outcomes = json.loads(m.get("outcomes") or "[]")
        prices = json.loads(m.get("outcomePrices") or "[]")
        question = m.get("question") or title

        # Se não houver preços, pular
        if not prices:
            return None

        # Probabilidade atual (do primeiro outcome? Ou mostrar todos?)
        # Para simplificar, mostramos a maior probabilidade
        max_idx = max(range(len(prices)), key=lambda i: float(prices[i]))
        max_price = float(prices[max_idx])
        max_outcome = str(outcomes[max_idx])

        # Variação 24h: precisa de histórico. Sem dados, assumimos N/A
        # Como não temos API de histórico, marcamos como não disponível
        change_pct = None  # TODO: integrar série temporal

        trend = "flat"  # Sem dados de série, assumimos flat

        # Liquidez (baseado no volume)
        liquidity_note = "volume moderado" if volume > 10000 else "volume baixo"

        return {
            "title": title,
            "question": question,
            "outcome": max_outcome,
            "probabilidade": round(max_price * 100, 1),
            "label": prob_label(max_price * 100),
            "volume": f"${volume:,.0f}",
            "volume24h": f"${volume24h:,.0f}",
            "end_date": end_date[:10] if end_date else "N/A",
            "liquidity": liquidity_note,
            "change_pct": change_pct,
            "trend": trend,
            "contract_id": m.get("id") or "N/A"
        }
    except Exception as e:
        print(f"Erro ao parsear mercado {title}: {e}", file=sys.stderr)
        return None

def main():
    args = sys.argv[1:]
    tema = None
    if "--tema" in args:
        idx = args.index("--tema")
        if idx + 1 < len(args):
            tema = args[idx + 1]

    print("🔍 *Polymarket Analyst — Teste da Skill*\n")
    print(f"⏰ {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M UTC')}\n")

    # Buscar eventos FEATURED (alta liquidez) e top volume
    print("📡 Buscando mercados ativos (featured + top volume)...")
    featured = get_events(limit=20, featured=True)
    top_vol = get_events(limit=30, order="volume")
    # Combinar e deduplicar por ID
    seen = set()
    all_events = []
    for ev in (featured + top_vol):
        eid = ev.get("id")
        if eid and eid not in seen:
            seen.add(eid)
            all_events.append(ev)

    if not all_events:
        print("❌ Nenhum mercado encontrado.")
        return

    # Filtrar por tema se especificado
    if tema:
        all_events = [e for e in all_events if tema.lower() in (e.get("title") or "").lower()]
        if not all_events:
            print(f"⚠️ Nenhum mercado com '{tema}' encontrado.")
            return

    print(f"✅ {len(all_events)} mercados únicos encontrados. Analisando top 5...\n")

    # Analisar top 5 por volume
    events_sorted = sorted(all_events, key=lambda e: float(e.get("volume") or 0), reverse=True)
    analyses = []
    for ev in events_sorted[:5]:
        analysis = analyze_market(ev)
        if analysis:
            analyses.append(analysis)

    if not analyses:
        print("❌ Nenhuma análise possível (dados insuficientes).")
        return

    # Formatar saída — Modo Rápido (conforme skill)
    print("📊 *Análise de Mercados (Modo Rápido)*\n")
    print("─" * 60)

    for i, a in enumerate(analyses, 1):
        print(f"{i}. 📌 {a['title'][:70]}")
        print(f"   🎯 Mercado: {a['question']}")
        print(f"   💰 Probabilidade: {a['probabilidade']}% — {a['label']}")
        if a['change_pct'] is not None:
            print(f"   📈 Mudança 24h: {a['change_pct']:+.1f}%")
        else:
            print(f"   📈 Mudança 24h: N/A (histórico indisponível)")
        print(f"   🔄 Tendência: {a['trend']}")
        print(f"   💧 Liquidez: {a['liquidity']} (volume 24h: {a['volume24h']})")
        print(f"   📅 Encerra: {a['end_date']}")
        print(f"   🔗 ID: {a['contract_id'][-8:]}...")
        print()

    print("─" * 60)
    print("\n⚠️ *Cauções:*")
    print("- Dados são snapshot atual; Historic 24h indisponível para cálculo de mudança.")
    print("- Volume baixo indica menor liquidez; preço pode ser menos confiável.")
    print("- Probabilidade implícita não é certeza; mercado pode estar errado.")
    print()

if __name__ == "__main__":
    main()
