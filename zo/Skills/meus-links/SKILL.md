---
name: meus-links
description: Gerencia os links e pastas do Aleksandro no serviço "meus-links" via MCP Streamable HTTP. Use para listar, criar, editar, arquivar, favoritar, fixar, deletar (lixeira ou permanente) e restaurar links, além de criar/renomear/mover/deletar pastas. Acionar sempre que Aleksandro quiser salvar um link, organizar bookmarks, consultar a lista de links, mexer em pastas, ou quando precisar buscar/inserir uma URL recorrente que ele guardou.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
---
## O que faz

Wrapper CLI do MCP **meus-links** (Supabase Edge Function, transporte Streamable HTTP). Expõe 10 tools:

**Links**
- `list_links` — listar (com filtros: pasta, favoritos, arquivados, lixeira, busca textual, limite)
- `create_link` — criar (`title`, `url`, `description?`, `folder_id?`, `is_favorite?`)
- `update_link` — editar (`id` obrigatório; demais campos opcionais)
- `delete_link` — mover pra lixeira (`permanent=true` apaga de vez)
- `restore_link` — restaurar da lixeira

**Pastas**
- `list_folders`
- `create_folder` — `name`, `color?` (blue, red, green, pink...), `icon?`, `parent_id?`
- `update_folder` — `id` + campos
- `delete_folder` — remove a pasta (links nela ficam sem pasta)

## Como usar

1. Carregar credenciais de `/home/workspace/.env` (o script faz isso automaticamente).
2. Executar `python3 Skills/meus-links/scripts/meus-links.py <ação> [args]`.
3. Resultado em JSON por padrão; `--pretty` formata como tabela.

### Comandos

```bash
# Listar
python3 Skills/meus-links/scripts/meus-links.py list-links
python3 Skills/meus-links/scripts/meus-links.py list-links --favorites
python3 Skills/meus-links/scripts/meus-links.py list-links --search "openai" --limit 20
python3 Skills/meus-links/scripts/meus-links.py list-links --folder <folder_id>

# Criar
python3 Skills/meus-links/scripts/meus-links.py create-link \
  --title "Anthropic Console" --url "https://console.anthropic.com" \
  --description "Painel da Anthropic" --folder <folder_id> --favorite

# Editar
python3 Skills/meus-links/scripts/meus-links.py update-link <id> --title "Novo" --pinned

# Lixeira
python3 Skills/meus-links/scripts/meus-links.py delete-link <id>
python3 Skills/meus-links/scripts/meus-links.py delete-link <id> --permanent
python3 Skills/meus-links/scripts/meus-links.py restore-link <id>

# Pastas
python3 Skills/meus-links/scripts/meus-links.py list-folders
python3 Skills/meus-links/scripts/meus-links.py create-folder --name "Pesquisa" --color blue
```

## Configuração

Em `/home/workspace/.env` (`chmod 600`):
- `MEUS_LINKS_TOKEN` (Bearer token)
- `MEUS_LINKS_ENDPOINT` (URL do MCP)
