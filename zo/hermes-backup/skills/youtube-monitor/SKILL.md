# YouTube Monitor Skill

Monitora canais do YouTube e envia notificações de novos vídeos via WhatsApp/Telegram.

## Comandos

- `youtube-monitor check` — Verifica novos vídeos em todos os canais cadastrados
- `youtube-monitor list` — Lista canais configurados
- `youtube-monitor add <channel>` — Adiciona canal (handle @ ou ID)

## Estado

Os canais e último vídeo visto são armazenados em `dados/youtube_channels.json`.

## Configuração

Os canais são configurados via comando `add`. Adicione quantos quiser.

## Exemplo

```bash
python3 skills/youtube-monitor/scripts/youtube_monitor.py add @aiprogbr
python3 skills/youtube-monitor/scripts/youtube_monitor.py check
```

## Integração com OpenClaw

A skill envia notificações automaticamente via gateway (WhatsApp/Telegram) quando detecta novos vídeos.
