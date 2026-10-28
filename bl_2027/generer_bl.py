"""Génère le Bon de livraison (BL) 2027 d'Enedril.
Usage : python3 generer_bl.py <dossier_sortie> [exemple]"""
import sys, os, datetime, json
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule
from openpyxl.drawing.image import Image as XLImage
from openpyxl.worksheet.filters import FilterColumn, CustomFilters, CustomFilter
from openpyxl.utils import get_column_letter as L

OUTDIR = sys.argv[1]; EXEMPLE = len(sys.argv) > 2
LOGO = '/home/user/Paul/public/logo-enedril-white.png'
NAVY, BLUE, CYAN, RED = '08203F', '0A4FA0', '00AEEF', 'E2231A'
INK, MUTED, LINE, INPUT = '0B1B2E', '51647A', 'D5DEE8', 'EAF6FD'
F = 'Calibri'
font = lambda sz=10, b=False, c=INK, i=False: Font(name=F, size=sz, bold=b, color=c, italic=i)
fill = lambda c: PatternFill('solid', start_color=c, end_color=c)
thin = lambda c=LINE: Side(style='thin', color=c)

NL = 14                       # lignes du BL
NI = 24                       # lignes de l'import
CAT1, CAT2 = 6, 5005          # catalogue outils
I1 = 6                        # première ligne de l'import
T1 = 15                       # première ligne du tableau du BL

wb = Workbook(); ws = wb.active; ws.title = '1 Bon de livraison'
wl = wb.create_sheet('Listes')
wc = wb.create_sheet('Catalogue outils', 1)
for w, c in ((ws, BLUE), (wc, '2E8B57'), (wl, '9FB6CE')): w.sheet_properties.tabColor = c; w.sheet_view.showGridLines = False
wl['A1'] = 'Type de colisage'; wl['A1'].font = font(9, True, 'FFFFFF'); wl['A1'].fill = fill(NAVY); wl.column_dimensions['A'].width = 24
for i, n in enumerate(['Palette', 'Fishing basket', 'Caisse', 'Vrac'], 2): wl[f'A{i}'] = n
def dv(rng, formula, strict=False):
    d = DataValidation(type='list', formula1=formula, allow_blank=True, showErrorMessage=strict); ws.add_data_validation(d); d.add(rng)

# ------------------------------------------------------------------ 1 BL
for col, w in zip('ABCDEFG', (17, 20, 52, 7, 9, 12, 14)): ws.column_dimensions[col].width = w
ws.column_dimensions['L'].hidden = True
for col, w in zip('HMNOP', (2, 14, 12, 10, 10)): ws.column_dimensions[col].width = w
for r in (1, 2, 3):
    for c in range(1, 8): ws.cell(r, c).fill = fill(NAVY if r < 3 else CYAN)
ws.row_dimensions[1].height = 34; ws.row_dimensions[2].height = 22; ws.row_dimensions[3].height = 5
img = XLImage(LOGO); img.width, img.height = 150, 34; ws.add_image(img, 'A1')
ws.merge_cells('C1:G1'); ws['C1'] = 'BON DE LIVRAISON · DELIVERY TICKET'; ws['C1'].font = font(15, True, 'FFFFFF'); ws['C1'].alignment = Alignment(horizontal='right', vertical='center')
ws.merge_cells('C2:G2'); ws['C2'] = '="N° "&A6'; ws['C2'].font = font(11, c='9FD8F5'); ws['C2'].alignment = Alignment(horizontal='right', vertical='center')
ws.merge_cells('A4:G4'); ws['A4'] = 'ENEDRIL SAS · 3 Avenue des Lacs · 64140 Lons (France) · +33 (0)5 59 04 50 45 · SIRET 79464246200020 · TVA FR11794642462'
ws['A4'].font = font(8, c=MUTED); ws['A4'].alignment = Alignment(horizontal='center', vertical='center'); ws.row_dimensions[4].height = 18
def tin(r, c1, c2, text, fmt=None, tall=False):
    if c2 > c1: ws.merge_cells(start_row=r, start_column=c1, end_row=r, end_column=c2); ws.merge_cells(start_row=r+1, start_column=c1, end_row=r+1, end_column=c2)
    a = ws.cell(r, c1); a.value = text.upper(); a.font = font(7.5, True, MUTED); a.alignment = Alignment(vertical='bottom', indent=1)
    for k in range(c1, c2 + 1): ws.cell(r+1, k).fill = fill(INPUT); ws.cell(r+1, k).border = Border(bottom=Side(style='thin', color=CYAN))
    b = ws.cell(r+1, c1); b.font = font(10.5, True, BLUE); b.alignment = Alignment(horizontal='left', vertical='center', indent=1, wrap_text=True)
    if fmt: b.number_format = fmt
    ws.row_dimensions[r].height = 15; ws.row_dimensions[r+1].height = 34 if tall else 21
tin(5, 1, 2, 'N° du BL · Delivery ticket n°'); tin(5, 3, 3, 'Date', 'dd/mm/yyyy'); tin(5, 4, 7, 'N° de dossier (devis) · Job number')
tin(7, 1, 2, 'Client · Customer'); tin(7, 3, 3, 'Puits / chantier · Well'); tin(7, 4, 7, 'PO client · Purchase order')
tin(9, 1, 2, 'Transporteur · Transport company'); tin(9, 3, 3, 'PO transport · Transport PO n°'); tin(9, 4, 7, 'Délai · Expected time of arrival (ETA)')
tin(11, 1, 3, 'Adresse de chargement · Loading address', None, True); tin(11, 4, 7, 'Adresse de livraison · Delivery address', None, True)
ws['A12'] = 'Enedril · 3 Avenue des Lacs · 64140 Lons (France)'
ws.row_dimensions[13].height = 8
HD = ['N°\nItem', 'N° de série\nSerial number', 'Description', 'Qté\nQty', 'Origine\nOrigin', 'Poids net\nkg / unité', 'Valeur de remplacement\n€ / unité']
for i, h in enumerate(HD, 1):
    c = ws.cell(14, i); c.value = h; c.font = font(8.5, True, NAVY); c.fill = fill('DCE8F5'); c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
ws.row_dimensions[14].height = 36; ws['I14'] = 'actif'; ws['I14'].font = font(7, c='B8C4D2')
last = T1 + NL - 1
CATR = lambda p: f"'Catalogue outils'!$A${CAT1}:$A${CAT2}" if p == 1 else f"'Catalogue outils'!$A${CAT1}:$AC${CAT2}"
CAT = lambda p, r: f"INDEX('Catalogue outils'!$A${CAT1}:$AC${CAT2},L{r},{p})"
for h, col in (('Réf catalogue', 'M'), ('Code SH', 'N'), ('OD', 'O'), ('Lg', 'P')):
    ws[f'{col}14'] = h; ws[f'{col}14'].font = font(8, True, MUTED); ws[f'{col}14'].alignment = Alignment(horizontal='center')
ws['M13'] = 'Infos catalogue (non imprimées)'; ws['M13'].font = font(7.5, i=True, c=MUTED)
for i in range(NL):
    r = T1 + i; ws.row_dimensions[r].height = 26
    ws[f'A{r}'] = i + 1
    ws[f'L{r}'] = f'=IF(B{r}="",0,IFERROR(MATCH(B{r},{CATR(1)},0),IFERROR(MATCH(TEXT(B{r},"0"),{CATR(1)},0),IFERROR(MATCH(VALUE(B{r}),{CATR(1)},0),0))))'
    ws[f'C{r}'] = f'=IF(L{r}>0,IF({CAT(2, r)}=0,"",TRIM(SUBSTITUTE({CAT(2, r)},CHAR(10)," "))),"")'
    ws[f'E{r}'] = f'=IF(B{r}="","",IF(L{r}>0,IF(N({CAT(22, r)})=0,IF(ISTEXT({CAT(22, r)}),{CAT(22, r)},"FR"),"FR"),"FR"))'
    ws[f'F{r}'] = f'=IF(L{r}>0,IF(N({CAT(3, r)})=0,"",ROUND({CAT(3, r)},1)),"")'
    for col, cc in (('M', 20), ('N', 23), ('O', 4), ('P', 5)):
        ws[f'{col}{r}'] = f'=IF(L{r}>0,IF({CAT(cc, r)}=0,"",{CAT(cc, r)}),"")'
        ws[f'{col}{r}'].font = font(9, c=MUTED); ws[f'{col}{r}'].alignment = Alignment(horizontal='center', vertical='center')
    ws[f'L{r}'].font = font(7, c='B8C4D2'); ws[f'O{r}'].number_format = '# ??/??'
    ws[f'A{r}'].font = font(10.5, c=MUTED); ws[f'A{r}'].alignment = Alignment(horizontal='center', vertical='center')
    for col in 'BCDG':
        c = ws[f'{col}{r}']; c.fill = fill(INPUT); c.font = font(10.5, False, BLUE); c.alignment = Alignment(horizontal='left' if col in 'BC' else 'center', vertical='center', indent=1 if col in 'BC' else 0, wrap_text=True)
        c.border = Border(bottom=Side(style='thin', color='B7DDF2'))
    for col in 'EF':
        c = ws[f'{col}{r}']; c.font = font(10.5, c=INK); c.alignment = Alignment(horizontal='center', vertical='center'); c.border = Border(bottom=thin())
    ws[f'F{r}'].number_format = '#,##0.0'; ws[f'G{r}'].number_format = '#,##0.00'
dv(f'B{T1}:B{last}', f"='Catalogue outils'!$A${CAT1}:$A${CAT2}")
# totaux
rt = last + 1
ws.merge_cells(start_row=rt, start_column=1, end_row=rt, end_column=3)
ws[f'A{rt}'] = 'TOTAL'; ws[f'D{rt}'] = f'=SUM(D{T1}:D{last})'
ws[f'F{rt}'] = f'=SUMPRODUCT(N(+D{T1}:D{last}),N(+F{T1}:F{last}))' if False else f'=SUMPRODUCT(IF(ISNUMBER(D{T1}:D{last}),D{T1}:D{last},0)*IF(ISNUMBER(F{T1}:F{last}),F{T1}:F{last},0))'
ws[f'G{rt}'] = f'=SUMPRODUCT(IF(ISNUMBER(D{T1}:D{last}),D{T1}:D{last},0)*IF(ISNUMBER(G{T1}:G{last}),G{T1}:G{last},0))'
ws[f'F{rt}'].number_format = '#,##0.0 "kg"'; ws[f'G{rt}'].number_format = '#,##0.00 "€"'
for c in range(1, 8): ws.cell(rt, c).fill = fill(NAVY); ws.cell(rt, c).font = font(10.5, True, 'FFFFFF'); ws.cell(rt, c).alignment = Alignment(horizontal='left' if c < 4 else 'center', vertical='center', indent=1 if c == 1 else 0)
ws.row_dimensions[rt].height = 24
ws.row_dimensions[rt + 1].height = 18; ws.row_dimensions[rt + 2].height = 18
# colisage
P0 = rt + 3
ws.merge_cells(start_row=P0, start_column=1, end_row=P0, end_column=7); ws.cell(P0, 1).value = 'COLISAGE · PACKING (ensemble des articles)'
for c in range(1, 8): ws.cell(P0, c).fill = fill(NAVY)
ws.cell(P0, 1).font = font(10, True, 'FFFFFF'); ws.cell(P0, 1).alignment = Alignment(horizontal='center', vertical='center'); ws.row_dimensions[P0].height = 22
for i, h in enumerate(['Colis · Package', 'Type de colisage · Type', 'Dimensions L × l × h (cm)', '', '', 'Poids brut\nkg', 'Volume\nm³'], 1):
    c = ws.cell(P0 + 1, i); c.value = h; c.font = font(8.5, True, NAVY); c.fill = fill('DCE8F5'); c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
ws.row_dimensions[P0 + 1].height = 30
ws.merge_cells(start_row=P0 + 1, start_column=3, end_row=P0 + 1, end_column=5)
# dimensions : trois cases L, l, h dans C (texte) ? -> colonnes dédiées D, E (étroites) : on place L/l/h dans C (saisie libre "120 × 80 × 60")
NP = 3
for i in range(NP):
    r = P0 + 2 + i; ws.row_dimensions[r].height = 26
    ws[f'A{r}'] = f'Colis {i+1}'; ws[f'A{r}'].font = font(10.5, True, NAVY); ws[f'A{r}'].alignment = Alignment(horizontal='center', vertical='center')
    for col in 'BCFG':
        c = ws[f'{col}{r}']; c.fill = fill(INPUT); c.font = font(10.5, False, BLUE); c.alignment = Alignment(horizontal='center', vertical='center'); c.border = Border(bottom=Side(style='thin', color='B7DDF2'))
    ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=5)
    ws[f'F{r}'].number_format = '#,##0.0'
    ws[f'G{r}'].number_format = '0.000'
dv(f'B{P0+2}:B{P0+1+NP}', '=Listes!$A$2:$A$6')
ws.cell(P0 + 2 + NP, 1).value = '="TOTAL  ·  "&COUNTA(B' + str(P0 + 2) + ':B' + str(P0 + 1 + NP) + ')&" colis"'
ws.merge_cells(start_row=P0 + 2 + NP, start_column=1, end_row=P0 + 2 + NP, end_column=5)
rcol = P0 + 2 + NP
ws[f'F{rcol}'] = f'=SUM(F{P0+2}:F{rcol-1})'; ws[f'F{rcol}'].number_format = '#,##0.0 "kg"'; ws[f'G{rcol}'] = f'=SUM(G{P0+2}:G{rcol-1})'; ws[f'G{rcol}'].number_format = '0.000 "m³"'
for c in range(1, 8): ws.cell(rcol, c).fill = fill(NAVY); ws.cell(rcol, c).font = font(10, True, 'FFFFFF'); ws.cell(rcol, c).alignment = Alignment(horizontal='left' if c == 1 else 'center', vertical='center', indent=1 if c == 1 else 0)
ws.row_dimensions[rcol].height = 22
# signatures
rs = rcol + 2
ws.merge_cells(start_row=rs, start_column=1, end_row=rs, end_column=7)
ws[f'A{rs}'] = 'Marchandises reçues en bon état, à retourner à Enedril à la fin de la location · Goods received in good condition, to be returned to Enedril at the end of the rental'
ws[f'A{rs}'].font = font(8.5, True, MUTED); ws[f'A{rs}'].alignment = Alignment(indent=1, vertical='center', wrap_text=True); ws.row_dimensions[rs].height = 26
for c1, c2, t in ((1, 2, 'EXPÉDITEUR · ENEDRIL\nNom, date, signature'), (3, 3, 'TRANSPORTEUR\nNom, date, signature'), (4, 7, 'RÉCEPTION CLIENT · RECEIVED BY\nNom, date, signature, cachet')):
    ws.merge_cells(start_row=rs + 1, start_column=c1, end_row=rs + 4, end_column=c2)
    ws.cell(rs + 1, c1).value = t; ws.cell(rs + 1, c1).font = font(8, True, MUTED); ws.cell(rs + 1, c1).alignment = Alignment(vertical='top', indent=1, wrap_text=True)
    for rr in range(rs + 1, rs + 5):
        for cc in range(c1, c2 + 1): ws.cell(rr, cc).border = Border(left=thin() if cc == c1 else None, right=thin() if cc == c2 else None, top=thin() if rr == rs + 1 else None, bottom=thin() if rr == rs + 4 else None)
for rr in range(rs + 1, rs + 5): ws.row_dimensions[rr].height = 17
LASTROW = rs + 4

if EXEMPLE:
    ws['A6'] = 'BL-26-0123'; ws['C6'] = datetime.date(2026, 11, 9); ws['D6'] = '26-82-FR'
    ws['A8'] = 'Geopetrol'; ws['C8'] = 'Puits Lacq-12 · CLU108'; ws['D8'] = 'PO-4500123'
    ws['A10'] = 'Transports Durand'; ws['C10'] = 'TPO-778'; ws['D10'] = '48 h après chargement'
    ws['D12'] = 'Geopetrol · Base de Lacq · 64170 Lacq'
    for i, (sn, q, v) in enumerate([(8020008, 1, 4200), (7050712, 1, 900), (7050715, 2, 900)]): ws[f'B{T1+i}'] = sn; ws[f'D{T1+i}'] = q; ws[f'G{T1+i}'] = v
    ws[f'B{P0+2}'] = 'Fishing basket'; ws[f'C{P0+2}'] = '120 × 80 × 60'; ws[f'F{P0+2}'] = 145; ws[f'G{P0+2}'] = 0.576

# ------------------------------------------------------------------ 3 catalogue
# même disposition que le registre « Fabrication - Achat - 2014 et + » (colonnes Z à BB de l'ancien BL) : coller Z:BB en A5
POS = {1: 'N° de série', 2: 'Désignation', 3: 'Poids net (kg)', 4: 'OD', 5: 'Longueur (mm)', 20: 'Référence', 22: 'Origine', 23: 'Code SH (HS)'}
NCOL = 29
for c in range(1, NCOL + 1): wc.column_dimensions[L(c)].width = {1: 16, 2: 52, 3: 12, 4: 10, 5: 12, 20: 14, 22: 10, 23: 14}.get(c, 7)
for r in (1, 2, 3):
    for c in range(1, NCOL + 1): wc.cell(r, c).fill = fill(NAVY if r < 3 else '2E8B57')
wc.row_dimensions[1].height = 30; wc.row_dimensions[2].height = 20; wc.row_dimensions[3].height = 5
wc['A1'] = 'CATALOGUE OUTILS'; wc['A1'].font = font(18, True, 'FFFFFF'); wc['A1'].alignment = Alignment(vertical='center')
wc['A2'] = 'Dans le registre « Fabrication - Achat - 2014 et + » : copier les colonnes Z à BB (à partir de la ligne 2) et les coller ici en A6. Le BL cherche le N° de série (colonne A) et reprend désignation, poids, référence, origine, code SH, OD et longueur.'
wc['A2'].font = font(10, c='C9F0D8'); wc['A2'].alignment = Alignment(vertical='center')
for c in range(1, NCOL + 1):
    x = wc.cell(5, c); x.value = POS.get(c, f'col. {c}'); x.font = font(9, True, 'FFFFFF'); x.fill = fill(BLUE if c in POS else '7A8CA3'); x.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
wc.row_dimensions[5].height = 30
for r in range(CAT1, CAT1 + 60):
    for c in range(1, NCOL + 1):
        x = wc.cell(r, c); x.fill = fill(INPUT if c in POS else 'F2F5F9'); x.font = font(10, False, BLUE); x.border = Border(bottom=Side(style='thin', color=CYAN))
        x.alignment = Alignment(horizontal='left' if c == 2 else 'center', vertical='center', indent=1 if c == 2 else 0)
wc.freeze_panes = 'B6'
for r in range(CAT1, CAT2 + 1): wc[f'D{r}'].number_format = '# ??/??'
REG = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'registre_outils.json'), encoding='utf-8'))
for i, row in enumerate(REG):
    for p, v in zip((1, 2, 3, 4, 5, 20, 22, 23), row):
        if v is not None: wc.cell(CAT1 + i, p).value = v
wc['A4'] = f'Registre repris du lien de l\'ancien BL : {len(REG)} N° de série (dernière mise à jour connue). À remplacer par un nouveau copier-coller Z:BB quand le registre évolue.'; wc['A4'].font = font(9, True, MUTED)
wc.page_setup.orientation = 'landscape'; wc.page_setup.paperSize = 9; wc.page_setup.fitToWidth = 1; wc.page_setup.fitToHeight = 0; wc.sheet_properties.pageSetUpPr.fitToPage = True

wc.sheet_state = 'hidden'
ws.print_area = f'A1:G{LASTROW}'; ws.page_setup.orientation = 'portrait'; ws.page_setup.paperSize = 9
ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0; ws.sheet_properties.pageSetUpPr.fitToPage = True
ws.page_margins.left = ws.page_margins.right = .4; ws.page_margins.top = .4; ws.page_margins.bottom = .5
ws.oddFooter.center.text = 'Enedril · Bon de livraison &P / &N'; ws.oddFooter.center.size = 8
for w in (wl,):
    w.page_setup.orientation = 'landscape'; w.page_setup.paperSize = 9; w.page_setup.fitToWidth = 1; w.page_setup.fitToHeight = 0; w.sheet_properties.pageSetUpPr.fitToPage = True
wb.calculation.fullCalcOnLoad = True
out = os.path.join(OUTDIR, 'BL_Enedril_2027' + ('_exemple' if EXEMPLE else '') + '.xlsx'); wb.save(out); print('ok', out)
