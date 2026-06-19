#!/usr/bin/env python3
"""Gera decreto de crédito suplementar em PDF para Inajá-PR usando fpdf2.

Uso: python3 decreto-suplementar.py
Altere as variáveis DESTINO e FONTE abaixo conforme o decreto desejado.
"""

from fpdf import FPDF

# ============================================================
# CONFIGURAÇÃO — Altere aqui os dados do decreto
# ============================================================
DECRETO_NUM = "___/2026"
DECRETO_DATA = "___ de _________ de 2026"
ASSUNTO = "ABRE CREDITO SUPLEMENTAR PARA REFORCO DE DOTACAO ORCAMENTARIA DO DEPARTAMENTO DE EDUCACAO DESTINADA A AQUISICAO DE COMBUSTIVEL PARA O TRANSPORTE ESCOLAR."
VALOR_EXTENSO = "vinte e tres mil reais"
VALOR = "23.000,00"

DESTINO = {
    "orgao_cod": "10.002",
    "orgao_nome": "DIVISAO DE TRANSPORTE ESCOLAR",
    "acao_cod": "2.105",
    "acao_nome": "MANUTENCAO DO TRANSPORTE ESCOLAR",
    "programa": "10",
    "funcao": "12",
    "subfuncao": "361",
    "despesa_num": "297",
    "nd": "3.3.90.30.00.00.00.00",
    "nd_desc": "MATERIAL DE CONSUMO",
    "recurso_cod": "00000.00000.01.07.00.00.1.500.0000",
    "recurso_desc": "Recursos Ordinarios (Livres)",
    "valor": "23.000,00",
}

FONTE = {
    "orgao_cod": "99.099",
    "orgao_nome": "RESERVA DE CONTINGENCIA",
    "acao_cod": "9.999",
    "acao_nome": "RESERVA DE CONTIGENCIA",
    "programa": "99",
    "funcao": "99",
    "subfuncao": "999",
    "despesa_num": "365",
    "nd": "9.9.99.99.00.00.00.00",
    "nd_desc": "RESERVA DE CONTINGENCIA",
    "recurso_cod": "00000.00000.01.07.00.00.1.500.0000",
    "recurso_desc": "Recursos Ordinarios (Livres)",
    "valor": "23.000,00",
}

PREFEITO = "JOAO EDER AGUILAR"
CNPJ = "76.459.687/0001-40"

# ============================================================
# GERAÇÃO PDF — Não altere abaixo
# ============================================================

def make_cod(d):
    """Monta o código completo: ORGAO.ACAO.FUNCAO.SUBFUNCAO-DESPESA"""
    return f"{d['orgao_cod']}.{d['acao_cod']}.{d['funcao']}.{d['subfuncao']}-{d['despesa_num']}"

def gerar_decreto(destino, fonte, output_path):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.set_margins(15, 15, 15)
    pdf.set_y(15)

    # Helpers with X-reset (fpdf2 multi_cell bug workaround)
    def mc(text, font='Helvetica', style='', size=10, align='J', ln_after=1):
        pdf.set_x(15)
        pdf.set_font(font, style, size)
        pdf.multi_cell(0, 6, text, align=align)
        pdf.ln(ln_after)

    def cl(text, font='Helvetica', style='', size=10, align='L'):
        pdf.set_x(15)
        pdf.set_font(font, style, size)
        pdf.cell(0, 6, text, new_x="LMARGIN", new_y="NEXT", align=align)

    # Cabeçalho
    cl('ESTADO DO PARANA', style='B', size=11, align='C')
    cl('MUNICIPIO DE INAJA', size=11, align='C')
    cl(f'CNPJ: {CNPJ}', size=10, align='C')
    pdf.ln(8)

    mc(f'DECRETO No {DECRETO_NUM}, de {DECRETO_DATA}.', style='B', size=12, align='C', ln_after=3)
    mc(ASSUNTO, style='B', size=9, align='C', ln_after=3)

    # Preâmbulo
    mc('O PREFEITO MUNICIPAL DE INAJA, no uso de suas atribuicoes que lhe confere a Lei Organica do Municipio de INAJA e autorizacao contida na Lei Municipal No 1.359/2025, de 1 de Outubro de 2025,')
    pdf.ln(3)

    # DECRETA
    cl('D E C R E T A:', style='B', size=12, align='C')
    pdf.ln(5)

    # Art. 1º
    mc(f'Art. 1  Fica aberto credito suplementar no valor de R$ {destino["valor"]} ({VALOR_EXTENSO}), para reforco de dotacao orcamentaria do Departamento de Educacao, destinada a aquisicao de combustivel para o transporte escolar, conforme discriminacao a seguir:')
    pdf.ln(3)

    # Destino
    cl(f'{destino["orgao_cod"]} - {destino["orgao_nome"]}', style='B', size=10, align='C')
    cl(f'{destino["acao_cod"]} - {destino["acao_nome"]}', size=8)
    cod = make_cod(destino)
    mc(f'{cod} - {destino["nd"]} - {destino["nd_desc"]} - R$ {destino["valor"]}', size=8)
    mc(f'{destino["recurso_cod"]} - {destino["recurso_desc"]} - R$ {destino["valor"]}', size=8)
    pdf.ln(4)

    # Art. 2º
    mc(f'Art. 2  Os recursos necessarios a abertura do credito de que trata o artigo anterior, no valor de R$ {fonte["valor"]} ({VALOR_EXTENSO}), derivam da anulacao parcial de dotacao orcamentaria, conforme abaixo indicado:')
    pdf.ln(2)

    cl('I - Anulacao:', style='B', size=10)
    pdf.ln(1)

    # Fonte
    cl(f'{fonte["orgao_cod"]} - {fonte["orgao_nome"]}', style='B', size=10, align='C')
    cl(f'{fonte["acao_cod"]} - {fonte["acao_nome"]}', size=8)
    cod_f = make_cod(fonte)
    mc(f'{cod_f} - {fonte["nd"]} - {fonte["nd_desc"]} - R$ {fonte["valor"]}', size=8)
    mc(f'{fonte["recurso_cod"]} - {fonte["recurso_desc"]} - R$ {fonte["valor"]}', size=8)
    pdf.ln(6)

    # Art. 3º
    mc('Art. 3  Este decreto entrara em vigor na data de sua publicacao, revogadas as disposicoes em contrario.')
    pdf.ln(15)

    # Fecho e assinatura
    cl(f'GABINETE DO PREFEITO MUNICIPAL, {DECRETO_DATA}.', size=10, align='C')
    pdf.ln(12)
    cl(PREFEITO, style='B', size=10, align='C')
    cl('Prefeito Municipal', size=9, align='C')

    pdf.output(output_path)
    print(f'PDF gerado: {output_path}')

if __name__ == '__main__':
    dest_cod = DESTINO['orgao_cod'].replace('.', '')
    fonte_cod = FONTE['orgao_cod'].replace('.', '')
    output = f'/home/administrator/Decreto_Suplementar_{dest_cod}_{fonte_cod}.pdf'
    gerar_decreto(DESTINO, FONTE, output)