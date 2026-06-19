---
name: oficio-municipal
description: "Analyze ofícios (official municipal documents), create organized folder structure, action plans, and draft responses. For use with prefeitura documents."
triggers:
  - "ofício"
  - "oficio"
  - "documento oficial"
  - "controladoria"
  - "controle interno"
  - "TCE"
  - "CAUC"
---

# Ofício Municipal — Analysis & Response Workflow

## When to use
When Junior receives an ofício (official letter/memo) from Controladoria Interna, TCE, or other municipal organs and needs analysis + response.

## Folder Structure
Shared documents go in `/compartilhado/prefeitura/oficios/`:
```
/compartilhado/prefeitura/oficios/
├── NNN-descricao-resumida/
│   ├── YYYY-MM-DD_Oficio_NNN_Origem_Assunto.pdf   ← original
│   ├── PLANO_DE_ACAO.md                           ← checklist
│   └── MODELO_RESPOSTA.md                         ← draft response
```

## Step-by-step

### 1. Extract PDF content
Try PyMuPDF first (fast, free, no API calls):
```bash
cd ~/.hermes/hermes-agent && source venv/bin/activate && python3 -c "
import pymupdf
doc = pymupdf.open('/path/to/file.pdf')
for page in doc: print(page.get_text())
"
```
Note: use `import pymupdf` (modern name), NOT `import fitz` (deprecated alias).
If PyMuPDF returns empty/garbage text (scanned PDF), fall back to GPT-4o Vision OCR (see ocr-scanned-pdfs skill).
Note: `vision_analyze` does NOT support PDFs directly. `pdftotext` is not available on this VPS.

### 2. Analyze and identify
- **Remetente** (who sent)
- **Destinatário** (who receives — often Junior himself)
- **Assunto** (subject)
- **Irregularidades/Pendências** (list each one)
- **Prazos** (deadlines)
- **Consequências** (sanctions if not resolved)
- **Urgência** (🔴 Alta / 🟡 Média / 🟢 Baixa)

### 3. Create folder and files
- Create folder: `mkdir -p /compartilhado/prefeitura/oficios/NNN-descricao/`
- Move PDF into it
- Create `PLANO_DE_ACAO.md` with checklist of actions
- Create `MODELO_RESPOSTA.md` with draft official response

### 4. Response template structure
```
Header: Prefeitura Municipal de Inajá / CNPJ / Depto
Date
Ofício number
Addressee
Subject line

Body:
1. Acknowledgment of receipt
2. Actions taken / planned (numbered list)
3. Responsible servants (names, roles)
4. Timeline / cronograma
5. Closing formalities
Signature block
```

### 5. Key fields to ask Junior
- Nomes dos servidores designados
- Numeração do ofício de resposta
- Prazos reais do sistema/envolvido
- Contexto adicional sobre a situação

## Reference Files
- `references/tce-pr-agenda-2026.md` — Full TCE-PR obligation schedule for FY 2026 (IN 195/2025)

### 3.5 Quick-save for immediate reference
For fast reference (before organizing into shared folder), save a markdown summary to `~/workspace/dados/oficio-NNN-descricao.md`. Later move to `/compartilhado/prefeitura/oficios/` when organizing.

### 3.6 Multi-ofício tracking
When processing multiple ofícios in one session, always confirm each save individually AND give a final summary confirming all were saved. User expects explicit "saved X of Y" feedback.

### 3.7 Memory entries for ofícios
Keep memory entries ultra-concise: ofício number, one-line subject, deadline if urgent, and file path pointer. Full detail goes in the markdown file, NOT in memory. Example: `020 (CAUC irregularidades, prazo 5 dias)` — not the full list of 15 items.

## Reference Files
- `references/tce-pr-agenda-2026.md` — Full TCE-PR obligation schedule for FY 2026 (IN 195/2025)
- `references/cauc-irregularidades-pattern.md` — CAUC analysis pattern: classify items as 🔴 A Comprovar, ⚠️ Expiring, ✅ Comprovado. Includes competence mapping per CAUC item.
- `references/competencia-setorial-inaja.md` — Full mapping of which department handles what in Inajá (Finanças vs Contabilidade vs Educação vs CI etc.). Use when drafting responses that delimit competence.
- `references/sit-transferencias-pattern.md` — SIT/Sistema Integrado de Transferências analysis pattern. Defense line: SIT operation/fiscalization = CI competence, not Finanças.

## Defense Pattern: Delimiting Competence

When the Controle Interno (or any organ) sends ofícios requesting the Diretor de Finanças to assume responsibility for items outside Finanças' legal competence, the response MUST:

1. **Acknowledge receipt** — Always start by confirming receipt (date + reference)
2. **Explicitly delimit competence** — For each item that is NOT Finanças' responsibility, state: which department IS responsible and why (legal basis if possible)
3. **Affirm only Finanças' scope** — List what Finanças WILL do, but no more
4. **Redirect to competent organs** — Suggest CI direct recommendations to the correct departments
5. **Always include "CÓPIA: Gabinete do Prefeito"** — This creates a formal record that the Prefeito is aware, preventing CI from acting unilaterally

Known competence mapping for Inajá:
- RG: Contabilidade (elaboração + encaminhamento SICONFI)
- RREO: Contabilidade (elaboração + encaminhamento SICONFI)
- RREO Anexo 8 / Fundeb / SIOPE: Secretaria Municipal de Educação
- MSC (Matriz de Saldos Contábeis): Contabilidade
- CDP (Cadastro da Dívida Pública): Contabilidade
- CADIN: Órgão originário da inscrição (varies — check reference)
- SIM/AM, SIM/AP: Secretaria de Assistência Social
- Frotas: Setor de Transportes
- Patrimônio: Setor de Patrimônio
- CPASMI: Órgão gestor de pessoal/previdência
- Mural de Licitações: Controle Interno + setores licitantes
- SIT (análise/fiscalização): Controle Interno
- Execução Fiscal (TCE): Procuradoria Municipal / Setor Jurídico
- Conciliações bancárias: Finanças ✓
- Dados financeiros/orçamentários: Finanças ✓

### Multi-ofício "cerco" pattern
If multiple ofícios arrive from the same sender in a short span (e.g., 2-3 days), analyze them TOGETHER. CI often sends a barrage to create a paper trail making Finanças responsible for everything. Each response must delimit separately but consistently. Alert Junior to the pattern.

## PDF Generation for Ofício Responses

Use fpdf2 (installed in Hermes venv) with DejaVu fonts for full Unicode support (Portuguese characters: ã, ç, é, etc.):

```python
from fpdf import FPDF

class OficioPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=25)
        # DejaVu fonts — required for Portuguese/Unicode characters
        self.add_font('DejaVu', '', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
        self.add_font('DejaVu', 'B', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
        # NOTE: DejaVuSans-Oblique.ttf does NOT exist on this VPS — use Serif for italic if needed

pdf = OficioPDF()
pdf.add_page()
pdf.set_font('DejaVu', 'B', 11)
# ... build content ...
pdf.output('/path/to/output.pdf')
```

**Pitfall:** Do NOT use Helvetica with fpdf2 — it cannot encode Unicode characters like `—` (em dash), `ã`, `ç`. Always use DejaVu.

Standard ofício PDF header:
- Prefeitura Municipal de Inajá / Estado do Paraná / CNPJ / Endereço + Telefone
- Horizontal rule separator
- Footer: "Departamento de Finanças — Prefeitura Municipal de Inajá/PR"

Standard ofício PDF closing:
- "Atenciosamente," + space for signature
- Name: **Aleksandro Alves da Rocha Junior**
- Title: Diretor do Departamento de Finanças
- "CÓPIA: Gabinete do Prefeito João Eder Aguilar"

## Pitfalls
- Always check if PDF text extraction is clean — some scanned PDFs produce garbled text
- Ofícios from Controladoria often reference multiple systems (SICONFI, SIOPE, CAUC, SIT) — identify each one
- Response deadlines are usually 5 dias úteis unless stated otherwise
- Junior is the Diretor do Departamento de Finanças — he signs the responses
- CAUC ofícios have a specific pattern: list items by status (A Comprovar / Expiring / Comprovado) with item numbers, descriptions, sources, and validity dates — always extract the extrato table structure
- When memory is near capacity, consolidate ofício entries to one-liners with file paths rather than listing all details
- **NEVER assume responsibility** for items outside Finanças' competence in ofício responses — always delimit explicitly
- **Do NOT use Helvetica for PDF generation** — it cannot handle Portuguese Unicode. Use DejaVu fonts instead
- **DejaVuSans-Oblique.ttf does not exist** on this VPS — if italic is needed, use DejaVuSerif instead
- Leave date fields as blanks (___) for Junior to fill in — do not guess dates of receipt or ofício numbers
