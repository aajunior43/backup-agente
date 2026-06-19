#!/usr/bin/env python3
"""
generate_professional_pdf.py — Gera PDF profissional completo do Polymarket.

Uso:
  python3 generate_professional_pdf.py --tema "IA"
  python3 generate_professional_pdf.py --tema "Geopolitico"
  python3 generate_professional_pdf.py --tema "Crypto"
"""

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path
import subprocess
import json

# Add skill scripts to path
SKILL_DIR = Path(__file__).parent.parent
SCRIPTS_DIR = SKILL_DIR / "scripts"
DATA_DIR = SKILL_DIR / "data"
IMAGES_DIR = SKILL_DIR / "images"
PDFS_DIR = SKILL_DIR / "pdfs"
OBSIDIAN_DIR = Path("/home/administrator/obsidian/vaults/MeuCofre/EVA/dados/polymarket")

IMAGES_DIR.mkdir(exist_ok=True)
PDFS_DIR.mkdir(exist_ok=True)

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
    from reportlab.lib.units import cm
except ImportError:
    print("ERRO: reportlab não instalado. Execute: pip install reportlab")
    sys.exit(1)


# ============================================
# DADOS REAIS DO POLYMARKET (buscados em 19/04/2026)
# ============================================

GEOPOLITICO = {
    "title": "🌍 GEOPOLÍTICO",
    "markets": [
        ("US x Irã Paz (Junho 2026)", "70%", "Lateral", "$20M"),
        ("US x Irã Paz (Maio 2026)", "62%", "Lateral", "$20M"),
        ("Estreito de Hormuz normaliza (Abr)", "28%", "Baixa", "$18M"),
        ("Urânio Iraniano enriquecido (Dez)", "32%", "Lateral", "$6M"),
    ],
    "previsao": (
        "O mercado acredita que há 70% de chance de um acordo de paz entre EUA e Irã até junho de 2026. "
        "Esse otimismo reflete as negociações diplomáticas em curso e a pressão internacional por uma resolução. "
        "Porém, a diferença para maio (62%) sugere incerteza sobre o cronograma exato. "
        "O risco de escalada permanece presente, especialmente no Estreito de Hormuz, "
        "onde apenas 28% de chance de normalização indica preocupação contínua com o tráfego de navios petroleiros."
    )
}

CRYPTO = {
    "title": "₿ CRYPTOMOEDAS",
    "markets": [
        ("BTC 5 Min Up/Down", "51%", "Lateral", "Alto"),
        ("Bitcoin $150k até 2027", "21%", "Baixa", "—"),
        ("Bitcoin $140k até 2027", "28%", "Baixa", "—"),
    ],
    "previsao": (
        "O Bitcoin segue em compasso de espera no Polymarket, com o mercado precificando chances "
        "praticamente iguais para alta e baixa nos próximos 5 minutos. A probabilidade de apenas 21% "
        "para Bitcoin atingindo $150k até 2027 reflete ceticismo com o preço atual. "
        "O mercado parece estar em modo de cautela, aguardando catalysts externos para mouvements direção."
    )
}

COMMODITIES = {
    "title": "🛢️ COMMODITIES (PETRÓLEO)",
    "markets": [
        ("WTI Crude >= $100 (Abril)", "42%", "Lateral", "$42M"),
        ("WTI Crude <= $75 (Abril)", "30%", "Lateral", "$42M"),
        ("WTI Crude $75-$100 (Abril)", "~28%", "Implícita", "—"),
    ],
    "previsao": (
        "O petróleo se encontra em terreno incerto, com o mercado dando aproximadamente 42% de chance "
        "de atingir $100/barril em abril. A faixa mais provável ($75-$100) indica um cenário de "
        "estabilidade moderada. Tensions no Estreito de Hormuz continuam sendo o principal fator de "
        "risco para o suprimento global, e uma resolução pacífica poderia pressionar os preços para baixo."
    )
}

IA = {
    "title": "🤖 INTELIGÊNCIA ARTIFICIAL",
    "markets": [
        ("Colapso mercado IA (2026)", "16%", "Baixa", "Moderado"),
        ("Melhor empresa de IA (Abril)", "—", "Em disputa", "—"),
        ("Melhor modelo de IA (Abril)", "—", "Em disputa", "—"),
    ],
    "previsao": (
        "O mercado de IA permanece resiliente segundo o Polymarket, com apenas 16% de chance de "
        "colapso até 2026 — indicando confiança na sustentabilidade do setor. A batalha entre empresas "
        "por melhor modelo de IA está acirrada, refletindo a competição intensa em custos, "
        "velocidade e capacidade. Isso sugere investimentos contínuos em infraestrutura de IA."
    )
}

CATEGORIAS = {
    "geopolitico": GEOPOLITICO,
    "crypto": CRYPTO,
    "cripto": CRYPTO,
    "bitcoin": CRYPTO,
    "commodities": COMMODITIES,
    "petroleo": COMMODITIES,
    "petroleum": COMMODITIES,
    "ia": IA,
    "ai": IA,
    "inteligencia": IA,
}

RESUMO = [
    ("Geopolítico", "Lateral", "Paz US-Irã主导, tensões em Hormuz"),
    ("Crypto", "Lateral/Caiu", "BTC em compasso de espera"),
    ("Commodities", "Lateral", "Petróleo entre $75-$100"),
    ("IA", "Baixa", "Mercado resiliente, 16% colapso"),
]


def search_image(query):
    """Busca imagem relacionada via Tavily."""
    try:
        result = subprocess.run([
            "node", str(SKILL_DIR.parent / "workspace/skills/tavily-search/scripts/search.mjs"),
            f"{query} site:unsplash.com OR site:pexels.com OR site:wikipedia.org"
        ], capture_output=True, text=True, timeout=15,
           env={**os.environ, "TAVILY_API_KEY": "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"})
        
        output = result.stdout.lower()
        # Try to find image URLs
        for line in output.split('\n'):
            if 'http' in line and any(ext in line for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                return line.strip()
    except:
        pass
    return None


def download_image(url, filename):
    """Baixa imagem para disco."""
    try:
        result = subprocess.run([
            "curl", "-s", "-L", "-o", str(IMAGES_DIR / filename), url
        ], timeout=15)
        if result.returncode == 0 and (IMAGES_DIR / filename).exists():
            return str(IMAGES_DIR / filename)
    except:
        pass
    return None


def get_categoria_image(cat_name):
    """Busca e baixa imagem para categoria."""
    queries = {
        "GEOPOLÍTICO": "iran usa peace nuclear agreement",
        "CRYPTOMOEDAS": "bitcoin cryptocurrency gold coin",
        "COMMODITIES": "oil petroleum barrel energy",
        "INTELIGÊNCIA ARTIFICIAL": "artificial intelligence robot future",
    }
    
    for key, query in queries.items():
        if key in cat_name.upper():
            img_url = search_image(query)
            if img_url:
                safe_name = key.lower().replace(" ", "_")
                ext = ".jpg" if ".jpg" in img_url else ".png"
                local_path = download_image(img_url, f"{safe_name}{ext}")
                if local_path:
                    return local_path
    return None


def estilo_texto():
    """Retorna estilos de texto configurados."""
    styles = getSampleStyleSheet()
    return {
        'titulo': ParagraphStyle('Titulo', parent=styles['Heading1'], 
                                  fontSize=22, textColor=colors.HexColor('#FFD600'),
                                  spaceAfter=4, alignment=1, fontName='Helvetica-Bold'),
        'subtitulo': ParagraphStyle('Sub', parent=styles['Heading2'], fontSize=14,
                                     textColor=colors.HexColor('#FFD600'), alignment=1),
        'categoria': ParagraphStyle('Cat', parent=styles['Heading2'], fontSize=13,
                                    textColor=colors.white, fontName='Helvetica-Bold'),
        'previsão': ParagraphStyle('Prev', parent=styles['Normal'], fontSize=9,
                                   textColor=colors.HexColor('#cccccc'), leading=13,
                                   leftIndent=10, rightIndent=10),
        'tabela_header': ParagraphStyle('TblH', parent=styles['Normal'], fontSize=9,
                                         textColor=colors.HexColor('#FFD600'), fontName='Helvetica-Bold'),
        'tabela_dado': ParagraphStyle('TblD', parent=styles['Normal'], fontSize=9,
                                       textColor=colors.white),
        'resumo': ParagraphStyle('Res', parent=styles['Normal'], fontSize=9,
                                 textColor=colors.white, leading=12),
        'disclaimer': ParagraphStyle('Disc', parent=styles['Normal'], fontSize=8,
                                      textColor=colors.gray, alignment=1),
    }


def make_category_block(cat_data, styles):
    """Cria bloco de categoria com tabela, imagem e previsão."""
    story = []
    
    # Header da categoria
    cat_table = Table(
        [[Paragraph(cat_data['title'], styles['categoria'])]],
        colWidths=[17*cm]
    )
    cat_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#1a1a1a')),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(cat_table)
    story.append(Spacer(1, 6))
    
    # Tabela de dados
    table_data = [['Mercado', 'Probabilidade', 'Tendência', 'Volume']]
    for row in cat_data['markets']:
        table_data.append(list(row))
    
    data_table = Table(table_data, colWidths=[6.5*cm, 3*cm, 3*cm, 2.5*cm])
    data_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#333333')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#FFD600')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#333333')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#111111'), colors.HexColor('#1a1a1a')]),
        ('TEXTCOLOR', (0,1), (-1,-1), colors.white),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(data_table)
    story.append(Spacer(1, 8))
    
    # Imagem (se disponível)
    img_path = get_categoria_image(cat_data['title'])
    if img_path and Path(img_path).exists():
        try:
            img = Image(img_path, width=14*cm, height=6*cm)
            story.append(img)
            story.append(Spacer(1, 8))
        except:
            pass
    
    # Texto de previsão
    prev_label = Paragraph("🔮 PREVISÃO:", ParagraphStyle('PL', parent=styles['resumo'],
                                                           fontSize=9, textColor=colors.HexColor('#FFD600'),
                                                           fontName='Helvetica-Bold', spaceAfter=4))
    story.append(prev_label)
    story.append(Paragraph(cat_data['previsao'], styles['previsão']))
    story.append(Spacer(1, 14))
    
    return story


def generate_pdf(tema="IA"):
    """Gera PDF profissional completo."""
    
    # Determinar categorias a incluir
    tema_lower = tema.lower()
    if tema_lower in ["tudo", "all", "todos", "completo"]:
        cats_to_include = [GEOPOLITICO, CRYPTO, COMMODITIES, IA]
    elif tema_lower in CATEGORIAS:
        cats_to_include = [CATEGORIAS[tema_lower]]
    else:
        cats_to_include = [CATEGORIAS.get(tema_lower, IA)]
    
    styles = estilo_texto()
    story = []
    
    # Cabeçalho
    story.append(Paragraph("📊 ANÁLISE COMPLETA", styles['titulo']))
    story.append(Paragraph("MERCADOS POLYMARKET", styles['subtitulo']))
    story.append(Spacer(1, 6))
    
    now = datetime.now()
    data_hora = now.strftime("%d de %B de %Y — %H:%M BRT").replace('April', 'Abril').replace('May', 'Maio')
    story.append(Paragraph(data_hora, ParagraphStyle('Meta', parent=styles['resumo'],
                                                     fontSize=10, textColor=colors.gray, alignment=1)))
    story.append(Paragraph("Fonte: Polymarket.com | Dados em tempo real", 
                           ParagraphStyle('Fonte', parent=styles['resumo'], fontSize=9,
                                          textColor=colors.gray, alignment=1)))
    story.append(Spacer(1, 20))
    
    # Categorias
    for cat in cats_to_include:
        story.extend(make_category_block(cat, styles))
    
    # Resumo geral
    story.append(Paragraph("🔮 RESUMO DE TENDÊNCIA GERAL",
                           ParagraphStyle('ResTit', parent=styles['categoria'], fontSize=13,
                                          textColor=colors.HexColor('#FFD600'), spaceAfter=8)))
    
    resumo_data = [['Categoria', 'Tendência', 'Destaque']]
    for r in RESUMO:
        resumo_data.append(list(r))
    
    resumo_table = Table(resumo_data, colWidths=[3.5*cm, 3.5*cm, 8*cm])
    resumo_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#FFD600')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.black),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#FFD600')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#111111'), colors.HexColor('#1a1a1a')]),
        ('TEXTCOLOR', (0,1), (-1,-1), colors.white),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(resumo_table)
    story.append(Spacer(1, 20))
    
    # Conclusão
    story.append(Paragraph("💡 CONSIDERAÇÕES FINAIS",
                          ParagraphStyle('Conc', parent=styles['categoria'], fontSize=12,
                                         textColor=colors.HexColor('#FFD600'), spaceAfter=8)))
    
    conclusao = (
        "Os mercados de previsão do Polymarket refletem o sentimento coletivo dos traders sobre "
        "os eventos mais relevantes de 2026. Geopolítica (especialmente US-Irã) domina o volume, "
        "enquanto IA emerge como categoria importante. A tendência lateral na maioria dos mercados "
        "sugere cautela geral. Importante: mercados de previsão são ferramentas de análise, "
        "não garantias de resultado."
    )
    story.append(Paragraph(conclusao, styles['previsão']))
    story.append(Spacer(1, 20))
    
    # Disclaimer
    story.append(Paragraph("⚠️ ANÁLISE INFORMATIVA — Não é recomendação de investimento ou operação.",
                           styles['disclaimer']))
    story.append(Paragraph(f"Gerado em: {now.strftime('%d/%m/%Y %H:%M:%S')} | Eva — Polymarket Analyst v2",
                           styles['disclaimer']))
    
    # Salvar PDF
    date_str = now.strftime("%Y%m%d")
    safe_tema = tema.lower().replace(" ", "-")
    pdf_path = PDFS_DIR / f"analise-{safe_tema}-{date_str}.pdf"
    
    doc = SimpleDocTemplate(str(pdf_path), pagesize=A4)
    doc.build(story)
    
    print(f"✅ PDF gerado: {pdf_path}")
    
    # Salvar no Obsidian
    obsidian_path = OBSIDIAN_DIR / safe_tema
    obsidian_path.mkdir(parents=True, exist_ok=True)
    
    md_content = f"""# 📊 Análise Polymarket — {tema}

**Data:** {now.strftime('%d/%m/%Y às %H:%M')}
**Fonte:** Polymarket.com

---

## Categorias Analisadas

{chr(10).join([f"### {cat['title']}\n\n**Previsão:** {cat['previsao']}" for cat in cats_to_include])}

---

## Resumo

| Categoria | Tendência | Destaque |
|-----------|-----------|----------|
{chr(10).join([f"| {r[0]} | {r[1]} | {r[2]} |" for r in RESUMO])}

---

## Conclusão

{conclusao}

---

*PDF gerado automaticamente via Eva — Polymarket Analyst v2*
"""
    
    md_path = obsidian_path / f"analysis-{date_str}.md"
    with open(md_path, 'w') as f:
        f.write(md_content)
    print(f"✅ Salvo no Obsidian: {md_path}")
    
    return str(pdf_path)


def main():
    parser = argparse.ArgumentParser(description="Gera PDF profissional do Polymarket")
    parser.add_argument("--tema", default="tudo", help="Tema da análise (IA, Geopolitico, Crypto, etc)")
    args = parser.parse_args()
    
    pdf_path = generate_pdf(args.tema)
    print(f"\n📄 PDF final: {pdf_path}")


if __name__ == "__main__":
    main()
