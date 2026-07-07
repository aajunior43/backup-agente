#!/bin/bash
# YouTube Monitor - Execução direta via cron (sem AI model)
# RSS + Telegram API via Python urllib

STATE_FILE="/home/administrator/.openclaw/workspace/dados/youtube_channels.json"

python3 - <<'PYEOF'
import json, feedparser, time, urllib.request, urllib.parse
from datetime import datetime, timezone

STATE_FILE = "/home/administrator/.openclaw/workspace/dados/youtube_channels.json"
TELEGRAM_TOKEN = "8646208153:AAEeX-QzDuxmgQYzCdUZxeQ1o3R-AucAcMg"
TELEGRAM_CHAT_ID = "942288759"

def get_video_id(entry):
    if hasattr(entry, 'yt_videoId'):
        return entry.yt_videoId
    if hasattr(entry, 'id') and 'yt:video:' in entry.id:
        return entry.id.replace('yt:video:', '')
    return None

def fetch_video(channel_id):
    try:
        feed = feedparser.parse(f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}")
        if not feed.entries:
            return None
        entry = feed.entries[0]
        vid = get_video_id(entry)
        if vid:
            return {"id": vid, "title": getattr(entry, 'title', 'Sem título')}
    except:
        pass
    return None

def send_telegram(text):
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        data = urllib.parse.urlencode({
            "chat_id": TELEGRAM_CHAT_ID,
            "text": text,
            "parse_mode": "Markdown"
        }).encode()
        req = urllib.request.Request(url, data=data)
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read()).get("ok", False)
    except Exception as e:
        print(f"ERRO Telegram: {e}")
        return False

print(f"Iniciando check — {datetime.now().strftime('%H:%M:%S BRT')}")

state = json.load(open(STATE_FILE))
channels = state.get("channels", {})

alerts = []
for key, ch in channels.items():
    vid = fetch_video(ch.get("channel_id", key))
    name = ch.get("name", key)
    if vid:
        last = ch.get("last_video_id", "")
        if last != vid["id"]:
            print(f"🆕 {name}: {vid['id']} — {vid['title'][:60]}")
            alerts.append({"name": name, "video": vid})
            ch["last_video_id"] = vid["id"]
        else:
            print(f"➖ {name}: sem mudança")
    else:
        print(f"❌ {name}: erro ao buscar")
    time.sleep(0.3)

state["last_check"] = datetime.now(timezone.utc).isoformat()
json.dump(state, open(STATE_FILE, "w"), indent=2, ensure_ascii=False)
print(f"Canais: {len(channels)} | Novos: {len(alerts)}")

if alerts:
    lines = ["📺 *Novos vídeos detectados*\n"]
    for a in alerts:
        v = a["video"]
        lines.append(f"▶️ *{a['name']}*")
        lines.append(f"🎬 {v['title'][:100]}")
        lines.append(f"🔗 https://youtube.com/watch?v={v['id']}")
        lines.append("")
    lines.append("— YouTube Monitor")
    msg = "\n".join(lines)
    ok = send_telegram(msg)
    print(f"Notificação: {'✅ Enviada' if ok else '❌ Falhou'}")
else:
    print("😴 Nenhum vídeo novo — sem notificação.")
PYEOF
