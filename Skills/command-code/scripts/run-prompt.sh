#!/bin/bash
# Executa um prompt usando Command Code CLI
# Uso: ./run-prompt.sh "seu prompt aqui"

PROMPT="${1:-}"
if [ -z "$PROMPT" ]; then
  echo "Uso: ./run-prompt.sh \"seu prompt aqui\""
  exit 1
fi

cmd -p "$PROMPT" --model deepseek/deepseek-v4-flash