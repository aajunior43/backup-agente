#!/usr/bin/env bash
# Teste rápido da API AgentRouter (https://agentrouter.org)
# Uso: AR_KEY=sk-... bash Scripts/test-agentrouter.sh [mensagem]
# A key deve vir da variável AR_KEY (adicione como segredo em Settings > Advanced).
set -u
: "${AR_KEY:?Defina AR_KEY com sua chave sk-...}"
MSG="${1:-Hello}"
UA='claude-cli/1.0.0 (external, cli)'

parse_anthropic() {
python3 -c "
import json,sys
d=json.load(sys.stdin)
if 'error' in d: print('ERRO:', d['error'].get('message'))
else:
    t=[b.get('text','') for b in d.get('content',[]) if b.get('type')=='text']
    print(t[0] if t else '(sem bloco de texto — modelo de raciocínio, aumente max_tokens)')"
}
parse_openai() {
python3 -c "import json,sys; d=json.load(sys.stdin); print(d['choices'][0]['message']['content'] if 'choices' in d else 'ERRO: '+str(d.get('error','')))"
}

echo "== claude-opus-4-8 =="
timeout 120 curl -sS https://agentrouter.org/v1/messages \
  -H "x-api-key: $AR_KEY" -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" -H "User-Agent: $UA" \
  -d "{\"model\":\"claude-opus-4-8\",\"max_tokens\":300,\"messages\":[{\"role\":\"user\",\"content\":\"$MSG\"}]}" | parse_anthropic

echo "== claude-opus-5 =="
timeout 180 curl -sS https://agentrouter.org/v1/messages \
  -H "x-api-key: $AR_KEY" -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" -H "User-Agent: $UA" \
  -d "{\"model\":\"claude-opus-5\",\"max_tokens\":2000,\"messages\":[{\"role\":\"user\",\"content\":\"$MSG\"}]}" | parse_anthropic

echo "== gpt-5.6-sol =="
timeout 120 curl -sS https://agentrouter.org/v1/chat/completions \
  -H "Authorization: Bearer $AR_KEY" -H "Content-Type: application/json" -H "User-Agent: $UA" \
  -d "{\"model\":\"gpt-5.6-sol\",\"max_tokens\":300,\"messages\":[{\"role\":\"user\",\"content\":\"$MSG\"}]}" | parse_openai
