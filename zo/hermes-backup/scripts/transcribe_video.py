#!/usr/bin/env python3
import sys
import subprocess
import os
import json
from datetime import datetime

# Configurar PYTHONPATH para incluir nossas dependências locais
os.environ["PYTHONPATH"] = "/home/administrator/.openclaw/workspace/.python-packages:" + os.environ.get("PYTHONPATH", "")

VIDEO_URL = "https://www.youtube.com/watch?v=34bXXBPqUkg"
AUDIO_DIR = "/tmp/yt_audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

print(f"🎬 Transcrevendo vídeo: {VIDEO_URL}")
print(f"📁 Áudio temporário: {AUDIO_DIR}")

# Baixar áudio com yt-dlp
print("\n⬇️  Baixando áudio...")
cmd_dl = [
    "yt-dlp", "-x", "--audio-format", "wav",
    "-o", os.path.join(AUDIO_DIR, "%(title)s.%(ext)s"),
    VIDEO_URL
]
result = subprocess.run(cmd_dl, capture_output=True, text=True)
if result.returncode != 0:
    print("❌ Erro no download:", result.stderr[-500:])
    sys.exit(1)
print("✅ Áudio baixado")

# Encontrar arquivo WAV
wav_files = [f for f in os.listdir(AUDIO_DIR) if f.endswith(".wav")]
if not wav_files:
    print("❌ Nenhum WAV encontrado")
    sys.exit(1)
audio_path = os.path.join(AUDIO_DIR, wav_files[0])
print(f"🎵 Áudio: {audio_path}")

# Transcrever com Whisper (usando módulo Python)
print("\n🎤 Transcrevendo (modelo base, idioma pt)...")
cmd_whisper = [
    sys.executable, "-m", "whisper", audio_path,
    "--model", "base",
    "--language", "pt",
    "--output_format", "txt",
    "--task", "transcribe"
]
# Configurar PYTHONPATH para o subprocesso
env = os.environ.copy()
env["PYTHONPATH"] = "/home/administrator/.openclaw/workspace/.python-packages:" + env.get("PYTHONPATH", "")

result = subprocess.run(cmd_whisper, capture_output=True, text=True, env=env)
if result.returncode != 0:
    print("❌ Erro na transcrição:", result.stderr[-500:])
    sys.exit(1)
print("✅ Transcrição gerada")

# Ler resultado
txt_path = audio_path.replace(".wav", ".txt")
if not os.path.exists(txt_path):
    print("❌ Arquivo de transcrição não encontrado")
    sys.exit(1)

with open(txt_path, "r", encoding="utf-8") as f:
    transcription = f.read()

print("\n" + "="*60)
print("📝 TRANSCRIÇÃO COMPLETA:")
print("="*60)
print(transcription)
print("="*60)

# Salvar em arquivo para referência
output_file = "/home/administrator/.openclaw/workspace/data/transcricoes/ratoborrachudo_34bXXBPqUkg.txt"
os.makedirs(os.path.dirname(output_file), exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    f.write(transcription)
print(f"\n💾 Transcrição salva em: {output_file}")
