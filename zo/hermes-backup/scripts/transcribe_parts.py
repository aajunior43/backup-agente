#!/usr/bin/env python3
import sys, os, subprocess, glob

os.environ["PYTHONPATH"] = "/home/administrator/.openclaw/workspace/.python-packages:" + os.environ.get("PYTHONPATH", "")

parts_dir = "/tmp/yt_audio_parts"
parts = sorted(glob.glob(os.path.join(parts_dir, "part_*.wav")))
print(f"🎤 Transcrevendo {len(parts)} partes (modelo tiny, 4 threads)...")

full_text = []
for i, part in enumerate(parts):
    print(f"\n🔊 Parte {i+1}/{len(parts)}: {os.path.basename(part)}")
    txt_file = part.replace(".wav", ".txt")
    
    cmd = [
        sys.executable, "-m", "whisper", part,
        "--model", "tiny",
        "--language", "pt",
        "--output_format", "txt",
        "--task", "transcribe",
        "--threads", "4",
        "--fp16", "False"
    ]
    env = os.environ.copy()
    env["PYTHONPATH"] = "/home/administrator/.openclaw/workspace/.python-packages:" + env.get("PYTHONPATH", "")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, env=env, timeout=600)
        if result.returncode != 0:
            print(f"   ⚠️  Erro: {result.stderr[-300:]}")
            continue
        if os.path.exists(txt_file):
            with open(txt_file, "r", encoding="utf-8") as f:
                text = f.read().strip()
            full_text.append(text)
            print(f"   ✅ Concluído ({len(text)} chars)")
        else:
            print(f"   ⚠️  Arquivo não encontrado")
    except subprocess.TimeoutExpired:
        print(f"   ⏱️  Timeout na parte {i+1}")
        continue

if full_text:
    final = "\n\n".join(full_text)
    out_path = "/home/administrator/.openclaw/workspace/data/transcricoes/ratoborrachudo_34bXXBPqUkg_final.txt"
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(final)
    print(f"\n✅ Transcrição completa salva em: {out_path}")
    print(f"📊 Total: {len(final)} caracteres de {len(parts)} partes")
else:
    print("\n❌ Nenhuma parte foi transcrita com sucesso.")
