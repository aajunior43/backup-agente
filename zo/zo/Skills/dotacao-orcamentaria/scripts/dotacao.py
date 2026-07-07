#!/usr/bin/env python3
"""
Dotação Orçamentária — Inajá 2026 (v2.0)
Consultas melhoradas com análise de credores e integração Obsidian
"""

import csv
import os
import sys
import json
from datetime import datetime

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.dirname(SCRIPT_DIR)
WORKSPACE = "/home/workspace"
DADOS_DIR = f"{SKILL_DIR}/dados"
OBSIDIAN_CREDORES = f"{WORKSPACE}/Documentos/Obsidian/Credores"

def encontrar_csv_mais_recente():
    """Encontra o CSV mais recente no diretório de dados."""
    arquivos = [f for f in os.listdir(DADOS_DIR) if f.startswith('orcamento-inaja-2026') and f.endswith('.csv')]
    if not arquivos:
        # Fallback para o CSV principal
        return f"{DADOS_DIR}/orcamento-inaja-2026.csv"
    
    # Ordena por data (mais recente primeiro)
    arquivos.sort(reverse=True)
    return f"{DADOS_DIR}/{arquivos[0]}"

def carregar_dados(arquivo=None):
    """Carrega dados do CSV."""
    if arquivo is None:
        arquivo = encontrar_csv_mais_recente()
    with open(arquivo, 'r', encoding='utf-8') as f:
        return list(csv.DictReader(f, delimiter=';')), arquivo

def listar_credores(dados):
    """Lista todos os credores/fornecedores únicos."""
    credores = {}
    for r in dados:
        entity = r.get('Entidade', '')
        if entity and entity not in credores:
            credores[entity] = {'count': 0, 'total': 0.0}
        # Busca credor no histórico (coluna 16 ou similar)
        # Por enquanto conta só entidades únicas
    return list(set([r.get('Entidade', 'N/A') for r in dados]))

def parse_saldo(saldo_str):
    """Converte string de saldo para float."""
    if not saldo_str:
        return 0.0
    try:
        return float(saldo_str.replace('.', '').replace(',', '.'))
    except:
        return 0.0

def buscar_por_funcao(funcao, dados=None):
    """Busca todas as despesas de uma função."""
    if dados is None:
        dados, _ = carregar_dados()
    return [r for r in dados if r.get('Número da função', '').startswith(str(funcao))]

def buscar_por_recurso(codigo, dados=None):
    """Busca por código do recurso."""
    if dados is None:
        dados, _ = carregar_dados()
    return [r for r in dados if codigo in r.get('Recurso', '')]

def buscar_por_item(item, dados=None):
    """Busca dotação por número do item/ficha."""
    if dados is None:
        dados, _ = carregar_dados()
    return [r for r in dados if r.get('Número da despesa', '').strip() == str(item).strip()]

def verificar_cobertura(item, valor, dados=None):
    """Verifica se uma dotação cobre o valor desejado."""
    if dados is None:
        dados, _ = carregar_dados()
    resultados = buscar_por_item(item, dados)
    if not resultados:
        return None
    
    r = resultados[0]
    saldo = parse_saldo(r.get('Saldo atual da despesa', '0'))
    cobertura = saldo >= valor
    
    return {
        'item': r.get('Número da despesa'),
        'descricao': r.get('Descrição da ação', ''),
        'natureza': r.get('Natureza de Despesa', ''),
        'recurso': r.get('Descrição do recurso', ''),
        'saldo': saldo,
        'valor_desejado': valor,
        'cobertura': cobertura,
        'diferenca': saldo - valor if cobertura else None
    }

def credores_encontrados(dados):
    """Extrai todos os credores únicos dos dados."""
    # Tenta encontrar credor no CSV - usa 'Entidade' ou similar
    credores = {}
    for r in dados:
        # Tenta pegar o nome do órgão como credor
        orgao = r.get('Descrição do organograma', '').strip()
        if orgao and orgao != 'PREFEITURA MUNICIPAL DE INAJA':
            if orgao not in credores:
                credores[orgao] = {'count': 0, 'items': [], 'total_saldo': 0.0}
            credores[orgao]['count'] += 1
            credores[orgao]['items'].append(r.get('Número da despesa', ''))
            credores[orgao]['total_saldo'] += parse_saldo(r.get('Saldo atual da despesa', '0'))
    return credores

def formatar_saldo(saldo):
    """Formata saldo como string Monetária."""
    return f"R$ {saldo:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')

def criar_nota_credor(nome, dados_credor, arquivo_saida):
    """Cria nota formatada no Obsidian para um credor."""
    total_saldo = sum([parse_saldo(r.get('Saldo atual da despesa', '0')) for r in dados_credor])
    
    nota = f"""# {nome}

> Cadastrado no orçamento de Inajá 2026

## Resumo

| Itens | Total em dotações |
|-------|-------------------|
| {len(dados_credor)} | {formatar_saldo(total_saldo)} |

---

## Dotação(ões)

"""
    for r in dados_credor:
        nota += f"""### Item {r.get('Número da despesa', 'N/A')}

- **Ação:** {r.get('Descrição da ação', 'N/A')}
- **Função:** {r.get('Número da função', 'N/A')} - {r.get('Descrição da função', 'N/A')}
- **Natureza:** {r.get('Natureza de Despesa', 'N/A')}
- **Recurso:** {r.get('Descrição do recurso', 'N/A')}
- **Saldo:** {formatar_saldo(parse_saldo(r.get('Saldo atual da despesa', '0')))}

---
"""
    
    nota += f"""
**Criado:** {datetime.now().strftime('%d/%m/%Y %H:%M')}
"""
    
    with open(arquivo_saida, 'w', encoding='utf-8') as f:
        f.write(nota)
    
    return arquivo_saida

def main():
    if len(sys.argv) < 2:
        print("DOTACAO v2.0 — Inajá 2026")
        print("=" * 40)
        print("Comandos disponíveis:")
        print("  credores              # Lista todos os credores/fornecedores")
        print("  buscar --item <n>     # Busca dotação por item/ficha")
        print("  buscar --funcao <n>   # Busca por função (ex: 10=Saúde)")
        print("  buscar --recurso <n>  # Busca por recurso (ex: 103=FUNDEB)")
        print("  saldo --item <n>      # Mostra saldo de uma dotação")
        print("  verificar --valor <v> --item <n>  # Verifica se cobre valor")
        print("  nota --fornecedor <nome>  # Cria nota Obsidian")
        print("  educacao              # Lista dotações da educação")
        print("  saude                  # Lista dotações da saúde")
        print("  social                 # Lista dotações de assistência social")
        print("  dot <n>                # Resumo rápido de uma dotação")
        sys.exit(0)
    
    cmd = sys.argv[1]
    
    if cmd == 'credores':
        dados, arquivo = carregar_dados()
        print(f"📂 CSV: {os.path.basename(arquivo)}")
        print(f"Total de registros: {len(dados)}\n")
        
        # Agrupa por órgão
        orgaos = {}
        for r in dados:
            orgao = r.get('Descrição do organograma', 'N/A')
            if orgao not in orgaos:
                orgaos[orgao] = {'count': 0, 'saldo': 0}
            orgaos[orgao]['count'] += 1
            orgaos[orgao]['saldo'] += parse_saldo(r.get('Saldo atual da despesa', '0'))
        
        print("📋 ORGÃOS / CREDORES ENCONTRADOS:")
        print("-" * 60)
        for orgao, info in sorted(orgaos.items(), key=lambda x: x[1]['saldo'], reverse=True):
            print(f"  {orgao[:45]}")
            print(f"    → {info['count']} dotação(ões) | Saldo: {formatar_saldo(info['saldo'])}")
            print()
    
    elif cmd == 'buscar':
        if '--item' in sys.argv:
            idx = sys.argv.index('--item')
            item = sys.argv[idx + 1]
            dados, arquivo = carregar_dados()
            resultados = buscar_por_item(item, dados)
            if resultados:
                for r in resultados:
                    print(f"✅ Item {r['Número da despesa']}")
                    print(f"   Órgão: {r.get('Descrição do organograma', 'N/A')}")
                    print(f"   Ação: {r.get('Descrição da ação', 'N/A')}")
                    print(f"   Natureza: {r.get('Natureza de Despesa', 'N/A')}")
                    print(f"   Recurso: {r.get('Descrição do recurso', 'N/A')}")
                    print(f"   Saldo: {formatar_saldo(parse_saldo(r.get('Saldo atual da despesa', '0')))}")
            else:
                print(f"❌ Item {item} não encontrado")
        
        elif '--funcao' in sys.argv:
            idx = sys.argv.index('--funcao')
            funcao = sys.argv[idx + 1]
            dados, arquivo = carregar_dados()
            resultados = buscar_por_funcao(funcao, dados)
            print(f"📂 {len(resultados)} dotação(ões) na função {funcao}:")
            for r in resultados[:15]:
                print(f"  [{r.get('Número da despesa', '')}] {r.get('Descrição da ação', '')[:40]} | {formatar_saldo(parse_saldo(r.get('Saldo atual da despesa', '0')))}")
            if len(resultados) > 15:
                print(f"  ... e mais {len(resultados) - 15} itens")
        
        elif '--recurso' in sys.argv:
            idx = sys.argv.index('--recurso')
            recurso = sys.argv[idx + 1]
            dados, arquivo = carregar_dados()
            resultados = buscar_por_recurso(recurso, dados)
            print(f"📂 {len(resultados)} dotação(ões) com recurso {recurso}:")
            for r in resultados[:15]:
                print(f"  [{r.get('Número da despesa', '')}] {r.get('Descrição da ação', '')[:40]} | {formatar_saldo(parse_saldo(r.get('Saldo atual da despesa', '0')))}")
            if len(resultados) > 15:
                print(f"  ... e mais {len(resultados) - 15} itens")
    
    elif cmd == 'saldo':
        if '--item' in sys.argv:
            idx = sys.argv.index('--item')
            item = sys.argv[idx + 1]
            dados, arquivo = carregar_dados()
            resultados = buscar_por_item(item, dados)
            if resultados:
                r = resultados[0]
                print(f"📊 Item {item} — {r.get('Descrição da ação', 'N/A')}")
                print(f"   Saldo disponível: {formatar_saldo(parse_saldo(r.get('Saldo atual da despesa', '0')))}")
            else:
                print(f"❌ Item {item} não encontrado")
    
    elif cmd == 'verificar':
        valor = None
        item = None
        if '--valor' in sys.argv:
            idx = sys.argv.index('--valor')
            valor = float(sys.argv[idx + 1])
        if '--item' in sys.argv:
            idx = sys.argv.index('--item')
            item = sys.argv[idx + 1]
        
        destino = None
        if '--destino' in sys.argv:
            idx = sys.argv.index('--destino')
            destino = sys.argv[idx + 1]

        if valor and item:
            resultado = verificar_cobertura(item, valor)
            if resultado:
                if resultado['cobertura']:
                    print(f"✅ Item {item} COBRE R$ {valor:,.2f}")
                    print(f"   Saldo: {formatar_saldo(resultado['saldo'])}")
                    print(f"   Sobra: {formatar_saldo(resultado['diferenca'])}")
                else:
                    print(f"❌ Item {item} NÃO cobre R$ {valor:,.2f}")
                    print(f"   Saldo: {formatar_saldo(resultado['saldo'])}")
                    print(f"   Faltam: {formatar_saldo(valor - resultado['saldo'])}")
            else:
                print(f"❌ Item {item} não encontrado")
        elif valor and destino:
            dados, _ = carregar_dados()
            matches = [r for r in dados if destino.upper() in r.get('Descrição da ação', '').upper()]
            if not matches:
                print(f"❌ Nenhuma dotação encontrada com '{destino}'")
            else:
                print(f"🔎 {len(matches)} dotação(ões) para '{destino}':\n")
                for r in matches:
                    saldo = parse_saldo(r.get('Saldo atual da despesa', '0'))
                    cobre = saldo >= valor
                    status = "✅" if cobre else "❌"
                    print(f"  {status} Item {r.get('Número da despesa', 'N/A')} — {r.get('Descrição da ação', '')[:40]}")
                    print(f"     Saldo: {formatar_saldo(saldo)} | Valor: R$ {valor:,.2f}")
        else:
            print("Use: dotacao.py verificar --valor <n> --item <n>")
            print("     dotacao.py verificar --valor <n> --destino <texto>")
    
    elif cmd == 'educacao':
        dados, arquivo = carregar_dados()
        funcoes = ['12']  # Educação (10=Saúde, 08=Assistência Social, 12=Educação)
        print("📚 DOTACOES DA EDUCACAO:\n")
        for f in funcoes:
            resultados = buscar_por_funcao(f, dados)
            print(f"  Funcao {f}: {len(resultados)} dotacoes")
            for r in resultados[:5]:
                print(f"    [{r.get('Número da despesa', '')}] {r.get('Descrição da ação', '')[:35]} | {formatar_saldo(parse_saldo(r.get('Saldo atual da despesa', '0')))}")
    
    elif cmd == 'saude':
        dados, arquivo = carregar_dados()
        resultados = buscar_por_funcao('10', dados)
        print("🏥 DOTACOES DA SAUDE:\n")
        print(f"  Total: {len(resultados)} dotacoes")
        for r in resultados[:10]:
            print(f"    [{r.get('Número da despesa', '')}] {r.get('Descrição da ação', '')[:35]} | {formatar_saldo(parse_saldo(r.get('Saldo atual da despesa', '0')))}")
    
    elif cmd == 'social':
        dados, arquivo = carregar_dados()
        resultados = buscar_por_funcao('08', dados)
        print("🤝 DOTACOES DE ASSISTENCIA SOCIAL:\n")
        print(f"  Total: {len(resultados)} dotacoes")
        for r in resultados[:10]:
            print(f"    [{r.get('Número da despesa', '')}] {r.get('Descrição da ação', '')[:35]} | {formatar_saldo(parse_saldo(r.get('Saldo atual da despesa', '0')))}")
    
    elif cmd == 'listar-credores':
        dados, arquivo = carregar_dados()
        print(f"📂 CSV: {os.path.basename(arquivo)}")
        print(f"Total de registros: {len(dados)}\n")
        orgaos = {}
        for r in dados:
            orgao = r.get('Descrição do organograma', 'N/A')
            if orgao not in orgaos:
                orgaos[orgao] = {'count': 0, 'saldo': 0}
            orgaos[orgao]['count'] += 1
            orgaos[orgao]['saldo'] += parse_saldo(r.get('Saldo atual da despesa', '0'))
        print("📋 ORGÃOS / CREDORES ENCONTRADOS:")
        print("-" * 60)
        for orgao, info in sorted(orgaos.items(), key=lambda x: x[1]['saldo'], reverse=True):
            print(f"  {orgao[:45]}")
            print(f"    → {info['count']} dotação(ões) | Saldo: {formatar_saldo(info['saldo'])}")
            print()

    elif cmd in ('nota-credor', 'nota'):
        fornecedor_flag = '--fornecedor' in sys.argv
        if fornecedor_flag:
            idx = sys.argv.index('--fornecedor')
            nome = sys.argv[idx + 1]
            dados, arquivo = carregar_dados()
            registros = [r for r in dados if nome.upper() in r.get('Descrição do organograma', '').upper()]
            if registros:
                os.makedirs(OBSIDIAN_CREDORES, exist_ok=True)
                data_hoje = datetime.now().strftime('%Y-%m-%d')
                nome_arquivo = f"{OBSIDIAN_CREDORES}/{data_hoje}-{nome.lower().replace(' ', '-')}.md"
                caminho = criar_nota_credor(nome, registros, nome_arquivo)
                print(f"✅ Nota criada: {caminho}")
            else:
                print(f"❌ Nenhum registro encontrado para '{nome}'")
        else:
            print("Use: dotacao.py nota-credor --fornecedor <nome>")

    elif cmd == 'analisar-credores':
        dados, arquivo = carregar_dados()
        print(f"📂 CSV: {os.path.basename(arquivo)}")
        print(f"Total de registros: {len(dados)}\n")
        orgaos = {}
        for r in dados:
            orgao = r.get('Descrição do organograma', 'N/A')
            if orgao not in orgaos:
                orgaos[orgao] = {'count': 0, 'saldo': 0.0, 'funcoes': set(), 'recursos': set()}
            orgaos[orgao]['count'] += 1
            orgaos[orgao]['saldo'] += parse_saldo(r.get('Saldo atual da despesa', '0'))
            orgaos[orgao]['funcoes'].add(r.get('Descrição da função', ''))
            orgaos[orgao]['recursos'].add(r.get('Descrição do recurso', ''))
        total_geral = sum(v['saldo'] for v in orgaos.values())
        print(f"📊 SUMÁRIO — {len(orgaos)} órgãos | Total: {formatar_saldo(total_geral)}\n")
        print("-" * 70)
        for orgao, info in sorted(orgaos.items(), key=lambda x: x[1]['saldo'], reverse=True):
            pct = (info['saldo'] / total_geral * 100) if total_geral else 0
            print(f"  {orgao[:45]}")
            print(f"    Dotações: {info['count']} | Saldo: {formatar_saldo(info['saldo'])} ({pct:.1f}%)")
            funcoes_str = ', '.join(f for f in info['funcoes'] if f)
            if funcoes_str:
                print(f"    Funções: {funcoes_str[:60]}")
            print()

    elif cmd == 'dot':
        if len(sys.argv) > 2:
            item = sys.argv[2]
            dados, arquivo = carregar_dados()
            resultados = buscar_por_item(item, dados)
            if resultados:
                r = resultados[0]
                print(f"📋 Item {item}")
                print(f"   {r.get('Descrição do organograma', 'N/A')}")
                print(f"   {r.get('Descrição da ação', 'N/A')}")
                print(f"   Nat: {r.get('Natureza de Despesa', 'N/A')}")
                print(f"   Rec: {r.get('Descrição do recurso', 'N/A')}")
                print(f"   Saldo: {formatar_saldo(parse_saldo(r.get('Saldo atual da despesa', '0')))}")
            else:
                print(f"❌ Item {item} nao encontrado")
        else:
            print("Use: dotacao.py dot <item>")
    
    else:
        print(f"Comando '{cmd}' nao reconhecido")
        print("Use sem argumentos para ver ajuda")

if __name__ == "__main__":
    main()