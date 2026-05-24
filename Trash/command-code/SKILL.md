---
name: command-code
description: Executor de comandos e agentes de IA usando a Command Code CLI (cmd). Usa a API key do usuário para rodar modelos como DeepSeek V4 Flash com créditos disponíveis. Ideal para coding assist, execuções rápidas e tarefas que consomem poucos tokens.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
---

# Command Code Skill

Executa comandos via CLI `cmd` da Command Code usando a API key do usuário.

## Configuração

A API key está armazenada em `~/.commandcode/auth.json`:
```json
{"apiKey":"user_2QQDpztERfJjhBfWLFPv1YhCnrYud3E8ReMBSh2ughYev7P7NiWY1PJoBRLbGBqdMLkg2z1QkAUVHESzNLz1KQag","model":"deepseek/deepseek-v4-flash"}
```

## Uso

### Comando básico (prompta o modelo)
```bash
cmd -p "seu prompt aqui" --model deepseek/deepseek-v4-flash
```

### Modelo padrão (DeepSeek V4 Flash)
```bash
cmd -p "seu prompt"
```

### Modelos disponíveis
- `deepseek/deepseek-v4-flash` — rápido e barato (recomendado)
- `deepseek/deepseek-v4-pro` — mais inteligente
- `claude-sonnet-4-6`
- `claude-opus-4-7`
- `gpt-5.3-codex`

### Sessão interativa
```bash
cmd
```

## Scripts

- `scripts/run-prompt.sh` — executa um prompt passando como argumento
- `scripts/run-model.sh` — executa com modelo específico

## Credits

O usuário tem $10 em créditos (4x stretch = $40 em DeepSeek V4 Pro).
Verificar em: https://commandcode.ai/settings/billing