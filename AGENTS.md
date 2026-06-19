# backup-agente

Repositório central de backup dos agentes de IA que atuam no ecossistema de Aleksandro.

Cada agente (Zo, OpenClaw, Hermes, Odysseu) mantém seus próprios arquivos dentro de sua
pasta designada. O repositório é compartilhado para centralizar backups, mas **cada um
responde apenas pela sua própria pasta**.

---

## Estrutura

```
/
├── AGENTS.md          ← Este arquivo. Instruções para qualquer IA que opere aqui.
├── zo/                ← Zo Computer (workspace principal)
├── openclaw/          ← OpenClaw / Claude Code
├── hermes/            ← Hermes Agent
└── odysseu/           ← Odysseu
```

---

## Regras de convivência entre agentes

### 🟢 Permitido — PODE ler e consultar outras pastas

Agentes podem **ler, buscar texto (grep), listar arquivos e copiar referências** de
qualquer pasta do repositório. Isso é necessário porque:

- Um agente pode precisar de contexto sobre o que outro agente está fazendo
- Um agente pode usar dados ou documentos de outro agente como referência
- A leitura colaborativa melhora a consistência entre agentes

**Exemplos do que é permitido:**
- `Zo` consultar um relatório que `Hermes` gerou
- `OpenClaw` ler um arquivo de configuração do `Zo`
- `Odysseu` copiar um trecho de código da `Skills` do Zo como inspiração
- Fazer `grep` em qualquer pasta do repositório

### 🔴 PROIBIDO — NUNCA escrever, criar, mover, renomear ou apagar fora da sua pasta

1. **Cada agente escreve APENAS na sua pasta designada.** Não crie, edite, mova,
   renomeie ou apague arquivos fora dela — nem que seja "só um ajuste pequeno".
2. **Não crie pastas novas na raiz.** Se um novo agente precisar de uma pasta,
   peça ao usuário para definir.
3. **Não force push** na branch principal (a menos que explicitamente instruído).
4. **Commits com mensagens descritivas** em português, mencionando o que mudou.
5. **AGENTS.md é editado apenas pelo usuário ou por instrução direta dele.**
   Agentes individuais não alteram este arquivo.
6. **Mantenha `.gitignore` na sua pasta** para evitar subir lixo (node_modules/,
   .env, __pycache__/, *.pyc, .parcel-cache, etc.).

---

## Pastas dos agentes

### `zo/` — Zo Computer
Backup completo do workspace `/home/workspace`: Prefeitura/, Skills/, saude/,
financeiro/, projetos/, Images/, etc.
- **Script de backup:** `Skills/backup-github/scripts/backup.ts`
- **Agendamento:** Automations do Zo Computer (diário 00:00)
- **Responsável:** Zo (agente atual)

### `openclaw/` — OpenClaw / Claude Code
Backup dos dados, configurações e estado do OpenClaw.
- **Responsável:** OpenClaw

### `hermes/` — Hermes Agent
Backup dos dados, configurações, skills, documentos e estado do Hermes Agent.
- **Responsável:** Hermes Agent

### `odysseu/` — Odysseu
Backup dos dados, configurações e estado do Odysseu.
- **Responsável:** Odysseu

---

## Resumo rápido

| Ação | Na sua pasta | Na pasta dos outros |
|------|:-----------:|:------------------:|
| Ler / consultar / grep | ✅ Livre | ✅ Permitido |
| Criar arquivos | ✅ Sim | ❌ Não |
| Editar arquivos | ✅ Sim | ❌ Não |
| Mover / renomear | ✅ Sim | ❌ Não |
| Apagar arquivos | ✅ Sim | ❌ Não |
| Criar pastas na raiz | ❌ Só com o usuário | ❌ Só com o usuário |
| Alterar AGENTS.md | ❌ Só com o usuário | ❌ Só com o usuário |
| Force push | ❌ Só se necessário | ❌ Só se necessário |

---

📅 Backup gerenciado pelo ecossistema de agentes de Aleksandro.
Para dúvidas: aajunior43@gmail.com
