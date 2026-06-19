# API WhatsApp - Alisson - Documentação Completa

## Configuração

| Item | Valor |
|------|-------|
| Base URL | `https://api-whatsapp.api-alisson.com.br/api/v1` |
| Token | `4h8g8JO7vtQbXSvJW61WtdAemw6PaQ5m` |
| UUID Instância | `7481d0ad-26b1-4c86-ba64-2cedfb8b100b` |
| Nome | `Teste` |
| Número WhatsApp | `554491722402` |
| Portal | `https://clientes.api-alisson.com.br` |

## Autenticação

Token passado como query parameter: `?token=SEU_TOKEN`

Todos os endpoints aceitam `GET` ou `POST` conforme indicado.

---

## Endpoints de Instância

### `GET /instance/list`
Lista todas as instâncias.

```bash
curl "https://api-whatsapp.api-alisson.com.br/api/v1/instance/list?token=TOKEN"
```

**Resposta:**
```json
{
  "status": "success",
  "data": [
    {
      "uuid": "...",
      "name": "Teste",
      "type": "whatsapp",
      "status": "open"
    }
  ]
}
```

### `GET /instance/details`
Detalhes de uma instância. Requer `uuid` como query param.

```bash
curl "https://api-whatsapp.api-alisson.com.br/api/v1/instance/details?token=TOKEN&uuid=UUID"
```

**Resposta:**
```json
{
  "status": "success",
  "data": {
    "uuid": "...",
    "name": "Teste",
    "type": "whatsapp",
    "status": "open",
    "webhook_url": null,
    "self_message_notification": 0,
    "auto_reject_calls": 1,
    "auto_read_messages": 1,
    "whatsapp_number": "554491722402"
  }
}
```

### `POST /instance/create`
Cria nova instância.

```bash
curl -X POST "https://api-whatsapp.api-alisson.com.br/api/v1/instance/create?token=TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"MinhaInstancia"}'
```

**Resposta:**
```json
{
  "status": "success",
  "data": {
    "uuid": "...",
    "name": "MinhaInstancia",
    "auto_reject_calls": 0,
    "auto_read_messages": 0,
    "webhook_url": null,
    "self_message_notification": 0,
    "status": "qr_code",
    "qr_code_base64": "data:image/png;base64,..."
  }
}
```

### `POST /instance/delete`
Deleta uma instância. Requer `uuid` no body.

```bash
curl -X POST "https://api-whatsapp.api-alisson.com.br/api/v1/instance/delete?token=TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uuid":"UUID"}'
```

### `POST /instance/connect`
Reconecta uma instância.

```bash
curl -X POST "https://api-whatsapp.api-alisson.com.br/api/v1/instance/connect?token=TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uuid":"UUID"}'
```

### `POST /instance/disconnect`
Desconecta uma instância.

```bash
curl -X POST "https://api-whatsapp.api-alisson.com.br/api/v1/instance/disconnect?token=TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uuid":"UUID"}'
```

---

## Endpoints de Mensagem

### `POST /message/send-text`
Envia mensagem de texto.

```bash
curl -X POST "https://api-whatsapp.api-alisson.com.br/api/v1/message/send-text?token=TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "UUID",
    "number": "558798810170",
    "content": "Olá, tudo bem?"
  }'
```

**Parâmetros:**
- `uuid` (obrigatório): UUID da instância
- `number` (obrigatório): Número com DDI+DDD (ex: `558798810170`)
- `content` (obrigatório): Texto da mensagem

**Resposta sucesso:**
```json
{
  "status": "success",
  "message": "Mensagem enviada com sucesso!",
  "data": {
    "instance": "UUID",
    "number": "554491722402",
    "message_id": "3EB05FB456F5ACFA4BABA4"
  }
}
```

### `POST /message/send-media`
Envia mídia (imagem, vídeo, documento).

```bash
curl -X POST "https://api-whatsapp.api-alisson.com.br/api/v1/message/send-media?token=TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "UUID",
    "number": "558798810170",
    "mediatype": "image",
    "mimetype": "image/png",
    "media": "URL_DA_IMAGEM",
    "caption": "Legenda opcional"
  }'
```

**mediatype:** `image`, `video`, `document`, `audio`
**media:** URL pública do arquivo ou base64

### `POST /message/send-audio`
Envia áudio.

```bash
curl -X POST "https://api-whatsapp.api-alisson.com.br/api/v1/message/send-audio?token=TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "UUID",
    "number": "558798810170",
    "audio": "URL_DO_AUDIO"
  }'
```

---

## Status da Instância

- `open` — Conectada e pronta para enviar
- `qr_code` — Aguardando escaneamento do QR code
- `close` — Desconectada

---

## Portal de Cliente

URLs úteis no portal `https://clientes.api-alisson.com.br`:
- `/index.php?rp=/store/api-whatsapp-varejo` — Plano varejo
- `/index.php?rp=/store/api-whatsapp-atacado` — Plano atacado
- `/index.php?rp=/knowledgebase/1/Api-Whatsapp` — Documentação
- `/index.php?rp=/announcements/2/Atualizacao-Api-Whatsapp.html` — Anúncios

---

## Script Python para Envio Rápido

```python
import requests

BASE_URL = "https://api-whatsapp.api-alisson.com.br/api/v1"
TOKEN = "4h8g8JO7vtQbXSvJW61WtdAemw6PaQ5m"
UUID = "7481d0ad-26b1-4c86-ba64-2cedfb8b100b"

def send_message(number: str, content: str):
    resp = requests.post(
        f"{BASE_URL}/message/send-text?token={TOKEN}",
        json={"uuid": UUID, "number": number, "content": content}
    )
    return resp.json()

# Exemplo:
# send_message("558798810170", "Olá!")
```

---

## Notas Importantes

1. **Token**: Sempre como query param `?token=...`
2. **Número**: Formato `DDI+DDD+NUMERO` sem espaços, traços ou parênteses (ex: `558798810170`)
3. **UUID**: Necessário em quase todos os endpoints
4. **Método**: `GET` para listagem/detalhes, `POST` para ações
5. **Content-Type**: `application/json` para POSTs com body
