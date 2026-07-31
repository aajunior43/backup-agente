# Prompt para Codex — Seletor de descrição de empenho no padrão de São Paulo/SP

## Contexto

Criar um módulo seletor/gerador de descrição de empenho orçamentário baseado no padrão observado nos empenhos da Prefeitura de São Paulo/SP publicados em 2026, conforme Decreto nº 64.904/2026 e regras do SIAFEM/SP.

## Padrão de referência — São Paulo/SP

Com base nas edições do Diário Oficial de São Paulo/SP (2026), os empenhos seguem estrutura formal com os elementos abaixo, **não necessariamente em caixa alta**:

- NOTA DE EMPENHO N.º XXXX/ANO
- PROCESSO LICITATÓRIO N.º XXXX/ANO
- PREGÃO Nº XX/ANO
- ATA DE REGISTRO DE PREÇOS Nº XX/ANO
- FAVORECIDO: <razão social>
- OBJETO: <descrição do objeto>
- VALOR TOTAL: R$ X,XX
- DATA: DD/MM/ANO
- PRAZO DE VIGÊNCIA: DATA INICIAL à DATA FINAL
- ORDENADOR DE DESPESA: <nome>
- DOTAÇÃO ORÇAMENTÁRIA: <código>

Observação: a descrição do objeto costuma ser objetiva, mas pode incluir finalidade, unidade responsável e destino do bem/serviço, sem cair em linguagem excessivamente burocrática nem em caixa alta contínua.

## Tarefa

Criar um **seletor modular de descrição de empenho** que:

1. Tenha blocos/templates reutilizáveis para:
   - Aquisição de material/equipamento
   - Serviço contínuo/eventual
   - Obras e reformas
   - Registro de preços/ATA
   - Dispensa/Inexigibilidade

2. Permita ao usuário preencher campos estruturados e gere automaticamente a descrição final no formato oficial de São Paulo/SP.

3. Gere também o campo `OBJETO:` em texto corrido, com linguagem limpa, sem caixa alta forçada, sem acentos, mas mantendo termos técnicos quando couber.

4. Opcionalmente inclua cabeçalho metadados no estilo do Diário Oficial de São Paulo/SP:
   - Nota de Empenho
   - Processo
   - Modalidade/Pregão
   - Ata
   - Favorecido
   - Valor total
   - Data
   - Prazo
   - Ordenador
   - Dotação orçamentária

5. Salve o resultado em Markdown e, se o usuário pedir, gere PDF para anexo de processo.

## Regras de saída

- Texto do objeto em texto corrido natural, sem letras maiúsculas contínuas.
- Números mantidos no formato brasileiro quando couber.
- Se faltar dado, marcar como `<preencher>` em vez de inventar.
- Não misturar o estilo de Maringá/PR com o de São Paulo/SP; o módulo deve seguir explicitamente o padrão de São Paulo/SP.

## Entregável

Código-fonte do módulo, com exemplo de uso, em arquivo único ou estrutura mínima. Pode ser TypeScript/Bun ou Python, conforme melhor se encaixar no ecossistema atual do usuário.
