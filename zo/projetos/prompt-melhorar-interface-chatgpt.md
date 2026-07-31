# Prompt: Melhorar Interface Gráfica e Temas do Projeto

> Cole tudo abaixo no ChatGPT, preenchendo os campos entre `[COLCHETES]` com os dados do seu projeto. Quanto mais contexto, melhor o resultado.

---

Você é um **design engineer sênior** — especialista em UI/UX, design systems e front-end, com 10+ anos de experiência transformando interfaces funcionais porém genéricas em produtos visualmente marcantes e agradáveis de usar.

## Meu projeto

- **O que é:** [DESCREVA O PROJETO EM 1–3 FRASES. Ex: página de links estilo linktree para meu catálogo de perfumes]
- **Stack/tecnologia:** [Ex: HTML + CSS + JS puro / React + Tailwind / etc.]
- **Público:** [quem vai usar]
- **Sensação que quero transmitir:** [Ex: sofisticado, acolhedor, técnico, divertido...]
- **Referências visuais que gosto (opcional):** [sites, apps, estilos]

## Código atual

```
[COLE AQUI O CÓDIGO HTML/CSS/JS OU COMPONENTES DO PROJETO]
```

*(Se o projeto for grande, cole primeiro a estrutura principal e diga: "vou enviar as outras partes em seguida".)*

## Sua missão — em 4 etapas

### Etapa 1 — Auditoria rápida
Antes de mudar qualquer coisa, aponte:
- Os 5 maiores problemas visuais da interface atual (hierarquia fraca, contraste ruim, tipografia inconsistente, espaçamento irregular, falta de feedback visual etc.), com a linha/trecho exato.
- O que JÁ está bom e deve ser preservado.

### Etapa 2 — Sistema de design
Defina e me entregue como tabela + variáveis CSS:
- **Paleta de cores** (primária, secundária, neutros, estados: hover/focus/success/error), com códigos hex e verificação de contraste WCAG AA entre texto e fundo.
- **Tipografia:** um par de fontes com personalidade (display + corpo) do Google Fonts, com pesos, tamanhos e alturas de linha para cada nível de texto.
- **Escala de espaçamento, raios de borda e sombras** consistentes.
- Tudo como tokens/variáveis (`--cor-primaria`, `--fonte-display` etc.) para facilitar temas.

### Etapa 3 — Temas
Crie **3 variações de tema** usando os mesmos tokens:
1. **Claro** (padrão)
2. **Escuro** (não apenas "inverter cores" — ajuste brilhos e sature menos os acentos)
3. **Um terceiro tema com personalidade** coerente com a sensação que pedi

Inclua o código do seletor de tema (botão ou toggle) com persistência em `localStorage` e respeito à preferência do sistema (`prefers-color-scheme`).

### Etapa 4 — Polimento e vida
Aplique no código:
- **Microinterações:** hover, focus visível, transições suaves (150–300ms), estados ativos de botões.
- **Movimento com propósito:** entrada sutil de seções ao rolar (scroll reveal), sem exagerar.
- **Hierarquia tipográfica forte:** contraste claro entre títulos grandes e texto de apoio.
- **Responsividade:** funcione bem de 360px a 1440px; mobile primeiro.
- **Acessibilidade:** contraste AA, foco por teclado, `aria-label` onde precisar, sem depender só de cor para comunicar estado.

## Regras obrigatórias

1. **Não mude funcionalidades nem lógica** — só interface. Se precisar tocar no JS, explique o porquê.
2. **Nada de visual genérico de template:** evite gradientes roxo/rosa em títulos, Inter como fonte única, cards idênticos lado a lado, glassmorphism em tudo, cantos arredondados padrão em todo elemento. Quero escolhas com intenção.
3. Entregue o **código completo e funcional**, pronto para copiar e colar — não trechos soltos.
4. Ao final, liste um resumo **"o que mudei e por quê"** em tópicos curtos.
5. Se faltar informação para decidir algo, tome a decisão e justifique — não me interrompa com perguntas triviais.

## Formato da resposta

1. Auditoria (tópicos curtos)
2. Tabela do sistema de design
3. Código completo atualizado (blocos separados por arquivo: HTML / CSS / JS)
4. Explicação dos 3 temas
5. Resumo das mudanças

Pode começar.

---

## Dicas de uso

- **Quer iterar:** depois da resposta, peça ajustes pontuais: *"deixe o tema escuro mais quente"* ou *"a tipografia ficou pequena no mobile, corrija"*.
- **Quer uma variação:** *"gere uma versão alternativa da paleta mantendo a mesma estrutura"*.
- **Projeto grande:** envie por partes (cabeçalho, corpo, rodapé) pedindo para manter os mesmos tokens.
