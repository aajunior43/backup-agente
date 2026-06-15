---
name: whatsapp-api
description: API WhatsApp (Alisson) — envia mensagens de texto, mídia e áudio via WhatsApp usando a API https://api-whatsapp.api-alisson.com.br. Use sempre que o usuário pedir para enviar mensagem, ligar, ou se comunicar com alguém pelo WhatsApp.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
---

## Configuração

| Item | Valor |
|------|-------|
| Base URL | `https://api-whatsapp.api-alisson.com.br/api/v1` |
| Token | `4h8g8JO7vtQbXSvJW61WtdAemw6PaQ5m` |
| UUID Instância | `7481d0ad-26b1-4c86-ba64-2cedfb8b100b` |
| Nome da Instância | `Teste` |
| Número do WhatsApp | `554491722402` |

## Quando usar

Sempre que o usuário pedir para:
- Enviar mensagem para alguém no WhatsApp
- Mandar texto, foto, vídeo, documento ou áudio
- Enviar lembrete, confirmação, orçamento, recado via WhatsApp

## Formato do número

Sempre use `DDI+DDD+NUMERO` sem espaços, traços ou parênteses.
- Exemplo Brasil: `5544991842415`
- Se o usuário fornecer apenas o número local, adicione `55` + DDD.

## Contatos conhecidos

**Caminho: `/home/workspace/contatos/contatos.json`** (raiz do workspace)

Use o script de busca para encontrar números:
```bash
python3 scripts/search-contact.py "mãe"
python3 scripts/search-contact.py --list
```

Se o contato não existir, pergunte ao usuário o número.

## Scripts disponíveis

Todos em `scripts/` — instale deps com `pip install -r scripts/requirements.txt`

### 1. Enviar mensagem (`send-message.py`)

```bash
# Texto direto com número
python3 scripts/send-message.py "5544991842415" "Olá!"

# Usar nome do contato (busca automática)
python3 scripts/send-message.py "mãe" "Oi mãe, tudo bem?"

# Enviar mídia
python3 scripts/send-message.py "5544991842415" "Olha essa foto" --type media --media-url "https://..." --media-type image

# Enviar áudio
python3 scripts/send-message.py "5544991842415" "" --type audio --media-url "https://..."
```

### 2. Buscar contato (`search-contact.py`)

```bash
python3 scripts/search-contact.py "mãe"
python3 scripts/search-contact.py --list
```

### 3. Verificar status (`check-status.py`)

```bash
python3 scripts/check-status.py
```

Sempre cheque o status antes de enviar se houver dúvidas sobre a conexão.

## Endpoints diretos (curl)

### Enviar texto
```bash
curl -s -X POST "https://api-whatsapp.api-alisson.com.br/api/v1/message/send-text?token=4h8g8JO7vtQbXSvJW61WtdAemw6PaQ5m" \
  -H "Content-Type: application/json" \
  -d '{"uuid":"7481d0ad-26b1-4c86-ba64-2cedfb8b100b","number":"NUMERO","content":"MENSAGEM"}'
```

### Enviar mídia
```bash
curl -s -X POST "https://api-whatsapp.api-alisson.com.br/api/v1/message/send-media?token=4h8g8JO7vtQbXSvJW61WtdAemw6PaQ5m" \
  -H "Content-Type: application/json" \
  -d '{"uuid":"7481d0ad-26b1-4c86-ba64-2cedfb8b100b","number":"NUMERO","mediatype":"image","mimetype":"image/png","media":"URL_DA_IMAGEM","caption":"Legenda"}'
```
`mediatype`: `image`, `video`, `document`, `audio`

### Enviar áudio
```bash
curl -s -X POST "https://api-whatsapp.api-alisson.com.br/api/v1/message/send-audio?token=4h8g8JO7vtQbXSvJW61WtdAemw6PaQ5m" \
  -H "Content-Type: application/json" \
  -d '{"uuid":"7481d0ad-26b1-4c86-ba64-2cedfb8b100b","number":"NUMERO","audio":"URL_DO_AUDIO"}'
```

### Listar instâncias (status)
```bash
curl -s "https://api-whatsapp.api-alisson.com.br/api/v1/instance/list?token=4h8g8JO7vtQbXSvJW61WtdAemw6PaQ5m"
```

## Regras de uso

1. **Regra do Aleksandro**: Sempre que enviar mensagem para números que NÃO sejam do Aleksandro (5544991842415), identifique-se como "assistente do Aleksandro", nunca finja ser ele.
2. Use markdown do WhatsApp: `*negrito*`, `_itálico_`, `~riscado~`, ```monospace```.
3. Quebras de linha: use `\n` no conteúdo.
4. Sempre confirme ao usuário após o envio (sucesso ou erro).

## Log de mensagens

Todos os envios via script são registrados automaticamente em:
`/home/workspace/Skills/whatsapp-api/logs/messages.log`

Formato: uma linha JSON por mensagem com timestamp, número, tipo, conteúdo e status.

## Status da instância

- `open` — 🟢 Conectada e pronta
- `qr_code` — 🟡 Aguardando QR code (usuário precisa escanear)
- `close` — 🔴 Desconectada
