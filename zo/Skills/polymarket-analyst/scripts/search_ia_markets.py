#!/usr/bin/env python3
"""
Busca mercados do Polymarket relacionados a IA (Inteligência Artificial).
Filtra por palavras-chave no título/descrição.
"""

import sys
import json
import urllib.request
import urllib.parse
import time
from datetime import datetime, timezone

GAMMA_BASE = "https://gamma-api.polymarket.com"

# Termos mais específicos para IA (evitar falsos positivos como "financing")
KEYWORDS = [
    "gpt", "openai", "anthropic", "claude", "gemini", "llm", "large language model",
    "agi", "superintelligence", "neural network", "deep learning", "transformer",
    "chatgpt", "gpt-4", "gpt-5", "gemini 1.5", "claude 3", "mistral", "llama",
    "ai safety", "ai alignment", "ai regulation", "artificial general intelligence",
    "inteligência artificial", "ia generativa", "modelo de linguagem grande",
    "redes neurais", "aprendizado profundo"
]

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

def get_events(limit=100):
    # Buscar eventos ativos com volume (ordenados por volume)
    params = {"active": "true", "closed": "false", "limit": limit, "order": "volume", "direction": "desc"}
    return fetch("events", params) or []

import re

def match_keywords(text: str) -> bool:
    """Match palavras-chave como palavras completas (não substrings)."""
    if not text:
        return False
    text_lower = text.lower()
    # Tokenizar o texto em palavras (separado por espaços, pontuação)
    words = re.findall(r'\b\w+\b', text_lower)
    # Também considerar a string completa para keywords multipalavras
    for kw in KEYWORDS:
        kw_lower = kw.lower()
        # Se keyword tem mais de uma palavra, buscar na string completa
        if ' ' in kw_lower:
            if kw_lower in text_lower:
                return True
        else:
            # Keyword de uma palavra só: exigir word boundary
            pattern = r'\b' + re.escape(kw_lower) + r'\b'
            if re.search(pattern, text_lower):
                return True
    return False

def analyze_event(ev):
    title = ev.get("title") or ev.get("slug") or "Desconhecido"
    description = ev.get("description") or ""
    volume = float(ev.get("volume") or 0)
    volume24h = float(ev.get("volume24hr") or 0)
    end_date = ev.get("endDate", "N/A")[:10] if ev.get("endDate") else "N/A"

    markets = ev.get("markets") or []
    if not markets:
        return None

    # Pegar mercado principal (primeiro)
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
        max_outcome = str(outcomes[max_idx])

        return {
            "title": title,
            "description": description[:200] + ("..." if len(description) > 200 else ""),
            "question": question,
            "outcome": max_outcome,
            "probabilidade": round(max_price * 100, 1),
            "volume_total": f"${volume:,.0f}",
            "volume_24h": f"${volume24h:,.0f}",
            "encerramento": end_date,
            "contract_id": m.get("id") or "N/A"
        }
    except:
        return None

def main():
    print("🤖 *Polymarket — Mercados sobre IA*\n")
    print(f"⏰ {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M UTC')}\n")

    print("🔍 Buscando eventos (top 200 por volume) e filtrando por IA...")
    events = get_events(limit=200)

    matched = []
    for ev in events:
        title = ev.get("title") or ""
        desc = ev.get("description") or ""
        slug = ev.get("slug") or ""
        if match_keywords(title) or match_keywords(desc) or match_keywords(slug):
            matched.append(ev)

    print(f"📊 Total eventos verificados: 200")
    print(f"🔎 Correspondências encontradas: {len(matched)}\n")

    # Debug: mostrar os primeiros matches se houver poucos
    if len(matched) <= 10:
        for ev in matched:
            title = ev.get("title", "")
            desc = ev.get("description", "")[:100]
            print(f"   🔍 Título: {title}")
            print(f"      Desc: {desc}...\n")

    if not matched:
        print("⚠️ Nenhum mercado sobre IA encontrado amongst os top 200 por volume.")
        return

    # Ordenar por volume
    matched_sorted = sorted(matched, key=lambda e: float(e.get("volume") or 0), reverse=True)

    # Mostrar top 5
    print("🏆 *Top 5 mercados sobre IA:*\n")
    shown = 0
    for ev in matched_sorted:
        analysis = analyze_event(ev)
        if analysis and shown < 5:
            shown += 1
            print(f"{shown}. 📌 {analysis['title'][:70]}")
            print(f"   🎯 {analysis['question'][:100]}")
            print(f"   💰 Probabilidade: {analysis['probabilidade']}%")
            print(f"   📊 Volume 24h: {analysis['volume_24h']}")
            print(f"   📅 Encerra: {analysis['encerramento']}")
            print()

    if shown < len(matched_sorted):
        print(f"   ... e mais {len(matched_sorted) - shown} mercados\n")

    print("─" * 60)
    print(f"\n✅ Total: {len(matched)} mercados sobre IA encontrados.")
    print("🔎 Keywords: " + ", ".join(KEYWORDS[:8]) + "...")

if __name__ == "__main__":
    main()
