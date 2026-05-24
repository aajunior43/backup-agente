#!/bin/bash
# Executa um prompt com modelo específico
# Uso: ./run-model.sh "model" "prompt"

MODEL="${1:-}"
PROMPT="${2:-}"

if [ -z "$MODEL" ] || [ -z "$PROMPT" ]; then
  echo "Uso: ./run-model.sh \"model\" \"prompt\""
  echo "Exemplo: ./run-model.sh \"deepseek/deepseek-v4-flash\" \"Hello\""
  exit 1
fi

cmd -p "$PROMPT" --model "$MODEL"