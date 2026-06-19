---
name: mermaid-diagrams
description: >
  Cria diagramas profissionais usando a linguagem Mermaid — fluxogramas,
  diagramas de sequência, classes, estados, ER, Gantt, mindmap, linha do
  tempo, gráficos de pizza, quadrant chart e mais. Renderiza para PNG ou SVG.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  display-name: 🧩 Mermaid Diagrams
  version: 2.0
---

# 🧩 Mermaid Diagrams Skill

Renderiza diagramas Mermaid para PNG ou SVG usando `mmdc` (@mermaid-js/mermaid-cli).

## Referência Rápida

```bash
# Arquivo .mmd -> PNG
bun run Skills/mermaid-diagrams/scripts/render-mermaid.ts diagrama.mmd

# Tema escuro
bun run Skills/mermaid-diagrams/scripts/render-mermaid.ts diagrama.mmd --theme dark

# SVG responsivo
bun run Skills/mermaid-diagrams/scripts/render-mermaid.ts diagrama.mmd --format svg

# Código inline
bun run Skills/mermaid-diagrams/scripts/render-mermaid.ts "graph TD; A-->B" --output fluxo.png

# Lote (todos .mmd da pasta)
bun run Skills/mermaid-diagrams/scripts/render-mermaid.ts *.mmd --output-dir ./diagramas

# Fundo transparente
bun run Skills/mermaid-diagrams/scripts/render-mermaid.ts fluxo.mmd --background transparent
```

## Opções do Script

| Opção | Default | Descrição |
|-------|---------|-----------|
| `--output <path>` | `{nome}.{formato}` | Caminho do arquivo de saída |
| `--output-dir <dir>` | — | Diretório de saída (modo batch) |
| `--theme <tema>` | `default` | Tema: `default`, `dark`, `forest`, `neutral`, `base` |
| `--format <fmt>` | `png` | Formato: `png`, `svg` |
| `--width <px>` | `800` | Largura do viewport |
| `--scale <n>` | `2` | Escala HiDPI (2x para retina) |
| `--background <cor>` | `white` | Fundo: `white`, `transparent`, `#hex` |
| `--layout <dir>` | — | Força direção: `vertical` (TD) ou `horizontal` (LR) |
| `--css <arquivo>` | — | Arquivo CSS para customização |
| `--no-responsive` | — | Desativa correção automática de SVG responsivo |

## Tipos de Diagrama

### 🔀 Flowchart (Fluxograma)

```mermaid
flowchart TD
    A[Início] --> B{Está válido?}
    B -->|Sim| C[Processar]
    B -->|Não| D[Erro]
    C --> E[Fim]
    D --> E
```

Substitua `flowchart` por `graph` para compatibilidade básica. Use `flowchart` — é mais moderno e flexível.

### 🧑‍💻 Sequence Diagram (Sequência)

```mermaid
sequenceDiagram
    participant U as Usuário
    participant S as Servidor
    participant B as Banco

    U->>S: POST /login
    S->>B: SELECT * FROM users
    B-->>S: Dados do usuário
    S-->>U: Token JWT
    S-->>B: INSERT log
    Note over U,S: Autenticação em 2s
```

### 🏛️ Class Diagram (Classes)

```mermaid
classDiagram
    class Animal {
      +String nome
      +int idade
      +fazerSom()*
    }
    class Cachorro {
      +String raca
      +latir()
    }
    class Gato {
      +String cor
      +miar()
    }
    Animal <|-- Cachorro
    Animal <|-- Gato
```

### 🔄 State Diagram (Estados)

```mermaid
stateDiagram-v2
    [*] --> Pendente
    Pendente --> Processando: Iniciar
    Processando --> Concluído: Sucesso
    Processando --> Erro: Falha
    Concluído --> [*]
    Erro --> Pendente: Retry
    Erro --> Cancelado: Desistir
```

### 🗄️ ER Diagram (Entidade-Relacionamento)

```mermaid
erDiagram
    USUARIO {
        int id PK
        string nome
        string email
        date created_at
    }
    PEDIDO {
        int id PK
        int usuario_id FK
        date data
        decimal total
    }
    ITEM_PEDIDO {
        int id PK
        int pedido_id FK
        string produto
        int qtd
        decimal preco
    }
    USUARIO ||--o{ PEDIDO : faz
    PEDIDO ||--|{ ITEM_PEDIDO : contem
```

### 📅 Gantt (Cronograma)

```mermaid
gantt
    title Projeto Exemplo
    dateFormat  YYYY-MM-DD
    axisFormat  %d/%m
    section Planejamento
    Levantamento requisitos  :a1, 2025-01-01, 7d
    Design                   :a2, after a1, 5d
    section Desenvolvimento
    Backend                  :a3, after a2, 14d
    Frontend                 :a4, after a2, 14d
    section QA
    Testes                   :a5, after a3, 5d
    Homologação              :a6, after a4, 3d
    section Deploy
    Publicação               :a7, after a6, 2d
```

### 🧠 Mindmap

```mermaid
mindmap
  root((Projeto))
    Frontend
      React
      Tailwind
      TypeScript
    Backend
      Node.js
      PostgreSQL
      Redis
    DevOps
      Docker
      CI/CD
      Cloud
```

### ⏳ Timeline (Linha do Tempo)

```mermaid
timeline
    title História do Projeto
    2024 : Início do desenvolvimento
         : MVP lançado
    2025 : Versão 2.0
         : 5 mil usuários
    2026 : Migração cloud
         : 10 mil usuários
         : Expansão internacional
```

### 🌳 Git Graph

```mermaid
gitGraph
    commit id: "init"
    branch develop
    checkout develop
    commit id: "feat: login"
    commit id: "feat: api"
    branch feature/payments
    commit id: "feat: payment"
    checkout develop
    merge feature/payments
    checkout main
    merge develop tag: "v1.0"
    commit id: "hotfix"
```

### 🥧 Pie Chart (Pizza)

```mermaid
pie title Distribuição de Gastos
    "Moradia" : 35
    "Alimentação" : 25
    "Transporte" : 15
    "Saúde" : 10
    "Lazer" : 10
    "Outros" : 5
```

Valores são proporcionais (não precisa somar 100). Útil para budgets, orçamentos e composições.

### 📊 Quadrant Chart

```mermaid
quadrantChart
    title Prioridades do Projeto
    x-axis "Baixo Impacto" --> "Alto Impacto"
    y-axis "Baixa Urgência" --> "Alta Urgência"
    quadrant-1 "Faça agora"
    quadrant-2 "Agende"
    quadrant-3 "Delegue"
    quadrant-4 "Elimine"
    "Corrigir bug crítico": [0.9, 0.9]
    "Melhoria UI": [0.7, 0.4]
    "Documentação": [0.3, 0.3]
    "Feature menor": [0.2, 0.7]
```

### 📈 XY Chart (Gráfico)

```mermaid
xychart-beta
    title "Vendas Mensais"
    x-axis "Mês" ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"]
    y-axis "Vendas (R$)" 0 --> 10000
    bar [5000, 6000, 7500, 8200, 9000, 9500]
    line [4500, 5500, 7000, 7800, 8500, 9200]
```

### 🏗️ Block Diagram (Pacotes)

```mermaid
block-beta
    columns 3
    A["frontend"]:3
    B["components"]:2 C["hooks"]
    D["pages"]:3
    E["api"]:2 F["types"]
    style A fill:#3b82f6,color:#fff
    style D fill:#10b981,color:#fff
```

### 📋 Requirement Diagram

```mermaid
requirementDiagram
    requirement req_autenticacao {
        id: REQ-001
        text: Usuário deve fazer login
        risk: medium
        verifymethod: test
    }
    element sistema_login {
        type: system
    }
    req_autenticacao - contains -> sistema_login
```

## Uso Avançado

### Tema Base Customizado

O tema `base` permite controle fino de cores via variáveis:

```bash
bun run render-mermaid.ts diagrama.mmd --theme base
```

Cores que você pode personalizar (edite o script para ajustar): `background`, `primaryColor`, `secondaryColor`, `lineColor`, `textColor`, `fontSize`.

### CSS Customizado

Crie um arquivo `.css` com estilos adicionais:

```bash
bun run render-mermaid.ts diagrama.mmd --css ./meu-estilo.css
```

### Layout Forçado

Útil para garantir orientação consistente em fluxogramas:

```bash
# Força fluxo de cima pra baixo
bun run render-mermaid.ts diagrama.mmd --layout vertical

# Força fluxo horizontal (esquerda pra direita)
bun run render-mermaid.ts diagrama.mmd --layout horizontal
```

### Renderização em Lote

Processe vários arquivos de uma vez:

```bash
# Todos .mmd da pasta atual
bun run render-mermaid.ts *.mmd --output-dir ./imagens --theme dark

# Com nome específico
bun run render-mermaid.ts fluxo_*.mmd --output-dir ./saida --format svg
```

## Dicas

1. **Prefira `flowchart` a `graph`** — mais moderno, mais flexível
2. **Fundo escuro**: use `--theme dark`
3. **Documentos vetoriais**: use `--format svg` — escalável, editável
4. **Sem fundo**: `--background transparent` para sobrepor em outras imagens
5. **Evite > 40 nós** — fica ilegível. Divida em subdiagramas
6. **Labels com quebra de linha**: `<br/>` — `A[Texto<br/>linha 2]`
7. **Emojis e acentos**: funcionam normalmente 😊
8. **Espaços em nomes**: use aspas — `A["Meu Nó"]`

## Troubleshooting

### "mmdc não encontrado"
O script já detecta isso e sugere a instalação:
```bash
npm install -g @mermaid-js/mermaid-cli
```

### Erro "Font not found" no servidor
O Puppeteer pode precisar de fontes. Instale:
```bash
apt-get install -y fonts-noto-color-emoji fonts-dejavu-core
```

### Diagrama renderiza cortado
Aumente `--width` e `--scale`:
```bash
bun run render-mermaid.ts diagrama.mmd --width 1200 --scale 3
```

### SVG não aparece direito no navegador
O script já aplica correção responsiva automaticamente. Se ainda assim出现问题, desative com `--no-responsive` e ajuste manualmente.

### Saída em lote mostra "Nenhum arquivo"
Verifique se o glob corresponde a arquivos existentes. O shell expande `*.mmd` para arquivos .mmd na pasta atual.

## Referências

- [Documentação oficial Mermaid](https://mermaid.js.org/intro/)
- [Sintaxe de Flowchart](https://mermaid.js.org/syntax/flowchart.html)
- [Sintaxe de Sequence](https://mermaid.js.org/syntax/sequenceDiagram.html)
- [Live Editor](https://mermaid.live)
- [Temas e Estilos](https://mermaid.js.org/syntax/theming.html)
