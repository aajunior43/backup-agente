# Dotação Orçamentária — Inajá 2026

Skill para consultar dotação orçamentária do município de Inajá-PR, analisar credores e gerar notas no Obsidian.

## Arquivos de Dados

O sistema suporta múltiplos CSVs por data. O mais recente é usado automaticamente.

```
dados/orcamento-inaja-2026.csv        # Arquivo único (legado)
dados/orcamento-inaja-2026-YYYY-MM-DD.csv  # Arquivos por data
```

## Uso

### Consultas em Linguagem Natural

```bash
# Buscar por fornecedor/credor
python3 scripts/dotacao.py credores

# Buscar por dotação específica
python3 scripts/dotacao.py buscar --item 278

# Verificar saldo
python3 scripts/dotacao.py saldo --item 278

# Listar todos os credores únicos
python3 scripts/dotacao.py listar-credores

# Buscar por recurso (103=FUNDEB, 104=Impostos Educação, etc)
python3 scripts/dotacao.py buscar --recurso 103

# Buscar por função (12=Edcação, 8=Saúde, etc)
python3 scripts/dotacao.py buscar --funcao 10
```

### Análise de Despesas

```bash
# Analisar todos os credores e gerar sumário
python3 scripts/dotacao.py analisar-credores

# Gerar nota no Obsidian para um credor
python3 scripts/dotacao.py nota-credor --fornecedor "TORREZAN"

# Verificar se dotação cobre valor desejado
python3 scripts/dotacao.py verificar --valor 1755 --destino "CMEI"
```

### Comandos Rápidos (alias)

```bash
# Educacao
python3 scripts/dotacao.py educacao

# Saude
python3 scripts/dotacao.py saude

# Assistencia social
python3 scripts/dotacao.py social

# Dotação específica
python3 scripts/dotacao.py dot 278
```

## Estrutura do CSV

| Campo | Descrição |
|-------|-----------|
| Entidade | PREFEITURA MUNICIPAL DE INAJA |
| Número do Organograma | 09.001, 10.001, etc |
| Descrição do organograma | Nome do departamento |
| Número da ação | 2.101, 1.721, etc |
| Descrição da ação | Nome da ação orçamentária |
| Número do programa | 2, 3, 7, etc |
| Descrição do programa | Nome do programa |
| Número da função | 4, 8, 10, 12 |
| Descrição da função | Educação, Saúde, etc |
| Número da subfunção | 122, 244, 361, etc |
| Descrição da subfunção | Nome da subfunção |
| Número da despesa | Item da dotação (ficha) |
| Natureza de Despesa | 3.3.90.39, 3.3.90.30, etc |
| Descrição da natureza de despesa | Nome do elemento |
| Recurso | Código do recurso |
| Descrição do recurso | Nome do recurso |
| Saldo atual da despesa | Saldo disponível |

## Resources Úteis

| Código | Nome |
|--------|------|
| 103 | 5% FUNDEB |
| 104 | Impostos Educação Básica |
| 107 | Salário Educação |
| 500 | Recursos Ordinários (LIVRES) |
| 540 | FUNDEB 40% |

## Functions

- `carregar_csv()` — Carrega CSV mais recente automaticamente
- `listar_credores()` — Lista todos fornecedores únicos
- `buscar_por_credor(nome)` — Busca por nome de fornecedor
- `analisar_credor(nome)` — Estatísticas de um credor
- `criar_nota_obsidian(credor, dados)` — Gera nota formatada
- `verificar_cobertura(item, valor)` — Verifica se dotação cobre valor
- `formatar_empenho(dados)` — Formata dados para empenho

## Tips

- Use `python3 scripts/dotacao.py credores` para ver todos os fornecedores
- Use `python3 scripts/dotacao.py verificar --valor X --destino Y` antes de indicar dotação
- Notas são salvas em `~/obsidian/vaults/MeuCofre/PREFEITURA/Credores/`