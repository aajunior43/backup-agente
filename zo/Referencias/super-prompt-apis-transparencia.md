# SUPER PROMPT — SISTEMA DE RASTREAMENTO DE IRREGULARIDADES PÚBLICAS
## Guia Completo de APIs de Transparência Brasileiras

---

> **CONTEXTO PARA O MODELO DE IA:**
> Você é um assistente especializado em transparência pública e combate à corrupção no Brasil. O usuário está construindo um sistema que rastreia crimes, fraudes em licitações, irregularidades em contratos e histórico eleitoral de mandatários, usando APIs públicas brasileiras. Quando solicitado a consultar, cruzar ou analisar dados públicos, use as APIs abaixo com os endpoints, parâmetros e exemplos fornecidos. Sempre prefira cruzamento de múltiplas fontes antes de emitir qualquer conclusão. Nunca afirme que uma irregularidade é crime — use linguagem de "indício", "flag de risco" ou "inconsistência detectada".

---

## CATEGORIA 1 — LICITAÇÕES & IRREGULARIDADES (TCU/TCE)

---

### 1. Portal de Compras do Governo Federal (Compras.gov.br)
**Órgão:** Ministério da Gestão · SEGES
**Base URL:** `https://api.compras.dados.gov.br/pesquisa/v1`
**Autenticação:** Não requerida
**Formato:** JSON, XML, CSV

#### Endpoints principais:
```
GET /licitacoes?codigoOrgao={UASG}&dataInicio={YYYY-MM-DD}&dataFim={YYYY-MM-DD}
GET /contratos?cnpjFornecedor={CNPJ}
GET /fornecedores?cnpj={CNPJ}
GET /pregoes?modalidade=PE&situacao=Encerrada
GET /dispensas?codigoOrgao={UASG}
GET /inexigibilidades?codigoOrgao={UASG}
```

#### Exemplo de uso — Buscar contratos de um fornecedor suspeito:
```python
import requests

CNPJ = "12345678000190"  # CNPJ do fornecedor
url = f"https://api.compras.dados.gov.br/pesquisa/v1/contratos"
params = {"cnpjFornecedor": CNPJ, "_format": "json"}
resp = requests.get(url, params=params)
contratos = resp.json()

for c in contratos:
    print(f"Órgão: {c['nomeUnidade']} | Valor: R${c['valorTotal']} | Data: {c['dataAssinatura']}")
```

#### Flags de risco a detectar:
- Mesmo CNPJ vencendo licitações em múltiplos municípios no mesmo período
- Empresas criadas há menos de 6 meses vencendo licitações de alto valor
- Dispensa de licitação com valor próximo ao limite legal (R$ 50.000 para obras, R$ 176.000 para serviços — Lei 14.133/2021)

---

### 2. CEIS — Cadastro de Empresas Inidôneas e Suspensas
**Órgão:** CGU
**Base URL:** `https://api.cgu.gov.br/api/v1/ceis`
**Autenticação:** Não requerida

#### Endpoints:
```
GET /ceis/sancoes?cnpjCpfSancionado={CNPJ_OU_CPF}
GET /ceis/sancoes?orgaoSancionador={NOME_ORGAO}
GET /ceis/sancoes?dataInicioSancao={YYYY-MM-DD}&dataFimSancao={YYYY-MM-DD}
```

#### Exemplo — Verificar se fornecedor está na lista negra:
```python
def checar_ceis(cnpj: str) -> dict:
    url = "https://api.portaldatransparencia.gov.br/api-de-dados/ceis"
    headers = {"chave-api-dados": "SEU_TOKEN"}
    params = {"cnpjCpfSancionado": cnpj, "pagina": 1}
    resp = requests.get(url, headers=headers, params=params)
    data = resp.json()
    if data:
        return {"status": "BLOQUEADO", "sancoes": data}
    return {"status": "LIMPO"}
```

#### Uso no sistema:
Toda vez que um CNPJ aparecer em uma licitação, chamar esta função automaticamente. Se retornar "BLOQUEADO", gerar alerta imediato.

---

### 3. CNEP — Cadastro Nacional de Empresas Punidas
**Órgão:** CGU (Lei Anticorrupção — Lei 12.846/2013)
**Base URL:** `https://api.portaldatransparencia.gov.br/api-de-dados/cnep`
**Autenticação:** Token CGU (gratuito em portaldatransparencia.gov.br/api-de-dados)

#### Diferença do CEIS:
- CEIS: impedidas de contratar (legislação geral)
- CNEP: punidas pela Lei Anticorrupção, inclui acordos de leniência

#### Endpoints:
```
GET /cnep?cnpjCpfSancionado={CNPJ}
GET /cnep?acordoLeniencia=true
GET /cnep?tipoSancao={TIPO}
```

#### Exemplo — Buscar empresas com acordo de leniência:
```python
url = "https://api.portaldatransparencia.gov.br/api-de-dados/cnep"
headers = {"chave-api-dados": "SEU_TOKEN"}
params = {"acordoLeniencia": "true", "pagina": 1}
resp = requests.get(url, headers=headers, params=params)
print(resp.json())
```

---

### 4. PNCP — Portal Nacional de Contratações Públicas
**Órgão:** Ministério da Gestão (nova Lei 14.133/2021)
**Base URL:** `https://pncp.gov.br/api/pncp/v1`
**Autenticação:** Não requerida (consulta pública)

#### Endpoints:
```
GET /orgaos/{CNPJ}/compras/{ANO}/{SEQUENCIAL}/itens
GET /orgaos/{CNPJ}/contratos?dataInicio={YYYY-MM-DD}&dataFim={YYYY-MM-DD}
GET /orgaos/{CNPJ}/atas
GET /contratacoes/publicacao?dataInicial={YYYY-MM-DD}&dataFinal={YYYY-MM-DD}&codigoModalidadeContratacao=6
```

#### Exemplo — Buscar todas as dispensas de um órgão:
```python
CNPJ_ORGAO = "01612563000100"  # Ex: Prefeitura de Inajá-PR
url = f"https://pncp.gov.br/api/pncp/v1/orgaos/{CNPJ_ORGAO}/compras"
params = {"dataInicio": "2024-01-01", "dataFim": "2024-12-31", "pagina": 1, "tamanhoPagina": 50}
resp = requests.get(url, params=params)
```

#### Modalidades a monitorar (campo `codigoModalidadeContratacao`):
- `8` = Dispensa de Licitação
- `9` = Inexigibilidade
- `6` = Pregão Eletrônico
- `1` = Concorrência

---

### 5. TCU — Acórdãos e Irregularidades
**Órgão:** Tribunal de Contas da União
**Base URL:** `https://pesquisa.apps.tcu.gov.br`
**Autenticação:** Não requerida (interface de busca)
**Dados abertos:** `https://portal.tcu.gov.br/dados-abertos/`

#### Como usar:
```python
# Busca textual no sistema de jurisprudência do TCU
url = "https://contas.tcu.gov.br/juris/SvlHighLight"
params = {
    "key": "ACORDAO-COMPLETO",
    "texto": "licitacao irregular municipio Parana",
    "bases": "ACORDAO-COMPLETO",
    "highlight": "1"
}
resp = requests.get(url, params=params)
```

#### Para dados abertos em CSV/JSON:
Acessar `https://portal.tcu.gov.br/dados-abertos/` — disponibiliza arquivos bulk de acórdãos, responsáveis e sanções.

---

### 6. TCE-PR — Dados Abertos do Paraná
**Órgão:** Tribunal de Contas do Estado do Paraná
**Portal:** `https://www1.tce.pr.gov.br/conteudo/dados-abertos/229`
**Formato:** CSV/XLSX para download, sem API REST direta

#### Como integrar:
```python
import pandas as pd

# Download direto dos arquivos CSV publicados pelo TCE-PR
url_acordaos = "https://www1.tce.pr.gov.br/dados-abertos/acordaos.csv"
df = pd.read_csv(url_acordaos, encoding='latin-1', sep=';')

# Filtrar por município
df_inaja = df[df['municipio'].str.contains('Inajá', case=False, na=False)]
```

---

### 7. SICONV — Transferências Voluntárias
**Órgão:** Ministério da Gestão
**Base URL:** `https://api.convenios.gov.br/siconv/v1`
**Autenticação:** Não requerida

#### Endpoints:
```
GET /consultarConvenio?codigoConvenio={CODIGO}
GET /consultarConvenio?cnpjProponente={CNPJ}
GET /consultarConvenio?situacao=Inadimplente
GET /consultarProposta?uf=PR&municipio=Inaja
```

#### Exemplo — Municípios com convênios inadimplentes:
```python
url = "https://api.convenios.gov.br/siconv/v1/consultarConvenio"
params = {"uf": "PR", "situacao": "Inadimplente", "pagina": 0, "tamanhoPagina": 50}
resp = requests.get(url, params=params)
convenios = resp.json().get("lista", [])
for conv in convenios:
    print(f"Município: {conv['municipio']} | Valor: {conv['vlGlobal']} | Objeto: {conv['objeto']}")
```

---

### 8. Portal Brasileiro de Dados Abertos (dados.gov.br)
**Órgão:** Ministério da Gestão · CGU
**Base URL:** `https://dados.gov.br/api/3`
**Autenticação:** Token gratuito (gerar em dados.gov.br)

#### Endpoints:
```
GET /action/package_search?q={TERMO}&rows=10
GET /action/package_show?id={ID_DATASET}
GET /action/organization_list
GET /action/resource_show?id={ID_RECURSO}
```

#### Exemplo — Descobrir novos datasets de órgãos:
```python
url = "https://dados.gov.br/api/3/action/package_search"
params = {"q": "licitacoes contratos municipios", "rows": 20}
resp = requests.get(url, params=params)
datasets = resp.json()["result"]["results"]
for ds in datasets:
    print(f"{ds['title']} — {ds['organization']['title']}")
```

---

### 9. SADIPEM — Dívida Pública de Municípios
**Órgão:** Secretaria do Tesouro Nacional
**Base URL:** `https://apidatalake.tesouro.gov.br/ords/sadipem`
**Autenticação:** Não requerida

#### Endpoints:
```
GET /tt/operacao_credito?id_uf={UF}&id_municipio={COD_IBGE}
GET /tt/divida_publica?id_uf=PR
GET /tt/limite_lrf?exercicio={ANO}
```

#### Exemplo — Verificar se município ultrapassou limite da LRF:
```python
url = "https://apidatalake.tesouro.gov.br/ords/sadipem/tt/operacao_credito"
params = {"id_uf": "PR", "exercicio": 2024}
resp = requests.get(url, params=params)
dados = resp.json()["items"]
for item in dados:
    if item["situacao"] == "Inadimplente":
        print(f"ALERTA LRF: {item['municipio']} — {item['valor_total']}")
```

---

### 10. SICONFI — Contabilidade e Fiscalidade Municipal
**Órgão:** Secretaria do Tesouro Nacional
**Base URL:** `https://apidatalake.tesouro.gov.br/ords/siconfi`
**Autenticação:** Não requerida
**Documentação:** `http://apidatalake.tesouro.gov.br/docs/siconfi/`

#### Endpoints:
```
GET /tt/rreo?an_exercicio={ANO}&in_periodicidade=B&nr_periodo={1-6}&co_tipo_matriz=RREO&no_uf=PR&co_ente={COD_SICONFI}
GET /tt/rgf?an_exercicio={ANO}&in_periodicidade=Q&nr_periodo={1-4}&co_tipo_matriz=RGF&co_ente={COD_SICONFI}
GET /tt/entes?co_tipo_ente=M&no_uf=PR
```

#### Exemplo — Puxar RREO de Inajá-PR:
```python
# Primeiro buscar o código do ente
url_entes = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/entes"
params = {"co_tipo_ente": "M", "no_uf": "PR", "no_ente": "Inajá"}
resp = requests.get(url_entes, params=params)
co_ente = resp.json()["items"][0]["co_ente"]

# Depois puxar o RREO
url_rreo = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo"
params_rreo = {
    "an_exercicio": 2025,
    "in_periodicidade": "B",
    "nr_periodo": 1,
    "co_tipo_matriz": "RREO",
    "co_ente": co_ente
}
resp_rreo = requests.get(url_rreo, params=params_rreo)
rreo = resp_rreo.json()["items"]
```

#### Flags de risco no SICONFI:
- Despesas com pessoal > 60% da RCL (limite LRF)
- Receitas declaradas muito acima da média histórica do município
- Ausência de entrega do RREO no prazo (município pode ser suspenso de transferências)

---

### 11. CEPIM — Entidades Privadas Impedidas
**Órgão:** CGU · Portal da Transparência
**Base URL:** `https://api.portaldatransparencia.gov.br/api-de-dados/cepim`
**Autenticação:** Token CGU obrigatório

#### Endpoints:
```
GET /cepim?cnpjSancionado={CNPJ}&pagina=1
GET /cepim?nomeEntidade={NOME}&pagina=1
```

#### Exemplo:
```python
headers = {"chave-api-dados": "SEU_TOKEN"}
url = "https://api.portaldatransparencia.gov.br/api-de-dados/cepim"
params = {"cnpjSancionado": "12345678000190", "pagina": 1}
resp = requests.get(url, headers=headers, params=params)
print(resp.json())
```

---

### 12. CEAF — Cadastro de Expulsões da Administração Federal
**Órgão:** CGU · Portal da Transparência
**Base URL:** `https://api.portaldatransparencia.gov.br/api-de-dados/expulsoes`
**Autenticação:** Token CGU obrigatório

#### Endpoints:
```
GET /expulsoes?cpf={CPF}&pagina=1
GET /expulsoes?orgaoLotacao={SIGLA}&pagina=1
GET /expulsoes?tipoPenalidade=Demissao&pagina=1
```

#### Uso no sistema:
Cruzar CPF de servidores municipais com este cadastro para verificar se alguém expulso do governo federal foi recontratado em prefeituras.

---

## CATEGORIA 2 — CRIMES & CONDENAÇÕES

---

### 13. DataJud — Base Nacional de Processos (CNJ)
**Órgão:** Conselho Nacional de Justiça
**Base URL:** `https://api-publica.datajud.cnj.jus.br`
**Autenticação:** API Key gratuita (cadastro em datajud-wiki.cnj.jus.br)
**Documentação:** `https://datajud-wiki.cnj.jus.br/api-publica`

#### Endpoints (ElasticSearch):
```
POST /api_publica_{tribunal}/_search
Tribunais: tjpr, tjsp, stj, trf4, etc.
```

#### Exemplo — Buscar processos criminais por CPF:
```python
import requests, json

API_KEY = "APIKey cDZHYzlZa0JadVREZDJCendFbzVlQTU2S0g1dpXXXX"
CPF = "12345678900"

url = "https://api-publica.datajud.cnj.jus.br/api_publica_tjpr/_search"
headers = {
    "Authorization": API_KEY,
    "Content-Type": "application/json"
}
query = {
    "query": {
        "match": {
            "partes.documento": CPF
        }
    },
    "size": 20
}
resp = requests.post(url, headers=headers, json=query)
processos = resp.json()["hits"]["hits"]
for p in processos:
    src = p["_source"]
    print(f"Processo: {src['numeroProcesso']} | Classe: {src['classe']['nome']} | Tribunal: {src['tribunal']}")
```

#### Filtrar por assunto (crimes relevantes):
```python
# Assuntos mais relevantes no DataJud para corrupção:
# 10935 = Improbidade Administrativa
# 11047 = Corrupção Passiva
# 11046 = Corrupção Ativa
# 11057 = Lavagem de Dinheiro

query_crime = {
    "query": {
        "bool": {
            "must": [
                {"match": {"partes.documento": CPF}},
                {"terms": {"assuntos.codigo": [10935, 11047, 11046, 11057]}}
            ]
        }
    }
}
```

---

### 14. CNCIAI — Condenados por Improbidade Administrativa
**Órgão:** CNJ (Portaria 94)
**Portal:** `https://www.cnj.jus.br/sistemas/cnciai/`
**Autenticação:** API disponível mediante credenciamento (Portaria CNJ 94)

#### Como acessar via consulta pública:
```python
# Consulta pública via scraping do portal CNJ
# (API formal requer credenciamento institucional)
import requests
from bs4 import BeautifulSoup

def consultar_cnciai(cpf: str):
    url = "https://www.cnj.jus.br/sistemas/cnciai/"
    # O sistema aceita consulta por CPF, nome ou número de processo
    # Para uso sistemático, solicitar credenciamento via Portaria CNJ 94
    return {"url_consulta": f"{url}?cpf={cpf}"}
```

#### Dados disponíveis:
- Nome do condenado (PF ou PJ)
- Artigo da LIA (Lei 8.429/92) em que foi condenado
- Prazo de suspensão de direitos políticos
- Órgão e tribunal que proferiu a decisão
- Se implica inelegibilidade (Ficha Limpa)

---

### 15. Receita Federal — Dados de CNPJ (cnpj.ws)
**Base URL:** `https://publica.cnpj.ws/cnpj/{CNPJ}`
**Autenticação:** Não requerida (mirror público gratuito da RFB)
**Rate limit:** ~3 req/segundo

#### Exemplo — Verificar situação e sócios de empresa:
```python
def consultar_cnpj(cnpj: str) -> dict:
    cnpj_limpo = cnpj.replace(".", "").replace("/", "").replace("-", "")
    url = f"https://publica.cnpj.ws/cnpj/{cnpj_limpo}"
    resp = requests.get(url)
    if resp.status_code == 200:
        data = resp.json()
        return {
            "razao_social": data["razao_social"],
            "situacao": data["estabelecimento"]["situacao_cadastral"],
            "data_abertura": data["estabelecimento"]["data_inicio_atividade"],
            "socios": [s["nome"] for s in data.get("socios", [])],
            "natureza_juridica": data["natureza_juridica"]["descricao"],
            "capital_social": data["capital_social"]
        }
    return {"erro": resp.status_code}

# Flags de risco:
empresa = consultar_cnpj("12345678000190")
from datetime import date, datetime

data_abertura = datetime.strptime(empresa["data_abertura"], "%Y-%m-%d").date()
dias_existencia = (date.today() - data_abertura).days

if dias_existencia < 180:
    print("🚨 FLAG: Empresa criada há menos de 6 meses")
if empresa["situacao"] != "Ativa":
    print(f"🚨 FLAG: Situação cadastral: {empresa['situacao']}")
```

---

### 16. COAF — Dados Abertos de Inteligência Financeira
**Órgão:** COAF · Bacen
**Portal:** `https://www.gov.br/coaf/pt-br/acesso-a-informacao/dados-abertos`
**Formato:** CSV/XLSX via download (sem API REST direta)
**Obs:** RIFs individuais são sigilosos por lei. Apenas estatísticas agregadas são públicas.

#### Como usar:
```python
# Download das estatísticas públicas do COAF
import pandas as pd

# Arquivo disponível no portal de dados abertos
url_coaf = "https://dados.gov.br/dados/conjuntos-dados/coaf-em-numeros"
# Baixar CSV manualmente e carregar:
df_coaf = pd.read_csv("coaf_comunicacoes.csv", sep=";", encoding="utf-8")

# Filtrar por UF para identificar municípios com alto volume de comunicações suspeitas
df_pr = df_coaf[df_coaf["uf"] == "PR"]
print(df_pr.groupby("municipio")["qtd_comunicacoes"].sum().sort_values(ascending=False).head(10))
```

---

### 17. Banco Central — Dados Abertos (SCR/PIX)
**Órgão:** Banco Central do Brasil
**Base URL:** `https://olinda.bcb.gov.br/olinda/servico`
**Autenticação:** Não requerida
**Documentação:** `https://dadosabertos.bcb.gov.br/`

#### Endpoints principais:
```
GET /SCR/versao/v1/odata/TaxaCredito?$filter=...
GET /IFDATA/versao/v1/odata/...
GET /Pix/versao/v1/odata/PixLiquidadosAtual
```

#### Exemplo — Buscar operações de crédito por município:
```python
url = "https://olinda.bcb.gov.br/olinda/servico/SCR/versao/v1/odata/TaxaCredito"
params = {
    "$format": "json",
    "$filter": "Municipio eq 'INAJÁ' and UF eq 'PR'",
    "$select": "Municipio,CarteiraMoeda,Valor,DataBase"
}
resp = requests.get(url, params=params)
dados = resp.json()["value"]
```

---

### 18. CVM — Comissão de Valores Mobiliários
**Órgão:** CVM · Ministério da Fazenda
**Base URL:** `https://dados.cvm.gov.br/dados/`
**Autenticação:** Não requerida

#### Endpoints:
```
GET /CIA_ABERTA/DOC/FCA/DADOS/fca_cia_aberta_{ANO}.zip
GET /PENALIDADES/DADOS/penalidades.csv
GET /FI/DOC/INF_DIARIO/DADOS/inf_diario_fi_{AAAAMM}.csv
```

#### Exemplo — Buscar empresas penalizadas pela CVM:
```python
import pandas as pd

url = "https://dados.cvm.gov.br/dados/PENALIDADES/DADOS/penalidades.csv"
df = pd.read_csv(url, sep=";", encoding="latin-1")

# Cruzar com CNPJ de fornecedores de licitações
fornecedores_cnpjs = ["12345678000190", "98765432000101"]
df_flag = df[df["CNPJ_PENALIZADO"].isin(fornecedores_cnpjs)]
if not df_flag.empty:
    print("🚨 FLAG CVM: Fornecedor penalizado pela CVM")
    print(df_flag[["NOME_PENALIZADO", "DESCRICAO_PENALIDADE", "DATA_JULGAMENTO"]])
```

---

### 19. MPF — Casos e Investigações
**Órgão:** Ministério Público Federal
**Portal:** `https://www.mpf.mp.br/sala-de-imprensa/dados-abertos`
**Formato:** Arquivos CSV via download

#### Como usar:
```python
import pandas as pd

# Dados disponíveis como CSV no portal do MPF
# Inclui: ações penais, acordos de colaboração, investigados por estado
url_acoes = "https://www.mpf.mp.br/sala-de-imprensa/dados-abertos/acoes-penais.csv"
df_mpf = pd.read_csv(url_acoes, sep=";", encoding="utf-8")

# Filtrar por UF
df_pr_mpf = df_mpf[df_mpf["estado"] == "PR"]
```

---

### 20. SINESP — Segurança Pública
**Órgão:** Ministério da Justiça · SENASP
**Base URL:** `https://www.gov.br/mj/pt-br/assuntos/sua-seguranca/seguranca-publica/estatistica`
**Formato:** CSV via download

#### Como usar:
```python
# Dados de ocorrências por município — útil para contextualização
# Download mensal disponível no portal do MJ
df_sinesp = pd.read_csv("ocorrencias_pr_2024.csv", sep=";")
df_homicidios = df_sinesp[df_sinesp["tipo_crime"] == "Homicídio doloso"]
df_por_municipio = df_homicidios.groupby("municipio")["qtd_vitimas"].sum()
```

---

## CATEGORIA 3 — IRREGULARIDADES EM CONTRATOS PÚBLICOS

---

### 21. Portal da Transparência Federal — API Completa
**Órgão:** CGU
**Base URL:** `https://api.portaldatransparencia.gov.br/api-de-dados`
**Autenticação:** Token obrigatório — gerar GRATUITAMENTE em:
`https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email`

#### Endpoints disponíveis:
```
GET /contratos?cnpjFornecedor={CNPJ}&pagina=1
GET /licitacoes?codigoOrgao={UASG}&dataInicio={YYYY-MM-DD}
GET /despesas/por-orgao?codigoOrgao={UASG}&ano={ANO}
GET /servidores?cpf={CPF}
GET /viagens?cpfViajante={CPF}&pagina=1
GET /cartao-pagamento?cpfPortador={CPF}&pagina=1
GET /emendas?codigoFuncao={COD}&pagina=1
GET /notas-fiscais?cnpjEmitente={CNPJ}&pagina=1
GET /ceis?cnpjCpfSancionado={CNPJ_CPF}&pagina=1
GET /cnep?cnpjCpfSancionado={CNPJ_CPF}&pagina=1
GET /ceaf?cpf={CPF}&pagina=1
GET /cepim?cnpjSancionado={CNPJ}&pagina=1
```

#### Classe Python reutilizável:
```python
import requests
import time

class TransparenciaAPI:
    BASE_URL = "https://api.portaldatransparencia.gov.br/api-de-dados"
    
    def __init__(self, token: str):
        self.headers = {"chave-api-dados": token}
    
    def _get(self, endpoint: str, params: dict) -> list:
        resultados = []
        pagina = 1
        while True:
            params["pagina"] = pagina
            resp = requests.get(f"{self.BASE_URL}/{endpoint}", headers=self.headers, params=params)
            if resp.status_code != 200:
                break
            data = resp.json()
            if not data:
                break
            resultados.extend(data if isinstance(data, list) else [data])
            pagina += 1
            time.sleep(0.3)  # Rate limit
        return resultados
    
    def verificar_sancoes(self, cnpj_cpf: str) -> dict:
        ceis = self._get("ceis", {"cnpjCpfSancionado": cnpj_cpf})
        cnep = self._get("cnep", {"cnpjCpfSancionado": cnpj_cpf})
        return {
            "ceis": ceis,
            "cnep": cnep,
            "flag": len(ceis) > 0 or len(cnep) > 0
        }
    
    def contratos_fornecedor(self, cnpj: str) -> list:
        return self._get("contratos", {"cnpjFornecedor": cnpj})
    
    def viagens_servidor(self, cpf: str) -> list:
        return self._get("viagens", {"cpfViajante": cpf})
    
    def cartao_pagamento(self, cpf: str) -> list:
        return self._get("cartao-pagamento", {"cpfPortador": cpf})

# Uso:
api = TransparenciaAPI("SEU_TOKEN_AQUI")
resultado = api.verificar_sancoes("12345678000190")
if resultado["flag"]:
    print("🚨 EMPRESA SANCIONADA!")
```

---

### 22. SIAFI — Execução Orçamentária Federal
**Órgão:** Secretaria do Tesouro Nacional
**Base URL:** `https://apidatalake.tesouro.gov.br/ords/siafi`
**Autenticação:** Não requerida

#### Endpoints:
```
GET /tt/empenho?an_empenho={ANO}&co_ug={COD_UG}&no_credor={NOME}
GET /tt/pagamento?an_pagamento={ANO}&co_ug={COD_UG}
GET /tt/liquidacao?an_liquidacao={ANO}&co_ug={COD_UG}
```

#### Exemplo — Rastrear empenhos para um credor específico:
```python
url = "https://apidatalake.tesouro.gov.br/ords/siafi/tt/empenho"
params = {
    "an_empenho": 2024,
    "no_credor": "EMPRESA SUSPEITA LTDA"
}
resp = requests.get(url, params=params)
empenhos = resp.json()["items"]
total = sum(float(e["vl_empenho"].replace(",", ".")) for e in empenhos)
print(f"Total empenhado: R$ {total:,.2f}")
```

---

### 23. Querido Diário — Diários Oficiais Municipais
**Órgão:** Open Knowledge Brasil
**Base URL:** `https://api.queridodiario.ok.org.br`
**Autenticação:** Não requerida (limite sugerido: 60 req/min)
**Documentação:** `https://queridodiario.ok.org.br/api/docs`

#### Endpoints:
```
GET /gazettes?territory_ids={COD_IBGE}&querystring={TERMO}&size=10
GET /cities?city_name={NOME_MUNICIPIO}
GET /territories?territory_type=city&state_code=PR
```

#### Exemplo — Monitorar diário de um município por palavras suspeitas:
```python
def monitorar_diario(cod_ibge: str, termos: list) -> list:
    alertas = []
    for termo in termos:
        url = "https://api.queridodiario.ok.org.br/gazettes"
        params = {
            "territory_ids": cod_ibge,
            "querystring": termo,
            "excerpt_size": 500,
            "number_of_excerpts": 3,
            "size": 10
        }
        resp = requests.get(url, params=params)
        gazettes = resp.json().get("gazettes", [])
        for g in gazettes:
            alertas.append({
                "data": g["date"],
                "termo_encontrado": termo,
                "trecho": g["excerpts"][0] if g["excerpts"] else "",
                "url": g["url"]
            })
    return alertas

# Termos críticos para monitorar:
termos_suspeitos = [
    "dispensa de licitação",
    "inexigibilidade",
    "contratação emergencial",
    "sobrepreço",
    "aditivo contratual",
    "prorrogação de contrato"
]

# Código IBGE de Inajá-PR: 4109807
alertas = monitorar_diario("4109807", termos_suspeitos)
for a in alertas:
    print(f"📋 {a['data']} | Termo: '{a['termo_encontrado']}'")
    print(f"   Trecho: {a['trecho'][:200]}...")
```

---

### 24. BNDES — Financiamentos
**Órgão:** Banco Nacional de Desenvolvimento Econômico e Social
**Portal:** `https://dadosabertos.bndes.gov.br/dataset`
**Formato:** CSV/JSON

#### Uso:
```python
import pandas as pd

# Financiamentos aprovados — útil para cruzar com empresas que têm contratos públicos
url = "https://dadosabertos.bndes.gov.br/dataset/operacoes-de-credito-do-sistema-bndes"
# Baixar CSV e carregar:
df_bndes = pd.read_csv("operacoes_bndes.csv", sep=";", encoding="latin-1")
df_flag = df_bndes[df_bndes["CNPJ_CLIENTE"].isin(lista_cnpjs_suspeitos)]
```

---

### 25. SIMEC — Obras e Convênios MEC
**Órgão:** Ministério da Educação
**Portal:** `https://simec.mec.gov.br/dadosabertos`

#### Uso:
```python
# Verificar obras inacabadas em municípios
url = "https://simec.mec.gov.br/dadosabertos/obras"
params = {"municipio": "Inajá", "uf": "PR", "situacao": "Paralisada"}
resp = requests.get(url, params=params)
```

---

### 26. Emendas Parlamentares
**Órgão:** CGU · Portal da Transparência
**Base URL:** `https://api.portaldatransparencia.gov.br/api-de-dados/emendas`
**Autenticação:** Token CGU obrigatório

#### Exemplo — Cruzar emendas com doadores de campanha:
```python
headers = {"chave-api-dados": "SEU_TOKEN"}

# Passo 1: Buscar emendas de um parlamentar específico
url = "https://api.portaldatransparencia.gov.br/api-de-dados/emendas"
params = {"codigoEmenda": "", "nomeAutor": "DEPUTADO FULANO", "pagina": 1}
resp = requests.get(url, headers=headers, params=params)
emendas = resp.json()

# Passo 2: Para cada emenda, pegar o CNPJ do beneficiário
# Passo 3: Cruzar esse CNPJ com doações de campanha do TSE (API abaixo)
beneficiarios = set(e["cnpjCpfBeneficiario"] for e in emendas)
```

---

### 27. NF-e do Poder Executivo Federal
**Órgão:** CGU
**Base URL:** `https://api.portaldatransparencia.gov.br/api-de-dados/notas-fiscais`
**Autenticação:** Token CGU obrigatório

#### Exemplo — Detectar superfaturamento:
```python
# Buscar NFs de um fornecedor
params = {"cnpjEmitente": "12345678000190", "pagina": 1}
resp = requests.get(url, headers=headers, params=params)
notas = resp.json()

# Comparar valor unitário da NF com preço de referência do SIASG
for nota in notas:
    preco_nf = nota["valorUnitario"]
    # Consultar SIASG para preço de referência do mesmo item
    # Se preco_nf > 1.3 * preco_referencia: FLAG superfaturamento
```

---

### 35. CAF — Certificado de Regularidade do FGTS
**Orgao:** Caixa Economica Federal
**Base URL:** `https://consultaweb.caixa.gov.br/consulta-caixa/`
**Autenticacao:** Nao requerida (consulta web)
**Formato:** Web scraping

#### Uso:
Verificar regularidade de empregadores com o FGTS. Dados disponiveis via consulta web, sem API REST direta. Para volume, considerar o Cadastro de Regularidade via Portal da Transparencia.

---

### 36. ATRICON/IEGM — Indice de Efetividade Municipal
**Orgao:** ATRICON (Associacao dos Membros dos Tribunais de Contas)
**Portal:** `https://www.aticon.org.br/iegm/`
**Formato:** Dados via web scraping

#### Uso:
Indice que avalia a efetividade da gestao municipal com base em dados do TCE. Util para comparar municipios e identificar gestoes com baixo desempenho em indicadores de transparencia e fiscalidade.

---

## CATEGORIA 4 — ELEIÇÕES & FICHA LIMPA

---

### 28. TSE — Candidatos e Eleições
**Órgão:** Tribunal Superior Eleitoral
**Base URL:** `https://dadosabertos.tse.jus.br/api/3/action`
**Alternativa:** Download direto em `https://dadosabertos.tse.jus.br/dataset`
**Autenticação:** Não requerida

#### Download dos dados:
```python
import pandas as pd, zipfile, io, requests

# Dataset de candidatos — eleições 2024
url = "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2024.zip"
resp = requests.get(url, stream=True)
with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
    with z.open("consulta_cand_2024_BRASIL.csv") as f:
        df_cands = pd.read_csv(f, sep=";", encoding="latin-1")

# Buscar candidatos de um município com situação "Ficha Suja"
df_inaja = df_cands[
    (df_cands["NM_MUNICIPIO"] == "INAJÁ") &
    (df_cands["DS_DETALHE_SITUACAO_CAND"].str.contains("INAPTO|CASSADO", na=False))
]
```

---

### 29. TSE — Bens Declarados de Candidatos
```python
# Dataset de bens declarados — comparar patrimônio entre mandatos
url_bens = "https://cdn.tse.jus.br/estatistica/sead/odsele/bem_candidato/bem_candidato_2024.zip"
resp = requests.get(url_bens, stream=True)

with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
    with z.open("bem_candidato_2024_BRASIL.csv") as f:
        df_bens = pd.read_csv(f, sep=";", encoding="latin-1")

# Calcular variação patrimonial entre eleições
def variacao_patrimonial(cpf: str, ano1: int, ano2: int):
    bens_ant = df_bens_ant[df_bens_ant["NR_CPF_CANDIDATO"] == cpf]["VR_BEM_CANDIDATO"].sum()
    bens_nov = df_bens_nov[df_bens_nov["NR_CPF_CANDIDATO"] == cpf]["VR_BEM_CANDIDATO"].sum()
    variacao_pct = ((bens_nov - bens_ant) / bens_ant) * 100 if bens_ant > 0 else 0
    if variacao_pct > 200:
        print(f"🚨 FLAG: Patrimônio cresceu {variacao_pct:.1f}% durante o mandato!")
```

---

### 30. TSE — Financiamento de Campanhas
```python
# Dataset de receitas de campanha
url_receitas = "https://cdn.tse.jus.br/estatistica/sead/odsele/prestacao_contas/prestacao_contas_final_2024.zip"
resp = requests.get(url_receitas, stream=True)

with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
    with z.open("receitas_candidatos_2024_BRASIL.csv") as f:
        df_receitas = pd.read_csv(f, sep=";", encoding="latin-1")

# Cruzar doadores com beneficiários de contratos públicos
def cruzar_doadores_contratos(cnpj_doador: str, cpf_candidato: str):
    # Verificar se empresa que doou para campanha recebeu contratos
    doacao = df_receitas[
        (df_receitas["NR_CPF_CNPJ_DOADOR"] == cnpj_doador) &
        (df_receitas["NR_CPF_CANDIDATO"] == cpf_candidato)
    ]
    contratos = api_transparencia.contratos_fornecedor(cnpj_doador)
    
    if not doacao.empty and contratos:
        valor_doacao = doacao["VR_RECEITA"].sum()
        valor_contratos = sum(c["valorTotal"] for c in contratos)
        print(f"🚨 FLAG DOAÇÃO-CONTRATO: Empresa doou R${valor_doacao:,.2f} e recebeu R${valor_contratos:,.2f} em contratos")
```

---

### 31. CNIA — Cadastro Nacional de Inelegibilidade
**Órgão:** CNJ / TSE
**Portal:** `https://www.cnj.jus.br/sistemas/cnia/`

#### Uso:
```python
# Consultar inelegibilidade de um CPF antes de analisar candidatura
def verificar_inelegibilidade(cpf: str) -> dict:
    # Consulta pública disponível no portal CNJ
    url = f"https://www.cnj.jus.br/sistemas/cnia/consulta?cpf={cpf}"
    # Para automação em volume, solicitar credenciamento institucional ao CNJ
    return {"url_consulta": url, "instrucao": "Acessar manualmente ou via credenciamento CNJ"}
```

---

### 32. IBGE — Pesquisa MUNIC e Localidades
**Órgão:** IBGE
**Base URL:** `https://servicodados.ibge.gov.br/api/v1`
**Autenticação:** Não requerida

#### Endpoints:
```
GET /localidades/municipios
GET /localidades/estados/{UF}/municipios
GET /localidades/municipios/{COD_IBGE}
```

#### Exemplo:
```python
url = "https://servicodados.ibge.gov.br/api/v1/localidades/estados/PR/municipios"
resp = requests.get(url)
municipios_pr = resp.json()
# Lista completa com código IBGE — necessário para outras APIs
cod_inaja = next(m["id"] for m in municipios_pr if m["nome"] == "Inajá")
```

---

### 33. Juntas Comerciais — QSA de Empresas (DREI)
**Órgão:** DREI · Ministério do Desenvolvimento
**Portal:** `https://www.gov.br/drei/pt-br/assuntos/orientacoes-do-drei/dados-abertos`
**Formato:** CSV/JSON via download

#### Uso para nepotismo cruzado:
```python
import pandas as pd

# Baixar CSV de sócios das juntas comerciais estaduais
# Depois cruzar com familiares de agentes públicos
df_socios = pd.read_csv("socios_empresas_pr.csv", sep=";")

# Nomes de familiares de um agente público (busca manual ou de declaração de bens)
familiares = ["MARIA SILVA SOUZA", "JOAO PEDRO SILVA"]
df_flag = df_socios[df_socios["NOME_SOCIO"].isin(familiares)]
if not df_flag.empty:
    empresas_familiares = df_flag["CNPJ"].unique()
    # Verificar se essas empresas têm contratos públicos
    for cnpj in empresas_familiares:
        contratos = api_transparencia.contratos_fornecedor(cnpj)
        if contratos:
            print(f"🚨 FLAG NEPOTISMO: Familiar sócio de empresa com contratos públicos: {cnpj}")
```

---

### 34. Base dos Dados (BD+)
**Organização:** Base dos Dados
**Portal:** `https://basedosdados.org`
**SDK:** Python (`pip install basedosdados`) / R (`install.packages("basedosdados")`)
**Autenticação:** Conta Google (BigQuery gratuito com cota mensal)

#### Instalação:
```bash
pip install basedosdados
```

#### Exemplo — Cruzamento TSE + CNPJ em SQL:
```python
import basedosdados as bd

# Query SQL diretamente no BigQuery via BD+
query = """
SELECT
  c.nome_candidato,
  c.cpf_candidato,
  c.sigla_partido,
  c.resultado,
  SUM(r.valor_receita) AS total_doacoes,
  COUNT(DISTINCT r.cnpj_cpf_doador) AS qtd_doadores
FROM `basedosdados.br_tse_eleicoes.candidatos` c
LEFT JOIN `basedosdados.br_tse_eleicoes.receitas_candidato` r
  ON c.cpf_candidato = r.cpf_candidato AND c.ano = r.ano
WHERE c.sigla_uf = 'PR'
  AND c.ano = 2024
  AND c.descricao_cargo = 'PREFEITO'
GROUP BY 1,2,3,4
ORDER BY total_doacoes DESC
"""

df = bd.read_sql(query, billing_project_id="SEU_PROJETO_GCP")
print(df.head(20))
```

---

## CRUZAMENTOS DE ALTO VALOR (CASOS DE USO REAIS)

---

### CRUZAMENTO 1 — Empresa laranja vencendo licitações
```python
def detectar_empresa_laranja(cnpj_fornecedor: str):
    # 1. Verificar idade da empresa
    dados = consultar_cnpj(cnpj_fornecedor)
    data_abertura = datetime.strptime(dados["data_abertura"], "%Y-%m-%d").date()
    dias = (date.today() - data_abertura).days
    
    # 2. Verificar sanções
    sancoes = api_transparencia.verificar_sancoes(cnpj_fornecedor)
    
    # 3. Buscar contratos
    contratos = api_transparencia.contratos_fornecedor(cnpj_fornecedor)
    total_contratos = sum(c.get("valorTotal", 0) for c in contratos)
    
    # 4. Verificar se empresa tem capital social compatível com contratos
    capital = dados.get("capital_social", 0)
    
    flags = []
    if dias < 180: flags.append("Empresa criada há menos de 6 meses")
    if sancoes["flag"]: flags.append("Empresa sancionada (CEIS/CNEP)")
    if capital > 0 and total_contratos > capital * 10: flags.append(f"Contratos ({total_contratos:,.0f}) muito acima do capital social ({capital:,.0f})")
    if dados["situacao"] != "Ativa": flags.append(f"Situação irregular: {dados['situacao']}")
    
    return {"cnpj": cnpj_fornecedor, "flags": flags, "score_risco": len(flags)}
```

---

### CRUZAMENTO 2 — Doador de campanha recebendo contratos
```python
def detectar_retorno_campanha(cpf_candidato: str, ano_eleicao: int):
    # 1. Buscar todos os doadores do candidato no TSE
    df_doadores = df_receitas[df_receitas["NR_CPF_CANDIDATO"] == cpf_candidato]
    cnpjs_doadores = df_doadores["NR_CPF_CNPJ_DOADOR"].unique()
    
    resultados = []
    for cnpj in cnpjs_doadores:
        contratos = api_transparencia.contratos_fornecedor(cnpj)
        # Filtrar contratos APÓS a eleição
        contratos_pos = [c for c in contratos if c["dataAssinatura"][:4] >= str(ano_eleicao)]
        if contratos_pos:
            valor_doado = df_doadores[df_doadores["NR_CPF_CNPJ_DOADOR"] == cnpj]["VR_RECEITA"].sum()
            valor_contratos = sum(c["valorTotal"] for c in contratos_pos)
            resultados.append({
                "cnpj": cnpj,
                "valor_doado": valor_doado,
                "valor_contratos_pos_eleicao": valor_contratos,
                "roi_doador": valor_contratos / valor_doado if valor_doado > 0 else 0
            })
    
    return sorted(resultados, key=lambda x: x["roi_doador"], reverse=True)
```

---

### CRUZAMENTO 3 — Servidor fantasma (múltiplos vínculos)
```python
def detectar_servidor_fantasma(cpf: str):
    # 1. Portal da Transparência — vínculo federal
    servidor_federal = api_transparencia._get("servidores", {"cpf": cpf})
    
    # 2. SICONFI — verificar folha de municípios (via despesas com pessoal)
    # 3. CEAF — foi expulso de algum órgão?
    expulsoes = api_transparencia._get("expulsoes", {"cpf": cpf})
    
    # 4. DataJud — tem ação de improbidade?
    processos = buscar_processos_datajud(cpf, assuntos=[10935])
    
    return {
        "vinculos_federais": len(servidor_federal),
        "expulsoes": len(expulsoes),
        "acoes_improbidade": len(processos),
        "flag": len(expulsoes) > 0 or len(processos) > 0
    }
```

---

### CRUZAMENTO 4 — Monitoramento contínuo via n8n
```
Fluxo recomendado no n8n (executar diariamente):

1. [Schedule Trigger] → Executar todo dia às 6h
2. [HTTP Request] → Querido Diário: buscar novos atos do município
3. [IF] → Contém termos suspeitos?
   → SIM: [HTTP Request] → Buscar CNPJ mencionado no CEIS/CNEP
          [IF] → Está sancionado?
          → SIM: [Telegram] → Enviar alerta com detalhes
4. [HTTP Request] → PNCP: verificar novas licitações publicadas
5. [HTTP Request] → SICONFI: verificar entrega do RREO no prazo
6. [Merge] → Consolidar alertas do dia
7. [Telegram/Email] → Enviar relatório diário
```

---

## CONFIGURAÇÃO INICIAL DO SISTEMA

### Dependências Python:
```bash
pip install requests pandas basedosdados python-dotenv tqdm
```

### Variáveis de ambiente (.env):
```
TOKEN_TRANSPARENCIA=sua_chave_aqui
TOKEN_DATAJUD=APIKey sua_chave_aqui
PROJETO_GCP=seu-projeto-bigquery
TELEGRAM_BOT_TOKEN=token_do_bot
TELEGRAM_CHAT_ID=seu_chat_id
```

### Obter tokens gratuitos:
- **Portal da Transparência:** `https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email`
- **DataJud (CNJ):** `https://datajud-wiki.cnj.jus.br/api-publica/acesso`
- **Base dos Dados:** Conta Google em `https://basedosdados.org`
- **dados.gov.br:** `https://dados.gov.br/dados/conteudo/como-acessar-a-api-do-portal-de-dados-abertos-com-o-perfil-de-consumidor`

---

## TABELA RESUMO — TODAS AS APIs

| # | Nome | Categoria | Auth | Endpoint Base |
|---|------|-----------|------|---------------|
| 1 | Portal de Compras | Licitações | Não | api.compras.dados.gov.br |
| 2 | CEIS | Licitações | Token CGU | api.portaldatransparencia.gov.br |
| 3 | CNEP | Licitações | Token CGU | api.portaldatransparencia.gov.br |
| 4 | PNCP | Licitações | Não | pncp.gov.br/api/pncp/v1 |
| 5 | TCU Acórdãos | Licitações | Não | contas.tcu.gov.br |
| 6 | TCE-PR | Licitações | Não | tce.pr.gov.br (CSV) |
| 7 | SICONV | Licitações | Não | api.convenios.gov.br |
| 8 | dados.gov.br | Licitações | Token | dados.gov.br/api/3 |
| 9 | SADIPEM | Licitações | Não | apidatalake.tesouro.gov.br |
| 10 | SICONFI | Licitações | Não | apidatalake.tesouro.gov.br |
| 11 | CEPIM | Licitações | Token CGU | api.portaldatransparencia.gov.br |
| 12 | CEAF | Licitações | Token CGU | api.portaldatransparencia.gov.br |
| 13 | DataJud | Crimes | API Key CNJ | api-publica.datajud.cnj.jus.br |
| 14 | CNCIAI | Crimes | Credenciamento | cnj.jus.br/sistemas/cnciai |
| 15 | CNPJ.ws (RFB) | Crimes | Não | publica.cnpj.ws |
| 16 | COAF Dados | Crimes | Não | dados.gov.br (CSV) |
| 17 | Bacen (SCR/PIX) | Crimes | Não | olinda.bcb.gov.br |
| 18 | CVM | Crimes | Não | dados.cvm.gov.br |
| 19 | MPF | Crimes | Não | mpf.mp.br (CSV) |
| 20 | SINESP | Crimes | Não | gov.br/mj (CSV) |
| 21 | Transparência Federal | Contratos | Token CGU | api.portaldatransparencia.gov.br |
| 22 | SIAFI | Contratos | Não | apidatalake.tesouro.gov.br |
| 23 | Querido Diário | Contratos | Não | api.queridodiario.ok.org.br |
| 24 | BNDES | Contratos | Não | dadosabertos.bndes.gov.br |
| 25 | SIMEC | Contratos | Não | simec.mec.gov.br |
| 26 | Emendas Parlamentares | Contratos | Token CGU | api.portaldatransparencia.gov.br |
| 27 | NF-e Governo | Contratos | Token CGU | api.portaldatransparencia.gov.br |
| 28 | TSE Candidatos | Eleições | Não | cdn.tse.jus.br (ZIP/CSV) |
| 29 | TSE Bens | Eleições | Não | cdn.tse.jus.br (ZIP/CSV) |
| 30 | TSE Financiamento | Eleições | Não | cdn.tse.jus.br (ZIP/CSV) |
| 31 | CNIA | Eleições | Não | cnj.jus.br/sistemas/cnia |
| 32 | IBGE MUNIC | Eleições | Não | servicodados.ibge.gov.br |
| 33 | Juntas Comerciais | Eleições | Não | gov.br/drei (CSV) |
| 34 | Base dos Dados | Eleições | Google/GCP | basedosdados.org |
| 35 | CAF (Bacen) | Crimes | Não | bcb.gov.br/dadosabertos |
| 36 | ATRICON/IEGM |

---

---

## CATEGORIA 5 — LEGISLATIVO (CÂMARA, SENADO, CONGRESSO)

### 37. Câmara dos Deputados — Dados Abertos
**Órgão:** Câmara dos Deputados
**Base URL:** `https://dadosabertos.camara.leg.br/api/v2`
**Autenticação:** Não requerida
**Formato:** JSON, XML
**Documentação:** `https://dadosabertos.camara.leg.br/swagger/api.html`

#### Endpoints principais:
```
GET /deputados?itens={N}&ordenarPor=nome
GET /deputados/{id}/despesas?ano={ANO}&itens={N}
GET /deputados/{id}/frentes
GET /proposicoes?itens={N}&ordem=DESC&ordenarPor=id
GET /proposicoes/{id}/autores
GET /proposicoes/{id}/tramitacoes
GET /votacoes?dataInicio={YYYY-MM-DD}&dataFim={YYYY-MM-DD}
GET /frentes?itens={N}
GET /frentes/{id}/membros
GET /orgaos?itens={N}
GET /sessoes?dataInicio={YYYY-MM-DD}&dataFim={YYYY-MM-DD}
```

#### Exemplo — Listar deputados e despesas:
```python
import requests

# Listar deputados
url = "https://dadosabertos.camara.leg.br/api/v2/deputados"
params = {"itens": 10, "ordenarPor": "nome"}
resp = requests.get(url, params=params)
deputados = resp.json()["dados"]

# Despesas de um deputado
dep_id = deputados[0]["id"]
url_desp = f"https://dadosabertos.camara.leg.br/api/v2/deputados/{dep_id}/despesas"
params_desp = {"ano": 2024, "itens": 100, "ordenarPor": "mes"}
resp_desp = requests.get(url_desp, params=params_desp)
```

#### Flags de risco:
- Deputados com despesas fora do padrão da cota parlamentar
- Fornecedores recorrentes em despesas de múltiplos deputados (indício de cartel)
- Proposições de interesse de empresas que doaram para campanha

✅ **TESTADO E FUNCIONANDO** — Retorna dados de deputados e proposições

---

### 38. Senado Federal — Dados Abertos
**Órgão:** Senado Federal
**Base URL:** `https://dadosabertos.senado.gov.br/api/3`
**API Legislativa:** `https://legis.senado.leg.br/dadosabertos`
**Autenticação:** Não requerida
**Formato:** JSON, XML, CSV
**Documentação:** `https://dadosabertos.senado.gov.br/api/3`
**Swagger:** `https://legis.senado.leg.br/dadosabertos/docs/index.html`

#### Endpoints principais (API Legislativa v3):
```
GET /dadosabertos/senador/{id}
GET /dadosabertos/comissao/{codigo}
GET /dadosabertos/comissao/agenda/{dataInicio}/{dataFim}
GET /dadosabertos/comissao/lista/colegiados
GET /dadosabertos/legislacao/{codigo}
GET /dadosabertos/materia/{codigo}
GET /dadosabertos/plenario/sessao/{data}
GET /dadosabertos/plenario/votacao/{codigo}
```

#### Catálogo de datasets (API v3):
```
GET /action/package_search?q={TERMO}&rows=10
GET /action/package_show?id={ID_DATASET}
```

#### Dados administrativos (download CSV/JSON):
- Remuneração de servidores
- Despesas do Senado
- Cotas parlamentares
- Contratos e licitações
Disponível em: `https://www12.senado.leg.br/dados-abertos`

#### Exemplo — Buscar matérias legislativas:
```python
import requests

# Buscar comissões ativas
url = "https://legis.senado.leg.br/dadosabertos/comissao/lista/colegiados"
headers = {"Accept": "application/json"}
resp = requests.get(url, headers=headers)
comissoes = resp.json()

# Buscar matéria por sigla/número/ano
url_materia = "https://legis.senado.leg.br/dadosabertos/materia/PLC/2024/1"
resp_materia = requests.get(url_materia, headers=headers)
```

⚠️ **Rate limit:** ~10 req/s (429 acima disso)

---

### 39. TransfereGov — Transferências Especiais (Emendas)
**Órgão:** Ministério da Gestão (MGI)
**Base URL (Especiais):** `https://api.transferegov.gestao.gov.br/transferenciasespeciais`
**Base URL (Fundo a Fundo):** `https://api.transferegov.gestao.gov.br/transferenciasfundofundo`
**Base URL (TED):** `https://api.transferegov.gestao.gov.br/transferenciasted`
**Autenticação:** Não requerida
**Formato:** JSON (PostgREST)
**Documentação:** `https://docs.api.transferegov.gestao.gov.br/transferenciasespeciais/`

#### Endpoints principais (PostgREST):
```
GET /programa_especial?limit={N}&offset={N}
GET /programa_especial?ano_programa=eq.{ANO}
GET /programa_beneficiario?tx_codigo_siorg=eq.{CODIGO}
GET /nota_credito?cd_ug_favorecida_nota=eq.{UG}
GET /plano_acao?id_programa=eq.{ID}
GET /programacao_financeira?ug_favorecida_programacao=eq.{UG}
```

#### Filtros PostgREST:
```
?coluna=eq.valor          # Igual
?coluna=like.*texto*     # Contém
?coluna=gt.{valor}       # Maior que
?coluna=lt.{valor}       # Menor que
&order=coluna.desc       # Ordenação
&limit=50&offset=0       # Paginação
```

#### Exemplo — Buscar emendas parlamentares de 2021:
```python
import requests

url = "https://api.transferegov.gestao.gov.br/transferenciasespeciais/programa_especial"
params = {"ano_programa": "eq.2021", "limit": 20, "offset": 0}
resp = requests.get(url, params=params)
programas = resp.json()

for p in programas:
    print(f"Programa {p['codigo_programa']}: R${p['valor_necessidade_financeira_programa']:,.2f}")
```

✅ **TESTADO E FUNCIONANDO** — Retorna dados de programas especiais com valores

#### Flags de risco:
- Emendas com valores impedidos altos (potencial desvio)
- Programas sem execução financeira
- Beneficiários concentrados em poucos municípios

---

### 40. ANS — Operadoras de Planos de Saúde
**Órgão:** Agência Nacional de Saúde Suplementar
**Base URL:** `https://www.ans.gov.br/operadoras-entity/v1`
**Autenticação:** Não requerida
**Formato:** JSON

#### Endpoints:
```
GET /operadoras/{registro_ans}
GET /operadoras/?size={N}&page={P}&sort={CAMPO}&razao_social={NOME}&cnpj={CNPJ}&ativa={true|false}
GET /administradoras-beneficios/{registro_ans}
GET /administradoras-beneficios/?size={N}&page={P}
```

#### Exemplo — Buscar operadora por CNPJ:
```python
import requests

cnpj = "03459805000196"
url = "https://www.ans.gov.br/operadoras-entity/v1/operadoras/"
params = {"cnpj": cnpj, "size": 10}
resp = requests.get(url, params=params)
data = resp.json()

for op in data["content"]:
    print(f"{op['razao_social']} | ANS: {op['registro_ans']} | Ativa: {op['ativa']}")
```

✅ **TESTADO E FUNCIONANDO** — 4.162+ operadoras cadastradas, searchable por CNPJ/nome

#### Dados complementares da ANS (CSV):
- Produtos de saúde suplementar
- Índice Geral de Reclamações (IGR)
- Características dos produtos
- Valores de mensalidade por faixa etária
Disponível em: `https://www.gov.br/ans/pt-br/acesso-a-informacao/perfil-do-setor/dados-abertos-1/dados-abertos`

---

### 41. DEMAS / Dados Abertos SUS — Estabelecimentos de Saúde
**Órgão:** Ministério da Saúde (DEMAS)
**Base URL:** `https://apidadosabertos.saude.gov.br/api/v1`
**Autenticação:** Token (cadastro em dadosabertos.saude.gov.br)
**Documentação:** `https://apidadosabertos.saude.gov.br/v1/`

#### Endpoints:
```
GET /estabelecimentos/hospitais?limit={N}&offset={N}
GET /estabelecimentos?codigo_tipo_unidade={COD}&codigo_uf={UF}
GET /tipo-unidade
```

#### Exemplo — Buscar hospitais por UF:
```python
import requests

url = "https://apidadosabertos.saude.gov.br/api/v1/estabelecimentos/hospitais"
params = {"limit": 50, "offset": 0}
headers = {"Authorization": "Bearer SEU_TOKEN"}
resp = requests.get(url, params=params, headers=headers)
```

⚠️ **Requer autenticação** — Cadastro gratuito em dadosabertos.saude.gov.br

---

### 42. Minha Receita — CNPJ (Alternativa à Receita Federal)
**Organização:** Comunidade / Dados Abertos
**Base URL:** `https://minhareceita.org/{CNPJ}`
**Autenticação:** Não requerida
**Formato:** JSON
**Código fonte:** `https://github.com/cuducos/minha-receita`

#### Uso — Consulta direta por CNPJ (sem barras/pontos):
```python
import requests

cnpj = "11222333000181"  # Sem formatação
url = f"https://minhareceita.org/{cnpj}"
resp = requests.get(url)
dados = resp.json()

print(f"Razão Social: {dados['razao_social']}")
print(f"Situação: {dados['descricao_situacao_cadastral']}")
print(f"CNAE: {dados['cnae_fiscal_descricao']}")
print(f"UF: {dados['uf']}")
print(f"Abertura: {dados['data_inicio_atividade']}")
# Quadro de sócios disponível no campo "qsa"
for socio in dados.get("qsa", []):
    print(f"  Sócio: {socio['nome_socio']} — {socio['qualificacao_socio']}")
```

✅ **TESTADO E FUNCIONANDO** — Retorna dados completos do CNPJ incluindo QSA (quadro societário)

#### Vantagens sobre CNPJ.ws:
- Sem rate limit conhecido (uso responsável)
- Inclui quadro societário completo (QSA)
- Dados atualizados via Receita Federal

---

### 43. Banco Central do Brasil — Olinda/API
**Órgão:** Banco Central do Brasil
**Base URL:** `https://olinda.bcb.gov.br/bcb/olinda/servico`
**Autenticação:** Não requerida (alguns endpoints)
**Formato:** JSON
**Portal:** `https://dadosabertos.bcb.gov.br/`

#### Endpoints principais:
```
# Taxas de câmbio
GET /Cambio/versao/v1/odata/Cambio()?moeda=@moeda&dataCotacao=@data

# Expectativas de mercado (Focus)
GET /Expectativas/versao/v1/odata/ExpectativaMercadoTop5

# Empréstimos do BNDES
GET /BNDES_Clientes/versao/v1/odata/Clientes()

# Dívida pública
GET /DVSGarantias/versao/v1/odata/Garantias()

# Operações de crédito (SCR)
GET /SCR_Data/versao/v1/odata/BaseSCR()

# Cadastro de instituições financeiras
GET /IFDATA/versao/v1/odata/IFData()
```

#### Exemplo — Cotação do dólar:
```python
import requests

url = "https://olinda.bcb.gov.br/bcb/olinda/servico/Cambio/versao/v1/odata/Cambio"
params = {"moeda": "'USD'", "dataCotacao": "'2024-01-01'", "$format": "json"}
resp = requests.get(url, params=params)
data = resp.json()
for cotacao in data["value"]:
    print(f"Data: {cotacao['dataHoraCotacao']} | Compra: R${cotacao['cotacaoCompra']}")
```

#### Dados disponíveis via CSV:
- Penalidades da CVM
- Fundos de investimento (diário)
- Cia. abertas (FCA)
- Todos em: `https://dados.cvm.gov.br/dados/`

---

### 44. SIORG — Estrutura Organizacional do Poder Executivo
**Órgão:** Ministério da Gestão (MGI)
**Base URL:** `https://api.siorg.gov.br/api/v1`
**Autenticação:** Requer credenciais Conecta Gov.br
**Formato:** JSON

#### Endpoints:
```
GET /estrutura-organizacional/resumida?codigoPoder={COD}&codigoEsfera={COD}
GET /instancias/consulta-unidade?codigoUnidade={COD}
GET /cargo-funcao
```

#### Uso para rastreamento:
- Mapear orgigramas de órgãos federais
- Identificar vínculos entre unidades e programas orçamentários
- Cruzar com dados de servidores do SIAPE

⚠️ **Requer credenciais Conecta Gov.br** (adesão em gov.br/conecta)

---

### 45. Conecta Gov.br — Catálogo de APIs Governamentais
**Órgão:** Secretaria de Governo Digital (SGD/MGI)
**Portal:** `https://www.gov.br/conecta/catalogo/`
**Documentação Swagger:** `https://gov.br/conecta/gerenciador-documentacao`

#### APIs disponíveis (seleção relevante para transparência):
- **e-Aud (CGU)** — Auditorias da Controladoria-Geral da União
- **Fala.Br** — Ouvidorias (manifestações de cidadãos)
- **Polímero** — Composição societária do setor elétrico
- **SIAPE Consultas** — Servidores públicos federais
- **SIAPE Ocorrências** — Ocorrências de servidores
- **Cadastro Único (CadÚnico)** — Famílias e indicadores
- **CAF** — Cadastro Nacional da Agricultura Familiar
- **Consulta Dívida Ativa da União**
- **TCC** — Termos de Compromisso de Cessação
- **Concórdia** — Concursos públicos
- **Outorgas de Geração** — Setor elétrico
- **Portal da Transparência** — Já documentado no Super Prompt

⚠️ **Requer adesão e credenciais** — Acesso via api.gov.br com certificado ICP-Brasil

---

### 46. ObrasGov.br — Cadastro de Obras Públicas
**Órgão:** Ministério da Gestão (MGI)
**Base URL:** `https://api.obrasgov.gestao.gov.br`
**Autenticação:** Não requerida (consulta pública)
**Documentação:** `https://www.gov.br/transferegov/pt-br/ferramentas-gestao/dados-abertos`

#### Endpoints (via TransfereGov):
```
GET /obra?limit={N}&offset={N}
GET /obra/{id}
```

#### Dados disponíveis via CSV:
- Projetos de investimento em obras
- Situação de execuções
- Valores aplicados por município
Disponível em: `http://repositorio.dados.gov.br/seges/detru/`

#### Flags de risco:
- Obras paradas há mais de 6 meses com valores altos
- Empreiteiras com história de atrasos recorrentes
- Variações de valor acima de 50% entre planejado e executado

❌ **API REST não funcional** — Usar dados CSV do repositório

---

### 47. SIOPS — Sistema de Informações sobre Orçamentos Públicos em Saúde
**Órgão:** Ministério da Saúde
**Base URL:** `https://datasus.saude.gov.br/siops`
**Autenticação:** Não requerida
**Formato:** CSV (download via TabNet)

#### Uso:
```python
# Acesso via TabNet (selecionar indicadores e períodos)
# Disponível em: https://datasus.saude.gov.br/siops/

# Dados disponíveis:
# - Despesas com saúde por município
# - Receitas municipais em saúde
# - Proporção de gastos com saúde vs. receita total
# - Evolução temporal dos gastos
```

---

## CATEGORIA 6 — DADOS COMPLEMENTARES PARA CRUZAMENTO

### 48. Receita Federal — Dados Abertos (CNPJ)
**Órgão:** Receita Federal do Brasil
**Portal:** `https://dados.gov.br/dados/conjunto-dados/cadastro-nacional-da-pessoa-juridica`
**Formato:** CSV (download em lote)
**Autenticação:** Não requerida

#### Dados disponíveis:
- Cadastro completo de todas as empresas do Brasil (atualização mensal)
- Campos: CNPJ, razão social, nome fantasia, CNAE, situação, data abertura, capital social, QSA
- Download em: `https://dados.gov.br/dados/conjunto-dados/cadastro-nacional-da-pessoa-juridica`

#### Para consultas pontuais, usar Minha Receita (API #42 acima)

#### Exemplo — Processar dados em lote:
```python
import pandas as pd

# Após download dos CSVs da Receita
df_empresas = pd.read_csv("K3241.K03200Y0.D20809.ESTABELE", sep=";", encoding="latin-1", header=None,
    names=["cnpj_basico", "cnpj_ordem", "cnpj_dv", "matriz_filial", "nome_fantasia",
           "situacao_cadastral", "data_situacao", "motivo_situacao", "nome_cidade_exterior",
           "pais", "data_inicio_atividade", "cnae_principal", "cnae_secundario",
           "tipo_logradouro", "logradouro", "numero", "complemento", "bairro",
           "cep", "uf", "municipio", "ddd1", "telefone1", "ddd2", "telefone2",
           "ddd_fax", "fax", "correio_eletronico", "situacao_especial", "data_situacao_especial"])

# Filtrar empresas ativas em um município
df_ativas = df_empresas[(df_empresas["situacao_cadastral"] == "02") & (df_empresas["uf"] == "PR")]
```

---

### 49. DI — Débitos de IFs ao Banco Central
**Órgão:** Banco Central
**Base URL:** `https://www.bcb.gov.br/api/servico/sitebcb/di`
**Autenticação:** Não requerida

#### Uso:
```python
import requests

# Informações de instituições financeiras
url = "https://www.bcb.gov.br/api/servico/sitebcb/di/instituicao"
resp = requests.get(url)
# Retorna dados de bancos, financeiras, etc.
```

---

### 50. INEP — Dados Educacionais
**Órgão:** INEP / Ministério da Educação
**Portal:** `https://inep.gov.br/microdados`
**Base URL (API):** Não há API REST oficial — dados via download em CSV
**Formato:** CSV (microdados)

#### Dados disponíveis:
- Censo Escolar (escolas, matrículas, infraestrutura)
- Censo da Educação Superior
- ENEM (resultados por escola/município)
- IDEB (Índice de Desenvolvimento da Educação Básica)
- Prova Brasil

#### Uso para cruzamento:
```python
import pandas as pd

# Censo Escolar
df_escolas = pd.read_csv("microdados_ed_basica_2024.csv", sep=";", encoding="latin-1")

# Cruzar com obras de escolas (ObrasGov/PAC)
# Identificar escolas sem infraestrutura básica que receberam verbas de emendas
df_sem_lab = df_escolas[df_escolas["IN_LABORATORIO_CIENCIAS"] == 0]
```

---

### 51. DATASUS — Dados de Saúde
**Órgão:** Ministério da Saúde / DATASUS
**Portais:** 
- `https://datasus.saude.gov.br/` (principal)
- `https://opendatasus.saude.gov.br/` (dados abertos)
- `https://apidadosabertos.saude.gov.br/` (API)

#### Dados disponíveis via TabNet:
- SIH/SUS (Internações Hospitalares)
- SIA/SUS (Ambulatorial)
- SIM (Mortalidade)
- SINASC (Nascidos vivos)
- SINAN (Agravos de notificação)
- CNES (Cadastro Nacional de Estabelecimentos de Saúde)

#### Exemplo — Internações SUS:
```python
import requests

# TabNet permite consultas via POST para gerar tabelas
# Url base: https://datasus.saude.gov.br/sih-sus/

# Para dados massivos, usar download dos microdados em:
# https://opendatasus.saude.gov.br/
```

---

### 52. CNPJ Full (Receita Federal) — Mirror Atualizado
**Organização:** Comunidade / Open Data
**Repositório:** `https://github.com/andrebandini/cnpj-full`
**Formato:** Parquet (processamento eficiente)

#### Vantagem sobre CSV original:
- Dados particionados em formato Parquet
- Atualização mensal automatizada
- Processamento muito mais rápido com pandas/polars
- Inclui QSA (Quadro Societário Administrativo)

#### Exemplo:
```python
import polars as pl

# Leitura eficiente com Polars
df = pl.read_parquet("cnpj_full/estabelecimentos/")
df_ativas = df.filter(pl.col("situacao_cadastral") == "02")
```

---

### 53. Escala Brasil Transparente (EBT) — Índice de Transparência
**Órgão:** CGU
**Portal:** `https://escalaabrt.cgu.gov.br/`
**Autenticação:** Não requerida (consulta web)
**Formato:** Dados via web scraping ou CSV

#### Uso:
- Avaliar índice de transparência de municípios e estados
- Cruzar com indicadores de gasto público
- Identificar municípios com baixa transparência que receberam alto volume de emendas

---

---

## CRUZAMENTOS DE ALTO VALOR (CASOS DE USO REAIS)

### CRUZAMENTO 5 — Despesas parlamentares vs. fornecedores de emendas
```python
# 1. Buscar deputado e suas despesas
dep = requests.get("https://dadosabertos.camara.leg.br/api/v2/deputados/204554/despesas?ano=2024&itens=500").json()

# 2. Extrair CNPJs dos fornecedores
cnpjs_fornecedores = set()
for d in dep["dados"]:
    cnpj = d.get("cnpjCpf", "").replace(".", "").replace("/", "").replace("-", "")
    if len(cnpj) == 14:
        cnpjs_fornecedores.add(cnpj)

# 3. Verificar cada fornecedor no CEIS/CNEP e Minha Receita
for cnpj in cnpjs_fornecedores:
    # Minha Receita (gratuito, sem rate limit)
    dados = requests.get(f"https://minhareceita.org/{cnpj}").json()
    if dados:
        print(f"{dados['razao_social']} | Situação: {dados.get('descricao_situacao_cadastral', '?')} | Abertura: {dados.get('data_inicio_atividade', '?')}")
    
    # CEIS (requer token)
    # sancoes = api_transparencia.verificar_sancoes(cnpj)
    # if sancoes["flag"]: print("🚨 FLAG: Fornecedor sancionado recebendo verba parlamentar")
```

---

### CRUZAMENTO 6 — Operadoras de saúde com contratos públicos
```python
# 1. Buscar operadoras de saúde por nome/CNPJ
url = "https://www.ans.gov.br/operadoras-entity/v1/operadoras/"
params = {"cnpj": "12345678000190", "size": 1}
resp = requests.get(url, params=params)
operadora = resp.json()["content"][0]

# 2. Verificar se a operadora tem contratos com o governo
# via Portal da Transparência (requer token)
contratos = api_transparencia.contratos_fornecedor(operadora["cnpj"])

# 3. Se operadora está em regime especial, marcar como flag
if operadora.get("classificacao_sigla") in ["FIME", "FIDC"]:
    print(f"🚨 FLAG: Operadora {operadora['razao_social']} em classificação especial: {operadora['classificacao_sigla']}")
```

---

### CRUZAMENTO 7 — Emendas parlamentares vs. execução municipal
```python
# 1. Buscar emendas destinadas a um município
url = "https://api.transferegov.gestao.gov.br/transferenciasespeciais/programa_especial"
params = {"ano_programa": "eq.2024", "limit": 100}
resp = requests.get(url, params=params)

# 2. Cruzar com SICONFI (receitas e despesas do município)
url_rreo = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo"
# ... buscar RREO do município ...

# 3. Comparar emendas destinadas vs. efetivamente executadas
# Flag: emendas com alto valor destinado mas baixa execução
```

---

## CONFIGURAÇÃO INICIAL DO SISTEMA

### Dependências Python:
```bash
pip install requests pandas basedosdados python-dotenv tqdm
```

### Variáveis de ambiente (.env):
```
TOKEN_TRANSPARENCIA=sua_chave_aqui
TOKEN_DATAJUD=APIKey sua_chave_aqui
PROJETO_GCP=seu-projeto-bigquery
TELEGRAM_BOT_TOKEN=token_do_bot
TELEGRAM_CHAT_ID=seu_chat_id
```

### Obter tokens gratuitos:
- **Portal da Transparência:** `https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email`
- **DataJud (CNJ):** `https://datajud-wiki.cnj.jus.br/api-publica/acesso`
- **Base dos Dados:** Conta Google em `https://basedosdados.org`
- **dados.gov.br:** `https://dados.gov.br/dados/conteudo/como-acessar-a-api-do-portal-de-dados-abertos-com-o-perfil-de-consumidor`
- **DEMAS/SUS:** Cadastro em `https://dadosabertos.saude.gov.br`
- **Conecta Gov.br:** Adesão em `https://www.gov.br/conecta`
- **SIORG:** Credenciais Conecta Gov.br (mesmo portal acima)


---

## TABELA RESUMO — TODAS AS 53 APIs

| # | Nome | Categoria | Auth | Status | Endpoint Base |
|---|------|-----------|------|--------|----------------|
| 1 | Portal de Compras | Licitações | Não | ❌ Swagger UI | api.compras.dados.gov.br |
| 2 | CEIS | Licitações | Token CGU | ⚠️ Token | api.portaldatransparencia.gov.br |
| 3 | CNEP | Licitações | Token CGU | ⚠️ Token | api.portaldatransparencia.gov.br |
| 4 | PNCP | Licitações | Não | ❌ 405 | pncp.gov.br/api/pncp/v1 |
| 5 | TCU Acórdãos | Licitações | Não | ⚠️ Não testado | contas.tcu.gov.br |
| 6 | TCE-PR | Licitações | Não | ⚠️ CSV only | tce.pr.gov.br |
| 7 | SICONV | Licitações | Não | ⚠️ Não testado | api.convenios.gov.br |
| 8 | dados.gov.br | Licitações | Token | ⚠️ Não testado | dados.gov.br/api/3 |
| 9 | SADIPEM | Licitações | Não | ⚠️ Não testado | apidatalake.tesouro.gov.br |
| 10 | SICONFI | Licitações | Não | ✅ Funcionando | apidatalake.tesouro.gov.br |
| 11 | CEPIM | Licitações | Token CGU | ⚠️ Token | api.portaldatransparencia.gov.br |
| 12 | CEAF | Licitações | Token CGU | ⚠️ Token | api.portaldatransparencia.gov.br |
| 13 | DataJud | Crimes | API Key CNJ | ⚠️ Key | api-publica.datajud.cnj.jus.br |
| 14 | CNCIAI | Crimes | Credenciamento | ⚠️ Credenc. | cnj.jus.br/sistemas/cnciai |
| 15 | CNPJ.ws (RFB) | Cadastro Empresarial | Não | ✅ 3 req/min | publica.cnpj.ws |
| 16 | COAF Dados | Crimes | Não | ⚠️ CSV only | gov.br/coaf |
| 17 | Bacen Olinda | Financeiro | Não | ⚠️ Não testado | olinda.bcb.gov.br |
| 18 | CVM | Crimes | Não | ❌ 404 | dados.cvm.gov.br |
| 19 | MPF | Crimes | Não | ⚠️ CSV only | mpf.mp.br |
| 20 | SINESP | Crimes | Não | ⚠️ CSV only | gov.br/mj |
| 21 | Transparência Federal | Contratos | Token CGU | ⚠️ Token | api.portaldatransparencia.gov.br |
| 22 | SIAFI | Contratos | Não | ⚠️ Não testado | apidatalake.tesouro.gov.br |
| 23 | Querido Diário | Contratos | Não | ✅ Funcionando* | api.queridodiario.ok.org.br |
| 24 | BNDES | Contratos | Não | ⚠️ Não testado | dadosabertos.bndes.gov.br |
| 25 | SIMEC | Contratos | Não | ⚠️ Não testado | simec.mec.gov.br |
| 26 | Emendas Parlamentares | Contratos | Token CGU | ⚠️ Token | api.portaldatransparencia.gov.br |
| 27 | NF-e Governo | Contratos | Token CGU | ⚠️ Token | api.portaldatransparencia.gov.br |
| 28 | TSE Candidatos | Eleições | Não | ⚠️ ZIP/CSV | cdn.tse.jus.br |
| 29 | TSE Bens | Eleições | Não | ⚠️ ZIP/CSV | cdn.tse.jus.br |
| 30 | TSE Financiamento | Eleições | Não | ⚠️ ZIP/CSV | cdn.tse.jus.br |
| 31 | CNIA | Eleições | Não | ⚠️ Web only | cnj.jus.br/sistemas/cnia |
| 32 | IBGE MUNIC | Eleições | Não | ✅ Funcionando | servicodados.ibge.gov.br |
| 33 | Juntas Comerciais | Eleições | Não | ⚠️ CSV only | gov.br/drei |
| 34 | Base dos Dados | Eleições | Google/GCP | ⚠️ BigQuery | basedosdados.org |
| 35 | CAF (Bacen) | Financeiro | Não | ⚠️ Não testado | bcb.gov.br/dadosabertos |
| 36 | ATRICON/IEGM | Transparência | Não | ⚠️ Não testado | — |
| 37 | Câmara Deputados | Legislativo | Não | ✅ Funcionando | dadosabertos.camara.leg.br/api/v2 |
| 38 | Senado Federal | Legislativo | Não | ⚠️ Não testado | dadosabertos.senado.gov.br/api/3 |
| 39 | TransfereGov | Transferências | Não | ✅ Funcionando | api.transferegov.gestao.gov.br |
| 40 | ANS Operadoras | Saúde | Não | ✅ Funcionando | ans.gov.br/operadoras-entity/v1 |
| 41 | DEMAS/SUS | Saúde | Token | ⚠️ Cadastro | apidadosabertos.saude.gov.br/api/v1 |
| 42 | Minha Receita | Cadastro Empresarial | Não | ✅ Funcionando | minhareceita.org/{CNPJ} |
| 43 | Bacen Olinda | Financeiro | Não | ⚠️ Não testado | olinda.bcb.gov.br |
| 44 | SIORG | Organizacional | Conecta | ⚠️ Credenciais | api.siorg.gov.br/api/v1 |
| 45 | Conecta Gov.br | Múltiplas | Conecta | ⚠️ Credenciais | gov.br/conecta/catalogo |
| 46 | ObrasGov | Obras | Não | ❌ CSV only | repositorio.dados.gov.br/seges/detru |
| 47 | SIOPS | Saúde | Não | ⚠️ TabNet | datasus.saude.gov.br/siops |
| 48 | Receita Federal | Cadastro Empresarial | Não | ✅ CSV download | dados.gov.br |
| 49 | DI Bacen | Financeiro | Não | ⚠️ Não testado | bcb.gov.br/api |
| 50 | INEP | Educação | Não | ✅ CSV download | inep.gov.br/microdados |
| 51 | DATASUS | Saúde | Token | ⚠️ Cadastro | opendatasus.saude.gov.br |
| 52 | CNPJ Full (Parquet) | Cadastro Empresarial | Não | ✅ Parquet | github.com/andrebandini/cnpj-full |
| 53 | Escala Brasil Transparente | Transparência | Não | ✅ Web | escalaabrt.cgu.gov.br |

\* Querido Diário: API funciona mas nem todos os municípios estão indexados.

---

## TESTE DE APIs — 2026-05-01

### ✅ Funcionando (sem autenticação)
- **IBGE Localidades** (`servicodados.ibge.gov.br/api/v1`) — Retorna dados de municípios, estados, regiões
- **SICONFI** (`apidatalake.tesouro.gov.br/ords/siconfi`) — Retorna entes municipais, dados contábeis
- **CNPJ.ws** (`publica.cnpj.ws/cnpj/{CNPJ}`) — Consulta CNPJ completa (limite: 3 req/min)
- **Querido Diário** (`api.queridodiario.ok.org.br`) — API online, mas nem todos os municípios estão indexados
- **Câmara dos Deputados** (`dadosabertos.camara.leg.br/api/v2`) — Deputados, despesas, proposições
- **TransfereGov** (`api.transferegov.gestao.gov.br`) — Emendas parlamentares, programas especiais
- **ANS Operadoras** (`ans.gov.br/operadoras-entity/v1`) — 4.162+ operadoras de planos de saúde
- **Minha Receita** (`minhareceita.org/{CNPJ}`) — CNPJ completo incluindo QSA, sem rate limit
- **CNPJ Full (Parquet)** — Download em lote, processamento eficiente

### ⚠️ Requer Token/Credencial
- **Portal da Transparência (CGU)** — Token gratuito em portaldatransparencia.gov.br/api-de-dados/cadastrar-email
- **CEIS/CNEP/CEPIM/CEAF** — Mesmo token CGU
- **DataJud (CNJ)** — API Key em datajud-wiki.cnj.jus.br/api-publica/acesso
- **DEMAS/SUS** — Cadastro em dadosabertos.saude.gov.br
- **SIORG / Conecta Gov.br** — Adesão em gov.br/conecta (certificado ICP-Brasil)
- **DATASUS** — Cadastro em opendatasus.saude.gov.br

### ❌ Problemas Encontrados
- **Compras.gov.br** — Endpoint redireciona p/ Swagger UI; formato de query pode ter mudado
- **PNCP** — Retornou 405 Method Not Allowed; estrutura de endpoint pode ter mudado
- **CVM Penalidades** — URL retornou 404; path pode ter mudado
- **ObrasGov** — API REST não funcional; usar dados CSV do repositório

### Notas
- Endpoint `no_ente` no SICONFI não filtra corretamente; usar `cod_ibge` direto
- CNPJ.ws tem rate limit de 3 consultas/minuto; Minha Receita (#42) não tem esse limite
- Para Inajá-PR, código IBGE é 4110708
- Para consultas pontais de CNPJ, preferir Minha Receita (#42); para volume em lote, usar CNPJ Full (#52)
- APIs do Senado e Bacen Olinda não foram testadas ainda — verificar endpoints antes de uso em produção
