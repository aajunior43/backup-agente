#!/usr/bin/env python3
"""
Ingest script for saude dataset.
Run from dataset root: python ingest/ingest.py
"""
import duckdb
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data.duckdb"
SOURCE_DIR = Path(__file__).parent.parent / "source"

def main():
    DB_PATH.unlink(missing_ok=True)
    con = duckdb.connect(str(DB_PATH))
    
    # Load CSV with headers
    con.execute("""
        CREATE TABLE medicoes AS 
        SELECT * FROM read_csv_auto('source/dados_saude.csv', header=true)
    """)
    
    # Parse timestamp from Data + Hora (handle invalid values)
    con.execute("ALTER TABLE medicoes ADD COLUMN datahora TIMESTAMP")
    con.execute("""
        UPDATE medicoes 
        SET datahora = strptime(Data::VARCHAR || ' ' || COALESCE(NULLIF(Hora, ''), '00:00'), '%Y-%m-%d %H:%M')
        WHERE Hora NOT LIKE '-%' AND Data::VARCHAR ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    """)
    
    # Table comments
    con.execute("COMMENT ON TABLE medicoes IS 'Registro de medições de saúde — pressão arterial, glicose, exames laboratoriais'")
    
    # Column comments (quoted for spaces)
    con.execute('COMMENT ON COLUMN medicoes."Data" IS \'Data da medição\'')
    con.execute('COMMENT ON COLUMN medicoes."Hora" IS \'Hora da medição\'')
    con.execute('COMMENT ON COLUMN medicoes.datahora IS \'Timestamp combinado Data + Hora\'')
    con.execute('COMMENT ON COLUMN medicoes."PA Sistolica" IS \'Pressão arterial sistólica (mmHg)\'')
    con.execute('COMMENT ON COLUMN medicoes."PA Diastolica" IS \'Pressão arterial diastólica (mmHg)\'')
    con.execute('COMMENT ON COLUMN medicoes."FC (bpm)" IS \'Frequência cardíaca (bpm)\'')
    con.execute('COMMENT ON COLUMN medicoes."Glicose" IS \'Glicose em mg/dL (medição casual)\'')
    con.execute('COMMENT ON COLUMN medicoes."Glicose Jejum" IS \'Glicose em jejum mg/dL\'')
    con.execute('COMMENT ON COLUMN medicoes."Tipo" IS \'Tipo de registro: Medicao ou nome do exame\'')
    con.execute('COMMENT ON COLUMN medicoes."Sodio" IS \'Sódio em mEq/L\'')
    con.execute('COMMENT ON COLUMN medicoes."Potassio" IS \'Potássio em mEq/L\'')
    con.execute('COMMENT ON COLUMN medicoes."Hemoglobina" IS \'Hemoglobina em g/dL\'')
    con.execute('COMMENT ON COLUMN medicoes."Hematocrito" IS \'Hematócrito em %\'')
    con.execute('COMMENT ON COLUMN medicoes."Colesterol Total" IS \'Colesterol total em mg/dL\'')
    con.execute('COMMENT ON COLUMN medicoes."HDL" IS \'HDL (bom colesterol) em mg/dL\'')
    con.execute('COMMENT ON COLUMN medicoes."LDL" IS \'LDL (mau colesterol) em mg/dL\'')
    con.execute('COMMENT ON COLUMN medicoes."Triglicerideos" IS \'Triglicerídeos em mg/dL\'')
    con.execute('COMMENT ON COLUMN medicoes."VLDL" IS \'VLDL em mg/dL\'')
    con.execute('COMMENT ON COLUMN medicoes."Creatinina" IS \'Creatinina em mg/dL\'')
    con.execute('COMMENT ON COLUMN medicoes."Acido Urico" IS \'Ácido úrico em mg/dL\'')
    con.execute('COMMENT ON COLUMN medicoes."TGO/AST" IS \'TGO/AST em U/L\'')
    con.execute('COMMENT ON COLUMN medicoes."TGP/ALT" IS \'TGP/ALT em U/L\'')
    con.execute('COMMENT ON COLUMN medicoes."Leucocitos" IS \'Leucócitos em células/mm³\'')
    con.execute('COMMENT ON COLUMN medicoes."Plaquetas" IS \'Plaquetas em células/mm³\'')
    con.execute('COMMENT ON COLUMN medicoes."Observacoes" IS \'Observações e fonte dos dados\'')
    
    con.close()
    print(f"Created {DB_PATH}")

if __name__ == "__main__":
    main()