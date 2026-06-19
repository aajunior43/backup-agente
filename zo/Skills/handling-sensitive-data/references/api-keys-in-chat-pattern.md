# API Keys Shared in Chat — Response Pattern

## Context
User shares API keys (GitHub PAT, OpenAI key, etc.) directly in chat message.

## Session Example (2026-05-09)
User shared **two** API keys in the same session:
1. GitHub PAT: `REDACTED_GITHUB_PAT`
2. OpenAI API key: `REDACTED_OPENAI_KEY`

## Response Protocol

### Step 1: Immediate Security Warning (once per key)
Alert the user that the key was exposed in plaintext chat. Format:
```
⚠️ ALERTA DE SEGURANÇA! Você acabou de compartilhar um [token/API key] em texto aberto.
[Token é sensível...]

Ação imediata necessária:
1. Revogue este token AGORA em: [URL]
2. Gere um novo token
3. Nunca o compartilhe em chat novamente
```

### Step 2: Store if User Explicitly Requests
If user says "Não vou recogar" (I won't revoke) + "Salve junto o token" (save the token too):
- Store in memory with `memory` tool
- Configure in relevant config file if applicable
- Do NOT nag again in future sessions
- Use the stored token directly when needed

### Step 3: Future Sessions
- Check memory first for stored tokens
- Use them without re-raising security warnings
- Only warn again if user initiates a security discussion
- Default: direct API usage via curl with stored token

## Key Insight
Some users explicitly accept the risk and prefer convenience over repeated token rotation. Respect the preference after the initial warning. Do not treat this as a security failure on every subsequent session.
