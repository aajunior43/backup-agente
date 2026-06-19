# CAUC — Padrão de Análise de Irregularidades

## Estrutura de Extração

Todo ofício sobre CAUC segue o extrato do Tesouro Nacional. Classificar em 3 categorias:

### 🔴 Itens "A Comprovar" (Pendentes)
Para cada item:
- **Número** (ex: 1.5, 3.1.1, 3.2.2)
- **Descrição** curta
- **Motivo/Fonte** (CADIN, SICONFI, SIOPE, etc.)
- **Período** afetado (bimestre/quadrimestre/ano)

### ⚠️ Itens com Validade Expirando
Para cada item:
- **Número e descrição**
- **Data de validade** (se venceu, está 🔴)
- Verificar se já foi renovado desde a data-base do extrato

### ✅ Itens Comprovados
Para cada item:
- **Número e descrição**
- **Data de validade** (próximo vencimento)
- Serve para mostrar o que NÃO precisa de ação imediata

## Sistemas Referenciados no CAUC

| Sigla | Sistema | Responsabilidade |
|-------|---------|------------------|
| SICONFI | Sistema de Informações Contábeis e Fiscais | RGF, RREO, MSC |
| SIOPE | Sistema de Informações sobre Orçamentos Públicos em Educação | Anexo 8, Fundeb |
| SIOPS | Sistema de Informações sobre Orçamentos Públicos em Saúde | Anexo 12 |
| CADIN | Cadastro de Inadimplentes | Dívidas com União |
| CDP | Cadastro da Dívida Pública | Dívida consolidada |
| SIT | Sistema Integrado de Transferências | Convênios e repasses |
| Transferegov.br | Portal de Transferências | Prestação de contas |

## Efeitos Práticos (sempre citar no resumo)

1. 🚫 Bloqueio de transferências voluntárias
2. 🚫 Impossibilidade de novos convênios
3. 🚫 Bloqueio de emendas parlamentares
4. ⚖️ Exposição ao TCE-PR e MP (improbidade LRF)
5. 📋 Ônus documental manual

## Prazo de Resposta

O Controle Interno typically pede resposta em **5 dias úteis** a partir do recebimento.

## Minuta de Resposta — Tom

- **NÃO assumir compromisso** além do necessário
- Agradecer a comunicação
- Informar providências em andamento (sem detalhar prazos específicos que não possa cumprir)
- Prometer cronograma "em breve" sem data fixa
- **Delimitar competência explicitamente** — para cada item que NÃO é de Finanças, indicar qual setor é responsável
- **Incluir CÓPIA ao Gabinete do Prefeito** — garante cobertura política e registro formal
- Sugerir que CI direcione recomendações aos setores competentes

## Mapeamento de Competência (Inajá-PR)

| Item CAUC | Responsável | Não é Finanças? |
|-----------|-------------|-----------------|
| 1.5 CADIN | Órgão originário (ver referência) | ✓ |
| 3.1.1 / 3.1.2 RGF | Contabilidade | ✓ |
| 3.2.1 / 3.2.2 RREO | Contabilidade | ✓ |
| 3.2.3 Anexo 8 / SIOPE | Secretaria de Educação | ✓ |
| 3.4.1 / 3.4.2 MSC | Contabilidade | ✓ |
| 3.5 CDP | Contabilidade | ✓ |
| 5.1 Aplicação Mínima Educação | Secretaria de Educação | ✓ |
| 5.3 / 5.4 Limites PPP/Crédito | Contabilidade (depende RREO/RGF) | ✓ |
| 5.5 / 5.6 / 5.7 Fundeb | Secretaria de Educação (SIOPE) | ✓ |
| 1.2 / 1.4 / 2.1 Val expirando | Finanças (renovação) | ✗ (é de Finanças) |
| Conciliações bancárias | Finanças | ✗ (é de Finanças) |
| Dados orçamentários SICONFI | Finanças (disponibilização) | Parcial |

Itens marcados ✓ devem ser REDIRECIONADOS ao setor competente na resposta, sem assumir responsabilidade.

## Formato de Arquivo

Salvar em: `~/workspace/dados/oficio-NNN-2026-CAUC-inajá.md`
Incluir: tabela de itens por status, efeitos práticos, recomendações do CI, prazo de resposta.