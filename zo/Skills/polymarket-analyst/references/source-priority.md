# Prioridade de Fontes — Polymarket

## Hierarquia (do melhor ao pior)

1. **Firecrawl** → extração direta do site Polymarket
2. **Tavily** → busca indexada com contexto
3. **API CLOB** → dados estruturados (use quando disponível)
4. **Usuário** → screenshots, CSV, links enviados
5. **Cache/Obsidian** → histórico já salvo

## Quando usar cada fonte

| Situação | Fonte Preferida |
|----------|-----------------|
| Link do usuário | Firecrawl (extrair dados da página) |
| Nome/tema genérico | Tavily (buscar mercados) |
| Precisa de preço exato | API CLOB (se conseguir ID) |
| Tem screenshot | Vision + complementar com busca |
| Sem internet | Diga claramente que não conseguiu |

## Como verificar dados

Sempre desconfie de preços antigos. Para verificar:
1. Confirme data/hora do dado
2. See for markets with volume > $100k (mais confiável)
3. Check spread — se > 5%, alerta de baixa liquidez

## Alertas de qualidade

- **🟢 Alta confiança:** Volume alto + Dados свежие + Firecrawl
- **🟡 Média confiança:** Tavily com data recente + contexto consistente
- **🔴 Baixa confiança:** Dado velho, baixa liquidez, contradição entre fontes