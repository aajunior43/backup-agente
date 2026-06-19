# Checklist de Validação do e-CNPJ A3 — Prefeitura Municipal de Inajá/PR

**Finalidade:** garantir que o certificado digital esteja plenamente funcional, instalado, com drivers atualizados e válido em todos os sistemas que você precisa acessar.

---

## Bloco 1 — Validação física e de validade

- [ ] **Certificado A3** (token USB ou cartão smartcard) está físicamente em mãos
- [ ] **Senha de uso** do certificado está disponível (4 a 8 dígitos) e foi testada
- [ ] **Senha de revogação/PUK** (caso A3 com cartão) está anotada em local seguro
- [ ] **Validade do certificado** — conferir data de expiração (acesso: [iti.gov.br](https://www.iti.gov.br/validar-certificado) → "Validar Certificado")
- [ ] **Certificado NÃO está revogado** — checar na lista de certificados revogados (LCR/CRL) da Autoridade Certificadora emissora
- [ ] **Tipo de certificado** — confirmar se é e-CNPJ A3 (entidade) ou e-CPF A3 com vinculação (ver campo "Subject Alternative Name" e "CNPJ")
- [ ] **AC emissora** — identificar (Serpro, Certisign, Valid, Soluti, OAB, etc.) para suporte técnico
- [ ] **Cadeia ICP-Brasil** — emitir trace de certificação e validar cadeia: AC Raiz → AC emissora → seu certificado (válido sem erro de path)

---

## Bloco 2 — Drivers e ambiente

- [ ] **Driver do dispositivo** instalado (SafeNet Authentication Client, Gemalto IDGo, Watchdata, OBERthur, etc.)
- [ ] **Driver do leitora** (se for cartão) instalado e visível no Gerenciador de Dispositivos
- [ ] **Navegador** — Google Chrome 120+ ou Microsoft Edge 120+ (Firefox requer ajustes manuais)
- [ ] **Java** — OpenJDK 17 ou 21 instalado e atualizado (alguns sistemas do SICONFI e Compras.gov exigem)
- [ ] **.NET Framework** 4.8+ instalado (Windows) — exigido pelo Compras.gov e TransferênciaGov
- [ ] **Sistema operacional** — Windows 10/11 ou Linux com pkcs11-tool; macOS tem suporte limitado
- [ ] **Antivírus** — adicionar exceção para o driver do certificado (alguns bloqueiam)
- [ ] **Hora do sistema** — sincronizada com [ntp.br](https://ntp.br) (desvios de >5 min causam rejeição)
- [ ] **Firewall** — libera portas 80, 443 e 8443 (alguns sistemas usam ICPEdu)

---

## Bloco 3 — Configuração de aplicações de teste

- [ ] **Assinador ICP-Brasil** — testar com [assinador.iti.br](https://assinador.iti.br) (assinatura de PDF de teste)
- [ ] **Validar no portal Gov.br** — [acesso.gov.br](https://acesso.gov.br) → login com certificado digital
- [ ] **Validar no e-CAC da RFB** — [cav.receita.fazenda.gov.br](https://cav.receita.fazenda.gov.br) → "Login com Certificado Digital"
- [ ] **Validar no SICONFI** — [siconfi.tesouro.gov.br](https://siconfi.tesouro.gov.br) → área restrita com A3
- [ ] **Validar no Compras.gov** — [compras.gov.br](https://www.gov.br/compras) → "Entrar com Certificado"
- [ ] **Validar no PNCP** — [pncp.gov.br](https://pncp.gov.br) → área de publicação
- [ ] **Validar no TransferênciaGov** — [transferenciagov.br](https://www.gov.br/transferenciagov) → login com A3
- [ ] **Validar no TCE-PR** — [tce.pr.gov.br](https://www.tce.pr.gov.br) → "Acesso de Jurisdicionado"
- [ ] **Validar no eSocial** — [esocial.gov.br](https://www.esocial.gov.br) → perfil governo
- [ ] **Validar na SEFAZ-PR** — [receita.pr.gov.br](https://www.receita.pr.gov.br) → área restrita

---

## Bloco 4 — Procurações e habilitações

- [ ] **Procuração eletrônica no e-CAC** (se o A3 for e-CPF com vinculação): outorgada pelo representante legal da Prefeitura para os usuários que usarão o certificado
- [ ] **Perfil de Secretário de Finanças** cadastrado no SIM-AM (solicitar ao TCE-PR via [email/telefone])
- [ ] **Perfil de Contador/Responsável Técnico** cadastrado no SICONFI (solicitar à STN via Atendimento)
- [ ] **Interlocutor do município** cadastrado no SIM-AM — pessoa designada como ponto focal
- [ ] **Representante legal** do CNPJ identificado e cadastrado no eSocial (S-1000) e na SEFAZ-PR

---

## Bloco 5 — Plano de contingência

- [ ] **Backup do A3** — não é possível (certificado não pode ser copiado); **o titular precisa ter 2º A3** (recomendado) ou A1 (.pfx) para contingência
- [ ] **Certificado A1 (.pfx)** — considerar emitir um A1 adicional com mesma chave pública, como contingência
- [ ] **Leitora/token reserva** — ter 1 leitora reserva ou 2 tokens registrados
- [ ] **Procedimento de revogação** — saber como revogar imediatamente em caso de perda (no portal da AC)
- [ ] **Renovação com 30 dias de antecedência** — agendar no Google Calendar: "Renovar A3 — Prefeitura de Inajá"
- [ ] **Contato de suporte** da AC emissora anotado (telefone, e-mail, chat)
- [ ] **Documentação do CNPJ** (Cartão CNPJ, Contrato Social) digitalizada e acessível

---

## Bloco 6 — Teste funcional ponta a ponta

Faça um teste completo simulando a primeira obrigação do mês (ex.: SIM-AM de mai/2026):

1. [ ] Inserir o token/leitora com o A3
2. [ ] Abrir Chrome e acessar [tce.pr.gov.br](https://www.tce.pr.gov.br)
3. [ ] Selecionar "Acesso de Jurisdicionado" → "Certificado Digital"
4. [ ] Selecionar o certificado do CNPJ 76.970.318/0001-67
5. [ ] Digitar a senha do A3
6. [ ] Verificar se o SIM-AM abre sem erros
7. [ ] Verificar se as abas (Receita, Despesa, Folha, Licitação) carregam
8. [ ] Tentar baixar um XML/protocolo de meses anteriores para confirmar leitura
9. [ ] Fechar sessão e logout seguro

**Repetir o mesmo fluxo** para SICONFI, eSocial, Compras.gov, TransferênciaGov e PNCP.

---

## Bloco 7 — Renovação e ciclo de vida

| Marco | Quando | Ação |
|-------|--------|------|
| **Renovação online** | Até 60 dias antes do vencimento | Acessar portal da AC e renovar (sem custo se dentro do plano) |
| **Renovação presencial** | 30 dias antes | Ir ao posto da AC com documentos |
| **Revogação por perda** | Imediato | Acessar portal da AC, validar identidade, revogar |
| **Troca de dispositivo** | 60 dias antes | Solicitar revogação do A3 atual e emitir novo A3 |
| **Mudança de representante legal** | Imediato | Revogar A3 antigos e emitir novos com novo CNPJ representante |

---

## Sinais de alerta (problemas comuns)

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| "Certificado não encontrado" | Driver não instalado / token não detectado | Reinstalar driver; testar em outra porta USB |
| "Senha inválida" | Bloqueio após 3 tentativas | Aguardar 1 hora ou usar PUK |
| "Certificado expirado" | Validade venceu | Renovar imediatamente na AC |
| "Cadeia de certificação inválida" | AC Raiz não está no repositório do navegador | Atualizar navegador; importar cadeia manualmente |
| "Certificado revogado" | Revogação por perda/sigilo | Emitir novo A3 |
| "Acesso negado" no SICONFI | CNPJ sem perfil de Secretário | Solicitar habilitação à STN via [atendimento] |
| Login solicitado toda vez (sem opção de A3) | Site não homologado para A3 | Usar A1 (.pfx) temporariamente nesse site específico |

---

## Resumo executivo

**Ação imediata (esta semana):**
1. Testar o A3 no [assinador.iti.br](https://assinador.iti.br)
2. Fazer primeiro login no e-CAC, SICONFI e TCE-PR
3. Atualizar drivers, navegador e Java
4. Solicitar habilitação como interlocutor do SIM-AM

**Ação de curto prazo (próximos 30 dias):**
1. Configurar procurações no e-CAC
2. Mapear sistema de contabilidade municipal e suporte
3. Emitir A1 de contingência (recomendação)
4. Agendar renovações no Calendar

**Ação contínua (mensal):**
1. Manter drivers atualizados
2. Testar login em 2-3 sistemas aleatórios para garantir que não houve expiração silenciosa
3. Verificar prazos do calendário `calendario_obrigacoes_inaja_2026.md`

---

**Suporte geral ICP-Brasil:** [iti.gov.br](https://www.iti.gov.br) — 0800-773-7723
**AC Serpro:** 0800-880-1660 · [serpro.gov.br/assinador](https://www.serpro.gov.br/assinador-digital)
**AC Certisign:** 0800-771-2372 · [certisign.com.br](https://www.certisign.com.br)
**AC Valid:** 0800-580-2858 · [validcertificadora.com.br](https://www.validcertificadora.com.br)
**AC Soluti:** 0800-940-2244 · [soluti.com.br](https://www.soluti.com.br)
