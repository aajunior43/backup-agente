---
name: calendario
description: Cria eventos no Google Calendar do Aleksandro com notificações automáticas em 3 momentos (1 dia antes, 1 hora antes e na hora do evento). Use sempre que Aleksandro pedir para adicionar, criar, marcar, agendar, lembrar, anotar compromisso, reunião, consulta, prova, pagamento, tarefa ou qualquer coisa com data/hora.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
---

## O que faz

Cria eventos no Google Calendar do Aleksandro com **3 notificações automáticas** (nativas do Google Calendar — popup + email, não WhatsApp):

- ⏰ **Na hora do evento** (0 min antes)
- ⏰ **1 hora antes** (60 min antes)
- ⏰ **1 dia antes** (1440 min antes)

## Quando ativar esta skill

Sempre que Aleksandro disser coisas como:

- "Adicione/marque/crie [compromisso] em [data]"
- "Me lembre [data] [hora]"
- "Tenho [reunião/consulta/exame] [dia]"
- "Anote/registre [tarefa] para [data]"

## Como usar (fluxo do agente)

1. **Interpretar** data/hora. Se Aleksandro não disser hora, pergunte rapidamente (ou use dia inteiro).
2. **Criar o evento** com `use_app_google_calendar` (`google_calendar-create-event`).
3. **Confirmar** em pt-BR com a data/hora formatada.

### Parâmetros principais

| Parâmetro | Quando usar |
|-----------|-------------|
| `summary` | Título curto e claro (emoji opcional se combinando) |
| `eventStartDate` | Data+hora início (RFC3339 com offset `-03:00`; ou só `YYYY-MM-DD` se dia inteiro) |
| `eventEndDate` | Data+hora fim (mesmo formato; se dia inteiro, **+1 dia**) |
| `location` | Se Aleksandro mencionar local |
| `description` | Notas, contexto, motivo do lembrete |
| `attendees` | Emails de convidados (opcional) |
| `repeatFrequency` | Se recorrente: `DAILY`, `WEEKLY`, `MONTHLY`... |
| `timeZone` | Sempre `America/Sao_Paulo` |

### Exemplos de uso

```bash
# Reunião amanhã 14h (1h de duração)
eventStartDate: 2026-06-18T14:00:00-03:00
eventEndDate:   2026-06-18T15:00:00-03:00

# Evento dia inteiro (sexta)
eventStartDate: 2026-06-19
eventEndDate:   2026-06-20

# Lembrete rápido 18:30 hoje (5 min)
eventStartDate: 2026-06-17T18:30:00-03:00
eventEndDate:   2026-06-17T18:35:00-03:00

# Curso que se repete toda segunda por 4 semanas
repeatFrequency: WEEKLY
repeatInterval:  1
repeatUntil:     2026-07-13
```

## Como ativar as 3 notificações (setup único)

O Google Calendar precisa estar configurado para disparar as notificações nos 3 momentos. **Fazer UMA vez:**

1. Abrir [calendar.google.com](https://calendar.google.com) → ⚙️ **Configurações**
2. Em "Configurações dos meus calendários" → clicar no **calendário principal**
3. Rolar até **"Notificações de eventos"** (Event notifications)
4. Adicionar/ajustar:
   - **Notificação 1:** `1 dia antes` → popup + email
   - **Notificação 2:** `1 hora antes` → popup + email
   - **Notificação 3:** `Na hora do evento` → popup + email
5. Salvar

Depois disso, todo evento criado herda as 3 notificações automaticamente.

> Se Aleksandro quiser notificações diferentes para um evento específico (ex: lembrete 10 min antes pra consulta de saúde), é só pedir — eu ajusto criando o evento com `reminders` customizado.

## ⚠️ Limitação conhecida: lembretes via integração Pipedream (atualizado em 2026-06-18)

**A integração `use_app_google_calendar` (Pipedream) NÃO permite configurar lembretes.** Comportamento verificado empiricamente:

- `google_calendar-create-event` e `google_calendar-update-event` **ignoram** o campo `reminders` (tanto `useDefault` quanto `overrides`) enviado em `configured_props`. Sempre aplicam um padrão hardcoded: **1 popup de 30 min antes**.
- `update-event` também **sobrescreve** os lembretes existentes ao editar qualquer outro campo — mesmo sem passar `reminders`, ele reescreve para 30 min popup. Portanto, ** editar um evento quebra os 3 lembretes que ele tinha**.
- Só `google_calendar-quick-add-event` cria eventos com `useDefault: true` (herdando os 3 lembretes padrão do calendário). **Porém** o quick-add parseia texto livre e em português/inglês vem interpretando data e título de forma imprevisível (ex.: datas viraram horários aleatórios, sobrou texto no título), além de **não aceitar descrição**.

**Workarounds na prática:**

1. **Para eventos que precisam dos 3 lembretes E descrição/local/data precisa:** criar via `create-event` (descrição e data ficam corretas, mas só 30 min popup). Em seguida, **pedir ao Aleksandro para abrir o evento no Google Calendar e marcar "Usar notificações padrão"** (1 clique) — assim ele herda os 3 lembretes configurados nas Settings do calendário. **Não usar `update-event` depois disso**, pois quebraria os lembretes de novo.
2. **Para eventos simples sem descrição (ex.: "Lembrete: curso amanhã"):** `quick-add-event` herda os 3 lembretes direto, mas revisar sempre a data/título retornados no JSON de resposta — se errar, deletar e refazer com texto diferente.

> Não vale a pena insistir em `update-event`/`create-event` com `reminders` para forçar os 3 lembretes — o campo é descartado silenciosamente. Tentar de novo não resolve; é limitação da action, não erro transitório.

## Outros comandos relacionados

| Pedido do Aleksandro | Ferramenta |
|----------------------|------------|
| "O que tenho [período]?" / "Quais meus eventos?" | `google_calendar-list-events` |
| "Remova/cancele [evento]" | `google_calendar-delete-event` |
| "Mude/adie [evento]" | `google_calendar-update-event` |
| "Adicione [email] no evento [nome]" | `google_calendar-add-attendees-to-event` |
| "Aceitar/recusar [convite]" | `google_calendar-respond-to-event` |

## Conta conectada

- **Email:** `aajunior43@gmail.com`
- **Calendário padrão:** `primary`
- **Fuso horário:** `America/Sao_Paulo` (offset `-03:00`)

## Cidade de referência

Inajá, Paraná (PR) — região Noroeste do Paraná. Considerar feriados nacionais/estaduais se aplicável.
