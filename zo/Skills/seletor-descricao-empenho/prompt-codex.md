# Prompt para Codex — Módulo Seletor de Padrão de Descrição de Empenho

## Contexto

Hoje temos a skill `Skills/descricao-empenho/` que gera descrições de empenho orçamentário no padrão da **Prefeitura de Inajá/PR**. O padrão de Inajá é:

- Começa sempre com `PELA DESPESA EMPENHADA REFERENTE A`
- Toda em caixa alta, sem acentos, pontuação limpa
- Frase única com vírgulas separando elementos e ponto final
- Ordem canônica: objeto, especificações técnicas, finalidade, documento de origem, valor numérico + por extenso, fornecedor e CNPJ
- Formato do valor: `R$ 22.412,14 (VINTE E DOIS MIL, QUATROCENTOS E DOZE REAIS E QUATORZE CENTAVOS)`

O **Padrão de Maringá/PR** (pesquisado em 2026) difere nos seguintes pontos:

- Começa com `Empenhar recursos orçamentários em favor de <FORNECEDOR> (CNPJ <CNPJ>), no valor de R$ <VALOR> (<VALOR POR EXTENSO>), para <OBJETO>`
- Inclui identificação do bem quando aplicável (marca, modelo, chassi, ano, cor, KM)
- Inclui finalidade/motivo
- Inclui documento de origem com número e data
- Não usa caixa alta obrigatoriamente
- Formato mais próximo de linguagem jurídico-administrativa comum em portarias

Exemplo real Maringá:
> Empenhar recursos orçamentários em favor de Inga Veículos Paranavaí (CNPJ 01.994.951/0011-68), no valor de R$ 22.412,14 (vinte e dois mil, quatrocentos e doze reais e quatorze centavos), para execução de serviços de manutenção corretiva e fornecimento de peças de reposição do sistema de embreagem do veículo Mercedes-Benz Atego 2730 K/36 6x4, chassi 9BM951514TB435681, ano fabricação/modelo 2025/2026, cor branca, com KM 701, visando solucionar a dificuldade de engate da caixa de câmbio, conforme Orçamento nº 16376 de 10/06/2026.

---

## Tarefa

Crie um módulo **seletor de padrão de descrição de empenho** que permita gerar descrições seguindo diferentes padrões municipais. O módulo deve ser uma skill TypeScript/Bun em `/home/workspace/Skills/seletor-descricao-empenho/`.

---

## Requisitos funcionais

### 1. Arquitetura baseada em padrões (Strategy Pattern)

Cada padrão municipal é uma classe/estratégia separada que implementa uma interface comum:

```typescript
interface PadraoDescricaoEmpenho {
  nome: string;
  municipio: string;
  uf: string;

  gerar(dados: DadosEmpenho): string;
  validar(dados: DadosEmpenho): string[]; // lista de erros/vazios
}

interface DadosEmpenho {
  objeto: string;
  especificacoes?: string;
  finalidade?: string;
  documentoOrigem: string;
  valor: number;
  fornecedor: string;
  cnpj?: string;
  // campos adicionais livres por padrão
}
```

### 2. Implementar dois padrões iniciais

**Padrão Inajá/PR** — refatorar o código existente de `Skills/descricao-empenho/scripts/descricao-empenho.ts` para dentro de uma classe `PadraoInaja`:

- Prefixo: `PELA DESPESA EMPENHADA REFERENTE A`
- Tudo em caixa alta, sem acentos
- Valor numérico formatado como `R$ X.XXX,XX`
- Valor por extenso entre parênteses: `(VINTE E DOIS MIL REAIS E QUATORZE CENTAVOS)`
- Ordem: objeto, especificações, finalidade, documento, valor+extenso, fornecedor/CNPJ

**Padrão Maringá/PR** — nova classe `PadraoMaringa`:

- Prefixo: `Empenhar recursos orçamentários em favor de`
- Mantém capitalização normal (não força caixa alta)
- Valor no formato `R$ X.XXX,XX (valor por extenso em minúsculas)`
- Ordem: fornecedor + CNPJ, valor, objeto + especificações, finalidade, documento
- Exemplo canônico fornecido acima

### 3. CLI com subcomandos

Criar `scripts/seletor-descricao.ts` com:

```bash
# Gerar com padrão específico
bun run scripts/seletor-descricao.ts gerar --padrao=inaja --objeto="..." --valor=22412.14 ...

# Gerar com padrão específico
bun run scripts/seletor-descricao.ts gerar --padrao=maringa --fornecedor="..." --cnpj="..." ...

# Listar padrões disponíveis
bun run scripts/seletor-descricao.ts listar-padroes

# Validar dados sem gerar
bun run scripts/seletor-descricao.ts validar --padrao=maringa --objeto="..." ...

# Testar exemplos canônicos
bun run scripts/seletor-descricao.ts testar
```

Flags obrigatórios por padrão devem ser validadas. Incluir `--help` e `--json` para saída estruturada.

### 4. SKILL.md

Criar `SKILL.md` com frontmatter:

```yaml
name: seletor-descricao-empenho
description: Gera descrições de empenho orçamentário seguindo padrões municipais configuráveis. Suporta múltiplos padrões (Inajá/PR, Maringá/PR, etc.) através de um seletor. Use quando Aleksandro pedir descrição de empenho, histórico de empenho, ou quando o padrão for diferente de Inajá.
metadata:
  author: aleksandro.zo.computer
```

O corpo do SKILL.md deve explicar:
- Quando usar esta skill vs. `descricao-empenho`
- Como adicionar um novo padrão municipal
- Exemplos de uso para cada padrão
- Referência aos arquivos criados

### 5. Extensibilidade

O módulo deve facilitar adicionar novos padrões sem alterar código existente:

- Criar arquivo `padroes/<nome-municipio>.ts` exportando a classe
- Registrar no índice em `padroes/index.ts`
- CLI automaticamente descobre via índice

Criar ao menos um placeholder para futuro padrão (ex: `padroes/exemplo.ts` comentado).

### 6. Testes

Criar `tests/seletor-descricao.test.ts` com ao menos:

- Teste do padrão Inajá com os exemplos canônicos existentes
- Teste do padrão Maringá com o exemplo real extraído do portal
- Teste de validação de campos obrigatórios ausentes
- Teste de formatação de valores (vírgula decimal, ponto milhar, valor por extenso)

Rodar com `bun test`.

### 7. Documentação

Criar `README.md` com:
- Arquitetura do módulo
- Como adicionar um novo padrão (passo a passo)
- Exemplos de entrada/saída para cada padrão
- Tabela comparativa entre padrões (Inajá vs Maringá)

---

## Restrições técnicas

- TypeScript + Bun, zero dependências externas sempre que possível
- Usar `Intl.NumberFormat` para formatação de moeda
- Para valor por extenso, usar uma implementação própria simples (não instalar pacotes)
- Respeitar a estrutura da skill existente `descricao-empenho`
- Não quebrar compatibilidade com a skill existente (ela deve continuar funcionando)
- CLI deve ter saída colorida com `chalk` (se disponível) ou ANSI escape codes simples

---

## Critérios de aceitação

- [ ] `bun test` passa com todos os testes verdes
- [ ] `bun run scripts/seletor-descricao.ts listar-padroes` mostra pelo menos Inajá e Maringá
- [ ] `bun run scripts/seletor-descricao.ts gerar --padrao=maringa ...` produz exatamente o exemplo canônico de Maringá
- [ ] `bun run scripts/seletor-descricao.ts gerar --padrao=inaja ...` produz exatamente os exemplos canônicos de Inajá
- [ ] `bun run scripts/seletor-descricao.ts testar` valida exemplos canônicos
- [ ] SKILL.md descreve como adicionar novo padrão
- [ ] `Skills/descricao-empenho/` continua funcionando sem alterações
- [ ] README.md documenta a arquitetura e exemplos

---

## Arquivos de referência

- `Skills/descricao-empenho/SKILL.md` — padrão atual e exemplos
- `Skills/descricao-empenho/scripts/descricao-empenho.ts` — implementação atual
- `Prefeitura/descricao-empenho-orcamento-16376.md` — exemplo real e documentação

---

## Observações para o Codex

1. Leia os arquivos de referência antes de escrever qualquer código.
2. Refatore o mínimo necessário: o ideal é que a skill `descricao-empenho` **não seja alterada**, e o novo módulo seja uma camada paralela.
3. Use o `bun` como runtime; não adicione dependências desnecessárias.
4. Priorize clareza e extensibilidade: o objetivo é que novos padrões sejam fáceis de adicionar.
5. O valor por extenso deve ser implementado de forma simples — não precisa cobrir todos os edge cases da língua portuguesa, apenas valores típicos de empenho (até milhões).
