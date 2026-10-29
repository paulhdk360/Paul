"""Génère le France Chrono 2027 d'Enedril (un seul onglet).
Usage : python3 generer_chrono.py <dossier_sortie>"""
import sys, os, datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule
from openpyxl.utils import get_column_letter as L

OUTDIR = sys.argv[1]
NAVY, BLUE, CYAN, RED = '08203F', '0A4FA0', '00AEEF', 'E2231A'
INK, MUTED, LINE, INPUT = '0B1B2E', '51647A', 'D5DEE8', 'EAF6FD'
F = 'Calibri'
font = lambda sz=10, b=False, c=INK, i=False: Font(name=F, size=sz, bold=b, color=c, italic=i)
fill = lambda c: PatternFill('solid', start_color=c, end_color=c)
thin = lambda c=LINE: Side(style='thin', color=c)

H = 7                       # ligne des en-têtes
R1, R2 = H + 1, H + 500     # lignes de saisie (formules déjà en place : ne jamais insérer de lignes, écrire dans la première ligne vide)
COLS = [  # (lettre, titre, largeur, type)
    ('A', 'Réf', 11, 'in'), ('B', 'Date\ndemande', 10.5, 'date'), ('C', 'Date\nenvoi', 10.5, 'date'), ('D', 'Délai\n(j)', 6, 'calc'),
    ('E', 'Client', 26, 'in'), ('F', 'Contact', 20, 'in'), ('G', 'Job', 17, 'list'), ('H', 'Prestation', 11, 'list'), ('I', 'Description', 40, 'in'),
    ('J', 'Offre\npar', 8, 'in'), ('K', 'Incoterm', 11, 'list'), ('L', 'Statut', 13, 'list'), ('M', 'Date\nrelance', 10.5, 'date'), ('N', 'À relancer', 11, 'calc'),
    ('O', 'Commentaires', 36, 'in'),
    ('P', 'Devis', 8, 'link'), ('Q', 'Tool list', 9, 'link'), ('R', 'BL', 7, 'link'), ('S', 'Service\nticket', 9, 'link'), ('T', 'Dossier', 9, 'link')]
PATH = 'Z:\\MUSTANG SERVICES\\Affaires 2027\\'   # dossier des affaires sur le serveur : Ctrl + H pour le remplacer dans les formules
LINKS = {'P': '_Devis.xlsx', 'Q': '_ToolList.xlsx', 'R': '_BL.xlsx', 'S': '_ServiceTicket.xlsx'}
STATUTS = ['A faire', 'Envoyé', 'En attente', 'Gagné', 'Terminé', 'Perdu', 'Annulé']
JOBS = ['Fishing', 'Whipstocks', 'Opérateur', 'Directional Drilling', 'PDC', 'Blocage / Déblocage', 'Matériel atelier', 'Break-out & Machines', 'Drill Bit']
PREST = ['Rental', 'Sale', 'Service']
INCO = ['EXW Lons', 'FCA Anvers', 'FCA Norway', 'FOB Canada']

wb = Workbook(); ws = wb.active; ws.title = 'Chrono 2027'; ws.sheet_properties.tabColor = BLUE; ws.sheet_view.showGridLines = False
for l, t, w, k in COLS: ws.column_dimensions[l].width = w
LAST = len(COLS)
for r in (1, 2, 3):
    for c in range(1, LAST + 1): ws.cell(r, c).fill = fill(NAVY if r < 3 else CYAN)
ws.row_dimensions[1].height = 32; ws.row_dimensions[2].height = 20; ws.row_dimensions[3].height = 5
ws['A1'] = 'FRANCE CHRONO 2027 · ENEDRIL'; ws['A1'].font = font(18, True, 'FFFFFF'); ws['A1'].alignment = Alignment(vertical='center')
ws['A2'] = 'Un devis = une ligne. Écrire dans la première ligne vide du tableau (ne pas insérer de lignes : toutes les formules sont déjà en place).'
ws['A2'].font = font(10, c='9FD8F5'); ws['A2'].alignment = Alignment(vertical='center')

# --- indicateurs
def kpi(col, row, label, formula, fmt='0'):
    ws[f'{col}{row}'] = label; ws[f'{col}{row}'].font = font(8, True, MUTED); ws[f'{col}{row}'].alignment = Alignment(indent=1, vertical='bottom', wrap_text=True)
    ws[f'{col}{row+1}'] = formula; ws[f'{col}{row+1}'].font = font(15, True, BLUE); ws[f'{col}{row+1}'].number_format = fmt; ws[f'{col}{row+1}'].alignment = Alignment(horizontal='left', indent=1, vertical='center')
    ws[f'{col}{row+1}'].fill = fill(INPUT)
    ws[f'{col}{row}'].fill = fill(INPUT)
ST = f'$L${R1}:$L${R2}'
cn = lambda s: f'COUNTIF({ST},"{s}")'
ws.row_dimensions[4].height = 26; ws.row_dimensions[5].height = 26
for c1, c2, lab, f, fmt in (('A', 'A', 'Demandes', f'=COUNTA($A${R1}:$A${R2})', '0'), ('B', 'B', 'Devis faits', f'=COUNT($C${R1}:$C${R2})', '0'),
                            ('C', 'C', 'À faire', '=' + cn('A faire'), '0'),
                            ('E', 'E', 'En attente', '=' + cn('Envoyé') + '+' + cn('En attente'), '0'), ('F', 'F', 'Gagnés', '=' + cn('Gagné') + '+' + cn('Terminé'), '0'),
                            ('G', 'G', 'Perdus / annulés', '=' + cn('Perdu') + '+' + cn('Annulé'), '0'),
                            ('H', 'H', 'Taux de transformation', f'=IF(({cn("Gagné")}+{cn("Terminé")}+{cn("Perdu")})=0,"",({cn("Gagné")}+{cn("Terminé")})/({cn("Gagné")}+{cn("Terminé")}+{cn("Perdu")}))', '0%'),
                            ('I', 'I', "Durée moyenne d'envoi des devis (j)", f'=IFERROR(AVERAGE($D${R1}:$D${R2}),"")', '0.0'),
                            ('J', 'J', 'À relancer', f'=COUNTIF($N${R1}:$N${R2},"⚠*")', '0')):
    kpi(c1, 4, lab, f, fmt)
ws['K4'] = 'Prochaine référence'; ws['K4'].font = font(8, True, MUTED); ws['K4'].fill = fill(INPUT); ws['K4'].alignment = Alignment(indent=1, vertical='bottom', wrap_text=True)
ws['K5'] = f'="27-"&TEXT(MAX($U${R1}:$U${R2})+1,"000")&"-XX"'; ws['K5'].font = font(15, True, BLUE); ws['K5'].fill = fill(INPUT); ws['K5'].alignment = Alignment(horizontal='left', indent=1, vertical='center')
ws.column_dimensions['U'].hidden = True
for r in range(R1, R2 + 1): ws[f'U{r}'] = f'=IFERROR(VALUE(MID($A{r},4,3)),0)'
ws.row_dimensions[6].height = 8
# --- en-têtes
for l, t, w, k in COLS:
    c = ws[f'{l}{H}']; c.value = t; c.font = font(8.5, True, 'FFFFFF'); c.fill = fill(BLUE if k in ('in', 'date', 'list', 'eur') else ('2E8B57' if k == 'link' else '5B7390'))
    c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
ws.row_dimensions[H].height = 34
# --- lignes
for r in range(R1, R2 + 1):
    ws.row_dimensions[r].height = 18
    for l, t, w, k in COLS:
        c = ws[f'{l}{r}']; c.border = Border(bottom=thin('E6ECF3'), left=thin('F0F3F7'), right=thin('F0F3F7'))
        c.font = font(10, c=BLUE if k in ('in', 'date', 'list', 'eur') else INK); c.alignment = Alignment(vertical='center', horizontal='center' if k in ('date', 'calc', 'list', 'link') else None, indent=1 if l in 'EFIV' else 0)
        if k in ('date',): c.number_format = 'dd/mm/yy'
        if k == 'eur': c.number_format = '#,##0'; c.alignment = Alignment(horizontal='right', vertical='center', indent=1)
    ws[f'D{r}'] = f'=IF(AND(ISNUMBER($B{r}),ISNUMBER($C{r})),$C{r}-$B{r},"")'
    ws[f'N{r}'] = f'=IF(AND(OR($L{r}="Envoyé",$L{r}="En attente"),ISNUMBER($C{r}),NOT(ISNUMBER($M{r}))),IF(TODAY()-$C{r}>=7,"⚠ relancer",""),"")'
    for l, suf in LINKS.items():
        ws[f'{l}{r}'] = f'=IF($A{r}="","",HYPERLINK("{PATH}"&$A{r}&"\\"&$A{r}&"{suf}","Ouvrir"))'
        ws[f'{l}{r}'].font = Font(name=F, size=9.5, color='0563C1', underline='single')
    ws[f'T{r}'] = f'=IF($A{r}="","",HYPERLINK("{PATH}"&$A{r}&"\\","Dossier"))'; ws[f'T{r}'].font = Font(name=F, size=9.5, color='0563C1', underline='single')
# listes déroulantes
def dv(col, items, strict=False):
    d = DataValidation(type='list', formula1='"' + ','.join(items) + '"', allow_blank=True, showErrorMessage=strict); ws.add_data_validation(d); d.add(f'{col}{R1}:{col}{R2}')
dv('G', JOBS); dv('H', PREST); dv('K', INCO); dv('L', STATUTS, True)
# couleurs de statut
rng = f'L{R1}:L{R2}'
for s, bg, fg in (('A faire', 'E3E6EA', '4A5668'), ('Envoyé', 'B9D8F5', '0A4FA0'), ('En attente', 'FFE9A8', '7A5B00'), ('Gagné', '9EDDB0', '0B5A2A'), ('Terminé', 'CFE9D6', '0B5A2A'), ('Perdu', 'F6B3AE', '8A1710'), ('Annulé', 'D5DBE3', '4A5668')):
    ws.conditional_formatting.add(rng, FormulaRule(formula=[f'$L{R1}="{s}"'], fill=fill(bg), font=Font(name=F, bold=True, color=fg)))
ws.conditional_formatting.add(f'N{R1}:N{R2}', FormulaRule(formula=[f'LEFT($N{R1},1)="⚠"'], font=Font(name=F, bold=True, color=RED)))
# exemples fictifs
EX = [('27-001-FR', datetime.date(2027, 1, 5), datetime.date(2027, 1, 7), 'Client exemple A', 'Contact A', 'Fishing', 'Rental', 'Exemple · Stab 5-7/8 + XO', 'PH', 'EXW Lons', 'Gagné'),
      ('27-002-CM', datetime.date(2027, 1, 8), datetime.date(2027, 1, 8), 'Client exemple B', 'Contact B', 'Whipstocks', 'Sale', 'Exemple · Whipstock 10-3/4"', 'FJ/PH', 'EXW Lons', 'Envoyé'),
      ('27-003-DE', datetime.date(2027, 1, 12), None, 'Client exemple C', 'Contact C', 'Fishing', 'Rental', 'Exemple · Casing scraper', 'PH', 'EXW Lons', 'A faire')]
for i, row in enumerate(EX):
    r = R1 + i
    for l, v in zip('ABCEFGHIJKL', row):
        if v is not None: ws[f'{l}{r}'] = v
ws['O' + str(R1)] = "LIGNES D'EXEMPLE (fictives) : à effacer"
ws['O' + str(R1)].font = font(9, True, RED)
ws.freeze_panes = f'B{H+1}'; ws.auto_filter.ref = f'A{H}:{L(LAST)}{R2}'
ws.print_title_rows = f'{H}:{H}'; ws.print_area = f'A1:{L(LAST)}{R1 + 99}'
ws.page_setup.orientation = 'landscape'; ws.page_setup.paperSize = 9; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0; ws.sheet_properties.pageSetUpPr.fitToPage = True
ws.page_margins.left = ws.page_margins.right = .3; ws.page_margins.top = .4; ws.page_margins.bottom = .4
wb.calculation.fullCalcOnLoad = True
out = os.path.join(OUTDIR, 'France_Chrono_2027.xlsx'); wb.save(out); print('ok', out)
