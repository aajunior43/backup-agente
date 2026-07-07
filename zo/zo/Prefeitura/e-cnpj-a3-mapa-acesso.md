# Mapa de Acesso — e-CNPJ A3 · Prefeitura de Inajá/PR

**CNPJ:** 76.970.318/0001-67
**Código IBGE:** 4110300
**UASG (Câmara):** 980077
**População:** 2.536 habitantes (Censo 2022) — município de pequeno porte
**Esfera de governo:** Municipal
**Tipo de certificado:** e-CNPJ A3 (token ou smartcard — padrão ICP-Brasil)

---

## 1. Como funciona o e-CNPJ A3

O e-CNPJ A3 é um **certificado digital ICP-Brasil** emitido por Autoridades Certificadoras credenciadas (Serpro, Certisign, Valid, Soluti, etc.) que identifica o CNPJ da Prefeitura de Inajá em sistemas públicos federais, estaduais e de tribunais. Ele **não dá acesso a tudo automaticamente** — cada sistema exige:

1. **Cadastro prévio** do CNPJ do certificado como "usuário habilitado" no sistema (geralmente feito pela primeira vez pelo próprio CNPJ em login inicial, ou pelo administrador do sistema).
2. **Vínculo de perfil/role** específico dentro do sistema (Contador, Secretário, Operador, Gestor, etc.).
3. **Conectividade** com a AC (Autoridade Certificadora) para validação da cadeia de confiança.

A primeira ação, ao receber o A3, deve ser validar o certificado e fazer o primeiro login em cada sistema abaixo para que o CNPJ fique "memorizado" e os perfis sejam atribuídos.

---

## 2. Sistemas que você acessa com o e-CNPJ A3

### 2.1 TRIBUNAIS DE CONTAS E CONTROLE EXTERNO

| Sistema | Órgão | Finalidade | URL | Status sugerido | Próxima obrigação |
|---------|-------|------------|-----|----------------|-------------------|
| **SIM-AM** (Sistema de Informações Municipais — Acompanhamento Mensal) | TCE-PR | Envio mensal de dados orçamentários, contábeis, patrimoniais, licitações, contratos, atos de pessoal, obras, fontes de recursos | [tce.pr.gov.br](https://www.tce.pr.gov.br) | A habilitar | 30/06/2026 — Fechamento mai/2026 |
| **SIAP-FP** (Folha de Pagamento) | TCE-PR | Envio mensal de folha de pagamento, atos de pessoal | [tce.pr.gov.br](https://www.tce.pr.gov.br) | A habilitar | 22/06/2026 — Fechamento mai/2026 |
| **Mural das Licitações** | TCE-PR | Publicação mensal dos procedimentos licitatórios | [tce.pr.gov.br](https://www.tce.pr.gov.br) | A habilitar | 08/06/2026 — Encerramento mural mai/2026 |
| **PCA — Prestação de Contas Anual** | TCE-PR | Envio anual da prestação de contas (exercício anterior) | [tce.pr.gov.br](https://www.tce.pr.gov.br) | A habilitar | 31/03/2026 (PCA 2025 — já encerrado) |
| **Agenda de Obrigações (IN 196/2025)** | TCE-PR | Calendário anual de prazos | [tce.pr.gov.br](https://www.tce.pr.gov.br) | Público (não exige login) | — |
| **Portal do Jurisdicionado** | TCE-PR | Consulta de processos, alertas, jurisprudência | [portal.tce.pr.gov.br](https://portal.tce.pr.gov.br) | A habilitar | — |

### 2.2 UNIÃO — TESOURO NACIONAL / SICONFI

| Sistema | Órgão | Finalidade | URL | Status sugerido | Próxima obrigação |
|---------|-------|------------|-----|----------------|-------------------|
| **SICONFI — Matriz de Saldos Contábeis (MSC)** | STN | Envio mensal de saldos contábeis | [siconfi.tesouro.gov.br](https://siconfi.tesouro.gov.br) | A habilitar | Último dia útil do mês subsequente |
| **SICONFI — Declaração de Contas Anuais (DCA)** | STN | Envio anual do balanço (referente ao exercício anterior) | [siconfi.tesouro.gov.br](https://siconfi.tesouro.gov.br) | A habilitar | 30/04/2026 (DCA 2025 — já encerrado) |
| **SICONFI — RREO** | STN | Replicação do Relatório Resumido de Execução Orçamentária | [siconfi.tesouro.gov.br](https://siconfi.tesouro.gov.br) | A habilitar | 30/07/2026 — 3º bimestre |
| **SICONFI — RGF** | STN | Replicação do Relatório de Gestão Fiscal | [siconfi.tesouro.gov.br](https://siconfi.tesouro.gov.br) | A habilitar | 30/07/2026 — 1º semestre |
| **API SICONFI (dados abertos)** | STN | Consulta programática de RREO, RGF, DCA, MSC, extratos | [apidatalake.tesouro.gov.br/docs/siconfi](https://apidatalake.tesouro.gov.br/docs/siconfi/) | Público (sem login) | — |
| **Tesouro Transparente** | STN | Consulta de operações, transferências, dívidas | [tesourotransparente.gov.br](https://www.tesourotransparente.gov.br) | Público (sem login) | — |

### 2.3 UNIÃO — RECEITA FEDERAL / RFB

| Sistema | Órgão | Finalidade | URL | Status sugerido | Próxima obrigação |
|---------|-------|------------|-----|----------------|-------------------|
| **e-CAC** (Centro Virtual de Atendimento) | RFB | Caixa postal fiscal, consulta de débitos, parcelamentos, certidões | [cav.receita.fazenda.gov.br](https://cav.receita.fazenda.gov.br) | A habilitar | — |
| **eSocial** (Portal do Empregador Doméstico e geral) | RFB/Caixa/INSS | Eventos de admissão, desligamento, folha (S-1000 a S-3000) | [esocial.gov.br](https://www.esocial.gov.br) | A habilitar | 15/06/2026 (competência 05/2026) |
| **EFD-Reinf** | RFB | Escrituração Fiscal Digital de Retenções e Informações da Receita Previdenciária | [rfb.gov.br](https://www.gov.br/receitafederal/pt-br) | A habilitar | 15/06/2026 (competência 05/2026) |
| **DCTFWeb** | RFB | Declaração de Débitos e Créditos Tributários Federais | [dctfweb.gov.br](https://dctfweb.gov.br) | A habilitar | 30/06/2026 (competência 05/2026) |
| **ECF / SPED Contábil** | RFB | Escrituração Contábil Fiscal | [sped.rfb.gov.br](https://sped.rfb.gov.br) | A habilitar | Último dia útil de junho (ECF anual) |
| **EFD-ICMS/IPI** | RFB/SEFAZ | Escrituração Fiscal Digital — ICMS/IPI | [sped.rfb.gov.br](https://sped.rfb.gov.br) | A habilitar (apenas se tiver movimentação) | 2º dia útil do 2º mês subsequente |
| **Portal e-CAC — Processos Digitais** | RFB | Acompanhamento de fiscalizações, malhas, e-mails fiscais | [cav.receita.fazenda.gov.br](https://cav.receita.fazenda.gov.br) | A habilitar | — |
| **Certidões (CND/CPEND/Regularidade Fiscal)** | RFB | Emissão de Certidão Negativa de Débitos, CND Federal, etc. | [solucoes.receita.fazenda.gov.br](https://solucoes.receita.fazenda.gov.br) | A habilitar | — |

### 2.4 UNIÃO — COMPRAS / TRANSFERÊNCIAS / CONVÊNIOS

| Sistema | Órgão | Finalidade | URL | Status sugerido | Próxima obrigação |
|---------|-------|------------|-----|----------------|-------------------|
| **PNCP — Portal Nacional de Contratações Públicas** | CGU/Compras.gov | Publicação de editais, atas, contratos | [pncp.gov.br](https://pncp.gov.br) | A habilitar | Prazo de 10 dias úteis após homologação |
| **Compras.gov (antigo ComprasNet)** | Min. Gestão | Licitações eletrônicas (Pregão Eletrônico) | [compras.gov.br](https://www.gov.br/compras) | A habilitar | — |
| **TransferênciaGov.br (antigo +Brasil / SIAFI Operacional)** | Min. Gestão | Convênios, transferências voluntárias, plataformas GPS/FPP, BB, CE | [transferenciagov.br](https://www.gov.br/transferenciagov) | A habilitar | — |
| **Convênios SICONV/SIAFI antigo** | Min. Gestão | Cadastro de convênios | (Incorporado ao TransferênciaGov) | A migrar | — |
| **Painel de Preços** | TCU/Min. Gestão | Consulta de preços referenciais | [paineldeprecos.planejamento.gov.br](https://paineldeprecos.planejamento.gov.br) | Público | — |
| **CADIN — Cadastro de Inadimplentes** | STN | Verificação de inadimplência do município | [contas.cadin.fazenda.gov.br](https://contas.cadin.fazenda.gov.br) | Público | — |

### 2.5 UNIÃO — SAÚDE, EDUCAÇÃO, ASSISTÊNCIA

| Sistema | Órgão | Finalidade | URL | Status sugerido | Próxima obrigação |
|---------|-------|------------|-----|----------------|-------------------|
| **SIOPS** | Min. Saúde | Sistema de Informações sobre Orçamentos Públicos em Saúde | [siops.datasus.gov.br](https://siops.datasus.gov.br) | A habilitar | 30/09/2026 (4º bimestre) |
| **DATASUS — FNS** | Min. Saúde | Fundo Nacional de Saúde, transferências SUS | [portalfns.saude.gov.br](https://portalfns.saude.gov.br) | A habilitar | — |
| **investSUS / SIGES / SISMOB** | Min. Saúde | Investimentos, gestão, monitoramento de obras SUS | [investsus.saude.gov.br](https://investsus.saude.gov.br) | A habilitar | — |
| **SIOPE** | FNDE/MEC | Sistema de Informações sobre Orçamentos Públicos em Educação | [siope.educacao.gov.br](https://siope.educacao.gov.br) | A habilitar | 30/09/2026 (4º bimestre) |
| **FNDE — PDDE / PAR / PNATE / Fundeb** | FNDE | Programas educacionais | [fnde.gov.br](https://www.fnde.gov.br) | A habilitar | — |
| **SUAS — SNA/PRC/IGD** | Min. Assistência | Cadastro SUAS, programas socioassistenciais (BPC, Bolsa Família/PBF) | [aplicacoes.mds.gov.br](https://aplicacoes.mds.gov.br) | A habilitar | — |
| **CADÚnico / CECAD** | Min. Assistência | Cadastro único e consulta de famílias | [aplicacoes.mds.gov.br](https://cadunico.dataprev.gov.br) | A habilitar | — |
| **SAGICAD — Aposentadoria e Pensões RPPS** | Min. Previdência | Gestão de RPPS municipal | (atendimento via Prevcom/IMPAR) | A habilitar | — |

### 2.6 UNIÃO — OUTROS

| Sistema | Órgão | Finalidade | URL | Status sugerido | Próxima obrigação |
|---------|-------|------------|-----|----------------|-------------------|
| **Cadastro de Clientes do Sistema Financeiro Nacional (CCS)** | Bacen | Não se aplica a municípios | — | N/A | — |
| **IBGE — Cidades@ / SIDRA** | IBGE | Pesquisa populacional, PIB, MUNIC, FINBRA | [cidades.ibge.gov.br](https://cidades.ibge.gov.br) | Público (sem login) | — |
| **FINBRA — Finanças do Brasil** | IBGE/STN | Dados fiscais municipais de 2013+ | [finbra.ibge.gov.br](https://finbra.ibge.gov.br) | Público | — |
| **MUNIC — Pesquisa de Informações Básicas Municipais** | IBGE | Anual (não exige A3 para preenchimento) | [ibge.gov.br](https://www.ibge.gov.br) | A habilitar (questionário online) | — |
| **Portal Gov.br — Autenticação Unificada** | gov.br | Login único para centenas de serviços | [gov.br](https://www.gov.br) | A habilitar (Login Único) | — |
| **CIGA — Comunidade Interfederativa Geomais / IEGM** | CIGA/TCE | Indicadores de gestão municipal | [iegm.org.br](https://iegm.org.br) | A habilitar | — |

### 2.7 ESTADUAL — PARANÁ

| Sistema | Órgão | Finalidade | URL | Status sugerido | Próxima obrigação |
|---------|-------|------------|-----|----------------|-------------------|
| **SEFAZ-PR — Receita Estadual** | SEFAZ-PR | GIA, EFD ICMS IPI, NF-e, CNPJ com IE | [receita.pr.gov.br](https://www.receita.pr.gov.br) | A habilitar | — |
| **GIA-PR / SEFAZ** | SEFAZ-PR | Guia de Informação e Apuração do ICMS | [receita.pr.gov.br](https://www.receita.pr.gov.br) | A habilitar | Conforme regime |
| **SINTEGRA / NFA** | SEFAZ-PR | Cadastro de contribuintes e Nota Fiscal Avulsa | [sintegra.fazenda.pr.gov.br](https://sintegra.fazenda.pr.gov.br) | A habilitar | — |
| **NFS-e Padrão Nacional** | Receita Nacional/CONFAZ | Nota Fiscal de Serviços Eletrônica municipal (ADN) | [nfse.gov.br](https://www.nfse.gov.br) | A habilitar | Diário |
| **Convênio 176/2024 (NFS-e Nacional)** | CONFAZ | Integração da NFS-e municipal com ambiente nacional | [nfse.gov.br](https://www.nfse.gov.br) | A verificar | 2026 (cronograma CONFAZ) |
| **SICAR — Cadastro Ambiental Rural** | MAPA/Atenas | CAR dos imóveis rurais (não se aplica diretamente a prefeituras) | [car.gov.br](https://www.car.gov.br) | N/A | — |
| **CAF — Certificação Adoção Faces 2** | Atena/Atenas | CAF dos municípios (ICMS Ecológico, ITR) | [aten.as](https://aten.as) | A verificar | — |
| **TCE-PR — Portal do Jurisdicionado** | TCE-PR | Acompanhamento de alertas, pareceres prévios | [portal.tce.pr.gov.br](https://portal.tce.pr.gov.br) | A habilitar | — |
| **SIT — Sistema Integrado de Transferências** | TCE-PR | Repasses, transferências, convênios | [tce.pr.gov.br](https://www.tce.pr.gov.br) | A habilitar | — |
| **DETRAN-PR / CIRETRAN** | DETRAN-PR | Veículos municipais, condutores | [detran.pr.gov.br](https://www.detran.pr.gov.br) | A habilitar | — |
| **BRT/TCE-PR — Alerta de Prazos** | TCE-PR | Push de notificações | [tce.pr.gov.br](https://www.tce.pr.gov.br) | A habilitar | — |

### 2.8 MUNICIPAL — INAJÁ

| Sistema | Finalidade | URL | Status sugerido | Próxima obrigação |
|---------|------------|-----|----------------|-------------------|
| **Portal da Transparência de Inajá** | Publicação de execução, licitações, folha, contratos | [inaja.pr.gov.br/portal/transparencia](https://www.inaja.pr.gov.br/portal/transparencia) | A auditar | Contínuo |
| **Sistema de Contabilidade (Betha/Contass/IPM/etc.)** | Escrituração contábil, orçamento, tesouraria | (definir com informática) | A confirmar fornecedor | Mensal |
| **Sistema de Tributação Municipal** | IPTU, ISS, ITBI, taxas, dívida ativa | (definir com informática) | A confirmar | IPTU 12/06/2026 |
| **Folha de Pagamento** | SIAP-FP, atos de pessoal | (integrado com o de contabilidade) | A habilitar SIAP-FP | 22/06/2026 |
| **Sistema de Compras/Licitação** | Pregão, tomadas de preço, dispensas | (definir) | A habilitar PNCP | Conforme demanda |
| **Câmara Municipal (Câmara A3 separado)** | CNPJ 01.600.393/0001-37 (entidade separada) | [cminaja.pr.gov.br](https://www.cminaja.pr.gov.br) | A verificar | — |
| **e-SIC Municipal** | Atendimento à Lei de Acesso à Informação | [inaja.pr.gov.br](https://www.inaja.pr.gov.br) | A auditar | Prazo 20 dias |

### 2.9 SEGURO / RPPS / TRABALHISTA

| Sistema | Órgão | Finalidade | URL | Status sugerido | Próxima obrigação |
|---------|-------|------------|-----|----------------|-------------------|
| **INSS — CNIS / GFIP** | INSS | Cadastro de segurados, contribuições RPPS | [meu.inss.gov.br](https://meu.inss.gov.br) | A habilitar | — |
| **CAIXA — FGTS / Conectividade Social** | CAIXA | FGTS, SEFIP, contribuição social | [conectividade.caixa.gov.br](https://conectividade.caixa.gov.br) | A habilitar | Dia 7 (GFIP) |
| **Banco do Brasil — Conectividade Empresarial** | BB | Pagamentos, convênios, GPS | [bb.com.br](https://www.bb.com.br) | A habilitar | — |
| **Secretaria da Previdência — SIPREV / CADPREV** | Min. Previdência | Regime Próprio de Previdência Social, DIPR, DAIR | [cadprev.previdencia.gov.br](https://cadprev.previdencia.gov.br) | A habilitar | DIPR bimestral / DAIR mensal |
| **DIPR** | Min. Previdência | Demonstrativo de Informações Previdenciárias (bimestral) | [cadprev.previdencia.gov.br](https://cadprev.previdencia.gov.br) | A habilitar | 2º dia útil após o 1º mês do bimestre |
| **DAIR** | Min. Previdência | Demonstrativo de Aplicações e Investimentos dos RPPS (mensal) | [cadprev.previdencia.gov.br](https://cadprev.previdencia.gov.br) | A habilitar | Último dia do mês subsequente |

---

## 3. Tabela consolidada de status e prazos

> **Legenda de status:**
> - **✅ Habilitado** — certificado configurado e login testado com sucesso
> - **🟡 A habilitar** — primeiro acesso ainda não realizado ou perfil pendente
> - **⏸️ Em migração** — sistema antigo substituído; em transição
> - **❌ Não se aplica** — sistema irrelevante para o município
> - **Público** — não exige login/A3

| # | Sistema | Esfera | Status | Próximo prazo |
|---|---------|--------|--------|---------------|
| 1 | SIM-AM | TCE-PR | 🟡 A habilitar | 30/06/2026 |
| 2 | SIAP-FP | TCE-PR | 🟡 A habilitar | 22/06/2026 |
| 3 | Mural das Licitações | TCE-PR | 🟡 A habilitar | 08/06/2026 |
| 4 | SIT (TCE-PR) | TCE-PR | 🟡 A habilitar | — |
| 5 | PCA — TCE-PR | TCE-PR | 🟡 A habilitar | — (PCA 2026 só em 2027) |
| 6 | SICONFI (MSC) | União/STN | 🟡 A habilitar | Último dia útil mês |
| 7 | SICONFI (DCA) | União/STN | 🟡 A habilitar | 30/04 (próximo: 2027) |
| 8 | SICONFI (RREO) | União/STN | 🟡 A habilitar | 30/07/2026 |
| 9 | SICONFI (RGF) | União/STN | 🟡 A habilitar | 30/07/2026 |
| 10 | API SICONFI (dados abertos) | União/STN | ✅ Público | — |
| 11 | e-CAC | União/RFB | 🟡 A habilitar | — |
| 12 | eSocial | União/RFB | 🟡 A habilitar | 15/06/2026 |
| 13 | EFD-Reinf | União/RFB | 🟡 A habilitar | 15/06/2026 |
| 14 | DCTFWeb | União/RFB | 🟡 A habilitar | 30/06/2026 |
| 15 | SPED Contábil/ECF | União/RFB | 🟡 A habilitar | Último dia útil jun |
| 16 | Certidões RFB | União/RFB | 🟡 A habilitar | — |
| 17 | PNCP | União/CGU | 🟡 A habilitar | 10 dias úteis |
| 18 | Compras.gov | União/MGI | 🟡 A habilitar | — |
| 19 | TransferênciaGov | União/MGI | 🟡 A habilitar | — |
| 20 | SIOPS | União/M. Saúde | 🟡 A habilitar | 30/09/2026 |
| 21 | DATASUS/FNS | União/M. Saúde | 🟡 A habilitar | — |
| 22 | SIOPE | União/FNDE | 🟡 A habilitar | 30/09/2026 |
| 23 | FNDE (programas) | União/FNDE | 🟡 A habilitar | — |
| 24 | SUAS (SAGI/MDS) | União/MDS | 🟡 A habilitar | — |
| 25 | CADÚnico | União/MDS | 🟡 A habilitar | — |
| 26 | DIPR/DAIR (RPPS) | União/M. Prev | 🟡 A habilitar | Mensal |
| 27 | SEFAZ-PR | Estadual | 🟡 A habilitar | — |
| 28 | NFS-e Nacional | Estadual/Nac | 🟡 A habilitar | Diário |
| 29 | CIGA / IEGM | Estadual | 🟡 A habilitar | — |
| 30 | Portal Transparência Inajá | Municipal | 🟡 A auditar | Contínuo |
| 31 | Sistema de Contabilidade | Municipal | 🟡 A confirmar | Mensal |
| 32 | Sistema de Tributação | Municipal | 🟡 A confirmar | IPTU 12/06/2026 |
| 33 | e-SIC Municipal | Municipal | 🟡 A auditar | 20 dias |
| 34 | Câmara Municipal (CNPJ próprio) | Municipal | ❌ CNPJ diferente | — |

---

## 4. Mapeamento CNPJ × Certificado

**Importante:** O e-CNPJ A3 é emitido em nome do **CNPJ da Prefeitura** (76.970.318/0001-67). Sistemas federais normalmente vinculam o A3 ao CNPJ raiz (8 dígitos) e a gestão interna controla os usuários por procuração eletrônica ou procuração cadastrada no sistema.

- **A3 pessoal do secretário** — tem o CNPJ mas com o nome do usuário; serve para login único.
- **A3 da entidade (e-CNPJ)** — emitido em nome da Prefeitura, sem identificação pessoal; necessário para SICONFI, Compras.gov, TransferênciaGov.
- **Cadeia de procuração** — alguns sistemas (Receita Federal, eSocial) exigem procuração eletrônica prévia no e-CAC para outorgar poderes a um CPF usar o e-CNPJ.

**Recomendação:** Verificar com a informática se o A3 em mãos é:
- (a) **e-CNPJ A3 da entidade** (sem nome de pessoa) — pode ser usado diretamente em todos os sistemas.
- (b) **e-CPF A3 com vinculação ao CNPJ** — mais comum, exige procuração eletrônica outorgada no e-CAC.

---

## 5. Próximos passos práticos

1. **Teste do certificado A3** — instalar driver, abrir o gerenciador (SafeNet, Gemalto, Watchdata, OBERthur), validar cadeia ICP-Brasil em [iti.br](https://www.iti.gov.br).
2. **Login no e-CAC** — primeiro acesso para "memorizar" o CNPJ e configurar procuração.
3. **Login em cada sistema acima** — fazer o primeiro login de cada um, com o representante legal, para "ativar" o CNPJ.
4. **Solicitar habilitação como interlocutor** do SIM-AM, SICONFI, eSocial, etc., junto à Secretaria Executiva do TCE-PR e à STN.
5. **Mapeamento do sistema interno** (Betha, IPM, Contass, etc.) que o município usa — confirmar fornecedor e suporte técnico.
6. **Configurar alertas de prazo** — ativar notificações no TCE-PR, no SICONFI e configurar Google Calendar com a tabela acima.

---

**Fontes principais:** [e-CAC](https://cav.receita.fazenda.gov.br) · [SICONFI](https://siconfi.tesouro.gov.br) · [TCE-PR IN 196/2025](https://www.tce.pr.gov.br) · [PNCP](https://pncp.gov.br) · [Compras.gov](https://www.gov.br/compras) · [SIOPS](https://siops.datasus.gov.br) · [SIOPE](https://siope.educacao.gov.br) · [NFS-e Nacional](https://www.nfse.gov.br) · [CADPREV](https://cadprev.previdencia.gov.br) · [TransferênciaGov](https://www.gov.br/transferenciagov).
