#!/usr/bin/env python3
import sys, os, subprocess, tempfile
from datetime import datetime

os.environ["PYTHONPATH"] = "/home/administrator/.openclaw/workspace/.python-packages:" + os.environ.get("PYTHONPATH", "")

AUDIO_PATH = sys.argv[1] if len(sys.argv) > 1 else "/tmp/yt_audio/input.wav"
OUTPUT_DIR = "/tmp/yt_audio_parts"
os.makedirs(OUTPUT_DIR, exist_ok=True)

print(f"🎬 Otimizando áudio para transcrição rápida...")
print(f"🎵 Original: {AUDIO_PATH}")

# 1. Converter para mono, 16kHz, WAV comprimido
optimized = os.path.join(OUTPUT_DIR, "audio_optimized.wav")
print(f"\n🔧 Convertendo para 16kHz mono...")
cmd = [
    "ffmpeg", "-i", AUDIO_PATH,
    "-ac", "1",           # mono
    "-ar", "16000",       # 16kHz
    "-y", optimized
]
subprocess.run(cmd, capture_output=True, check=True)
print(f"✅ Otimizado: {optimized}")

# 2. Obter duração
result = subprocess.run(
    ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", optimized],
    capture_output=True, text=True, check=True
)
duration = float(result.stdout.strip())
print(f"⏱️  Duração: {duration:.1f} segundos ({duration/60:.1f} min)")

# 3. Dividir em partes de 5 minutos (300 segundos)
segment_duration = 300  # 5 min
parts = []
num_parts = int(duration // segment_duration) + 1

print(f"\n✂️  Dividing into {num_parts} parts of {segment_duration}s each...")
for i in range(num_parts):
    start = i * segment_duration
    part_file = os.path.join(OUTPUT_DIR, f"part_{i:03d}.wav")
    cmd = [
        "ffmpeg", "-i", optimized,
        "-ss", str(start),
        "-t", str(segment_duration),
        "-y", part_file
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    parts.append(part_file)
    print(f"   Part {i+1}/{num_parts}: {part_file}")

# 4. Transcrever cada parte (modelo tiny)
print(f"\n🎤 Transcrevendo {num_parts} partes com modelo tiny...")
full_text = []
for i, part in enumerate(parts):
    print(f"   Transcrevendo parte {i+1}/{num_parts}...")
    cmd = [
        sys.executable, "-m", "whisper", part,
        "--model", "tiny",
        "--language", "pt",
        "--output_format", "txt",
        "--task", "transcribe",
        "--fp16", "False"
    ]
    env = os.environ.copy()
    env["PYTHONPATH"] = "/home/administrator/.openclaw/workspace/.python-packages:" + env.get("PYTHONPATH", "")
    
    result = subprocess.run(cmd, capture_output=True, text=True, env=env)
    if result.returncode != 0:
        print(f"   ⚠️  Erro na parte {i+1}: {result.stderr[-200:]}")
        continue
    
    txt_file = part.replace(".wav", ".txt")
    if os.path.exists(txt_file):
        with open(txt_file, "r", encoding="utf-8") as f:
            text = f.read().strip()
        full_text.append(text)
        print(f"   ✅ Parte {i+1} concluída ({len(text)} chars)")
    else:
        print(f"   ⚠️  Arquivo de texto não encontrado")

# 5. Juntar tudo
final_transcription = "\n\n".join(full_text)
print("\n" + "="*60)
print("📝 TRANSCRIÇÃO COMPLETA (dividida em partes):")
print("="*60)
print(final_transcription[:3000] + ("..." if len(final_transcription) > 3000 else ""))
print("="*60)
print(f"Total: {len(final_transcription)} caracteres de {num_parts} partes")

# Salvar
basename = os.path.splitext(os.path.basename(AUDIO_PATH))[0]
output_file = f"/home/administrator/.openclaw/workspace/data/transcricoes/{basename}_fast.txt"
os.makedirs(os.path.dirname(output_file), exist_ok=True)
with open(output_file, "w", encoding="utf-8") as f:
    f.write(final_transcription)
print(f"💾 Salvo em: {output_file}")
