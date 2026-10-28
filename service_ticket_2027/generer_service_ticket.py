"""Génère le Service Ticket 2027 d'Enedril : calendrier de 3 mois maximum (93 jours en 3 blocs de 31 jours).
On part d'un mois ; la date de fin pilote les jours actifs ; les blocs 2 et 3 sont repliés jusqu'à ce qu'on en ait besoin.
Usage : python3 generer_service_ticket.py <dossier_sortie> [exemple]"""
import sys, os, datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule, CellIsRule
from openpyxl.drawing.image import Image as XLImage
from openpyxl.worksheet.pagebreak import Break
from openpyxl.utils import get_column_letter as L

OUTDIR = sys.argv[1]; EXEMPLE = len(sys.argv) > 2
LOGO = '/home/user/Paul/public/logo-enedril-white.png'
NAVY, BLUE, CYAN, RED = '08203F', '0A4FA0', '00AEEF', 'E2231A'
INK, MUTED, LINE, INPUT = '0B1B2E', '51647A', 'D5DEE8', 'EAF6FD'
F = 'Calibri'
font = lambda sz=10, b=False, c=INK, i=False: Font(name=F, size=sz, bold=b, color=c, italic=i)
fill = lambda c: PatternFill('solid', start_color=c, end_color=c)
thin = lambda c=LINE: Side(style='thin', color=c)

NDAYS = 93; BLOCK = 31
C0 = 13; CL = C0 + NDAYS - 1
H1 = CL + 2; NH = 13                            # colonnes de calcul masquées : 4 par bloc + premier jour O
OP1, OP2 = 17, 19
MA1, MA2 = 22, 33
TR1, TR2 = 36, 38
SUM0 = 42
NN = '$J$9'                                     # nombre de jours actifs
hc = lambda i, k: H1 + 4 * k + i                # 0 location/jours · 1 UC/mob · 2 VR+RC · 3 FOC
FO = H1 + 12

wb = Workbook(); ws = wb.active; ws.title = 'Service ticket'
ws.sheet_properties.tabColor = CYAN; ws.sheet_view.showGridLines = False
wsL = wb.create_sheet('Listes'); wsL.sheet_properties.tabColor = '9FB6CE'
wsL['A1'] = 'Ingénieur Enedril'; wsL['A1'].font = font(9, True, 'FFFFFF'); wsL['A1'].fill = fill(NAVY); wsL.column_dimensions['A'].width = 28
for i, n in enumerate(['Fabien JACQUOT', 'Alexis ESTINES', 'Paul HYNDERICK', 'Céline CARDONA', 'Koen MONDELAERS', 'Luigi LIBERATORE'], 2): wsL[f'A{i}'] = n
wsL['C1'] = 'Codes du calendrier'; wsL['C1'].font = font(9, True, 'FFFFFF'); wsL['C1'].fill = fill(NAVY); wsL.column_dimensions['C'].width = 24
for i, n in enumerate(['S', 'O', 'FOC', 'VR', 'RC', 'MOB', 'DEMOB'], 2): wsL[f'C{i}'] = n
wsL['E1'] = 'Oui'; wsL['E1'].font = font(9, True, 'FFFFFF'); wsL['E1'].fill = fill(NAVY)

for col, w in zip('ABCDEFGHIJKL', (7, 32, 5, 8, 8, 8, 8, 7, 7, 5, 5, 11)): ws.column_dimensions[col].width = w
for c in range(C0, CL + 1): ws.column_dimensions[L(c)].width = 3.3
ws.column_dimensions[L(CL + 1)].width = 1.5
for c in range(H1, H1 + NH): ws.column_dimensions[L(c)].hidden = True
# blocs 2 et 3 repliés : [+] au-dessus du calendrier pour les déplier
ws.column_dimensions.group(L(C0 + BLOCK), L(C0 + 2 * BLOCK - 1), outline_level=1, hidden=True)
ws.column_dimensions.group(L(C0 + 2 * BLOCK), L(CL), outline_level=1, hidden=True)

LASTC = C0 + BLOCK - 1
for r in (1, 2, 3):
    for c in range(1, LASTC + 1): ws.cell(r, c).fill = fill(NAVY if r < 3 else CYAN)
ws.row_dimensions[1].height = 34; ws.row_dimensions[2].height = 20; ws.row_dimensions[3].height = 5
img = XLImage(LOGO); img.width, img.height = 150, 34; ws.add_image(img, 'A1')
ws.merge_cells(start_row=1, start_column=C0, end_row=1, end_column=LASTC); ws.cell(1, C0).value = 'SERVICE TICKET'
ws.cell(1, C0).font = font(20, True, 'FFFFFF'); ws.cell(1, C0).alignment = Alignment(horizontal='right', vertical='center')
ws.merge_cells(start_row=2, start_column=C0, end_row=2, end_column=LASTC)
ws.cell(2, C0).value = '=IF(A6="","",A6&"  ·  ")&IF(G6="","","Dossier "&G6)'; ws.cell(2, C0).font = font(11, c='9FD8F5'); ws.cell(2, C0).alignment = Alignment(horizontal='right', vertical='center')
ws.row_dimensions[4].height = 8

def tin(r, c1, c2, text, fmt=None, inputcell=True):
    ws.merge_cells(start_row=r, start_column=c1, end_row=r, end_column=c2); ws.merge_cells(start_row=r+1, start_column=c1, end_row=r+1, end_column=c2)
    a = ws.cell(r, c1); a.value = text.upper(); a.font = font(7.5, True, MUTED); a.alignment = Alignment(vertical='bottom', indent=1)
    for k in range(c1, c2 + 1):
        ws.cell(r+1, k).border = Border(bottom=Side(style='thin', color=CYAN))
        if inputcell: ws.cell(r+1, k).fill = fill(INPUT)
    b = ws.cell(r+1, c1); b.font = font(11, True, BLUE if inputcell else NAVY); b.alignment = Alignment(horizontal='left', vertical='center', indent=1, wrap_text=True)
    if fmt: b.number_format = fmt
tin(5, 1, 2, 'Client · Customer'); tin(5, 3, 6, 'Puits / chantier · Well'); tin(5, 7, 9, 'Dossier N° · Job'); tin(5, 10, 12, 'PO / contrat')
tin(8, 1, 2, 'Ingénieur Enedril'); tin(8, 3, 6, 'Date de début · Start date', 'dd/mm/yyyy'); tin(8, 7, 9, 'Date de fin · End date (à modifier)', 'dd/mm/yyyy'); tin(8, 10, 12, 'Durée (jours)', None, False)
for r in (5, 8): ws.row_dimensions[r].height = 15
for r in (6, 9): ws.row_dimensions[r].height = 24
ws.row_dimensions[7].height = 6
dv = DataValidation(type='list', formula1='=Listes!$A$2:$A$12', allow_blank=True, showErrorMessage=False); ws.add_data_validation(dv); dv.add('A9')
# durée = fin - début + 1 ; sans date de fin : 31 jours ; 93 jours maximum
ws['J9'] = '=IF(C9="","",MIN(93,MAX(1,IF(G9="",31,G9-C9+1))))'; ws['J9'].number_format = '0'; ws['J9'].font = font(11, True, NAVY); ws['J9'].alignment = Alignment(horizontal='left', vertical='center', indent=1)
# alerte : jours au-delà du premier bloc
ws.merge_cells('A10:L10')
ws['A10'] = f'=IF(N({NN})>{BLOCK},"⚠  La date de fin dépasse le 1er bloc : cliquer sur le [+] au-dessus du calendrier pour déplier les jours suivants.","")'
ws['A10'].font = font(9, True, RED); ws['A10'].alignment = Alignment(indent=1, vertical='center'); ws.row_dimensions[10].height = 16
ws.merge_cells('A11:L11')
ws['A11'] = 'Codes : S = stand-by · O = opérations · FOC = gratuit · VR = valeur de remplacement · RC = restocking · MOB / DEMOB = arrivée / départ (comptés en S)'
ws['A11'].font = font(8.5, True, NAVY); ws['A11'].alignment = Alignment(indent=1, vertical='center'); ws.row_dimensions[11].height = 18

# calendrier : blocs de 31 jours, actifs jusqu'à la date de fin
for k in range(3):
    c1 = C0 + k * BLOCK; c2 = c1 + BLOCK - 1
    ws.merge_cells(start_row=12, start_column=c1, end_row=12, end_column=c2)
    d1 = f'$C$9+{k*BLOCK}'; d2 = f'$C$9+MIN({k*BLOCK+BLOCK-1},{NN}-1)'
    cell = ws.cell(12, c1); cell.value = (f'=IF(OR($C$9="",N({NN})<={k*BLOCK}),"","Du "&TEXT(DAY({d1}),"00")&"/"&TEXT(MONTH({d1}),"00")&" au "&TEXT(DAY({d2}),"00")&"/"&TEXT(MONTH({d2}),"00")&"/"&YEAR({d2}))')
    cell.font = font(10, True, 'FFFFFF'); cell.alignment = Alignment(horizontal='center', vertical='center')
    for c in range(c1, c2 + 1): ws.cell(12, c).fill = fill(BLUE if k % 2 == 0 else NAVY)
ws.row_dimensions[12].height = 20
DOW = '"L","M","M","J","V","S","D"'
for i in range(NDAYS):
    c = C0 + i
    ws.cell(13, c).value = f'=IF(OR($C$9="",N({NN})<={i}),"",$C$9+{i})'; ws.cell(13, c).number_format = 'dd'
    ws.cell(14, c).value = f'=IF(OR($C$9="",N({NN})<={i}),"",CHOOSE(WEEKDAY($C$9+{i},2),{DOW}))'
    for rr, fz in ((13, 8.5), (14, 7.5)):
        ws.cell(rr, c).font = font(fz, rr == 13, NAVY); ws.cell(rr, c).alignment = Alignment(horizontal='center', vertical='center'); ws.cell(rr, c).fill = fill('DCE8F5')
HD = ['UC déjà\nfacturée', 'Description', 'Qté\nQty', 'Stand-by\n€ / jour', 'Opér.\n€ / jour', 'UC\n€', 'Valeur\nremplac.', 'Inspect.\n€', 'Restock.\n€', 'Jours\nS', 'Jours\nO', 'Total\n€ HT']
for i, h in enumerate(HD, 1):
    ws.merge_cells(start_row=13, start_column=i, end_row=14, end_column=i)
    c = ws.cell(13, i); c.value = h; c.font = font(8, True, NAVY); c.fill = fill('DCE8F5'); c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    ws.cell(14, i).fill = fill('DCE8F5')
names = ['loc', 'uc', 'vr', 'foc']
for k in range(3):
    for i in range(4): ws.cell(14, hc(i, k)).value = f'{names[i]}{k+1}'
ws.cell(14, FO).value = 'bloc 1er O'

R = lambda r: f'${L(C0)}{r}:${L(CL)}{r}'
ACT = lambda r: f'${L(C0)}{r}:INDEX({R(r)},MAX(1,N({NN})))'
def BRK(r, k): return f'INDEX({R(r)},{k*BLOCK+1}):INDEX({R(r)},MIN({k*BLOCK+BLOCK},N({NN})))'
def cnt(r, k, *codes): return '+'.join(f'COUNTIF({BRK(r,k)},"{c}")' for c in codes)

def band(r, text):
    for c in range(1, CL + 1): ws.cell(r, c).fill = fill(NAVY)
    ws.cell(r, 1).value = text; ws.cell(r, 1).font = font(10, True, 'FFFFFF'); ws.cell(r, 1).alignment = Alignment(vertical='center', indent=1)
    ws.row_dimensions[r].height = 20
def row_style(r, inputs, calendar=True):
    ws.row_dimensions[r].height = 18
    for c in range(1, 13): ws.cell(r, c).border = Border(bottom=thin())
    for col in inputs:
        c = ws[f'{col}{r}']; c.fill = fill(INPUT); c.font = font(10, False, BLUE)
        c.alignment = Alignment(horizontal='left' if col == 'B' else 'center', vertical='center', indent=1 if col == 'B' else 0)
    if calendar:
        for c in range(C0, CL + 1):
            cell = ws.cell(r, c); cell.font = font(8.5, True, INK); cell.alignment = Alignment(horizontal='center', vertical='center')
            cell.border = Border(left=thin('E6ECF3'), right=thin('E6ECF3'), bottom=thin('E6ECF3'))
    else:
        for c in range(C0, CL + 1): ws.cell(r, c).fill = fill('F4F7FA')
def zero(r):
    for c in range(H1, H1 + NH): ws.cell(r, c).value = 0
    for c in range(H1, H1 + NH): ws.cell(r, c).font = font(7, c='B8C4D2')

# --- opérateurs
band(15, 'OPÉRATEURS   ·   tarif journalier et mob / demob (codes MOB et DEMOB dans le calendrier)')
ws.row_dimensions[OP1 - 1].height = 30
for col, h in (('B', 'Nom / poste'), ('D', 'Stand-by\n€/j'), ('E', 'Tarif jour\n€'), ('F', 'Mob-Demob\n€'), ('I', 'Nb mob\n/ demob'), ('J', 'Jours\nS'), ('K', 'Jours\nO'), ('L', 'Total\n€ HT')):
    c = ws[f'{col}{OP1 - 1}']; c.value = h; c.font = font(8, True, NAVY); c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
for c in range(1, 13): ws.cell(OP1 - 1, c).fill = fill('E8F0FA')
for r in range(OP1, OP2 + 1):
    row_style(r, 'BDEF'); zero(r)
    ws[f'J{r}'] = f'=COUNTIF({ACT(r)},"S")+COUNTIF({ACT(r)},"MOB")+COUNTIF({ACT(r)},"DEMOB")'
    ws[f'K{r}'] = f'=COUNTIF({ACT(r)},"O")'
    ws[f'I{r}'] = f'=COUNTIF({ACT(r)},"MOB")+COUNTIF({ACT(r)},"DEMOB")'
    for k in range(3):
        a = L(hc(0, k)); b = L(hc(1, k))
        sk = f'({cnt(r,k,"S","MOB","DEMOB")})'; ok = f'({cnt(r,k,"O")})'; mk = f'({cnt(r,k,"MOB","DEMOB")})'
        ws[f'{a}{r}'] = f'=IF(OR(B{r}="",N({NN})<={k*BLOCK}),0,{sk}*N(D{r})+{ok}*N(E{r}))'
        ws[f'{b}{r}'] = f'=IF(OR(B{r}="",N({NN})<={k*BLOCK}),0,{mk}*N(F{r}))'
    ws[f'L{r}'] = f'=IF(B{r}="","",' + '+'.join(f'{L(hc(i,k))}{r}' for i in (0, 1) for k in range(3)) + ')'
# --- matériel
band(MA1 - 1, 'MATÉRIEL LOUÉ   ·   copier les colonnes C à J de l’onglet « 2 Matériel » du devis et les coller en B' + str(MA1) + '   ·   « UC déjà facturée » : Oui si l’UC a été facturée sur un ticket précédent')
for r in range(MA1, MA2 + 1):
    row_style(r, 'ABCDEFGHI')
    ws[f'J{r}'] = f'=IF(B{r}="","",COUNTIF({ACT(r)},"S")+COUNTIF({ACT(r)},"MOB")+COUNTIF({ACT(r)},"DEMOB"))'
    ws[f'K{r}'] = f'=IF(B{r}="","",COUNTIF({ACT(r)},"O"))'
    q = f'IF(N(C{r})>0,C{r},1)'
    ws.cell(r, FO).value = f'=IF(B{r}="",0,IFERROR(INT((MATCH("O",{ACT(r)},0)-1)/{BLOCK})+1,0))'
    for k in range(3):
        act = f'N({NN})>{k*BLOCK}'
        ws.cell(r, hc(0, k)).value = f'=IF(OR(B{r}="",NOT({act})),0,{q}*(({cnt(r,k,"S","MOB","DEMOB")})*N(D{r})+({cnt(r,k,"O")})*N(E{r})))'
        ws.cell(r, hc(1, k)).value = f'=IF(OR(B{r}="",A{r}="Oui",{L(FO)}{r}<>{k+1}),0,{q}*(N(F{r})+N(H{r})))'
        ws.cell(r, hc(2, k)).value = f'=IF(OR(B{r}="",NOT({act})),0,{q}*(IF(({cnt(r,k,"VR")})>0,N(G{r}),0)+IF(({cnt(r,k,"RC")})>0,N(I{r}),0)))'
        ws.cell(r, hc(3, k)).value = f'=IF(OR(B{r}="",NOT({act})),0,{q}*({cnt(r,k,"FOC")})*N(E{r}))'
    ws[f'L{r}'] = f'=IF(B{r}="","",' + '+'.join(f'{L(hc(i,k))}{r}' for i in (0, 1, 2) for k in range(3)) + ')'
    for c in range(H1, H1 + NH): ws.cell(r, c).font = font(7, c='B8C4D2')
# --- transport et autres frais
band(TR1 - 1, 'TRANSPORT ET AUTRES FRAIS   ·   quantité × prix unitaire (colonne « Opér. € »)')
for r in range(TR1, TR2 + 1):
    row_style(r, 'BCE', calendar=False); zero(r)
    ws[f'L{r}'] = f'=IF(B{r}="","",N(C{r})*N(E{r}))'
for r in (*range(OP1, OP2 + 1), *range(MA1, MA2 + 1), *range(TR1, TR2 + 1)):
    for col in 'DEFGH': ws[f'{col}{r}'].number_format = '#,##0.00'
    ws[f'I{r}'].number_format = '0' if OP1 <= r <= OP2 else '#,##0.00'
    ws[f'L{r}'].number_format = '#,##0.00'; ws[f'L{r}'].font = font(10, True, INK); ws[f'L{r}'].alignment = Alignment(horizontal='right', vertical='center', indent=1)
    for col in 'JK': ws[f'{col}{r}'].font = font(10, False, INK); ws[f'{col}{r}'].alignment = Alignment(horizontal='center', vertical='center')
    if OP1 <= r <= OP2: ws[f'I{r}'].font = font(10, False, INK); ws[f'I{r}'].alignment = Alignment(horizontal='center', vertical='center')
dvu = DataValidation(type='list', formula1='=Listes!$E$1', allow_blank=True, showErrorMessage=False); ws.add_data_validation(dvu); dvu.add(f'A{MA1}:A{MA2}')

# --- récapitulatif global (colonnes de gauche)
for c in range(1, 13): ws.cell(SUM0 - 1, c).fill = fill(NAVY)
ws.cell(SUM0 - 1, 1).value = 'RÉCAPITULATIF'; ws.cell(SUM0 - 1, 1).font = font(10, True, 'FFFFFF'); ws.cell(SUM0 - 1, 1).alignment = Alignment(vertical='center', indent=1); ws.row_dimensions[SUM0 - 1].height = 20
def sumh(a, b, i): return '+'.join(f'SUM({L(hc(i,k))}{a}:{L(hc(i,k))}{b})' for k in range(3))
LINES = [(f'="Opérateurs · tarif journalier ("&SUM(K{OP1}:K{OP2})&" j opérations, "&SUM(J{OP1}:J{OP2})&" j stand-by)"', '910XFISHINGOP', '=' + sumh(OP1, OP2, 0)),
         (f'="Opérateurs · mob / demob ("&SUM(I{OP1}:I{OP2})&")"', '900XMOBDEMOB', '=' + sumh(OP1, OP2, 1)),
         ('Location du matériel (stand-by + opérations)', '904XRENTALEQUIPMT', '=' + sumh(MA1, MA2, 0)),
         ('Utilisation charge et inspection (UC, une seule fois)', '905XUC', '=' + sumh(MA1, MA2, 1)),
         ('Valeur de remplacement et restocking', '', '=' + sumh(MA1, MA2, 2)),
         ('Transport et autres frais', '900XMOBDEMOB', f'=SUM(L{TR1}:L{TR2})')]
for i, (lab, code, f) in enumerate(LINES):
    r = SUM0 + i; ws.row_dimensions[r].height = 18
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=6); ws.merge_cells(start_row=r, start_column=7, end_row=r, end_column=11)
    ws[f'A{r}'] = lab; ws[f'A{r}'].font = font(10.5, False, INK); ws[f'A{r}'].alignment = Alignment(vertical='center', indent=1)
    ws[f'G{r}'] = code; ws[f'G{r}'].font = font(8, c=MUTED); ws[f'G{r}'].alignment = Alignment(horizontal='center', vertical='center')
    ws[f'L{r}'] = f; ws[f'L{r}'].number_format = '#,##0.00'; ws[f'L{r}'].font = font(10.5, True); ws[f'L{r}'].alignment = Alignment(horizontal='right', vertical='center', indent=1)
    for c in range(1, 13): ws.cell(r, c).border = Border(bottom=thin())
rt = SUM0 + len(LINES)
ws.merge_cells(start_row=rt, start_column=1, end_row=rt, end_column=11); ws[f'A{rt}'] = 'TOTAL HT À FACTURER'
ws[f'L{rt}'] = f'=SUM(L{SUM0}:L{rt-1})'; ws[f'L{rt}'].number_format = '#,##0.00'
for c in range(1, 13): ws.cell(rt, c).fill = fill(BLUE); ws.cell(rt, c).font = font(12, True, 'FFFFFF'); ws.cell(rt, c).alignment = Alignment(vertical='center', horizontal='right' if c == 12 else 'left', indent=1 if c in (1, 12) else 0)
ws.row_dimensions[rt].height = 26; ws.row_dimensions[rt + 1].height = 16
ws.merge_cells(start_row=rt + 1, start_column=1, end_row=rt + 1, end_column=11)
ws[f'A{rt+1}'] = 'Gratuit (FOC), pour information'; ws[f'A{rt+1}'].font = font(9.5, i=True, c=MUTED); ws[f'A{rt+1}'].alignment = Alignment(indent=1, vertical='center')
ws[f'L{rt+1}'] = '=' + sumh(MA1, MA2, 3); ws[f'L{rt+1}'].number_format = '#,##0.00'; ws[f'L{rt+1}'].font = font(9.5, i=True, c=MUTED); ws[f'L{rt+1}'].alignment = Alignment(horizontal='right', indent=1)
# --- facturation par bloc (sous chaque bloc du calendrier) : l'UC tombe dans le bloc où l'outil travaille en O pour la première fois
BL = [('Opérateurs · jours', lambda k: f'SUM({L(hc(0,k))}{OP1}:{L(hc(0,k))}{OP2})'),
      ('Opérateurs · mob / demob', lambda k: f'SUM({L(hc(1,k))}{OP1}:{L(hc(1,k))}{OP2})'),
      ('Location du matériel', lambda k: f'SUM({L(hc(0,k))}{MA1}:{L(hc(0,k))}{MA2})'),
      ('UC et inspection', lambda k: f'SUM({L(hc(1,k))}{MA1}:{L(hc(1,k))}{MA2})'),
      ('Valeur de remplacement, restocking', lambda k: f'SUM({L(hc(2,k))}{MA1}:{L(hc(2,k))}{MA2})')]
for k in range(3):
    c1 = C0 + k * BLOCK
    for c in range(c1, c1 + BLOCK): ws.cell(SUM0 - 1, c).fill = fill(NAVY)
    ws.cell(SUM0 - 1, c1).value = f'=IF(OR($C$9="",N({NN})<={k*BLOCK}),"","FACTURATION DU BLOC "&{k+1}&" (hors transport et autres frais)")'
    ws.cell(SUM0 - 1, c1).font = font(10, True, 'FFFFFF'); ws.cell(SUM0 - 1, c1).alignment = Alignment(vertical='center', indent=1)
    for i, (lab, fn) in enumerate(BL):
        r = SUM0 + i
        ws.merge_cells(start_row=r, start_column=c1, end_row=r, end_column=c1 + 17); ws.merge_cells(start_row=r, start_column=c1 + 18, end_row=r, end_column=c1 + 25)
        ws.cell(r, c1).value = lab; ws.cell(r, c1).font = font(10, False, INK); ws.cell(r, c1).alignment = Alignment(vertical='center', indent=1)
        v = ws.cell(r, c1 + 18); v.value = f'=IF(N({NN})<={k*BLOCK},"",{fn(k)})'; v.number_format = '#,##0.00'; v.font = font(10, True); v.alignment = Alignment(horizontal='right', vertical='center', indent=1)
        for c in range(c1, c1 + 26): ws.cell(r, c).border = Border(bottom=thin())
    ws.merge_cells(start_row=rt, start_column=c1, end_row=rt, end_column=c1 + 17); ws.merge_cells(start_row=rt, start_column=c1 + 18, end_row=rt, end_column=c1 + 25)
    ws.cell(rt, c1).value = f'="TOTAL DU BLOC "&{k+1}'
    t = ws.cell(rt, c1 + 18); t.value = f'=IF(N({NN})<={k*BLOCK},"",SUM({L(c1+18)}{SUM0}:{L(c1+18)}{SUM0+4}))'; t.number_format = '#,##0.00'
    for c in range(c1, c1 + 26): ws.cell(rt, c).fill = fill(BLUE); ws.cell(rt, c).font = font(11, True, 'FFFFFF'); ws.cell(rt, c).alignment = Alignment(vertical='center', horizontal='right' if c == c1 + 18 else 'left', indent=1 if c in (c1, c1 + 18) else 0)
# signatures
rg = rt + 3
for c1, c2, t in ((1, 5, 'POUR ENEDRIL · Nom, date, signature'), (6, 12, 'POUR LE CLIENT · Nom, date, signature, cachet')):
    ws.merge_cells(start_row=rg, start_column=c1, end_row=rg + 2, end_column=c2); ws.cell(rg, c1).value = t; ws.cell(rg, c1).font = font(8, True, MUTED); ws.cell(rg, c1).alignment = Alignment(vertical='top', indent=1)
    for rr in range(rg, rg + 3):
        for cc in range(c1, c2 + 1): ws.cell(rr, cc).border = Border(left=thin() if cc == c1 else None, right=thin() if cc == c2 else None, top=thin() if rr == rg else None, bottom=thin() if rr == rg + 2 else None)
for rr in range(rg, rg + 3): ws.row_dimensions[rr].height = 17
LASTROW = rg + 2

# validations et couleurs
dvm = DataValidation(type='list', formula1='=Listes!$C$2:$C$8', allow_blank=True, showErrorMessage=True); dvm.errorStyle = 'warning'; dvm.error = 'Codes : S, O, FOC, VR, RC, MOB, DEMOB.'
ws.add_data_validation(dvm)
for a, b in ((OP1, OP2), (MA1, MA2)): dvm.add(f'{L(C0)}{a}:{L(CL)}{b}')
rngc = f'{L(C0)}{OP1}:{L(CL)}{OP2} {L(C0)}{MA1}:{L(CL)}{MA2}'
ws.conditional_formatting.add(rngc, FormulaRule(formula=[f'{L(C0)}$13=""'], fill=fill('E3E6EA'), stopIfTrue=True))
for code, bg, fg in (('S', 'FFE9A8', '7A5B00'), ('O', '9EDDB0', '0B5A2A'), ('FOC', 'D5DBE3', '4A5668'), ('VR', 'F6B3AE', '8A1710'), ('RC', 'FBCB9A', '7A3F00'), ('MOB', 'B9D8F5', '0A4FA0'), ('DEMOB', 'B9D8F5', '0A4FA0')):
    ws.conditional_formatting.add(rngc, CellIsRule(operator='equal', formula=[f'"{code}"'], fill=fill(bg), font=Font(name=F, bold=True, color=fg)))
ws.conditional_formatting.add(rngc, FormulaRule(formula=[f'AND({L(C0)}$13<>"",WEEKDAY({L(C0)}$13,2)>5)'], fill=fill('EEF2F6')))
ws.conditional_formatting.add(f'B{MA1}:I{MA2}', FormulaRule(formula=[f'AND($B{MA1}<>"",N($C{MA1})=0,N($E{MA1})=0)'], fill=fill('C9DAF0'), font=Font(name=F, bold=True, color=NAVY)))

if EXEMPLE:
    ws['A6'] = 'Geopetrol'; ws['C6'] = 'Puits Lacq-12 · CLU108'; ws['G6'] = '26-82-FR'; ws['J6'] = 'PO-4500123'
    ws['A9'] = 'Paul HYNDERICK'; ws['C9'] = datetime.date(2026, 10, 12); ws['G9'] = datetime.date(2026, 11, 20)
    ws[f'B{OP1}'] = 'HARRISON Stevens (DD)'; ws[f'D{OP1}'] = 400; ws[f'E{OP1}'] = 750; ws[f'F{OP1}'] = 300
    items = [('BHA #1', None, None, None, None, None, None, None), ('Stab 5-7/8 OD, 2-1/4" ID - 3-1/2" IF Pin x Box', 1, 85, 120, 40, 4200, 150, 600),
             ('XO 3-1/2" IF Pin x 2-7/8" EU Box', 2, 20, 30, 10, 900, 60, 150), ('XO 3-1/2" IF Box x 2-7/8" EU Pin', 1, 20, 30, 10, 900, 60, 150)]
    for i, row in enumerate(items):
        for col, v in zip('BCDEFGHI', row):
            if v is not None: ws[f'{col}{MA1+i}'] = v
    def mark(r, seq):
        for i, v in enumerate(seq):
            if v: ws.cell(r, C0 + i).value = v
    mark(OP1, ['MOB'] + ['O'] * 35 + ['DEMOB'])
    mark(MA1 + 1, ['MOB', 'S'] + ['O'] * 12 + ['S'] * 10 + ['O'] * 12 + ['DEMOB'])
    mark(MA1 + 2, ['MOB'] + ['O'] * 8 + ['S'] * 4 + ['DEMOB'])
    mark(MA1 + 3, ['S'] * 3 + ['O'] * 8 + ['VR'])
    ws[f'B{TR1}'] = 'Transport MOB (au coût +15 %)'; ws[f'C{TR1}'] = 1; ws[f'E{TR1}'] = 480
    ws[f'B{TR1+1}'] = 'Transport DEMOB (au coût +15 %)'; ws[f'C{TR1+1}'] = 1; ws[f'E{TR1+1}'] = 520
    # l'exemple montre 2 blocs : on les déplie
    ws.column_dimensions.group(L(C0 + BLOCK), L(C0 + 2 * BLOCK - 1), outline_level=1, hidden=False)

ws.print_title_cols = 'A:L'; ws.print_area = f'A1:{L(CL)}{LASTROW}'
ws.page_setup.orientation = 'landscape'; ws.page_setup.paperSize = 9; ws.page_setup.scale = 56
ws.page_margins.left = ws.page_margins.right = .3; ws.page_margins.top = .35; ws.page_margins.bottom = .4
ws.col_breaks.append(Break(id=C0 + BLOCK - 1)); ws.col_breaks.append(Break(id=C0 + 2 * BLOCK - 1))
ws.oddFooter.center.text = 'Enedril · Service ticket · &P / &N'; ws.oddFooter.center.size = 8
ws.freeze_panes = 'D15'; ws.sheet_view.zoomScale = 90
wb.calculation.fullCalcOnLoad = True
out = os.path.join(OUTDIR, 'Service_Ticket_Enedril_2027' + ('_exemple' if EXEMPLE else '') + '.xlsx'); wb.save(out); print('ok', out)
