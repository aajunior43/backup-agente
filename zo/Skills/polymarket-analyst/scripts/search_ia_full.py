#!/usr/bin/env python3
"""
Busca COMPLETA mercados do Polymarket sobre IA.

Estratégia:
1. Busca eventos ativos sem ordenação por volume (IA pode ter volume baixo)
2. Filtra por keywords de IA amplas
3. Remove falsos positivos com contexto mínimo
4. Ordena por encerramento
5. Gera relatório Telegram
"""

import sys
import json
import urllib.request
import urllib.parse
import time
import re
from datetime import datetime, timezone

GAMMA_BASE = "https://gamma-api.polymarket.com"

# Keywords amplas para IA
KEYWORDS = [
    # Modelos
    'gpt', 'openai', 'chatgpt', 'gpt-4', 'gpt-5',
    'anthropic', 'claude', 'claude-3',
    'gemini', 'mistral', 'llama', 'falcon',
    # Conceitos
    'artificial intelligence', 'inteligência artificial', 'ia',
    'machine learning', 'deep learning', 'neural',
    'large language model', 'llm',
    'agi', 'superintelligence',
    'ai safety', 'ai alignment',
    'deepmind', 'huggingface',
    # Tópicos relacionados
    'autonomous', 'robotics', 'computer vision',
    'natural language processing', 'nlp',
    'ai agent', 'multi-agent'
]

def fetch(endpoint, params=None, tries=3):
    url = f"{GAMMA_BASE}/{endpoint}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    for i in range(1, tries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "OpenClaw/1.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode())
        except Exception as e:
            if i == tries: return None
            time.sleep(2 ** i)
    return None

def get_random_active_events(total=1000):
    """Busca eventos ativos em múltiplas páginas (não ordenados por volume)."""
    all_events = []
    # Estratégia: paginar com offsets diferentes
    for offset in [0, 100, 200, 300, 400]:
        params = {
            "active": "true", "closed": "false",
            "limit": 200, "offset": offset
        }
        events = fetch("events", params)
        if events:
            all_events.extend(events)
            print(f"   Offset {offset}: {len(events)} eventos")
        time.sleep(0.5)
        if len(all_events) >= total:
            break
    # Deduplicar por ID
    seen = set()
    unique = []
    for ev in all_events:
        eid = ev.get("id")
        if eid and eid not in seen:
            seen.add(eid)
            unique.append(ev)
    print(f"✅ Total eventos únicos coletados: {len(unique)}\n")
    return unique

def is_ai_related(text):
    if not text: return False
    text_lower = text.lower()
    # BLACKLIST prefixes
    blacklist = ['ia-', 'ia ', 'mlbb', 'mobile legends', 'mlb ', 'nfl ', 'nba ', 'f1 ']
    for bad in blacklist:
        if text_lower.startswith(bad):
            return False
    # Contar matches
    matches = 0
    for kw in KEYWORDS:
        kw_l = kw.lower()
        if ' ' in kw_l:
            if kw_l in text_lower: matches += 1
        else:
            if re.search(r'\b' + re.escape(kw_l) + r'\b', text_lower): matches += 1
    return matches >= 1

def filter_ai(events):
    result = []
    for ev in events:
        title = ev.get("title", "") or ""
        desc = ev.get("description", "") or ""
        slug = ev.get("slug", "") or ""
        if is_ai_related(title) or is_ai_related(desc) or is_ai_related(slug):
            result.append(ev)
    return result

def parse_event(ev):
    title = ev.get("title") or ev.get("slug") or "Sem título"
    volume = float(ev.get("volume") or 0)
    volume24h = float(ev.get("volume24hr") or 0)
    end_date = ev.get("endDate")
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        except: end_dt = None
    else: end_dt = None

    markets = ev.get("markets") or []
    m = markets[0] if markets else {}
    outcomes = json.loads(m.get("outcomes") or "[]")
    prices = [float(p) for p in json.loads(m.get("outcomePrices") or "[]")] if outcomes else []
    if prices:
        max_idx = max(range(len(prices)), key=lambda i: prices[i])
        max_prob = round(prices[max_idx] * 100, 1)
        leading_outcome = str(outcomes[max_idx]) if max_idx < len(outcomes) else "N/A"
    else:
        max_prob = 0.0
        leading_outcome = "N/A"

    return {
        "title": title,
        "question": m.get("question") or title,
        "probability": max_prob,
        "volume_24h": volume24h,
        "end_date": end_dt.isoformat() if end_dt else None,
        "url": f"https://polymarket.com/event/{ev.get('slug')}" if ev.get('slug') else None
    }

def format_telegram(events):
    if not events:
        return "⚠️ Nenhum mercado sobre IA encontrado."
    now = datetime.now(timezone.utc)
    out = ["🤖 *Polymarket — Mercados sobre IA*", 
           f"⏰ {now.strftime('%d/%m/%Y %H:%M UTC')}",
           f"📊 Encontrados: {len(events)} mercados\n" + "─" * 50 + "\n"]
    for i, ev in enumerate(events[:15], 1):
        title = ev['title'][:60] + ("..." if len(ev['title']) > 60 else "")
        out.append(f"{i}. 📌 *{title}*")
        out.append(f"   🎯 {ev['question'][:100]}")
        out.append(f"   💰 Probabilidade: *{ev['probability']}%*")
        if ev['end_date']:
            try:
                end_dt = datetime.fromisoformat(ev['end_date'].replace("Z", "+00:00"))
                days = (end_dt - now).days
                out.append(f"   📅 Encerra: {end_dt.strftime('%d/%m/%Y')} ({days}d)")
            except: pass
        if ev['volume_24h'] > 0:
            out.append(f"   📊 Volume 24h: ${ev['volume_24h']:,.0f}")
        if ev['url']:
            out.append(f"   🔗 {ev['url']}")
        out.append("")
    out.append("─" * 50)
    out.append("\n🔎 Keywords: GPT, OpenAI, Claude, Gemini, LLM, AGI, etc.")
    out.append("⚠️ Caução: Probabilidade implícita não é certeza.")
    return "\n".join(out)

def main():
    print("🤖 *Polymarket — Busca de Mercados sobre IA*\n")
    # 1. Coletar eventos (ampla)
    events = get_random_active_events(800)
    # 2. Filtrar
    ai_events = filter_ai(events)
    print(f"🔎 Resultado: {len(ai_events)} mercados sobre IA encontrados.\n")
    if not ai_events:
        print("⚠️ Nenhum mercado sobre IA detectado.")
        print("💡 Possíveis causas:")
        print("   - Mercados de IA são raros ou de volume muito baixo")
        print("   - Keywords precisam ser expandidas")
        print("   - Eventos sobre IA estão em categorias não-ativas")
        return
    # 3. Parse e ordenar
    parsed = [parse_event(ev) for ev in ai_events]
    def sort_key(ev):
        try:
            end_dt = datetime.fromisoformat(ev['end_date'].replace("Z", "+00:00")) if ev['end_date'] else datetime.max
            return ((end_dt - datetime.now(timezone.utc)).days, -ev['volume_24h'])
        except:
            return (9999, -ev['volume_24h'])
    parsed.sort(key=sort_key)
    # 4. Output
    print(format_telegram(parsed))
    # 5. Salvar
    ts = datetime.now().strftime("%Y-%m-%d_%H%M")
    with open(f"dados/polymarket_ia_{ts}.json", "w") as f:
        json.dump({"generated_at": datetime.now(timezone.utc).isoformat(),
                   "total_events": len(events),
                   "ai_events": len(ai_events),
                   "events": parsed}, f, indent=2)
    print(f"\n💾 Salvo: dados/polymarket_ia_{ts}.json")

if __name__ == "__main__":
    main()
