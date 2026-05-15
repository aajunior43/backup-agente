# Dataset Saúde

Este dataset contém seus dados de saúde exportados via Telegram e exames laboratoriais.

## Como os dados foram coletados

Os dados foram enviados pelo usuário via Telegram (mensagens de áudio, foto e texto) e importados para CSV. O arquivo inclui:
- **Medições de pressão arterial (PA)**: sistólica e diastólica em mmHg
- **Frequência cardíaca (FC)**: em bpm
- **Glicose**: em mg/dL (medição casual)
- **Perfil lipídico**: colesterol total, HDL, LDL, triglicerídeos, VLDL
- **Exame de sangue**: sódio, potássio, hemoglobina, hematócrito, leucócitos, plaquetas
- **Função hepática/renal**: creatinina, ácido úrico, TGO/AST, TGP/ALT

## Cobertura
- **Período**: Fevereiro 2026 - Abril 2026
- **Registros**: 21 medições
- **Timestamps válidos**: 20 registros

## Regras de Negócio

### Pressão Arterial
- Normal: sistólica < 120 e diastólica < 80
- Elevada: sistólica 120-129 e diastólica < 80
- Hipertensão Estágio 1: sistólica 130-139 ou diastólica 80-89
- Hipertensão Estágio 2: sistólica ≥ 140 ou diastólica ≥ 90

### Glicose
- Normal: < 100 mg/dL (jejum), < 140 mg/dL (casual)
- Pré-diabetes: 100-125 mg/dL (jejum)
- Diabetes: ≥ 126 mg/dL (jejum), ≥ 200 mg/dL (casual)

### Colesterol
- LDL ideal: < 100 mg/dL
- HDL bom: > 40 mg/dL (homem), > 50 mg/dL (mulher)
- Triglicerídeos: < 150 mg/dL é normal

## Consultas de Exemplo

### Resumo de medições de pressão arterial
```sql
SELECT 
    ROUND(AVG("PA Sistolica"), 1) AS media_sistolica,
    ROUND(AVG("PA Diastolica"), 1) AS media_diastolica,
    COUNT(*) AS total_medicoes
FROM medicoes 
WHERE "PA Sistolica" IS NOT NULL;
```

### Evolução da glicose ao longo do tempo
```sql
SELECT 
    datahora,
    "Glicose" AS glicose,
    "Observacoes" AS fonte
FROM medicoes 
WHERE "Glicose" IS NOT NULL 
ORDER BY datahora;
```

### Último exame laboratorial completo
```sql
SELECT * FROM medicoes 
WHERE "Tipo" LIKE '%Lipídico%' OR "Tipo" LIKE '%Sangue%'
ORDER BY datahora DESC LIMIT 1;
```

### Estatísticas do perfil lipídico
```sql
SELECT 
    ROUND(AVG("Colesterol Total"), 1) AS media_colesterol,
    ROUND(AVG("LDL"), 1) AS media_ldl,
    ROUND(AVG("HDL"), 1) AS media_hdl
FROM medicoes 
WHERE "Colesterol Total" IS NOT NULL;
```

## Notas
- Dados originados de múltiplas fontes: Telegram (áudio, foto, texto), exame laboratorial DASA Cascavel
- Uma linha foi excluída do timestamp por conter valor inválido na hora ("-2:13")