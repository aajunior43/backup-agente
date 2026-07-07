#!/usr/bin/env python3
"""
YouTube Transcriber - OpenClaw Skill
Baixa áudio de vídeo do YouTube e transcreve com Whisper (local)
"""

import sys
import subprocess
import os
import tempfile
import json
from pathlib import Path

# Adicionar ~/.local/bin ao PATH
os.environ["PATH"] = os.path.expanduser("~/.local/bin") + ":" + os.environ.get("PATH", "")

def check_dependencies():
    """Verifica se yt-dlp e whisper estão disponíveis"""
    errors = []
    
    # Verificar yt-dlp
    try:
        subprocess.run(["yt-dlp", "--version"], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        errors.append("yt-dlp não encontrado. Instale: sudo apt install -y yt-dlp")
    
    # Verificar whisper (importando módulo)
    try:
        import whisper  # noqa: F401
    except ImportError:
        errors.append("whisper não instalado. Instale: python3 -m pip install --break-system-packages openai-whisper")
    
    if errors:
        print("❌ Dependências faltando:\n" + "\n".join(errors))
        sys.exit(1)

def download_audio(url, out_dir):
    """Baixa áudio do vídeo usando yt-dlp"""
    print(f"⬇️  Baixando áudio: {url}")
    cmd = [
        "yt-dlp", "-x", "--audio-format", "wav",
        "-o", os.path.join(out_dir, "%(title)s.%(ext)s"),
        url
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ Erro no download: {result.stderr}")
        sys.exit(1)
    
    wav_files = list(Path(out_dir).glob("*.wav"))
    if not wav_files:
        print("❌ Nenhum arquivo WAV gerado")
        sys.exit(1)
    
    return wav_files[0]

def transcribe_audio(audio_path, model_name="base", language="pt"):
    """Transcreve áudio usando Whisper"""
    print(f"🎤 Transcrevendo (modelo: {model_name}, idioma: {language})...")
    import whisper
    
    model = whisper.load_model(model_name)
    result = model.transcribe(str(audio_path), language=language)
    return result["text"]

def main():
    if len(sys.argv) < 2:
        print("Uso: transcribe_youtube.py <URL_DO_YOUTUBE>")
        sys.exit(1)
    
    url = sys.argv[1]
    
    # Verificar dependências
    check_dependencies()
    
    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            # Baixar áudio
            audio_file = download_audio(url, tmpdir)
            print(f"✅ Áudio salvo: {audio_file.name}")
            
            # Transcrever
            transcription = transcribe_audio(audio_file, model_name="base", language="pt")
            
            print("\n" + "="*60)
            print("📝 TRANSCRIÇÃO:")
            print("="*60)
            print(transcription)
            print("="*60)
            
            # Salvar em arquivo
            output_file = Path("/home/administrator/.openclaw/workspace/data") / f"transcricao_{audio_file.stem}.txt"
            output_file.parent.mkdir(parents=True, exist_ok=True)
            output_file.write_text(transcription, encoding="utf-8")
            print(f"\n💾 Transcrição salva em: {output_file}")
            
        except Exception as e:
            print(f"❌ Erro inesperado: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

if __name__ == "__main__":
    main()
