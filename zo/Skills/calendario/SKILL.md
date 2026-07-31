---
name: calendario
description: >-
  Cria, consulta e gerencia eventos no Google Calendar de Aleksandro.
  Usa use_app_google_calendar para quick-add de eventos, listagem de
  compromissos e lembretes. Integra notificações nativas do Google
  Calendar (1 dia antes, 1 hora antes, na hora). NUNCA envia
  notificações por WhatsApp para eventos, exceto se Aleksandro pedir
  explicitamente. Use SEMPRE que Aleksandro pedir para agendar, marcar,
  lembrar, criar evento, compromisso, reunião, consulta, exame, prova,
  pagamento ou qualquer coisa com data/hora.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  display-name: 📅 Calendário
  version: "1.0"
  tags: [calendario, agenda, evento, google-calendar, lembrete]
---

# Skill: Calendário

Gerencia eventos no Google Calendar de Aleksandro.

## Quando usar

**SEMPRE** que Aleksandro pedir para:
- Criar, adicionar, marcar ou agendar evento/compromisso/reunião/consulta/exame/prova/pagamento
- Lembrar, anotar ou listar algo com data/hora
- Qualquer coisa relacionada a calendário ou agenda

## Como usar

### Criar evento (quick-add — preferido)

Use `use_app_google_calendar` com `tool_name="google-calendar-quick-add"`:

```json
{
  "text": "Consulta médica amanhã às 14h por 1 hora",
  "calendar_id": "primary"
}
```

### Listar eventos

```json
{
  "tool_name": "google-calendar-list-events",
  "configured_props": {
    "calendar_id": "primary",
    "time_min": "2025-01-01T00:00:00-03:00",
    "max_results": 20
  }
}
```

### Formato de data/hora

Use o timezone de Aleksandro: **America/Sao_Paulo** (-03:00).

Sempre use RFC3339: `YYYY-MM-DDTHH:MM:SS-03:00`

## Notificações

- As notificações são **nativas do Google Calendar**:
  - 1 dia antes (pop-up)
  - 1 hora antes (pop-up)
  - Na hora do evento (pop-up)
- **NUNCA** usar WhatsApp para notificações de evento, exceto se Aleksandro pedir explicitamente.

## Calendário padrão

- calendar_id: `"primary"`
