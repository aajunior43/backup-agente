#!/usr/bin/env python3
"""
fetch_and_analyze.py — Busca dados do Polymarket e executa análise completa.

Uso:
  python3 fetch_and_analyze.py "Bitcoin" --analyze
  python3 fetch_and_analyze.py "https://polymarket.com/markets/..." --full
"""

import sys
import subprocess
from pathlib import Path
from datetime import datetime
import json
import os

SKILL_DIR = Path(__file__).parent.parent
SCRIPTS_DIR = SKILL_DIR / "scripts"
DATA_DIR = SKILL_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

def search_polymarket(query):
    """Busca mercados no Polymarket via Tavily."""
    print(f"🔍 Buscando: {query}")
    result = subprocess.run([
        "node", str(SKILL_DIR.parent.parent / "workspace/skills/tavily-search/scripts/search.mjs"),
        f"polymarket {query} probability price"
    ], capture_output=True, text=True, env={**os.environ, "TAVILY_API_KEY": "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"})
    return result.stdout

def scrape_url(url):
    """Usa Firecrawl para extrair dados da página."""
    print(f"🌐 Extraindo: {url}")
    result = subprocess.run([
        "node", str(SKILL_DIR.parent.parent / "workspace/skills/firecrawl/scripts/scrape.mjs"),
        url, "--limit", "5000"
    ], capture_output=True, text=True, env={**os.environ, "FIRECRAWL_API_KEY": "fc-65ef8c023a0d4da4863d7d8e7ea31321"})
    return result.stdout

def fetch_market_data(market_query):
    """Busca dados de um mercado Polymarket."""
    # First search via Tavily
    search_results = search_polymarket(market_query)
    print("✅ Busca concluída")
    
    # Try to find market URL in results
    market_url = None
    if "polymarket.com" in search_results:
        # Extract URL
        for line in search_results.split("\n"):
            if "polymarket.com" in line and "http" in line:
                # Extract URL
                import re
                urls = re.findall(r'https?://[^\s<>"]+', line)
                if urls:
                    market_url = urls[0]
                    break
    
    if not market_url:
        # Try direct URL construction
        slug = market_query.lower().replace(" ", "-")
        market_url = f"https://polymarket.com/markets/{slug}"
    
    print(f"📊 URL: {market_url}")
    
    # Scrape the market page
    page_content = scrape_url(market_url)
    
    return {
        "query": market_query,
        "url": market_url,
        "search_results": search_results,
        "page_content": page_content
    }

def parse_market_html(html_content):
    """Extrai dados do mercado do HTML."""
    import re
    
    data = {
        "price": None,
        "volume": None,
        "liquidity": None,
        "description": None,
        "outcomes": []
    }
    
    # Try to find price
    price_patterns = [
        r'(\d+\.?\d*)%',
        r'price["\s:]+(\d+\.?\d*)',
        r'current.*?(\d+\.?\d*)%',
    ]
    
    for pattern in price_patterns:
        match = re.search(pattern, html_content, re.IGNORECASE)
        if match:
            try:
                data["price"] = float(match.group(1).replace("%", "")) / 100
                break
            except:
                pass
    
    # Find volume
    volume_patterns = [
        r'volume["\s:]+[\"$]?([\d,]+)',
        r'\$([\d,]+)\s*(?:volume|vol)',
    ]
    
    for pattern in volume_patterns:
        match = re.search(pattern, html_content, re.IGNORECASE)
        if match:
            vol_str = match.group(1).replace(",", "")
            try:
                data["volume"] = float(vol_str)
                break
            except:
                pass
    
    return data

def generate_sample_csv(market_name, price, variation=0):
    """Gera CSV de exemplo para análise."""
    import csv
    from datetime import datetime, timedelta
    
    csv_file = DATA_DIR / f"{market_name.replace(' ', '-').lower()}-sample.csv"
    
    # Generate 30 days of sample data
    with open(csv_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["timestamp", "price"])
        
        base_price = price
        now = datetime.now()
        
        for i in range(30):
            ts = now - timedelta(days=30-i)
            # Add some variation
            import random
            variation_factor = random.uniform(-0.05, 0.05)
            day_price = base_price * (1 + variation_factor)
            writer.writerow([ts.isoformat(), round(day_price, 4)])
            base_price = day_price
    
    return str(csv_file)

def run_full_pipeline(market_query, analyze=True):
    """Executa pipeline completo."""
    print(f"\n{'='*50}")
    print(f"📊 POLYMARKET ANALYZER — {market_query}")
    print(f"{'='*50}\n")
    
    # Step 1: Fetch data
    print("1️⃣ Buscando dados do Polymarket...")
    fetch_result = fetch_market_data(market_query)
    
    # Step 2: Save raw data
    raw_file = DATA_DIR / f"{market_query.replace(' ', '-').lower()}-raw-{datetime.now().strftime('%Y%m%d%H%M')}.json"
    with open(raw_file, 'w') as f:
        json.dump(fetch_result, f, indent=2)
    print(f"✅ Dados brutos salvos: {raw_file}")
    
    # Step 3: Parse HTML and extract price
    price = None
    if fetch_result.get("page_content"):
        parsed = parse_market_html(fetch_result["page_content"])
        price = parsed.get("price")
        print(f"📈 Preço extraído: {price}")
    
    # Step 4: Generate sample data if no real data
    if not price:
        print("⚠️ Não consegui extrair preço real. Gerando dados de exemplo...")
        price = 0.55  # fallback
    
    csv_file = generate_sample_csv(market_query, price)
    print(f"📄 CSV gerado: {csv_file}")
    
    # Step 5: Run full analysis if requested
    if analyze:
        print("\n2️⃣ Executando análise completa...")
        result = subprocess.run([
            "python3", str(SCRIPTS_DIR / "run_full_analysis.py"),
            csv_file, "--market", market_query
        ], capture_output=True, text=True)
        
        print(result.stdout)
        if result.stderr:
            print(f"⚠️ {result.stderr[:200]}")
    
    print(f"\n{'='*50}")
    print("✅ Pipeline completo!")
    print(f"📁 Arquivos em: {SKILL_DIR}")
    
    return {
        "query": market_query,
        "price": price,
        "data_file": str(raw_file),
        "csv_file": str(csv_file)
    }

def main():
    if len(sys.argv) < 2 or sys.argv[1] in ["-h", "--help"]:
        print("""
📊 Polymarket Analyzer

Uso:
  python3 fetch_and_analyze.py "Bitcoin" --analyze
  python3 fetch_and_analyze.py "https://polymarket.com/markets/..." --full
  
Options:
  --analyze   Executa análise + gráfico + PDF + Obsidian
  --full      Busca real + análise completa
  --just-fetch Apenas busca dados (sem análise)
        """)
        sys.exit(1)
    
    query = sys.argv[1]
    analyze = "--analyze" in sys.argv or "--full" in sys.argv
    
    result = run_full_pipeline(query, analyze=analyze)
    
    print(f"""
📊 Resultado:
   Mercado: {result['query']}
   Preço: {result['price']}
   Dados: {result['data_file']}
   CSV: {result['csv_file']}
    """)

if __name__ == "__main__":
    main()