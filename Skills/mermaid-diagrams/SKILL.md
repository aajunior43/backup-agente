---
name: mermaid-diagrams
description: Cria diagramas profissionais usando a linguagem Mermaid — fluxogramas, diagramas de sequência, classes, estados, ER, Gantt, mindmap, linha do tempo e mais. Use quando o usuário pedir qualquer tipo de diagrama/fluxograma/visualização estrutural, especialmente quando mencionar "mermaid" ou quiser um render em PNG/SVG.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
---
# Mermaid Diagrams Skill

Renderiza diagramas Mermaid para arquivos PNG ou SVG usando `mmdc` (@mermaid-js/mermaid-cli).

## Como usar

1. Escreva o código Mermaid
2. Salve em arquivo `.mmd` (ou passe inline)
3. Use o script `scripts/render-mermaid.ts` para renderizar

### Comando básico

```bash
# A partir de arquivo
bun run Skills/mermaid-diagrams/scripts/render-mermaid.ts diagrama.mmd

# Com opções
bun run Skills/mermaid-diagrams/scripts/render-mermaid.ts diagrama.mmd --output ./saida.png --theme dark --width 1200

# Código inline
bun run Skills/mermaid-diagrams/scripts/render-mermaid.ts "graph TD; A-->B; B-->C" --output ./teste.png
```

### Opções do script

| Opção | Default | Valores |
|-------|---------|---------|
| `--output` | `<nome>.png` | Caminho de saída |
| `--theme` | `default` | `default`, `dark`, `forest`, `neutral` |
| `--format` | `png` | `png`, `svg` |
| `--width` | `800` | Largura em px |
| `--background` | `white` | `white`, `transparent`, `#hex` |
| `--layout` | — | `vertical`, `horizontal` |

## Tipos de diagrama

### Flowchart (Fluxograma)

```mermaid
flowchart TD
    A[Início] --> B{Está válido?}
    B -->|Sim| C[Processar]
    B -->|Não| D[Erro]
    C --> E[Fim]
    D --> E
```

### Sequence Diagram (Sequência)

```mermaid
sequenceDiagram
    participant U as Usuário
    participant S as Servidor
    participant B as Banco

    U->>S: POST /login
    S->>B: SELECT * FROM users
    B-->>S: Dados do usuário
    S-->>U: Token JWT
```

### Class Diagram (Classes)

```mermaid
classDiagram
    class Animal {
      +String nome
      +int idade
      +fazerSom()
    }
    class Cachorro {
      +String raca
      +latir()
    }
    Animal <|-- Cachorro
```

### State Diagram (Estados)

```mermaid
stateDiagram-v2
    [*] --> Pendente
    Pendente --> Processando: Iniciar
    Processando --> Concluído: Sucesso
    Processando --> Erro: Falha
    Concluído --> [*]
    Erro --> Pendente: Retry
```

### ER Diagram (Entidade-Relacionamento)

```mermaid
erDiagram
    USUARIO {
        int id PK
        string nome
        string email
    }
    PEDIDO {
        int id PK
        date data
        decimal total
    }
    USUARIO ||--o{ PEDIDO : faz
```

### Gantt (Cronograma)

```mermaid
gantt
    title Projeto X
    dateFormat  YYYY-MM-DD
    section Planejamento
    Requisitos    :a1, 2025-01-01, 7d
    Design        :a2, after a1, 5d
    section Dev
    Backend       :a3, after a2, 14d
    Frontend      :a4, after a2, 14d
    section Deploy
    Testes        :a5, after a3, 5d
    Publicação    :a6, after a5, 2d
```

### Mindmap

```mermaid
mindmap
  root((Projeto))
    Frontend
      React
      Tailwind
    Backend
      Node
      PostgreSQL
    DevOps
      Docker
      CI/CD
```

### Timeline

```mermaid
timeline
    title História do Projeto
    2024 : Início do desenvolvimento
         : MVP lançado
    2025 : Versão 2.0
         : Migração cloud
    2026 : Expansão nacional
         : 10k usuários
```

### Git Graph

```mermaid
gitGraph
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
```

## Layout Vertical

Para forçar diagramas de fluxo em orientação vertical (de cima para baixo), use `--layout vertical` (ou o atalho `--vertical`):

```bash
bun run Skills/mermaid-diagrams/scripts/render-mermaid.ts diagrama.mmd --layout vertical
```

Isso converte automaticamente `graph LR` → `graph TD` e `flowchart LR` → `flowchart TD` no código-fonte antes de renderizar. Funciona tanto para arquivos `.mmd` quanto para código inline.

```bash
# Código inline com layout vertical
bun run Skills/mermaid-diagrams/scripts/render-mermaid.ts "graph LR; A-->B; B-->C" --layout vertical --output ./fluxo.png
```

## Dicas

1. Use `flowchart` em vez de `graph` — é mais moderno e flexível
2. Para fundo escuro, use `--theme dark`
3. Para documentos/SVG, prefira `--format svg` (escalável)
4. `--background transparent` para PNGs sem fundo
5. Evite diagramas com mais de 40 nós — fica difícil de ler
6. Labels com quebra de linha use `<br/>`: `A[Texto<br/>linha 2]`
7. Unicode funciona normalmente: emojis, acentos, etc.

## Referências

- Docs oficial: https://mermaid.js.org/intro/
- Tutorial: https://mermaid.js.org/syntax/flowchart.html
- Live editor: https://mermaid.live