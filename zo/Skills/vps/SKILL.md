---
name: vps
description: Gerencia o VPS de Aleksandro em Campinas via SSH. Use para verificar status, rodar comandos remotos, acompanhar Docker/Traefik/Portainer/Cerebro, aplicar updates, limpar cache e fazer manutenção segura do servidor.
compatibility: Created for Zo Computer
metadata:
  author: aleksandro.zo.computer
  display-name: VPS
  emoji: 🖥️
---

# VPS

## Servidor principal

- Alias SSH: `vps-campinas`
- IP: `187.77.229.134`
- Usuário: `root`
- Sistema visto: Ubuntu 24.04 LTS
- Serviços relevantes: Docker, Traefik, Portainer, Cerebro
- Senha/chaves: nunca salvar dentro desta skill. Usar somente a configuração SSH já existente em `/root/.ssh/`.

## Fluxo padrão

1. Para qualquer pedido de gerenciamento do VPS, comece por um diagnóstico rápido:

```bash
/home/workspace/Skills/vps/scripts/vps.sh status
```

2. Antes de mudanças com risco, como firewall, portas SSH, remoção de containers, volumes, imagens, atualizações grandes ou reinícios, explique o impacto e peça confirmação.

3. Para comandos remotos pontuais:

```bash
/home/workspace/Skills/vps/scripts/vps.sh exec "comando"
```

## Comandos úteis

```bash
/home/workspace/Skills/vps/scripts/vps.sh status       # resumo do servidor
/home/workspace/Skills/vps/scripts/vps.sh docker       # containers, imagens e uso Docker
/home/workspace/Skills/vps/scripts/vps.sh logs traefik # logs de um container
/home/workspace/Skills/vps/scripts/vps.sh updates      # atualizações pendentes
/home/workspace/Skills/vps/scripts/vps.sh security     # checagens básicas de segurança
/home/workspace/Skills/vps/scripts/vps.sh clean-dry    # mostra limpeza Docker possível sem apagar
```

## Cuidados

- Não expor senha, tokens, `.env`, chaves privadas ou conteúdo de arquivos sensíveis.
- Não executar `docker system prune`, `apt upgrade`, reinício de serviços, alteração de firewall ou SSH sem confirmação explícita.
- Se alterar SSH ou firewall, manter uma sessão de teste aberta e validar novo acesso antes de fechar a configuração antiga.
- Preferir leitura/diagnóstico primeiro; ação destrutiva só com autorização.
