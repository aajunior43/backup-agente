#!/usr/bin/env python3
"""
Gera relatório de inteligência do Polymarket no formato solicitado.
"""

import json
import urllib.request
import urllib.parse
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any

GAMMA_BASE = "https://gamma-api.polymarket.com"

# Categorias e palavras-chave
CATEGORIES = {
    "IA & TECNOLOGIA": [
        "gpt", "openai", "anthropic", "claude", "gemini", "llm", "large language model",
        "agi", "superintelligence", "neural network", "deep learning", "transformer",
        "chatgpt", "gpt-4", "gpt-5", "claude 3", "mistral", "llama", "falcon",
        "artificial intelligence", "inteligência artificial", "ia", "machine learning",
        "ai safety", "ai alignment", "deepmind", "huggingface", "autonomous", "robotics",
        "computer vision", "natural language processing", "nlp", "ai agent", "multi-agent",
        "nvidia", "amd", "intel", "tpu", "chip", "semiconductor", "quantum", "computação quântica",
        "blockchain", "bitcoin", "ethereum", "crypto", "web3"
    ],
    "GEOPOLÍTICA": [
        "war", "russia", "ukraine", "china", "taiwan", "israel", "iran", "north korea",
        "middle east", "nato", "un", "un security council", "sanctions", "invasion",
        "geopolitics", "territory", "sovereignty", "military", "conflict", "attack",
        "rússia", "ucrânia", "china", "taiwan", "israel", "irã", "coreia do norte",
        "otan", "onu", "sanções", "invasão", "conflito", "militar"
    ],
    "ECONOMIA & MERCADOS": [
        "fed", "interest rate", "inflation", "cpi", "gdp", "recession", "economy",
        "stock market", "s&p", "dow", "nasdaq", "brent", "oil", "gold", "dollar",
        "eurusd", "gbpusd", "exchange rate", "reforma", "impl",
        "juros", "inflação", "pib", "recessão", "bolsa", "dólar", "euro", "petróleo",
        "ouro", "câmbio", "reforma", "impl", "fiscal", "monetário", "bc", "bacen"
    ],
    "POLÍTICA": [
        "election", "president", "senate", "congress", "vote", "ballot", "primary",
        "democrat", "republican", "lula", "bolsonaro", "putin", "trump", "biden",
        "eleição", "presidente", "senado", "congresso", "voto", "urnas", "partido",
        "pmdb", "pt", "psdb", "pl", "STF", "supremo", "tse", "câmara", "senado"
    ],
    "ESPORTES": [
        "world cup", "champions league", "nba", "nfl", "f1", "tennis", "olympics",
        "copa do mundo", "liga dos campeões", "futebol", "fórmula 1", "tênis", "olimpíadas",
        "brasil", "argentina", " Messi", "ronaldo", "neymar", "lebron", "jordan"
    ],
    "CIÊNCIA & SAÚDE": [
        "covid", "vaccine", "pandemic", "virus", "disease", "health", "hospital",
        "clinical trial", "fda", "who", "medicine", "treatment", "cure",
        "covid", "vacina", "pandemia", "vírus", "doença", "saúde", "hospital",
        "ensaio clínico", "anvisa", "oms", "medicamento", "tratamento", "cura",
        "space", "nasa", "rocket", "launch", "mars", "moon", "satellite", "ciência"
    ]
}

def fetch(endpoint, params=None, tries=3):
    url = f"{GAMMA_BASE}/{endpoint}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    for i in range(1, tries+1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "OpenClaw/1.0"})
            with urllib.request.urlopen(req, timeout=25) as r:
                return json.loads(r.read().decode())
        except Exception as e:
            if i == tries: return None
            time.sleep(2**i)
    return None

def get_events(limit=200):
    params = {"active": "true", "closed": "false", "limit": limit, "order": "volume", "direction": "desc"}
    return fetch("events", params) or []

def categorize(text: str) -> str:
    if not text:
        return "OUTROS"
    text_lower = text.lower()
    
    # Blacklist para evitar falsos positivos
    blacklist = [" vs ", "fc", "sc", "club", "team", "match", "game", "win", "lose", "draw", "football", "soccer", "nba", "nfl", "f1", "hockey", "tennis", "olympics", "copa", "championship", "league", "cup", "gol", "pênalti", "jogo", "partida", "vitória", "derrota", "empate"]
    if any(bad in text_lower for bad in blacklist):
        return "ESPORTES"
    
    for cat, keywords in CATEGORIES.items():
        for kw in keywords:
            if kw.lower() in text_lower:
                return cat
    return "OUTROS"

def parse_event(ev: Dict[str, Any]) -> Dict[str, Any]:
    title = ev.get("title") or ev.get("slug") or "Sem título"
    description = ev.get("description") or ""
    volume = float(ev.get("volume") or 0)
    volume24h = float(ev.get("volume24hr") or 0)
    end_date = ev.get("endDate", "")
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        except:
            end_dt = None
    else:
        end_dt = None

    markets = ev.get("markets") or []
    if not markets:
        return None

    m = markets[0]
    try:
        outcomes = json.loads(m.get("outcomes") or "[]")
        prices = json.loads(m.get("outcomePrices") or "[]")
        question = m.get("question") or title

        if not prices or not outcomes:
            return None

        # Encontrar a maior probabilidade
        max_idx = max(range(len(prices)), key=lambda i: float(prices[i]))
        max_price = float(prices[max_idx])
        max_outcome = str(outcomes[max_idx]) if max_idx < len(outcomes) else "N/A"

        return {
            "title": title,
            "description": description,
            "question": question,
            "leading_outcome": max_outcome,
            "probability": round(max_price * 100, 1),
            "volume": volume,
            "volume24h": volume24h,
            "end_date": end_dt,
            "contract_id": m.get("id") or "N/A",
            "url": f"https://polymarket.com/event/{ev.get('slug')}" if ev.get('slug') else None
        }
    except Exception as e:
        print(f"Erro ao parsear {title}: {e}")
        return None

def load_previous_snapshot() -> Dict[str, Any]:
    """Carrega o último snapshot salvo (até 48h atrás) para comparação."""
    import glob
    import os
    snaps = sorted(glob.glob('/home/administrator/.openclaw/workspace/dados/polymarket_snapshot_*.json'), reverse=True)
    if not snaps:
        return None
    # Pegar o mais recente que não seja o atual (ou seja, o anterior)
    # Como geramos agora, o primeiro da lista é o atual. Pegamos o segundo se existir.
    if len(snaps) >= 2:
        with open(snaps[1]) as f:
            return json.load(f)
    return None

def calculate_change(current_ev: Dict[str, Any], prev_data: Dict[str, Any]) -> float:
    """Calcula variação em pontos percentuais para um contrato."""
    cid = current_ev.get("contract_id")
    if not prev_data or not cid:
        return None
    # Buscar evento anterior com mesmo contract_id
    for prev_ev in prev_data.get("events", []):
        markets = prev_ev.get("markets") or []
        if markets and markets[0].get("id") == cid:
            prices = json.loads(markets[0].get("outcomePrices") or "[]")
            if prices:
                max_idx = max(range(len(prices)), key=lambda i: float(prices[i]))
                prev_price = float(prices[max_idx])
                curr_price = current_ev["probability"] / 100.0
                return round((curr_price - prev_price) * 100, 1)
    return None

def main():
    print("🤖 *POLYMARKET INTELLIGENCE*")
    print(f"🗓️ {datetime.now(timezone.utc).strftime('%A, %d de %B de %Y')}")
    print()

    events = get_events(limit=100)
    if not events:
        print("❌ Nenhum evento encontrado.")
        return

    parsed = []
    for ev in events:
        p = parse_event(ev)
        if p:
            parsed.append(p)

    # Carregar snapshot anterior para calcular mudanças
    prev_snapshot = load_previous_snapshot()
    if prev_snapshot:
        print(f"📊 Comparando com snapshot de {prev_snapshot.get('generated_at', 'anterior')}...\n")
        for p in parsed:
            change = calculate_change(p, prev_snapshot)
            p["change_pp"] = change
    else:
        print("⚠️ Sem snapshot anterior para cálculo de variação 24h.\n")
        for p in parsed:
            p["change_pp"] = None

    # Separar por categoria
    by_category: Dict[str, List[Dict[str, Any]]] = {}
    for p in parsed:
        cat = categorize(p["title"] + " " + p["description"] + " " + p["question"])
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(p)

    # Ordenar cada categoria por volume
    for cat in by_category:
        by_category[cat].sort(key=lambda x: x["volume"], reverse=True)

    # --- ALERTA DE MOVIMENTAÇÃO (variação > 10pp) ---
    mov_alerts = [p for p in parsed if p["change_pp"] is not None and abs(p["change_pp"]) > 10]
    if mov_alerts:
        print("⚡ *ALERTA DE MOVIMENTAÇÃO*")
        for p in mov_alerts[:5]:  # top 5 por volume
            arrow = "▲" if p["change_pp"] > 0 else "▼"
            print(f"*{p['title'][:70]}* — de {p['probability'] - p['change_pp']:.1f}% → {p['probability']}% ({arrow} {abs(p['change_pp']):.1f}pp)")
        print()

    # --- TOP 3 DO DIA ---
    print("🔥 *TOP 3 DO DIA*")
    top3 = sorted(parsed, key=lambda x: x["volume"], reverse=True)[:3]
    for i, p in enumerate(top3, 1):
        change_line = ""
        if p["change_pp"] is not None:
            arrow = "▲" if p["change_pp"] > 0 else "▼"
            change_line = f"├ 24h: {arrow} {abs(p['change_pp']):.1f}pp\n"
        print(f"\n*{i}. {p['title']}*")
        print(f"├ Sim: {p['probability']}% · Não: N/A")
        print(change_line, end="")
        print(f"├ Volume: ${p['volume']:,.0f}")
        # Análise em 1-2 frases
        print(f"└ 💬 {p['question'][:120]}...")
    print()

    # --- POR CATEGORIA ---
    print("📂 *Por categoria*")
    categorias_ordenadas = [c for c in CATEGORIES.keys() if c in by_category]
    for cat in categorias_ordenadas:
        mercados = [p for p in by_category.get(cat, []) if p["volume"] >= 1000][:5]  # volume mínimo $1k
        if not mercados:
            continue
        print(f"\n*{cat}*")
        for p in mercados:
            change_arrow = ""
            if p["change_pp"] is not None:
                arrow = "▲" if p["change_pp"] > 0 else "▼"
                change_arrow = f" · {arrow} {abs(p['change_pp']):.1f}pp"
            print(f"`{p['title'][:50]}` — *{p['probability']}%*{change_arrow}")
            # Interpretação curta objetiva
            if p["probability"] >= 70:
                print(f"_↳ Muito provável; mercado confiante_")
            elif p["probability"] <= 30:
                print(f"_↳ Improvável; pode estar subprecificado se houver mudança_")
            else:
                print(f"_↳ Indefinido; monitorar gatilhos_")
    print()

    # --- OPORTUNIDADE DE ATENÇÃO ---
    print("🎯 *OPORTUNIDADE DE ATENÇÃO*")
    # Mercados com probabilidade indefinida (40-60%) e volume razoável que podem ter viés
    candidates = [p for p in parsed if 40 <= p["probability"] <= 60 and p["volume"] >= 2000]
    if candidates:
        # Ordenar por volume (maior volume = mais relevante)
        chosen = sorted(candidates, key=lambda x: x["volume"], reverse=True)[0]
        print(f"*{chosen['title']}* — {chosen['probability']}%")
        print(f"_↳ Mercado ativo com probabilidade no meio do intervalo; pode estar refletindo incerteza genuína ou desequilíbrio de liquidez. Acompanhar se há informação nova que possa resolver a ambiguidade._")
    else:
        print("Nenhum mercado com perfil de oportunidade clara no momento.")
    print()

    # --- RESUMO EXECUTIVO ---
    print("📝 *RESUMO EXECUTIVO*")
    bullets = []
    if len(parsed) > 0:
        avg_prob = sum(p["probability"] for p in parsed) / len(parsed)
        bullets.append(f"Total de {len(parsed)} mercados ativos analisados")
        # Sentimento geral
        if avg_prob > 55:
            sentiment = "🟢 Otimista"
        elif avg_prob < 45:
            sentiment = "🔴 Pessimista"
        else:
            sentiment = "🟡 Indefinido"
        bullets.append(f"Probabilidade média: {avg_prob:.1f}% ({sentiment})")
        # Categorias dominantes
        top_cat = max(by_category.items(), key=lambda x: len(x[1]))[0] if by_category else "N/A"
        bullets.append(f"Categoria mais ativa: {top_cat}")
    else:
        bullets.append("Nenhum dado disponível")
    for b in bullets:
        print(f"• {b}")
    print(f"_Sentimento geral do mercado: {sentiment if 'sentiment' in locals() else '🟡 Indefinido'}_")
    print()

    # Salvar relatório e dados
    ts = datetime.now(timezone.utc).strftime('%Y-%m-%d_%H%M')
    report_data = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_events": len(events),
        "parsed_markets": len(parsed),
        "categories": {c: len(m) for c, m in by_category.items()},
        "markets": parsed
    }
    with open(f'/home/administrator/.openclaw/workspace/dados/polymarket_report_{ts}.json', 'w') as f:
        json.dump(report_data, f, indent=2, default=str)
    print(f"💾 Dados salvos: dados/polymarket_report_{ts}.json")

if __name__ == "__main__":
    main()
