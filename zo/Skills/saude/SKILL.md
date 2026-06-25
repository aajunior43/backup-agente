---
name: saude
description: Registra e consulta medições de saúde — glicose, pressão arterial (sistólica/diastólica) e pulso. Mantém o arquivo `saude/registro_saude.md` atualizado com histórico cronológico e gera exportação TXT quando solicitado. Use sempre que Aleksandro mencionar medições, saúde, glicose, pressão, pulso, ou pedir para anotar/registrar dados de saúde.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  display-name: ❤️ Registro de Saúde
  version: "1.0"
  tags: [saúde, glicose, pressão, pulso, medições]
---

# ❤️ Skill: Registro de Saúde

## O que faz

Gerencia o registro de medições de saúde do Aleksandro no arquivo `file 'saude/registro_saude.md'`.

## Arquivos

| Arquivo | O que contém |
|---------|-------------|
| `saude/registro_saude.md` | Histórico completo de medições (glicose, pressão, pulso) |
| `saude/registro_saude.txt` | Exportação TXT (cópia simples, sem formatação) |

## Como usar

### Registrar nova medição

Quando Aleksandro disser algo como:
- "Pressão 120/80 pulso 75"
- "Glicose 250"
- "Anota aí: pressão 130/90"

**Fluxo:**

1. **Interpretar os dados:**
   - Pressão: `sistólica/diastólica` (ex: `120/80`)
   - Pulso: `X bpm` (ex: `87 bpm`)
   - Glicose: `X mg/dL` (ex: `250 mg/dL`)
   - Data: usar a data atual (America/Sao_Paulo)
   - Hora: aproximada com base no horário da mensagem
   - Via: "Chat" ou "Telegram" conforme canal usado
   - Observação: se Aleksandro mencionar algo relevante (ansiedade, jejum, etc.)

2. **Ler o arquivo atual** `file 'saude/registro_saude.md'`

3. **Adicionar a nova medição** no topo da seção "## Medições" (mais recente primeiro)

4. **Formato padrão:**
```markdown
### DD/MM/AAAA
- Pressão: XXX/XX mmHg | Pulso: XX bpm
- Glicose: XXX mg/dL
- Hora: ~HH:MM
- Via: Chat/Telegram
- Observação: (opcional)
```

5. **Exportar TXT se pedido**

### Exportar TXT

Quando Aleksandro disser "me dá em txt", "exporta":

```bash
pandoc /home/workspace/saude/registro_saude.md -t plain -o /home/workspace/saude/registro_saude.txt
```

Isso produz um texto limpo (sem `###`, `**`, `-`), legível como TXT de verdade. Se o pandoc não estiver disponível, fallback: `cp /home/workspace/saude/registro_saude.md /home/workspace/saude/registro_saude.txt`.

Informar: "Exportado em `file 'saude/registro_saude.txt'`"

### Consultar medições

Quando Aleksandro perguntar "como está minha pressão/glicose", "histórico":

1. Ler `file 'saude/registro_saude.md'`
2. Apresentar resumo com:
   - Últimas 3-5 medições
   - Média da semana (se houver dados suficientes)
   - Tendências (subiu/desceu/estável)
   - Alertas se algum valor estiver fora do esperado:
     - Glicose > 300: 🔴 Alto
     - Glicose > 250: 🟡 Moderado
     - Pressão sistólica > 140: 🔴 Atenção
     - Pressão diastólica > 90: 🔴 Atenção
     - Pulso > 100: 🟡 Taquicardia leve

## Valores de referência (para contexto)

| Medida | Normal | Pré-alerta | Alerta |
|--------|--------|-----------|--------|
| Glicose (mg/dL) | < 180 | 180-300 | > 300 |
| Pressão sistólica | < 130 | 130-140 | > 140 |
| Pressão diastólica | < 85 | 85-90 | > 90 |
| Pulso (bpm) | 60-100 | — | > 100 |

## Notas importantes

- Sempre adicione no **topo** da lista (mais recente primeiro)
- Mantenha o formato consistente para facilitar leitura
- Hora aproximada é melhor que nenhuma hora
- Se o usuário enviar foto dos monitores, registre o que der para ler
