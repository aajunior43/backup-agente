#!/usr/bin/env python3
"""
Buscar dotações no orçamento de Inajá-PR por critérios.
Uso: python3 buscar_dotacoes.py [filtro] [valor]

Exemplos:
  python3 buscar_dotacoes.py natureza 3.3.90.39
  python3 buscar_dotacoes.py orgao "DIVISAO DE SERVICOS PUBLICOS"
  python3 buscar_dotacoes.py despesa 142
  python3 buscar_dotacoes.py saldo_min 5000
"""

import csv
import sys
import os

def parse_saldo(val):
    try:
        return float(val.replace('.', '').replace(',', '.'))
    except:
        return 0.0

def buscar(csv_path='~/.hermes/data/relacao_despesas_inaja.csv', filtro=None, valor=None):
    csv_path = os.path.expanduser(csv_path)
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        rows = list(reader)
    
    resultados = []
    for row in rows:
        saldo = parse_saldo(row.get('Saldo atual da despesa', '0'))
        
        if filtro == 'natureza':
            if valor in row.get('Natureza de Despesa', ''):
                resultados.append(row)
        elif filtro == 'orgao':
            if valor.upper() in row.get('Descrição do organograma', '').upper():
                resultados.append(row)
        elif filtro == 'despesa':
            if row.get('Número da despesa', '') == valor:
                resultados.append(row)
        elif filtro == 'saldo_min':
            if saldo >= float(valor):
                resultados.append(row)
        else:
            # Sem filtro, mostrar tudo com saldo > 0
            if saldo > 0:
                resultados.append(row)
    
    # Ordenar por saldo decrescente
    resultados.sort(key=lambda r: parse_saldo(r.get('Saldo atual da despesa', '0')), reverse=True)
    
    print(f"Encontradas {len(resultados)} dotações:\n")
    for r in resultados[:30]:
        despesa = r.get('Número da despesa', '')
        orgao = r.get('Descrição do organograma', '')
        acao = r.get('Descrição da ação', '')
        nat = r.get('Natureza de Despesa', '')
        desc_nat = r.get('Descrição da natureza de despesa', '')
        saldo = r.get('Saldo atual da despesa', '')
        recurso = r.get('Descrição do recurso', '')
        
        print(f"Despesa {despesa} | {orgao}")
        print(f"  Ação: {acao}")
        print(f"  Natureza: {nat} - {desc_nat}")
        print(f"  Saldo: R$ {saldo}")
        print(f"  Recurso: {recurso}")
        print()

if __name__ == '__main__':
    if len(sys.argv) >= 3:
        buscar(filtro=sys.argv[1], valor=sys.argv[2])
    else:
        buscar()
