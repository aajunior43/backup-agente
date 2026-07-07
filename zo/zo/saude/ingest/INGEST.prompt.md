# Dataset Saúde - Ingestion

## Source Files
- `source/dados_saude.csv` - CSV exportado do Telegram com medições de saúde

## Tables Created
| Table | Description | Row Count |
|-------|-------------|-----------|
| `medicoes` | Registro de medições de saúde — pressão arterial, glicose, exames laboratoriais | 21 |

## Transformations
- Timestamps combinados de Data + Hora em coluna `datahora` (TIMESTAMP)
- Validação regex para filtrar linhas com datas inválidas (ex: "-2:13" na hora)
- 20 de 21 linhas com timestamp válido (2026-02-22 a 2026-04-30)

## Running
```bash
cd /home/workspace/saude
python ingest/ingest.py
```

## Extending
Para adicionar novos dados, salve o CSV em `source/` e execute `python ingest/ingest.py` novamente.