#!/usr/bin/env python3
"""
YouTube Monitor Skill para OpenClaw
Verifica canais via RSS e envia notificações via Telegram
"""

import json
import feedparser
import sys
import time
import subprocess
from datetime import datetime, timezone
from pathlib import Path

# Caminhos
WORKSPACE = Path('/home/administrator/.openclaw/workspace')
STATE_FILE = WORKSPACE / 'dados' / 'youtube_channels.json'

# Config
MAX_CONCURRENT = 5  # Máximo de requisições simultâneas

def get_video_id_from_entry(entry):
    """Extrai video ID do entry do feed (lida com diferentes formatos)"""
    # Tenta yt:videoId
    if hasattr(entry, 'yt_videoId'):
        return entry.yt_videoId
    # Tenta id no formato yt:video:XXXXX
    if hasattr(entry, 'id') and entry.id.startswith('yt:video:'):
        return entry.id.replace('yt:video:', '')
    return None

def fetch_latest_video(channel_entry):
    """Usa RSS feed para obter o vídeo mais recente do canal"""
    name = channel_entry.get('name', 'Unknown')
    channel_id = channel_entry.get('channel_id', '')

    if not channel_id:
        return None, f"Sem channel_id para {name}"

    feed_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"

    try:
        feed = feedparser.parse(feed_url)
        if not feed.entries:
            return None, f"Feed vazio para {name}"

        entry = feed.entries[0]
        video_id = get_video_id_from_entry(entry)

        if not video_id:
            return None, f"Não consegui extrair videoId para {name}"

        title = getattr(entry, 'title', 'Sem título')
        return {'id': video_id, 'title': title}, None
    except Exception as e:
        return None, f"Erro {name}: {str(e)[:80]}"

def load_state():
    """Carrega estado dos canais"""
    if STATE_FILE.exists():
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    return {"channels": {}, "last_check": None, "notes": ""}

def save_state(state):
    """Salva estado dos canais"""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2, ensure_ascii=False)

def send_telegram_message(text):
    """Envia mensagem via openclaw message"""
    try:
        result = subprocess.run(
            ['openclaw', 'message', 'send', '--channel', 'telegram', '--target', '942288759', '--message', text],
            capture_output=True, text=True, timeout=30
        )
        return result.returncode == 0
    except Exception:
        return False

def check_channels():
    """Verifica todos os canais por novos vídeos usando RSS"""
    state = load_state()
    channels = state.get('channels', {})
    if not channels:
        print("⚠️ Nenhum canal configurado.")
        return

    channel_list = list(channels.items())
    alerts = []
    errors = []

    for i in range(0, len(channel_list), MAX_CONCURRENT):
        batch = channel_list[i:i+MAX_CONCURRENT]
        batch_results = []

        for key, ch in batch:
            vid, err = fetch_latest_video(ch)
            if err:
                print(f"❌ {ch.get('name', key)}: {err}")
                errors.append(ch.get('name', key))
                batch_results.append((key, ch, None, err))
            else:
                print(f"✅ {ch.get('name', key)}: {vid['id']} — {vid['title'][:60]}")
                batch_results.append((key, ch, vid, None))
            time.sleep(0.3)

        # Comparar com estado fresco
        fresh_state = load_state()
        for key, ch, video, err in batch_results:
            if err:
                continue
            stored = fresh_state['channels'].get(key, {}).get('last_video_id')
            if stored != video['id']:
                print(f"  🆕 NOVO: {video['title'][:60]}")
                alerts.append({'name': ch.get('name', key), 'video': video})
                if key in state['channels']:
                    state['channels'][key]['last_video_id'] = video['id']
            else:
                print(f"  ➖ Sem mudança")

    state['last_check'] = datetime.now(timezone.utc).isoformat()
    save_state(state)

    if alerts:
        send_consolidated_notification(alerts)
        print(f"\n📢 {len(alerts)} vídeo(s) novo(s) detectado(s).")
    else:
        print("\n😴 Nenhum vídeo novo hoje.")

def send_consolidated_notification(alerts):
    """Envia notificação consolidada"""
    if not alerts:
        return

    lines = ["📺 *Novos vídeos detectados*\n"]
    for item in alerts:
        v = item['video']
        lines.append(f"▶️ *{item['name']}*")
        lines.append(f"🎬 {v['title'][:100]}")
        lines.append(f"🔗 https://youtube.com/watch?v={v['id']}")
        lines.append("")

    lines.append("— YouTube Monitor")
    msg = "\n".join(lines)

    if send_telegram_message(msg):
        print(f"✅ Notificação enviada ({len(alerts)} vídeos)")
    else:
        print(f"⚠️ Falha ao enviar via Telegram (continua mesmo assim)")

def list_channels():
    """Lista canais configurados"""
    state = load_state()
    channels = state.get('channels', {})
    print(f"📺 Canais monitorados ({len(channels)}):")
    for key, ch in channels.items():
        print(f" - {ch.get('name', key)}")
        print(f"   ID: {ch.get('channel_id', '')}")
        print(f"   Último vídeo: {ch.get('last_video_id', '')}")
        print(f"   URL: {ch.get('url', '')}")
        print()

def add_channel(channel_input):
    """Adiciona canal (URL, @handle ou channel_id)"""
    print(f"➕ Adicionando canal: {channel_input}")

    # Determinar URL e channel_id
    if '@' in channel_input:
        if 'youtube.com' in channel_input:
            handle = channel_input.split('@')[1].split('/')[0]
        else:
            handle = channel_input.lstrip('@')
        url = f"https://www.youtube.com/@{handle}/videos"
        channel_id = handle  # provisional, will get from feed if possible
    elif channel_input.startswith('UC'):
        channel_id = channel_input
        url = f"https://www.youtube.com/channel/{channel_id}/videos"
    else:
        channel_id = channel_input
        url = channel_input

    # Criar entrada temporária para buscar video
    temp_entry = {'name': channel_input, 'url': url, 'channel_id': channel_id}
    video, err = fetch_latest_video(temp_entry)

    if err:
        print(f"❌ Erro ao buscar canal: {err}")
        print("   Tente adicionar pelo handle @canal ou pelo ID completo UCxxxxx")
        return

    name = video['title'].split(' - ')[0][:50]
    state = load_state()
    key = channel_id
    state['channels'][key] = {
        'name': name,
        'url': url,
        'last_video_id': video['id'],
        'added_at': datetime.utcnow().isoformat() + "Z",
        'channel_id': channel_id
    }
    save_state(state)
    print(f"✅ Canal adicionado: {name}")
    print(f"   Último vídeo: {video['title'][:60]}")

def main():
    if len(sys.argv) < 2:
        print("Uso: youtube_monitor.py [check|list|add <channel>]")
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == 'check':
        check_channels()
    elif cmd == 'list':
        list_channels()
    elif cmd == 'add' and len(sys.argv) >= 3:
        add_channel(sys.argv[2])
    else:
        print("Comando inválido.")
        sys.exit(1)

if __name__ == '__main__':
    main()
