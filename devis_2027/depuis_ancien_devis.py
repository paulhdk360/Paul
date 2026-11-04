"""Reprend un ancien devis Enedril (tableau « BHA » avec Stand by / Operating / Maintenance / Preparing / Restocking / LIH)
et le met au format Devis 2027 (classeur avec onglets 1 Affaire, 2 Matériel, 3 Options, 4 Devis), en français ou en anglais.
Usage : python3 depuis_ancien_devis.py <ancien_devis.xlsx> <modele_2027_vierge.xlsx> <sortie.xlsx> <FR|EN> [client]
Correspondance des colonnes : Stand by -> Stand-by (S) ; Operating rate -> Opérations (O) ; Maintenance -> UC ;
Preparing charge -> Inspection ; Restocking charge -> Restocking ; LIH -> LIH / DBR."""
import sys, re, datetime
import openpyxl

SRC, MODEL, OUT, LANG = sys.argv[1:5]; CLIENT = sys.argv[5] if len(sys.argv) > 5 else ''
EN = LANG.upper() == 'EN'
src = openpyxl.load_workbook(SRC, data_only=True).worksheets[0]
title = src['A1'].value or ''
ref = src['B2'].value; well = src['B3'].value; date = src['B4'].value
if not CLIENT:
    m = re.search(r'/\s*([A-Za-z0-9 ]+?)\s*-\s*Puits', title); CLIENT = m.group(1).strip() if m else ''

rows = []                                     # (bannière?, description, qté, S, O, UC, LIH, inspection, restocking)
num = lambda v: v if isinstance(v, (int, float)) else None
for r in range(6, src.max_row + 1):
    a, b = src.cell(r, 1).value, src.cell(r, 2).value
    if isinstance(a, str) and a.strip().upper().startswith('BHA'):
        rows.append(('Oui', a.strip(), None, None, None, None, None, None, None)); continue
    if a == '#' or b is None: continue
    q = src.cell(r, 3).value
    try: q = int(q)
    except (TypeError, ValueError): q = None
    lih = src.cell(r, 9).value
    if isinstance(lih, str): lih = 'at cost +15%' if EN else 'au coût +15 %'
    cost = lambda c: src.cell(r, c).value
    rows.append(('', str(b).strip(), q, num(cost(4)), num(cost(5)), num(cost(6)), lih, num(cost(7)), num(cost(8))))

wb = openpyxl.load_workbook(MODEL)
wa, wm, wo, wd = wb['1 Affaire'], wb['2 Matériel'], wb['3 Options'], wb['4 Devis']
wa['C6'] = ref; wa['C8'] = CLIENT; wa['C10'] = well
if isinstance(date, (datetime.datetime, datetime.date)): wa['C7'] = date
for i, row in enumerate(rows):
    r = 6 + i
    for col, v in zip('BCDEFGHIJ', row):
        if v not in (None, ''): wm[f'{col}{r}'] = v
wo['C9'] = 'Non'; wo['C10'] = 'Non'            # pas de ligne de transport dans l'ancien devis
wb['Listes']['H1'] = 2 if EN else 1              # langue du devis
# lignes affichées dans l'onglet 4 : une par ligne de matériel (le filtre masque le reste)
for i in range(64): wd.row_dimensions[16 + i].hidden = i >= len(rows)
wb.save(OUT); print('ok', OUT, len(rows), 'lignes')
