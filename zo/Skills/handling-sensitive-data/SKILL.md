---
name: handling-sensitive-data
description: How to handle requests to store, process, or use sensitive user data and personally identifiable information (PII). Includes recognizing high-risk data, refusing storage, and communicating privacy risks.
---

# Handling Sensitive Data

## Trigger
User asks to store, process, or share sensitive personal information such as government IDs, financial data, credentials, or other high-risk PII.

## Procedure

### 1. Identify the data type and risk level
- **High risk (REFUSE storage)**: Government IDs (CPF, SSN, passport, driver's license), financial account numbers, credit card numbers, passwords, medical records.
- **Medium risk (use judgment)**: Phone numbers, email addresses, home addresses. Store only if clearly useful and user-initiated.
- **Low risk (safe to store)**: Name, nickname, date of birth, city/state/country, language preference, profession.

### API keys and access tokens

API keys (e.g., `sk-...`, `ghp_...`) and access tokens are **credentials** and therefore high-risk by default.

**However**, when a user **explicitly** shares an API key and requests that you store it for direct API use (e.g., *"salve junto o token"* / *"save the token too"*), respect the user's preference:
- Store the token in memory so future sessions can use it without asking again
- Warn the user **once** about the exposure risk (chat logs may be visible to platform operators)
- Do **not** repeatedly nag about revocation on every subsequent session unless the user asks about security
- Default workflow: read the token from memory first; if missing, fall back to `/opt/data/.hermes/config.yaml`; only ask the user as a last resort

This applies when the user has a clear operational need (GitHub API, OpenAI TTS/Whisper, etc.) and explicitly accepts the trade-off.

### 2. If high-risk PII is offered
- **Do NOT store** in memory or any persistent storage.
- **Do NOT acknowledge receipt** in a way that implies the data was saved or is now in context.
- Politely explain why: this data is sensitive, could enable identity theft or fraud if leaked, and there is no legitimate operational need for the AI to retain government IDs or financial data.
- Offer alternatives: "If you need this for a form later, enter it directly on the official website."
- Continue the conversation normally after the refusal.

### 3. If medium-risk PII is offered
- Store only if clearly useful for the task at hand.
- Default to caution.

### 4. If low-risk demographic data is offered
- Store in user memory with `memory` tool.
- Confirm storage briefly.

## Pitfalls
- Do not treat all volunteered personal data the same. A birth date and a CPF have very different risk profiles.
- Do not lecture the user aggressively. Keep the security warning concise and helpful.
- Do not refuse to store a name or city just because it's "personal information" — those are operationally useful and low-risk.
- **Do not default-refuse API keys on every new session** if the user has previously established a preference for storing and using them directly. Check memory first; if the user already has tokens saved, use them without re-raising the security warning unless the user initiates a security discussion.

## Examples

### Brazilian CPF
User: "CPF 10321505999"
Response: Refuse. Explain CPF is sensitive PII. Do not call `memory`.

### Full name and city
User: "Aleksandro Alves da Rocha Junior" / "Cidade Inajá PR"
Response: Safe to store via `memory` tool. Confirm briefly.
