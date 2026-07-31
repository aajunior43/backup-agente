---
name: rastreamento
description: >-
  Gerencia e rastreia pedidos dos Correios (e outras transportadoras) do Aleksandro.
  Mantém um registro persistente em `pedidos/rastreamento.json`, consulta o status via
  API pública do Seu Rastreio quando disponível, com fallback para browser.
  Usa o Telegram para notificações. Use sempre que Aleksandro quiser adicionar, remover,
  checar ou listar pedidos, mencionar código de rastreio, ou perguntar "cadê meu pedido"/"chegou o pacote".
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  display-name: 📦 Rastreamento de Pedidos
  version: "1.0"
  tags: [rastreamento, correios, pedidos, encomendas, pac, sedex, telegram]
---

# 📦 Skill: Rastreamento de Pedidos

## O que faz

Gerencia os pedidos em trânsito do Aleksandro. Mantém um registro em JSON com descrição,
transportadora, código, status e histórico, e roda 5x por dia (08h, 11h, 14h, 17h, 20h)
enviando atualizações pelo Telegram.

## Arquivos

| Arquivo | O que contém |
|---------|-------------|
| `pedidos/rastreamento.json` | Base de dados dos pedidos (estado persistente) |
| `pedidos/rastreamento.md` | Versão markdown (legível, editável à mão) |
| `pedidos/historico.jsonl` | Log append-only de cada checagem (timestamp + status) |

## Comandos do CLI

```bash
# Adicionar pedido
bun run Skills/rastreamento/scripts/rastreamento.ts adicionar \
  --codigo=AP272328771BR --descricao="Tênis Nike" --transportadora=correios

# Listar todos os pedidos ativos
bun run Skills/rastreamento/scripts/rastreamento.ts listar

# Listar só entregues
bun run Skills/rastreamento/scripts/rastreamento.ts listar --entregues

# Checar um código específico
# 1) Tenta a API pública do Seu Rastreio se a secret SEU_RASTREIO_API_KEY existir
# 2) Se não houver API ou ela falhar, cai para a URL do browser
bun run Skills/rastreamento/scripts/rastreamento.ts checar --codigo=AP272328771BR

# Marcar como entregue
bun run Skills/rastreamento/scripts/rastreamento.ts entregar --codigo=AP272328771BR

# Remover pedido do registro
bun run Skills/rastreamento/scripts/rastreamento.ts remover --codigo=AP272328771BR

# Ver resumo para enviar no Telegram
bun run Skills/rastreamento/scripts/rastreamento.ts resumo
```

## Transportadoras suportadas

| Código | Transportadora | Detecção |
|--------|----------------|----------|
| `AP…BR`, `AA…BR`, `LB…BR`, `RA…BR` | Correios (PAC/SEDEX) | prefixo + 9 dígitos + BR |
| Outros formatos | Genérico (Linketracker etc.) | usar URL da loja |

Hoje a skill consulta apenas os **Correios**. Para outras transportadoras, o script devolve
a URL de rastreio da loja/origem para consulta manual.

## Fluxo da automação (5x/dia)

A automação roda nos horários `08:00, 11:00, 14:00, 17:00, 20:00` (America/Sao_Paulo) com
`rrule = "RRULE:FREQ=DAILY;BYHOUR=8,11,14,17,20;BYMINUTE=0"`.

A cada execução, o agente:

1. Lê `pedidos/rastreamento.json`
2. Para cada pedido **ativo** (não entregue):
   - Tenta primeiro a API pública do Seu Rastreio, se `SEU_RASTREIO_API_KEY` estiver configurada
   - Em fallback, consulta via browser
   - Atualiza o campo `status`, `ultima_atualizacao` e `historico`
3. Se **houve mudança** desde a última checagem, ou se **passaram >24h** desde o último
   update, envia um resumo pelo Telegram com:
   - Total de pedidos ativos
   - Cada pedido com última posição + data/hora
   - Alerta de prazo se aplicável
4. Se não houve mudança E já houve update recente, **não envia** (silencioso)

## Detecção automática de transportadora

A skill detecta automaticamente a transportadora pelo prefixo do código:

- `AP` → Correios PAC
- `AA` → Correios SEDEX
- `LB` → Correios LOGÍSTICA REVERSA
- `RA` → Correios REGISTRADO
- `ME` → Mercado Livre (envio Mercado Envios)
- Outro → Genérico (URL manual)

## Atualizar status (exemplo)

```bash
# Checagem manual a qualquer momento
bun run Skills/rastreamento/scripts/rastreamento.ts checar --codigo=AP272328771BR
```

### Com API do Seu Rastreio

Se a secret `SEU_RASTREIO_API_KEY` existir, o CLI consulta diretamente a API e mostra:

```
🔍 Consultando AP272328771BR (Correios PAC)…
✅ API Seu Rastreio
📦 Status: ...
📝 Detalhe: ...
📅 Atualização: ...
📍 Local: ...
🎯 Destino: ...
🔗 https://seurastreio.com.br/rastreio/AP272328771BR
```

### Sem API / fallback

Se a API não estiver disponível, cai para:

```
🔍 Consultando AP272328771BR (Correios PAC)…
ℹ️  API indisponível ou chave não configurada.
   Configure SEU_RASTREIO_API_KEY nas secrets para consulta automática sem browser.
🔗 https://rastreamento.correios.com.br/app/index.php?objetos=AP272328771BR
```

Quando o status muda para **"Objeto entregue ao destinatário"**, o pedido é marcado
automaticamente como `entregue: true` e removido da lista ativa (mas continua no histórico).

## API do Seu Rastreio

A skill pode usar a API pública do Seu Rastreio:

- Endpoint: `https://seurastreio.com.br/api/v1/rastreio?codigo=<CODIGO>`
- Autenticação: `Authorization: Bearer <SEU_RASTREIO_API_KEY>`
- Secret no Zo: `SEU_RASTREIO_API_KEY`

Configure a chave para consultas automáticas sem browser e CAPTCHA.

## Backup

O backup diário do workspace (via `Skills/backup-github/scripts/backup.ts`) sincroniza
`pedidos/` para o GitHub. Cada novo pedido/checkpoint fica preservado.

## Mensagens Telegram (template)

```
📦 Atualização de Pedidos — 27/07 14:00

1. AP272328771BR — Tênis Nike
   🟡 Em transferência (Belo Horizonte → Contagem)
   Última atualização: 27/07 17:19
   Previsão: 10/08

2. BR123456789XX — Fone Bluetooth
   ✅ Entregue hoje às 10:42
```

## Notas

- Códigos são normalizados (espaços e case-insensitive)
- Códigos duplicados são rejeitados com mensagem clara
- A skill **não** envia WhatsApp — apenas Telegram (conforme regra de notificações)
- Para desativar a automação temporariamente, usar `list_automations` e `edit_automation active=false`
