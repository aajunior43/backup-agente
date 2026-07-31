#!/usr/bin/env python3
import csv
import sys
from pathlib import Path

csv_path = Path("/home/.z/chat-uploads/Relação de Despesas-b804d8877e09.csv")

natureza_diaria = "3.3.90.14"
funcao_saude = "10"

rows = []
with csv_path.open("r", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f, delimiter=";")
    for row in reader:
        if (
            row.get("Natureza de Despesa", "").strip().startswith(natureza_diaria)
            and row.get("Número da função", "").strip() == funcao_saude
        ):
            rows.append(row)

if not rows:
    print("Nenhuma dotação encontrada para diária civil (3.3.90.14) na função Saúde (10).")
    sys.exit(0)

print("============================================================")
print("DOTAÇÕES ENCONTRADAS — DIÁRIA CIVIL PARA SAÚDE")
print("Natureza de Despesa: 3.3.90.14")
print("Função: 10 - Saúde")
print(f"Total de registros: {len(rows)}")
print("============================================================")
for i, row in enumerate(rows, 1):
    print(f"REGISTRO {i}")
    print(f"  Entidade: {row.get('Entidade','').strip()}")
    print(f"  Unidade: {row.get('Descrição do organograma','').strip()}")
    print(f"  Ação: {row.get('Número da ação','').strip()} - {row.get('Descrição da ação','').strip()}")
    print(f"  Programa: {row.get('Número do programa','').strip()} - {row.get('Descrição do programa','').strip()}")
    print(f"  Subfunção: {row.get('Número da subfunção','').strip()} - {row.get('Descrição da subfunção','').strip()}")
    print(f"  ID da dotação: {row.get('Número da despesa','').strip()}")
    print(f"  Natureza: {row.get('Natureza de Despesa','').strip()} - {row.get('Descrição da natureza de despesa','').strip()}")
    print(f"  Recurso: {row.get('Recurso','').strip()} - {row.get('Descrição do recurso','').strip()}")
    saldo = row.get("Saldo atual da despesa", "0,00").strip()
    print(f"  Saldo atual: R$ {saldo}")
    print()
