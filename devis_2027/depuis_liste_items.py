"""Met en forme un devis 2027 à partir d'une « liste d'items » par BHA (onglet Excel : titres « BHA #n … », puis lignes # / Description / Qté / origine / note).
Usage : python3 depuis_liste_items.py <liste.xlsx> "<onglet>" <modele_2027_vierge.xlsx> <sortie.xlsx> <FR|EN> <client>
- les BHA sont classés par numéro ; la quantité « - » donne une ligne sans quantité ;
- origine « Terega » (matériel fourni par le client) : mention ajoutée à la description, sans prix ;
- les prix ne sont pas dans la liste : colonnes de prix laissées vides (cases bleues à compléter dans l'onglet 2) ;
- notes internes (à usiner EDL, PREP CHARGE, commande NOV, demander devis…) : jamais imprimées, regroupées dans l'onglet « À compléter »."""
import sys, re, datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment

SRC, SHEET, MODEL, OUT, LANG, CLIENT = sys.argv[1:7]
EN = LANG.upper() == 'EN'
ws = openpyxl.load_workbook(SRC, data_only=True)[SHEET]
ref = ws['B2'].value; well = ws['B3'].value; date = ws['B4'].value
if isinstance(date, str):
    M = {'janvier': 1, 'février': 2, 'fevrier': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6, 'juillet': 7, 'août': 8, 'aout': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12, 'decembre': 12}
    m = re.match(r'(\d{1,2})\s+(\w+)\s+(\d{4})', date.strip().lower())
    date = datetime.date(int(m.group(3)), M[m.group(2)], int(m.group(1))) if m and m.group(2) in M else None

bhas = []                                   # [numéro, titre, [items]]
for r in range(5, ws.max_row + 1):
    a, b, c, d, e, f = (ws.cell(r, k).value for k in range(1, 7))
    if isinstance(a, str) and a.strip().upper().startswith('BHA'):
        n = re.search(r'#\s*(\d+)', a); title = a.strip()
        if d: title += ' · ' + str(d).strip()          # condition affichée sur le devis (ex. « Si Landing Nipple retiré… »)
        bhas.append([int(n.group(1)) if n else 99, title, []]); continue
    if a == '#' or b is None or not bhas: continue
    q = None
    try: q = int(c)
    except (TypeError, ValueError): pass
    bhas[-1][2].append(dict(row=r, desc=str(b).strip(), qty=q, origin=(str(d).strip() if d else ''), flag=(str(e).strip() if e else ''), note=(str(f).strip() if f else '')))
bhas.sort(key=lambda x: x[0])

wb = openpyxl.load_workbook(MODEL)
wa, wm, wo, wd = wb['1 Affaire'], wb['2 Matériel'], wb['3 Options'], wb['4 Devis']
wa['C6'] = ref; wa['C8'] = CLIENT; wa['C10'] = well
if isinstance(date, (datetime.date, datetime.datetime)): wa['C7'] = date
wo['C9'] = 'Non'; wo['C10'] = 'Non'
wb['Listes']['H1'] = 2 if EN else 1
supplied = ' (supplied by %s)' if EN else ' (fourni par %s)'
r = 6; notes = []
for n, title, items in bhas:
    wm[f'B{r}'] = 'Oui'; wm[f'C{r}'] = title
    wd.row_dimensions[16 + r - 6].height = 22 if len(title) <= 70 else (34 if len(title) <= 105 else 46)   # titres longs sur 2 ou 3 lignes
    r += 1
    for it in items:
        desc = it['desc'] + (supplied % CLIENT if it['origin'].lower().startswith('terega') else '')
        wm[f'C{r}'] = desc
        if it['qty']: wm[f'D{r}'] = it['qty']
        notes.append((title.split('—')[0].split('·')[0].strip(), it['desc'], it['qty'], it['origin'], it['flag'], it['note'], r))
        r += 1
NL = r - 6
for i in range(112): wd.row_dimensions[16 + i].hidden = i >= NL
# onglet de suivi : ce qui reste à compléter (non imprimé sur le devis)
wn = wb.create_sheet('À compléter', 4)
wn.sheet_properties.tabColor = 'E2231A'
heads = ['BHA', 'Description', 'Qté', 'Origine (interne)', 'Charge', 'Note interne', 'Ligne onglet 2']
for i, h in enumerate(heads, 1):
    c = wn.cell(1, i, h); c.font = Font(name='Calibri', bold=True, color='FFFFFF'); c.fill = PatternFill('solid', start_color='0A4FA0', end_color='0A4FA0')
for k, row in enumerate(notes, 2):
    for i, v in enumerate(row, 1): wn.cell(k, i, v)
    if row[4] or row[5] or row[3].lower().startswith(('à usiner', 'reservoir', 'nov', 'matfor', 'mocs')):
        for i in range(1, 8): wn.cell(k, i).fill = PatternFill('solid', start_color='FFF4D6', end_color='FFF4D6')
for col, w in zip('ABCDEFG', (24, 70, 6, 24, 16, 34, 14)): wn.column_dimensions[col].width = w
wn.freeze_panes = 'A2'
wn.cell(len(notes) + 4, 2, 'Les prix (Stand-by, Opérations, UC, valeur de remplacement, inspection / préparation) sont à saisir dans l’onglet « 2 Matériel ». Cet onglet n’est pas imprimé sur le devis.')
wb.save(OUT); print('ok', OUT, NL, 'lignes ·', sum(len(b[2]) for b in bhas), 'items ·', len(bhas), 'BHA')
