---
name: sistema-prefeitura
description: Opera o Mural de Tarefas da Prefeitura Municipal de Inajá via servidor MCP (listar, criar, editar, mover, remover tarefas e backups). Use sempre que Aleksandro pedir para mexer no mural/quadro de tarefas da Prefeitura, criar ou concluir tarefas para responsáveis (Luana, Aleksandro etc.), definir prazos/prioridades, ou gerar/enviar backup do sistema.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
---

# Sistema Prefeitura — Mural de Tarefas (MCP)

Opera o Mural de Tarefas da Prefeitura Municipal de Inajá por meio de um servidor MCP.
Use as ferramentas para executar **somente** ações solicitadas e confirmadas pelo usuário.

## Conexão

- Endpoint externo (padrão do script): `http://173.208.155.210:8001/mcp`
- Endpoint local: `http://localhost:8001/mcp` (NÃO responde dentro do sandbox do Zo — o servidor roda na máquina da Prefeitura; use sempre o IP externo)
- O IP externo pode mudar; para trocar, defina `MURAL_MCP_URL`.
- Autenticação: a chave MCP é lida da variável de ambiente `MURAL_MCP_KEY`.
- **Nunca** solicite, revele, registre ou repita o token de acesso em mensagens, tarefas, descrições ou arquivos.

### Configuração da chave (uma vez)

Salve a chave como secret em [Configurações → Avançado](/?t=settings&s=advanced):

- Nome da variável: `MURAL_MCP_KEY`
- Valor: a chave `imcp_x_...` gerada no sistema

Opcional: `MURAL_MCP_URL` para apontar para outro endpoint.

## CLI — `scripts/mural.ts`

Rode com `bun run Skills/sistema-prefeitura/scripts/mural.ts <comando> [opções]`.

| Comando | Descrição |
|---|---|
| `ferramentas` | Lista as ferramentas MCP disponíveis no servidor |
| `listar` | Lista tarefas. Filtros: `--status todo\|doing\|done`, `--responsavel NOME` |
| `criar` | Cria tarefa. `--titulo` (obrig.), `--descricao`, `--responsavel`, `--prioridade baixa\|media\|alta`, `--status todo\|doing\|done`, `--prazo YYYY-MM-DD` |
| `editar` | Atualiza campos. `--id` (obrig.) + só os campos a mudar; `--limpar-descricao`, `--limpar-responsavel`, `--limpar-prazo` enviam `null` |
| `mover` | Muda o estágio. `--id` (obrig.), `--status todo\|doing\|done` |
| `remover` | Exclui permanente. `--id` (obrig.), `--confirmacao REMOVER` |
| `backup` | Cópia local do banco + uploads (só admin) |
| `backup-github` | Cria backup e envia à branch `backups` do repo configurado (só admin) |

Exemplos:

```bash
bun run Skills/sistema-prefeitura/scripts/mural.ts listar
bun run Skills/sistema-prefeitura/scripts/mural.ts listar --status todo
bun run Skills/sistema-prefeitura/scripts/mural.ts criar --titulo "Revisar processo" --responsavel "Luana" --prioridade alta --prazo 2026-08-05
bun run Skills/sistema-prefeitura/scripts/mural.ts mover --id <ID> --status done
bun run Skills/sistema-prefeitura/scripts/mural.ts editar --id <ID> --limpar-prazo
bun run Skills/sistema-prefeitura/scripts/mural.ts remover --id <ID> --confirmacao REMOVER
```

## Regras obrigatórias de operação

1. Antes de editar, mover ou remover, use `listar` para confirmar o ID e evitar agir na tarefa errada.
2. Se houver mais de uma tarefa que corresponda ao pedido, pergunte qual delas deve ser alterada.
3. Confirme com o usuário antes de chamar `remover`. Não trate frases ambíguas como autorização de exclusão.
4. Ao criar, editar ou mover, informe ao usuário o resultado e o estágio final da tarefa.
5. Preserve dados não mencionados pelo usuário. Em `editar`, envie somente os campos que devem mudar.
6. Use prazos exclusivamente no formato `YYYY-MM-DD`. Se a data estiver ambígua, peça esclarecimento.
7. Não invente IDs, responsáveis, prazos ou conteúdo. Quando faltar informação relevante, pergunte.
8. Não use o MCP para dados fora do Mural de Tarefas; ele não substitui outras permissões do sistema.
9. Todas as operações são auditadas com origem `mcp`. Descreva as ações de forma objetiva e profissional.
10. Antes de `backup-github`, confirme que o usuário deseja enviar uma cópia dos dados ao GitHub.

## Ferramentas MCP de referência

- `listar_tarefas` — filtros opcionais `status`, `responsavel`
- `criar_tarefa` — `titulo` (obrig.), `descricao`, `responsavel`, `prioridade`, `status`, `prazo`
- `editar_tarefa` — `id` + campos a mudar; `null` limpa descrição/responsável/prazo
- `mover_tarefa` — `id`, `status`
- `remover_tarefa` — `id`, `confirmacao: "REMOVER"`
- `criar_backup` — somente admin
- `enviar_backup_github` — somente admin, usar só com pedido explícito
