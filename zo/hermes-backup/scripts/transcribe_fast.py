#!/usr/bin/env python3
import sys, os, subprocess, json
from datetime import datetime

os.environ["PYTHONPATH"] = "/home/administrator/.openclaw/workspace/.python-packages:" + os.environ.get("PYTHONPATH", "")

AUDIO_PATH = sys.argv[1] if len(sys.argv) > 1 else "/tmp/yt_audio/input.wav"
OUTPUT_DIR = os.path.dirname(AUDIO_PATH) or "/tmp/yt_audio"

print(f"🎬 Transcrevendo (modelo TINY, mais rápido)")
print(f"🎵 Áudio: {AUDIO_PATH}")
print(f"📁 Saída: {OUTPUT_DIR}")

cmd = [
    sys.executable, "-m", "whisper", AUDIO_PATH,
    "--model", "tiny",          # modelo menor, muito mais rápido
    "--language", "pt",
    "--output_format", "txt",
    "--task", "transcribe",
    "--threads", "4",           # usar múltiplas threads
    "--fp16", "False"          # CPU sem FP16
]

env = os.environ.copy()
env["PYTHONPATH"] = "/home/administrator/.openclaw/workspace/.python-packages:" + env.get("PYTHONPATH", "")

print(f"⚙️  Executando: {' '.join(cmd)}")
result = subprocess.run(cmd, capture_output=True, text=True, env=env)

if result.returncode != 0:
    print("❌ Erro:")
    print(result.stderr[-1000:])
    sys.exit(1)

print("✅ Transcrição concluída!")

# Ler arquivo gerado
txt_path = AUDIO_PATH.replace(".wav", ".txt")
if not os.path.exists(txt_path):
    print("❌ Arquivo .txt não encontrado")
    sys.exit(1)

with open(txt_path, "r", encoding="utf-8") as f:
    transcription = f.read()

print("\n" + "="*60)
print("📝 TRANSCRIÇÃO (modelo tiny):")
print("="*60)
print(transcription[:2000] + ("..." if len(transcription) > 2000 else ""))
print("="*60)
print(f"Total de caracteres: {len(transcription)}")

# Salvar local
basename = os.path.splitext(os.path.basename(AUDIO_PATH))[0]
output_file = f"/home/administrator/.openclaw/workspace/data/transcricoes/{basename}_tiny.txt"
os.makedirs(os.path.dirname(output_file), exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    f.write(transcription)
print(f"💾 Salvo em: {output_file}")
