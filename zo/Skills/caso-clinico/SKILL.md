---
name: caso-clinico
description: Gera casos clínicos fictícios para diagnóstico diferencial e conduta. Jogo educativo onde o usuário recebe um caso e tenta diagnosticar e medicar.
metadata:
  author: aleksandro.zo.computer
  specialty: educação médica, gamificação
---

# 🏥 Caso Clínico — O Jogo de Diagnóstico

Gera casos clínicos fictícios (mas realistas) para você praticar diagnóstico
diferencial, solicitar exames, fechar conduta e prescrever.

## Como jogar

1. Rode o script para sortear um caso clínico aleatório:
   ```bash
   bun run Skills/caso-clinico/scripts/caso-clinico.ts
   ```

2. O caso virá com:
   - **Identificação:** nome, idade, sexo, profissão
   - **História da doença atual (HDA):** sintomas, início, evolução
   - **Antecedentes:** comorbidades, medicações em uso, cirurgias
   - **Exame físico:** sinais vitais e achados relevantes
   - **Exames complementares** (se pedidos no caso)

3. Você faz o diagnóstico e a conduta. Depois eu revelo o **gabarito**.

## Para começar

Só rodar:

```bash
bun run Skills/caso-clinico/scripts/caso-clinico.ts
```

Se quiser um caso de uma área específica, passe como argumento:

```bash
bun run Skills/caso-clinico/scripts/caso-clinico.ts --especialidade cardiologia
```

Especialidades disponíveis: `clinica-medica`, `cardiologia`, `pneumologia`,
`gastroenterologia`, `neurologia`, `infectologia`, `endocrinologia`,
`nefrologia`, `ortopedia`, `pediatria`, `dermatologia`, `psiquiatria`.

Use `--dificuldade facil|medio|dificil` para controlar o nível.

### Comandos úteis

| Comando | Efeito |
|---------|--------|
| `bun run ... --list` | Mostra todas as especialidades disponíveis |
| `bun run ... --random` | Especialidade aleatória (padrão) |
| `bun run ... --modo ironman` | 5 casos seguidos, só passa se acertar todos |

## Regras do jogo

- O diagnóstico pode ser sindrômico, topográfico ou etiológico — quanto mais
  específico, melhor.
- A conduta deve incluir: tratamento, exames complementares, orientações e
  (se couber) encaminhamento.
- Depois da sua resposta, eu revelo o gabarito e dou uma pontuação.
