# Obsidian Notes (Inteligente)

 Skill para criar notas no vault Obsidian com classificação automática.

## Como usar

### Comando básico (classificação manual)
```json
{
  "title": "Título da Nota",
  "content": "Conteúdo da nota...",
  "folder": "Geral",     // pasta dentro de ALEKSANDRO/
  "tags": ["tag1", "tag2"]
}
```

### Comando inteligente (classificação automática)
Se você começar o título ou o conteúdo com a palavra **"Nota"**, a skill vai:
1. Analisar o texto
2. Decidir se é **pessoal** (ALEKSANDRO) ou **prefeitura** (PREFEITURA)
3. Sugerir uma subpasta adequada (cria se não existir)
4. Salvar no local correto

Exemplo:
```
Nota: Reunião com Prefeito
Pauta: orçamento 2026, empenhos, licitação hospital...
```
→ Vai automaticamente para `PREFEITURA/Financas/` ou similar.

## Palavras-chave reconhecidas

### PREFEITURA
Prefeitura, Inajá, secretaria, finais, contabilidade, edital, licitação, contrato, TCE, diário oficial, concurso, empenho, RP, prefeito, vereador, câmara, tesouraria, Betah, portal transparência

### ALEKSANDRO (pessoal)
vó cida, mãe, Simone, Jaqueline, saúde, pressão, glicemia, remédio, YouTube, tech, Python, openclaw, obsidian, Linux, script, estudo, projeto, gasto, compra, Nubank, Inter

## Retorno

A skill retorna:
- `status`: created
- `path`: caminho relativo no vault
- `area`: ALEKSANDRO ou PREFEITURA
- `subfolder`: subpasta onde foi salvo
- `message`: mensagem de confirmação

## Configuração

Vault base: `/home/administrator/obsidian/vaults/MeuCofre`

Notas são salvas em:
- `ALEKSANDRO/<subpasta>/` (pessoal)
- `PREFEITURA/<subpasta>/` (trabalho)
