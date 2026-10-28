"""Génère les deux classeurs Excel 2027 d'Enedril :
  - Devis (onglets 1 Affaire, 2 Matériel, 3 Options, 4 Devis)       -> avec les prix
  - Tool List (onglets 1 Matériel à coller, 2 Tool List + colisage) -> SANS prix, pour l'atelier
Usage : python3 generer_devis_2027.py <dossier_sortie> [exemple]"""
import sys, os, datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule
from openpyxl.worksheet.formula import ArrayFormula
from openpyxl.drawing.image import Image as XLImage
from openpyxl.worksheet.pagebreak import Break
from openpyxl.utils import get_column_letter as L

OUTDIR = sys.argv[1]; EXEMPLE = len(sys.argv) > 2
SUF = '_exemple' if EXEMPLE else ''
LOGO = '/home/user/Paul/public/logo-enedril-white.png'
NAVY, BLUE, CYAN, RED = '08203F', '0A4FA0', '00AEEF', 'E2231A'
INK, MUTED, LINE, INPUT = '0B1B2E', '51647A', 'D5DEE8', 'EAF6FD'
F = 'Calibri'
CALC = 'Forfait calculé (S + O + UC)'
def font(sz=10, b=False, c=INK, i=False): return Font(name=F, size=sz, bold=b, color=c, italic=i)
def fill(c): return PatternFill('solid', start_color=c, end_color=c)
thin = lambda c=LINE: Side(style='thin', color=c)

# ------------------------------------------------------------------ données communes
LISTS = {
 'A': ('Contact Enedril', ['Fabien JACQUOT', 'Alexis ESTINES', 'Paul HYNDERICK', 'Céline CARDONA', 'Koen MONDELAERS', 'Luigi LIBERATORE']),
 'B': ('E-mail', ['fjacquot@enedril.fr', 'aestines@enedril.fr', 'phynderick@enedril.fr', 'ccardona@enedril.fr', 'kmondelaers@enedril.fr', 'lliberatore@enedril.fr']),
 'D': ('Incoterm', ['EXW Lons', 'FCA Lons', 'DAP', 'DDP', 'FOB']),
 'E': ('Validité', ['15 jours / 15 days', '30 jours / 30 days', '60 jours / 60 days', '90 jours / 90 days']),
 'F': ('Règlement', ['30 jours date de facture / 30 days invoice date', '30 jours fin de mois / 30 days end of month', '45 jours fin de mois / 45 days end of month', 'À la commande / Upon order']),
 'G': ('Oui / Non', ['Oui', 'Non']),
 'J': ('Support de colisage', ['Palette', 'Fishing basket', 'Caisse', 'Loose (vrac)']),
 'K': ('N° de colis', ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'Loose']),
 'L': ('Unité', ['forfait', '€/jour', '€/jour/pers', '€/pers', '€/unité']),
 'M': ('Mode transport', ['Coût réel +15 %', 'Forfait']),
 'N': ('Mode forfait', [CALC, 'Forfait global', 'Forfait par jour']),
 'P': ('Statut', ['Oui', 'En cours']),
 'Q': ('Test / Taille', ['Taille OK', 'Test OK', 'Taille + test OK', 'À contrôler']),
}
SOCIETE = "ENEDRIL · Z-Induspal · 3 Av. des Lacs · 64140 LONS (France) · SIRET 79464246200020 · TVA FR11794642462"
COND_FR = ("La location s'entend depuis le jour de départ de la base d'origine jusqu'à son retour au même endroit.\n"
 "Le Wear Charge s'applique pour toute usure liée à un usage normal des équipements. En cas de dommages plus importants liés à un usage anormal, la valeur de remplacement sera facturée sur documentation.\n"
 "Charges additionnelles à prévoir pour le colisage d'outils destinés à une expédition en aérien ou maritime.\n"
 "Conditions générales de vente disponibles sur demande ou sur notre site internet www.enedril.com")
COND_EN = ("The rental is from the day of departure from the base of origin until its return to the same place.\n"
 "Wear Charge applies to all wear and tear related to normal use of equipment. In case of greater damage due to abnormal use, the replacement value will be charged based on supporting documentation.\n"
 "Additional charges may apply for packing tools intended for air or ocean shipment.\n"
 "General conditions of sale available upon request or on our website www.enedril.com")

# ------------------------------------------------------------------ aides
def new_sheet(wb, title, tab, first=False):
    ws = wb.active if first else wb.create_sheet(); ws.title = title
    ws.sheet_properties.tabColor = tab; ws.sheet_view.showGridLines = False; return ws
def build_listes(wb, extra_lang=True):
    ws = new_sheet(wb, 'Listes', '9FB6CE')
    for col, (h, vals) in LISTS.items():
        ws[f'{col}1'] = h; ws[f'{col}1'].font = font(9, True, 'FFFFFF'); ws[f'{col}1'].fill = fill(NAVY)
        for i, v in enumerate(vals): ws[f'{col}{i+2}'] = v; ws[f'{col}{i+2}'].font = font(10)
        ws.column_dimensions[col].width = 30
    ws['H1'] = 1; ws['H1'].font = font(9, c=MUTED)
    ws['H2'] = '← langue du devis : 1 = français, 2 = anglais'; ws['H2'].font = font(8, i=True, c=MUTED)
    ws['A10'] = 'Pour ajouter un contact, une validité, etc. : écrire à la suite dans la colonne (les listes déroulantes lisent les 12 premières lignes).'
    ws['A10'].font = font(9, i=True, c=MUTED)
    return ws
def lst(col, n=12): return f'=Listes!${col}$2:${col}${n}'
def dv_list(ws, rng, col, strict=True):
    d = DataValidation(type='list', formula1=lst(col), allow_blank=True, showErrorMessage=True)
    d.errorStyle = 'stop' if strict else 'warning'; d.errorTitle = 'Valeur'; d.error = 'Choisir une valeur de la liste.'
    ws.add_data_validation(d); d.add(rng)
def label(ws, ref, text):
    ws[ref] = text; ws[ref].font = font(9, True, MUTED); ws[ref].alignment = Alignment(vertical='center', indent=1)
def inp(ws, ref, value=None, fmt=None, align='left'):
    c = ws[ref]
    if value is not None: c.value = value
    c.font = font(10.5, False, BLUE); c.fill = fill(INPUT)
    c.alignment = Alignment(horizontal=align, vertical='center', indent=1 if align == 'left' else 0, wrap_text=True)
    c.border = Border(bottom=Side(style='thin', color=CYAN))
    if fmt: c.number_format = fmt
def banner(ws, title, sub, last_col):
    for r in (1, 2, 3):
        for c in range(1, last_col + 1): ws.cell(r, c).fill = fill(NAVY if r < 3 else CYAN)
    ws.row_dimensions[1].height = 30; ws.row_dimensions[2].height = 20; ws.row_dimensions[3].height = 6
    ws['B1'] = title; ws['B1'].font = font(18, True, 'FFFFFF'); ws['B1'].alignment = Alignment(vertical='center')
    ws['B2'] = sub; ws['B2'].font = font(10, c='9FD8F5'); ws['B2'].alignment = Alignment(vertical='center')
def section(ws, r, c1, c2, text, color=NAVY):
    ws.merge_cells(start_row=r, start_column=c1, end_row=r, end_column=c2)
    c = ws.cell(r, c1); c.value = text; c.font = font(10, True, 'FFFFFF'); c.alignment = Alignment(vertical='center', indent=1)
    for k in range(c1, c2 + 1): ws.cell(r, k).fill = fill(color)
    ws.row_dimensions[r].height = 20
def page(ws, orient='landscape', fit_h=0, area=None):
    ws.page_setup.orientation = orient; ws.page_setup.paperSize = 9; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = fit_h
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    if area: ws.print_area = area

# ------------------------------------------------------------------ colonnes de la feuille Matériel (devis) / Matériel à coller (tool list)
M1, M2 = 6, 29                                         # lignes de saisie : 24

# ================================================================== TOOL LIST (fonction partagée)
def build_tool_list(wb, ws, mt, mc, T1=15, TN=40, TV=20):
    """mt = nom de la feuille source (entre apostrophes) ; mc = colonnes : ban, desc, qty, lines, cum"""
    for i, w in enumerate((5.5, 14, 15, 42, 8, 8, 10, 11, 13, 8, 28, 8, 10, 8, 9, 8, 10, 8, 1.5, 6, 6, 6), 1): ws.column_dimensions[L(i)].width = w
    LC = 18
    for r in (1, 2, 3):
        for c in range(1, LC + 1): ws.cell(r, c).fill = fill(NAVY if r < 3 else CYAN)
    ws.row_dimensions[1].height = 32; ws.row_dimensions[2].height = 20; ws.row_dimensions[3].height = 5
    img = XLImage(LOGO); img.width, img.height = 140, 32; ws.add_image(img, 'A1')
    ws.merge_cells('F1:R1'); ws['F1'] = 'TOOL LIST  ·  LISTE DE MATÉRIEL'; ws['F1'].font = font(17, True, 'FFFFFF'); ws['F1'].alignment = Alignment(horizontal='right', vertical='center')
    ws.merge_cells('F2:R2'); ws['F2'] = '="N° "&G8&IF(C6="","","   ·   "&C6)'; ws['F2'].font = font(11, c='9FD8F5'); ws['F2'].alignment = Alignment(horizontal='right', vertical='center')
    ws.row_dimensions[4].height = 8
    def tin(r, c1, c2, text, ref, fmt=None):
        ws.merge_cells(start_row=r, start_column=c1, end_row=r, end_column=c2); ws.merge_cells(start_row=r+1, start_column=c1, end_row=r+1, end_column=c2)
        a = ws.cell(r, c1); a.value = text.upper(); a.font = font(7.5, True, MUTED); a.alignment = Alignment(vertical='bottom', indent=1)
        for k in range(c1, c2 + 1): ws.cell(r+1, k).fill = fill(INPUT); ws.cell(r+1, k).border = Border(bottom=Side(style='thin', color=CYAN))
        b = ws.cell(r+1, c1); b.font = font(10.5, True, BLUE); b.alignment = Alignment(horizontal='left', vertical='center', indent=1, wrap_text=True)
        if fmt: b.number_format = fmt
    # groupes : A:C, D:F, G:K, L:R  (valeurs saisies dans la 1re cellule de chaque groupe)
    tin(5, 1, 3, 'Client', 'A6'); tin(5, 4, 6, 'Puits / chantier', 'D6'); tin(5, 7, 11, 'Dossier N° · Rig', 'G6'); tin(5, 12, 18, 'A / at (destination)', 'L6')
    tin(7, 1, 3, 'Date de départ', 'A8', 'dd/mm/yyyy'); tin(7, 4, 6, 'Faite le', 'D8', 'dd/mm/yyyy'); tin(7, 7, 11, 'N° de tool list', 'G8'); tin(7, 12, 18, 'Faite par', 'L8')
    tin(9, 1, 6, 'Description générale', 'A10'); tin(9, 7, 11, 'Colisage', 'G10'); tin(9, 12, 18, 'Révisée le · par', 'L10')
    # F2 utilise C6/G8 : on range le dossier en G6, donc on corrige la formule
    ws['F2'] = '="N° "&G8&IF(G6="","","   ·   "&G6)'
    for r in (5, 7, 9): ws.row_dimensions[r].height = 15; ws.row_dimensions[r+1].height = 21
    ws['G10'] = 'A communiquer dès que possible'
    ws.merge_cells('A11:R11'); ws['A11'] = 'Toute modification par rapport à la liste ci-dessous doit être évitée, et impérativement signalée si pas le choix.'
    ws['A11'].font = font(9, True, RED); ws['A11'].alignment = Alignment(indent=1, vertical='center'); ws.row_dimensions[11].height = 20; ws.row_dimensions[12].height = 4
    def thead(r, c1, c2, text, color):
        ws.merge_cells(start_row=r, start_column=c1, end_row=r, end_column=c2)
        c = ws.cell(r, c1); c.value = text; c.font = font(8.5, True, 'FFFFFF'); c.alignment = Alignment(horizontal='center', vertical='center')
        for k in range(c1, c2 + 1): ws.cell(r, k).fill = fill(color)
    thead(13, 1, 4, 'ÉQUIPEMENT', NAVY); thead(13, 5, 9, 'RELEVÉS · MEASUREMENTS (in / pouces)', BLUE); thead(13, 10, 11, 'STOCK ET REMARQUES', NAVY)
    thead(13, 12, 15, 'AVANCEMENT PRÉPARATION', BLUE); thead(13, 16, 18, 'CONTRÔLE SUPERVISEUR', NAVY)
    TH = ['Item', 'Référence\n(PL)', 'Serial Number', 'Description', 'OD', 'ID', 'Ouverture\nblades', 'Ouverture max\ncouteaux', 'Taille / test\nconfirmé', 'Stock\n@CC', 'Commentaire',
          'Prêt à\npartir', 'Le', 'Par', 'Colisage\n(n° colis)', 'Check', 'Le', 'Par']
    for i, h in enumerate(TH, 1):
        c = ws.cell(14, i); c.value = h; c.font = font(8, True, NAVY); c.fill = fill('DCE8F5'); c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    ws.row_dimensions[14].height = 34
    for col, t in (('T', 'ligne'), ('U', 'réf.'), ('V', 'bannière')): ws[f'{col}14'] = t; ws[f'{col}14'].font = font(7, c='7A8CA3')
    S = lambda col: f'{mt}${mc[col]}${M1}:${mc[col]}${M2}'
    TOT = f'SUM({S("lines")})'
    for i in range(TN):
        r = T1 + i; ws.row_dimensions[r].height = 27
        ws[f'T{r}'] = f'=IF({i+1}<={TOT},{i+1},"")'
        ws[f'U{r}'] = f'=IF(T{r}="","",COUNTIF({S("cum")},"<"&T{r})+1)'
        ws[f'V{r}'] = f'=IF(U{r}="","",IF(INDEX({S("ban")},U{r})="Oui",1,0))'
        ws[f'A{r}'] = f'=IF(OR(T{r}="",V{r}=1),"",T{r}-COUNTIF(V${T1}:V{r},1))'
        q = f'INDEX({S("lines")},U{r})'
        ws[f'D{r}'] = (f'=IF(T{r}="","",IF(V{r}=1,UPPER(INDEX({S("desc")},U{r})),INDEX({S("desc")},U{r})&IF({q}>1,"  ("&(T{r}-INDEX({S("cum")},U{r})+{q})&"/"&{q}&")","")))')
        for col in 'TUV': ws[f'{col}{r}'].font = font(7, c='B8C4D2')
        ws[f'A{r}'].font = font(10, True, MUTED); ws[f'A{r}'].alignment = Alignment(horizontal='center', vertical='center')
        ws[f'D{r}'].font = font(9.5, c=INK); ws[f'D{r}'].alignment = Alignment(vertical='center', wrap_text=True, indent=1)
        for col in 'BCEFGHIJKLMNOPQR':
            c = ws[f'{col}{r}']; c.font = font(9.5, False, BLUE)
            c.number_format = '0.000' if col in 'EFGH' else ('dd/mm' if col in 'MQ' else 'General')
            c.alignment = Alignment(horizontal='left' if col in 'BCK' else 'center', vertical='center', indent=1 if col in 'BCK' else 0, wrap_text=True)
    last = T1 + TN - 1
    for col, lc in (('I', 'Q'), ('L', 'P'), ('O', 'K'), ('J', 'G'), ('P', 'G'), ('N', 'A'), ('R', 'A')): dv_list(ws, f'{col}{T1}:{col}{last}', lc, False)
    ws.conditional_formatting.add(f'A{T1}:R{last}', FormulaRule(formula=[f'$V{T1}=1'], fill=fill(BLUE), font=Font(name=F, bold=True, color='FFFFFF'), stopIfTrue=True))
    ws.conditional_formatting.add(f'A{T1}:R{last}', FormulaRule(formula=[f'$T{T1}<>""'], fill=fill(INPUT), border=Border(bottom=thin('B7DDF2'))))
    ws.conditional_formatting.add(f'L{T1}:L{last}', FormulaRule(formula=[f'AND($V{T1}=0,$L{T1}="Oui")'], fill=fill('DDF3E4')))
    ws.row_dimensions.group(T1 + TV, last, outline_level=1, hidden=True)
    ws.merge_cells(start_row=T1 + TN, start_column=1, end_row=T1 + TN, end_column=18)
    ws[f'A{T1+TN}'] = f'=IF({TOT}>{TV},"⚠  "&({TOT}-{TV})&" ligne(s) au-delà de la ligne {TV} sont masquées : cliquer sur le [+] dans la marge gauche pour les afficher.","")'
    ws[f'A{T1+TN}'].font = font(9.5, True, RED); ws[f'A{T1+TN}'].alignment = Alignment(indent=1, vertical='center')
    # colisage
    P0 = T1 + TN + 2
    thead(P0, 1, 18, 'COLISAGE  ·  PACKING', NAVY); ws.row_dimensions[P0].height = 20
    for c1, c2, h in [(1, 2, 'Colis'), (3, 3, 'Support'), (4, 4, 'Contenu (items de la tool list)'), (5, 5, 'L (cm)'), (6, 6, 'l (cm)'), (7, 7, 'h (cm)'), (8, 8, 'Poids (kg)'), (9, 9, 'Volume (m³)'), (10, 11, 'Remarques')]:
        if c1 != c2: ws.merge_cells(start_row=P0+1, start_column=c1, end_row=P0+1, end_column=c2)
        c = ws.cell(P0+1, c1); c.value = h; c.font = font(8, True, NAVY); c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        for k in range(c1, c2 + 1): ws.cell(P0+1, k).fill = fill('DCE8F5')
    ws.row_dimensions[P0+1].height = 22
    Ar = f'$A${T1}:$A${last}'; Or = f'$O${T1}:$O${last}'
    for i in range(10):
        r = P0 + 2 + i; ws.row_dimensions[r].height = 22
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2); ws.merge_cells(start_row=r, start_column=10, end_row=r, end_column=11)
        ws[f'A{r}'] = f'P{i+1}'; ws[f'A{r}'].font = font(10, True, NAVY); ws[f'A{r}'].alignment = Alignment(horizontal='center', vertical='center')
        inp(ws, f'C{r}', None, None, 'center'); dv_list(ws, f'C{r}', 'J', False)
        ws[f'D{r}'] = ArrayFormula(f'D{r}', f'=_xlfn.TEXTJOIN(", ",TRUE,IF({Or}=$A{r},{Ar},""))'); ws[f'D{r}'].font = font(9.5); ws[f'D{r}'].alignment = Alignment(vertical='center', wrap_text=True, indent=1)
        for col in 'EFGH': inp(ws, f'{col}{r}', None, '#,##0.0' if col == 'H' else '0', 'center')
        ws[f'I{r}'] = f'=IF(COUNT(E{r}:G{r})=3,E{r}*F{r}*G{r}/1000000,"")'; ws[f'I{r}'].number_format = '0.000'; ws[f'I{r}'].font = font(10); ws[f'I{r}'].alignment = Alignment(horizontal='center', vertical='center')
        inp(ws, f'J{r}')
        for k in range(1, 12): ws.cell(r, k).border = Border(bottom=thin())
    rl = P0 + 12
    ws.merge_cells(start_row=rl, start_column=1, end_row=rl, end_column=2); ws[f'A{rl}'] = 'Loose'; ws[f'A{rl}'].font = font(10, True, NAVY); ws[f'A{rl}'].alignment = Alignment(horizontal='center', vertical='center')
    ws[f'C{rl}'] = 'Loose (vrac)'; ws[f'C{rl}'].font = font(9.5, c=MUTED); ws[f'C{rl}'].alignment = Alignment(horizontal='center', vertical='center')
    ws[f'D{rl}'] = ArrayFormula(f'D{rl}', f'=_xlfn.TEXTJOIN(", ",TRUE,IF({Or}=$A{rl},{Ar},""))'); ws[f'D{rl}'].font = font(9.5); ws[f'D{rl}'].alignment = Alignment(vertical='center', wrap_text=True, indent=1)
    inp(ws, f'H{rl}', None, '#,##0.0', 'center'); ws.row_dimensions[rl].height = 22
    for k in range(1, 12): ws.cell(rl, k).border = Border(bottom=thin())
    rt = rl + 1
    ws.merge_cells(start_row=rt, start_column=1, end_row=rt, end_column=7)
    ws[f'A{rt}'] = f'="TOTAL  ·  "&COUNTA(C{P0+2}:C{P0+11})&" colis  ·  "&COUNT({Ar})&" outil(s)"'
    ws[f'H{rt}'] = f'=SUM(H{P0+2}:H{rl})'; ws[f'H{rt}'].number_format = '#,##0.0 "kg"'; ws[f'I{rt}'] = f'=SUM(I{P0+2}:I{P0+11})'; ws[f'I{rt}'].number_format = '0.000 "m³"'
    for k in range(1, 12): ws.cell(rt, k).fill = fill(NAVY); ws.cell(rt, k).font = font(10, True, 'FFFFFF'); ws.cell(rt, k).alignment = Alignment(horizontal='center' if k > 7 else 'left', vertical='center', indent=1 if k == 1 else 0)
    ws.row_dimensions[rt].height = 22
    rs = rt + 2
    for c1, c2, t in [(1, 4, 'PRÉPARÉ PAR · Nom, date, signature'), (5, 11, 'CONTRÔLÉ PAR (superviseur) · Nom, date, signature'), (12, 18, 'COLISAGE VÉRIFIÉ PAR · Nom, date')]:
        ws.merge_cells(start_row=rs, start_column=c1, end_row=rs+3, end_column=c2); ws.cell(rs, c1).value = t; ws.cell(rs, c1).font = font(8, True, MUTED); ws.cell(rs, c1).alignment = Alignment(vertical='top', indent=1)
        for rr in range(rs, rs + 4):
            for cc in range(c1, c2 + 1): ws.cell(rr, cc).border = Border(left=thin() if cc == c1 else None, right=thin() if cc == c2 else None, top=thin() if rr == rs else None, bottom=thin() if rr == rs + 3 else None)
    for r in range(rs, rs + 4): ws.row_dimensions[r].height = 16
    page(ws, 'landscape', 0, f'A1:R{rs+3}')
    ws.page_margins.left = ws.page_margins.right = .25; ws.page_margins.top = .3; ws.page_margins.bottom = .4
    ws.row_breaks.append(Break(id=P0 - 1)); ws.freeze_panes = 'E15'; ws.sheet_view.zoomScale = 90
    ws.oddFooter.center.text = 'Enedril · Tool List &P / &N'; ws.oddFooter.center.size = 8
    return T1, P0

# ================================================================== CLASSEUR DEVIS
def build_devis():
    wb = Workbook()
    wsA = new_sheet(wb, '1 Affaire', CYAN, True); wsM = new_sheet(wb, '2 Matériel', CYAN); wsO = new_sheet(wb, '3 Options', CYAN); wsD = new_sheet(wb, '4 Devis', BLUE)
    build_listes(wb)
    wsX = new_sheet(wb, 'Textes', '9FB6CE')
    AF, MT, OP = "'1 Affaire'!", "'2 Matériel'!", "'3 Options'!"
    # ---- textes FR / EN
    TXT = {
     'title': ('OFFRE DE LOCATION', 'EQUIPMENT RENTAL QUOTATION'), 'client': ('Client', 'Company'), 'attn': ("À l'attention de", 'Attention'),
     'well': ('Puits / Chantier', 'Well / Location'), 'rig': ('Rig', 'Rig'), 'offer': ("N° d'offre", 'Offer N°'), 'date': ('Date', 'Date'),
     'valid': ("Validité de l'offre", 'Validity'), 'inco': ('Incoterm', 'Incoterm'), 'lead': ('Délai de mise à dispo', 'Lead time'),
     'pay': ('Conditions de règlement', 'Payment terms'), 'we': ('Facturation WE et jours fériés', 'Weekend & holiday billing'),
     'by': ('Établi par', 'Established by'), 'mail': ('E-mail', 'E-mail'), 'tel': ('Téléphone', 'Phone'),
     'sec_eq': ('MATÉRIEL', 'EQUIPMENT'), 'h_n': ('#', '#'), 'h_desc': ('Description', 'Description'), 'h_qty': ('Qté', 'Qty'),
     'h_s': ('Stand-by (S)\n€ / jour / item', 'Stand-by (S)\ndaily rate / item'), 'h_o': ('Opérations (O)\n€ / jour / item', 'Operations (O)\ndaily rate / item'),
     'h_uc': ("Utilisation\nCharge (UC)\n€ / item", 'Utilisation\nCharge (UC)\nper item'), 'h_lih': ('Valeur de remplacement\n(LIH / DBR) € / item', 'Replacement value\n(LIH / DBR) per item'),
     'h_insp': ('Inspection\n€ / item', 'Inspection\nper item'), 'h_rest': ('Restocking\n€', 'Restocking\ncharge'), 'h_ref': ('Remarques', 'Remarks'),
     'incl': ('incl.', 'incl.'), 'incl_long': ('Inclus au forfait', 'Included in lump sum'),
     'sec_opt': ('PRESTATIONS ET OPTIONS', 'SERVICES AND OPTIONS'), 'h_label': ('Prestation', 'Service'), 'h_unit': ('Unité', 'Unit'),
     'h_pu': ('Prix unitaire €', 'Unit price €'), 'h_tot': ('Total €', 'Total €'), 'h_det': ('Détail', 'Details'),
     'op_day': ('Opérateur · tarif journalier', 'Operator · daily rate'), 'op_mob': ('Opérateur · Mob / Demob', 'Operator · Mob / Demob'),
     'tight': ('Serrage · prix par serrage', 'Tong & make-up service · price per make-up'), 'tr_mob': ('Transport MOB (Lons → chantier)', 'Transport MOB (Lons → site)'),
     'tr_dem': ('Transport DEMOB (chantier → Lons)', 'Transport DEMOB (site → Lons)'), 'free': ('Option', 'Option'), 'forfait': ('Forfait', 'Lump sum'),
     'at_cost': ('au coût réel +15 %', 'at cost +15%'), 'tr_note': ('Transport organisé par Enedril', 'Transport organised by Enedril'),
     'ht': ('€ HT', '€ excl. VAT'), 'calc_det': ('j stand-by + %s j opérations + utilisations de charge (UC)', 'stand-by days + %s operation days + utilisation charges (UC)'),
     'sec_cond': ('CONDITIONS PARTICULIÈRES · SPECIFIC CONDITIONS', 'SPECIFIC CONDITIONS · CONDITIONS PARTICULIÈRES'),
     'accept': ('BON POUR ACCORD', 'ACCEPTED BY'), 'sig_name': ('Nom et qualité', 'Name and title'), 'sig_date': ('Date', 'Date'), 'sig_sig': ('Signature et cachet', 'Signature and stamp'),
     'lump': ('forfait', 'lump sum'),
     'sec_tight': ('SERRAGE · TONG & MAKE-UP', 'TONG & MAKE-UP SERVICE'), 'sec_tr': ('TRANSPORT', 'TRANSPORT'), 'sec_op': ('OPÉRATEURS', 'OPERATORS'),
    }
    wsX['A1'], wsX['B1'], wsX['C1'] = 'Clé', 'Français', 'English'
    for c in 'ABC': wsX[f'{c}1'].font = font(9, True, 'FFFFFF'); wsX[f'{c}1'].fill = fill(NAVY)
    for i, (k, (fr, en)) in enumerate(TXT.items(), start=2):
        wsX[f'A{i}'], wsX[f'B{i}'], wsX[f'C{i}'] = k, fr, en
        for c in 'ABC': wsX[f'{c}{i}'].alignment = Alignment(wrap_text=True, vertical='top')
    for c, w in zip('ABC', (14, 60, 60)): wsX.column_dimensions[c].width = w
    XEND = len(TXT) + 1
    T = lambda k: f'INDEX(Textes!$B$2:$C${XEND},MATCH("{k}",Textes!$A$2:$A${XEND},0),Listes!$H$1)'

    # ================= 1 AFFAIRE
    ws = wsA
    for col, w in zip('ABCDEFG', (2, 28, 38, 3, 30, 46, 2)): ws.column_dimensions[col].width = w
    banner(ws, 'DEVIS 2027', "Remplir les onglets 1, 2 et 3 : le devis (4) se complète tout seul. Cases bleues = à saisir.", 7)
    if EXEMPLE:
        ws['F1'] = 'EXEMPLE · tarifs fictifs'; ws['F1'].font = font(11, True, 'FFFFFF'); ws['F1'].fill = fill(RED); ws['F1'].alignment = Alignment(horizontal='center', vertical='center')
    section(ws, 5, 2, 3, "L'AFFAIRE"); section(ws, 5, 5, 6, "L'OFFRE")
    for r, t in [(6, "N° d'offre"), (7, 'Date'), (8, 'Client'), (9, "À l'attention de"), (10, 'Puits / Chantier')]: label(ws, f'B{r}', t)
    for r, t in [(6, 'Établi par'), (7, 'E-mail'), (8, 'Téléphone'), (9, "Validité de l'offre"), (10, 'Incoterm'), (11, 'Délai de mise à dispo'), (12, 'Conditions de règlement'), (13, 'Facturation WE et jours fériés')]: label(ws, f'E{r}', t)
    for ref in ('C6', 'C8', 'C9', 'C10'): inp(ws, ref)
    inp(ws, 'C7', None, 'dd/mm/yyyy')
    inp(ws, 'F6'); dv_list(ws, 'F6', 'A', False)
    for r in (7, 8): ws[f'F{r}'].font = font(10.5, c=MUTED); ws[f'F{r}'].alignment = Alignment(vertical='center', indent=1); ws[f'F{r}'].border = Border(bottom=thin())
    ws['F7'] = '=IFERROR(VLOOKUP(F6,Listes!$A$2:$B$12,2,FALSE),"")'; ws['F8'] = '+33 (0)5 59 04 50 45'
    for ref, col, v in (('F9', 'E', '15 jours / 15 days'), ('F10', 'D', 'EXW Lons'), ('F12', 'F', '30 jours date de facture / 30 days invoice date'), ('F13', 'G', 'Non')):
        inp(ws, ref, v); dv_list(ws, ref, col, col == 'G')
    inp(ws, 'F11')
    for r in range(6, 14): ws.row_dimensions[r].height = 22
    ws['B16'] = '➜ Étape suivante : onglet « 2 Matériel »'; ws['B16'].font = font(11, True, BLUE)
    if EXEMPLE:
        ws['C6'] = '26-OFF-0123'; ws['C7'] = datetime.date(2026, 10, 28); ws['C8'] = 'Geopetrol'; ws['C9'] = 'M. Dupont'; ws['C10'] = 'Puits Lacq-12 · CLU108'
        ws['F6'] = 'Paul HYNDERICK'; ws['F11'] = '48 h après commande'

    # ================= 2 MATÉRIEL
    ws = wsM
    for col, w in zip('ABCDEFGHIJKLMN', (5, 10, 56, 7, 13, 13, 11, 14, 12, 11, 11, 8, 8, 12)): ws.column_dimensions[col].width = w
    banner(ws, 'MATÉRIEL DU DEVIS', "Une ligne par référence (quantité 2 = 2 lignes sur la tool list). Pour un titre de groupe (ex. BHA #1), mettre « Oui » dans Bannière et écrire le titre en Description.", 14)
    heads = ['#', 'Bannière ?', 'Description  (ou titre de bannière)', 'Qté', 'Stand-by (S)\n€ / jour', 'Opérations (O)\n€ / jour', 'UC\n€ / item', 'LIH / DBR\n€ / item', 'Inspection\n€ / item', 'Restocking\n€', 'Inclus au\nforfait ?', 'Lignes\ntool list', 'Cumul', 'Forfait\n€ (calc.)']
    for i, h in enumerate(heads, 1):
        c = ws.cell(5, i); c.value = h; c.font = font(9, True, 'FFFFFF'); c.fill = fill(BLUE if i <= 11 else '7A8CA3')
        c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    ws.row_dimensions[5].height = 34
    for r in range(M1, M2 + 1):
        ws.row_dimensions[r].height = 21
        ws[f'A{r}'] = f'=IF(AND(L{r}>0,B{r}<>"Oui"),COUNTIFS(L${M1}:L{r},">0",B${M1}:B{r},"<>Oui"),"")'
        ws[f'A{r}'].font = font(10, True, MUTED); ws[f'A{r}'].alignment = Alignment(horizontal='center', vertical='center')
        for col in 'BCDEFGHIJK':
            inp(ws, f'{col}{r}', None, '#,##0.00' if col in 'EFGHIJ' else ('0' if col == 'D' else None), 'center' if col != 'C' else 'left')
        inp(ws, f'K{r}', None, None, 'center')
        ws[f'L{r}'] = f'=IF($C{r}="",0,IF($B{r}="Oui",1,IF(N($D{r})>0,INT($D{r}),1)))'
        ws[f'M{r}'] = f'=SUM(L${M1}:L{r})'
        ws[f'N{r}'] = f'=IF(AND(L{r}>0,B{r}<>"Oui",K{r}="Oui"),L{r}*(N(E{r})*N({OP}$C$15)+N(F{r})*N({OP}$C$16)+N(G{r})),0)'
        ws[f'L{r}'].number_format = '0;-0;;@'; ws[f'N{r}'].number_format = '#,##0;-#,##0;;@'
        for col in 'LMN': ws[f'{col}{r}'].font = font(9, c='7A8CA3'); ws[f'{col}{r}'].alignment = Alignment(horizontal='center', vertical='center')
    dv_list(ws, f'K{M1}:K{M2}', 'G'); dv_list(ws, f'B{M1}:B{M2}', 'G')
    dvq = DataValidation(type='whole', operator='between', formula1='1', formula2='99', allow_blank=True, showErrorMessage=True, error='Quantité entière entre 1 et 99.')
    ws.add_data_validation(dvq); dvq.add(f'D{M1}:D{M2}')
    ws.conditional_formatting.add(f'A{M1}:K{M2}', FormulaRule(formula=[f'$B{M1}="Oui"'], fill=fill('C9DAF0'), font=Font(name=F, bold=True, color=NAVY)))
    ws.cell(M2 + 2, 3).value = f'=SUM(L{M1}:L{M2})&" ligne(s) sur la tool list  ·  "&COUNTIFS(L{M1}:L{M2},">0",B{M1}:B{M2},"<>Oui")&" outil(s) au devis"'
    ws.cell(M2 + 2, 3).font = font(10, True, BLUE)
    ws.cell(M2 + 3, 3).value = 'Pour la tool list : copier les colonnes B à D (Bannière, Description, Qté) et les coller dans le classeur « Tool List » (sans les prix).'
    ws.cell(M2 + 3, 3).font = font(9, i=True, c=MUTED)
    ws.cell(M2 + 4, 3).value = 'Le devis affiche les 14 premières lignes (les suivantes sont repliées dans l’onglet 4, avec une alerte). Colonnes grises (L à N) : calculs, ne pas modifier.'
    ws.cell(M2 + 4, 3).font = font(9, i=True, c=MUTED)
    ws.freeze_panes = 'D6'
    if EXEMPLE:
        rows = [('Oui', 'BHA #1', None, None, None, None, None, None, None, ''),
                ('', 'Stab 5-7/8 OD, 2-1/4" ID - 3-1/2" IF Pin x Box', 1, 85, 120, 40, 4200, 150, 600, 'Oui'),
                ('', 'XO 3-1/2" IF Pin x 2-7/8" EU Box', 2, 20, 30, 10, 900, 60, 150, 'Oui'),
                ('Oui', 'BHA #2', None, None, None, None, None, None, None, ''),
                ('', 'XO 3-1/2" IF Box x 2-7/8" EU Pin', 1, 20, 30, 10, 900, 60, 150, 'Non')]
        for i, row in enumerate(rows):
            r = M1 + i
            for col, v in zip('BCDEFGHIJK', row):
                if v not in (None, ''): ws[f'{col}{r}'] = v

    # ================= 3 OPTIONS
    ws = wsO
    for col, w in zip('ABCDEFGH', (2, 52, 12, 40, 9, 14, 28, 14)): ws.column_dimensions[col].width = w
    banner(ws, 'OPTIONS ET FORFAIT', "Une option sur « Non » disparaît du devis. Serrage, transport et opérateurs s'affichent chacun dans leur bloc ; le forfait dans un bandeau final.", 8)
    for i, h in enumerate(['', 'Option', 'Inclure ?', 'Intitulé affiché (facultatif)', 'Qté', 'Prix €', 'Unité / mode', 'Total €'], 1):
        if i == 1: continue
        c = ws.cell(5, i); c.value = h; c.font = font(9, True, 'FFFFFF'); c.fill = fill(BLUE); c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    ws.row_dimensions[5].height = 28
    def optrow(r, nom, inc, unit, listcol, strict, qtylabel=None):
        ws.row_dimensions[r].height = 26
        ws[f'B{r}'] = nom; ws[f'B{r}'].font = font(10.5, True, NAVY); ws[f'B{r}'].alignment = Alignment(vertical='center', indent=1)
        inp(ws, f'C{r}', inc, None, 'center'); inp(ws, f'D{r}'); inp(ws, f'E{r}', 1, '0', 'center'); inp(ws, f'F{r}', None, '#,##0.00', 'center'); inp(ws, f'G{r}', unit, None, 'center')
        ws[f'H{r}'] = f'=IF(C{r}="Oui",IF(AND(G{r}="Coût réel +15 %",F{r}=""),0,N(E{r})*N(F{r})),0)'
        ws[f'H{r}'].number_format = '#,##0.00'; ws[f'H{r}'].font = font(10.5, True); ws[f'H{r}'].alignment = Alignment(horizontal='center', vertical='center')
        dv_list(ws, f'C{r}', 'G'); dv_list(ws, f'G{r}', listcol, strict)
    optrow(6, '👷  Opérateur · tarif journalier', 'Non', '€/jour/pers', 'L', False)
    optrow(7, '👷  Opérateur · Mob / Demob', 'Non', '€/pers', 'L', False)
    optrow(8, '🔧  Serrage · prix par serrage (Qté = nombre de serrages)', 'Non', '€/serrage', 'L', False)
    optrow(9, '🚚  Transport MOB', 'Oui', 'Coût réel +15 %', 'M', True)
    optrow(10, '🚚  Transport DEMOB', 'Oui', 'Coût réel +15 %', 'M', True)
    section(ws, 12, 2, 8, '📦  FORFAIT · bandeau final du devis, avec son coût')
    optrow(13, 'Forfait', 'Non', CALC, 'N', True)
    ws['H13'] = f'=IF(C13="Oui",IF(G13="{CALC}",IF(F13<>"",F13,C17),N(E13)*N(F13)),0)'
    label(ws, 'B14', 'Périmètre affiché sous le forfait'); inp(ws, 'D14'); ws.merge_cells('D14:H14'); ws.row_dimensions[14].height = 30
    label(ws, 'B15', 'Forfait calculé · jours de stand-by (S)'); inp(ws, 'C15', 3, '0', 'center')
    label(ws, 'B16', 'Forfait calculé · jours d’opérations (O)'); inp(ws, 'C16', 2, '0', 'center')
    label(ws, 'B17', 'Montant calculé des lignes « Inclus au forfait »'); ws['C17'] = f'=SUM({MT}$N${M1}:$N${M2})'
    ws['C17'].number_format = '#,##0.00 "€"'; ws['C17'].font = font(10.5, True); ws['C17'].alignment = Alignment(horizontal='center', vertical='center')
    ws['D15'] = ('Forfait habituel : 3 jours de stand-by + 2 jours d’opérations + toutes les utilisations de charge (UC), sur les lignes « Inclus au forfait » de l’onglet 2. '
                 'Laisser « Prix € » vide pour utiliser ce calcul, ou saisir un prix pour le remplacer. Qté sert pour le mode « par jour » (nombre de jours).')
    ws['D15'].font = font(9, i=True, c=MUTED); ws['D15'].alignment = Alignment(wrap_text=True, vertical='top', indent=1); ws.merge_cells('D15:H17')
    ws['B19'] = 'Rappels'; ws['B19'].font = font(10, True, BLUE)
    for i, t in enumerate(["Transport « Coût réel +15 % » : aucun montant affiché. Choisir « Forfait » pour imposer un prix.",
                           "Lignes couvertes par le forfait : mettre « Oui » dans « Inclus au forfait » (onglet 2). Elles s’affichent « incl. » sur le devis."]):
        ws[f'B{20+i}'] = t; ws[f'B{20+i}'].font = font(9.5, c=MUTED)
    if EXEMPLE:
        ws['C6'] = 'Oui'; ws['F6'] = 750; ws['C7'] = 'Oui'; ws['F7'] = 300; ws['C8'] = 'Oui'; ws['E8'] = 4; ws['F8'] = 180
        ws['C13'] = 'Oui'; ws['D14'] = 'Location du stabilisateur et des 3 XO, transport inclus'
    ws.freeze_panes = 'A6'

    # ================= 4 DEVIS
    ws = wsD
    for col, w in zip('ABCDEFGHIJKL', (1.5, 5, 50, 6, 13, 13, 12, 15, 11, 11, 22, 1.5)): ws.column_dimensions[col].width = w
    for r in (1, 2, 3):
        for c in range(1, 13): ws.cell(r, c).fill = fill(NAVY if r < 3 else CYAN)
    ws.row_dimensions[1].height = 34; ws.row_dimensions[2].height = 22; ws.row_dimensions[3].height = 5
    img = XLImage(LOGO); img.width, img.height = 150, 34; ws.add_image(img, 'B1')
    ws.merge_cells('E1:K1'); ws['E1'] = '=' + T('title'); ws['E1'].font = font(17, True, 'FFFFFF'); ws['E1'].alignment = Alignment(horizontal='right', vertical='center')
    ws.merge_cells('E2:K2'); ws['E2'] = f'="N° "&{AF}$C$6&"   ·   "&IF({AF}$C$7="","",TEXT({AF}$C$7,"dd/mm/yyyy"))'
    ws['E2'].font = font(11, c='9FD8F5'); ws['E2'].alignment = Alignment(horizontal='right', vertical='center')
    ws.row_dimensions[4].height = 8
    txt0 = lambda f: f'=""&{f[1:]}' if f.count('!') == 1 and '&' not in f and 'IF(' not in f else f
    def info(r, c1, c2, key, formula):
        ws.merge_cells(start_row=r, start_column=c1, end_row=r, end_column=c2); ws.merge_cells(start_row=r+1, start_column=c1, end_row=r+1, end_column=c2)
        a, b = ws.cell(r, c1), ws.cell(r+1, c1)
        a.value = '=UPPER(' + T(key) + ')'; a.font = font(7.5, True, MUTED); a.alignment = Alignment(vertical='bottom', indent=1)
        b.value = txt0(formula); b.font = font(10.5, True); b.alignment = Alignment(vertical='top', indent=1, wrap_text=True)
        for k in range(c1, c2 + 1): ws.cell(r+1, k).border = Border(bottom=thin())
    GR = [(2, 3), (4, 6), (7, 8), (9, 11)]; a = lambda c: AF + c
    for r, items in [(5, [('client', '=' + a('$C$8')), ('offer', '=' + a('$C$6')), ('date', f'=IF({a("$C$7")}="","",TEXT({a("$C$7")},"dd/mm/yyyy"))'), ('by', '=' + a('$F$6'))]),
                     (7, [('attn', '=' + a('$C$9')), ('well', '=' + a('$C$10')), ('inco', '=' + a('$F$10')), ('mail', '=' + a('$F$7'))]),
                     (9, [('valid', '=' + a('$F$9')), ('lead', '=' + a('$F$11')), ('we', '=' + a('$F$13')), ('tel', '=' + a('$F$8'))]),
                     (11, [('pay', '=' + a('$F$12')), None, None, None])]:
        for (c1, c2), it in zip(GR, items):
            if it: info(r, c1, c2, it[0], it[1])
        ws.row_dimensions[r].height = 15; ws.row_dimensions[r+1].height = 19
    ws.row_dimensions[13].height = 8
    def dsec(r, key):
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=11)
        c = ws.cell(r, 2); c.value = '=' + T(key); c.font = font(10, True, 'FFFFFF'); c.alignment = Alignment(vertical='center', indent=1)
        for k in range(2, 12): ws.cell(r, k).fill = fill(BLUE)
        ws.row_dimensions[r].height = 20
    dsec(14, 'sec_eq')
    for k, col in [('h_n', 'B'), ('h_desc', 'C'), ('h_qty', 'D'), ('h_s', 'E'), ('h_o', 'F'), ('h_uc', 'G'), ('h_lih', 'H'), ('h_insp', 'I'), ('h_rest', 'J'), ('h_ref', 'K')]:
        c = ws[f'{col}15']; c.value = '=' + T(k); c.font = font(8, True, NAVY); c.fill = fill('DCE8F5')
        c.alignment = Alignment(horizontal='center' if col != 'C' else 'left', vertical='center', wrap_text=True, indent=1 if col == 'C' else 0)
    ws.row_dimensions[15].height = 44
    D1, DVIS = 16, 14
    for i in range(24):
        r = D1 + i; m = M1 + i; ws.row_dimensions[r].height = 21
        active = f'{MT}$L{m}>0'; ban = f'{MT}$B{m}="Oui"'; forf = f'AND({MT}$K{m}="Oui",{OP}$C$13="Oui")'
        ws[f'M{r}'] = f'=IF(AND({active},{ban}),1,0)'; ws[f'M{r}'].font = font(7, c='B8C4D2')
        ws[f'B{r}'] = f'=IF(AND({active},NOT({ban})),{MT}$A{m},"")'
        ws[f'C{r}'] = f'=IF({active},IF({ban},UPPER({MT}$C{m}),{MT}$C{m}),"")'
        ws[f'D{r}'] = f'=IF(AND({active},NOT({ban})),{MT}$L{m},"")'
        for col, mc in zip('EFGHIJ', 'EFGHIJ'):
            ws[f'{col}{r}'] = f'=IF(AND({active},NOT({ban})),IF({forf},{T("incl")},IF({MT}${mc}{m}="","",{MT}${mc}{m})),"")'
            ws[f'{col}{r}'].number_format = '#,##0.00'; ws[f'{col}{r}'].alignment = Alignment(horizontal='center', vertical='center')
        ws[f'K{r}'] = f'=IF(AND({active},NOT({ban})),IF({forf},{T("incl_long")},""),"")'
        for col in 'BCDEFGHIJK': ws[f'{col}{r}'].font = font(10 if col != 'K' else 9, col == 'B', MUTED if col in 'BK' else INK)
        ws[f'B{r}'].alignment = Alignment(horizontal='center', vertical='center'); ws[f'C{r}'].alignment = Alignment(vertical='center', indent=1, wrap_text=True)
        ws[f'D{r}'].alignment = Alignment(horizontal='center', vertical='center'); ws[f'K{r}'].alignment = Alignment(vertical='center', indent=1, wrap_text=True)
    rng = f'B{D1}:K{D1+23}'
    ws.row_dimensions.group(D1 + DVIS, D1 + 23, outline_level=1, hidden=True)
    ws.merge_cells('B40:K40'); ws['B40'] = f'=IF(SUM({MT}$L${M1+DVIS}:$L${M2})>0,"⚠  Des lignes de matériel au-delà de la ligne {DVIS} sont masquées : cliquer sur le [+] dans la marge gauche pour les afficher.","")'
    ws['B40'].font = font(9.5, True, RED); ws['B40'].alignment = Alignment(indent=1, vertical='center'); ws.row_dimensions[40].height = 18
    ws.conditional_formatting.add(rng, FormulaRule(formula=[f'$M{D1}=1'], fill=fill(NAVY), font=Font(name=F, bold=True, color='FFFFFF'), stopIfTrue=True))
    ws.conditional_formatting.add(rng, FormulaRule(formula=[f'$C{D1}<>""'], border=Border(bottom=thin(LINE))))
    ws.conditional_formatting.add(rng, FormulaRule(formula=[f'AND($C{D1}<>"",MOD(ROW(),2)=0)'], fill=fill('F6F9FC')))
    ws.conditional_formatting.add(f'E{D1}:J{D1+23}', FormulaRule(formula=[f'E{D1}="incl."'], font=Font(name=F, italic=True, color=CYAN)))
    # ---- blocs page 2 : serrage, transport, opérateurs, bandeau forfait
    TX = lambda k: T(k)
    def blk_head(r, hkey, flag):
        ws.row_dimensions[r].height = 20
        ws.merge_cells(f'B{r}:C{r}')
        ws[f'M{r}'] = f'=IF({flag},1,0)'; ws[f'M{r}'].font = font(7, c='B8C4D2')
        ws[f'B{r}'] = f'=IF({flag},{T(hkey)},"")'
        for col, k in (('D', 'h_qty'), ('E', 'h_unit'), ('F', 'h_pu'), ('G', 'h_tot'), ('H', 'h_det')):
            ws[f'{col}{r}'] = f'=IF({flag},{T(k)},"")'
        for col in 'BCDEFGHIJK': ws[f'{col}{r}'].font = font(9, True, 'FFFFFF'); ws[f'{col}{r}'].alignment = Alignment(horizontal='left' if col in 'BH' else 'center', vertical='center', indent=1 if col in 'BH' else 0)
        ws.merge_cells(f'H{r}:K{r}')
        ws.conditional_formatting.add(f'B{r}:K{r}', FormulaRule(formula=[f'$M{r}=1'], fill=fill(BLUE)))
    def blk_line(r, orow, defkey, unit=None, note=None):
        ws.row_dimensions[r].height = 21
        inc = f'{OP}$C${orow}="Oui"'; cost = f'{OP}$G${orow}="Coût réel +15 %"'
        ws[f'C{r}'] = f'=IF({inc},IF({OP}$D${orow}<>"",{OP}$D${orow},{T(defkey)}),"")'
        ws[f'D{r}'] = f'=IF({inc},IF({cost},"",{OP}$E${orow}),"")'
        ws[f'E{r}'] = f'=IF({inc},IF({cost},"",{OP}$G${orow}),"")'
        ws[f'F{r}'] = f'=IF({inc},IF({cost},{T("at_cost")},IF({OP}$F${orow}="","",{OP}$F${orow})),"")'
        ws[f'G{r}'] = f'=IF({inc},IF({cost},"—",{OP}$H${orow}),"")'
        ws[f'H{r}'] = (f'=IF({inc},{T(note)},"")' if note else '=""')
        ws.merge_cells(f'H{r}:K{r}')
        for col in 'CDEFGH': ws[f'{col}{r}'].font = font(10, col in 'CG', INK if col != 'H' else MUTED)
        ws[f'C{r}'].alignment = Alignment(vertical='center', indent=1); ws[f'H{r}'].alignment = Alignment(vertical='center', indent=1, wrap_text=True)
        for col in 'DEFG': ws[f'{col}{r}'].alignment = Alignment(horizontal='center', vertical='center')
        ws[f'F{r}'].number_format = '#,##0.00'; ws[f'G{r}'].number_format = '#,##0.00'
        ws.conditional_formatting.add(f'B{r}:K{r}', FormulaRule(formula=[f'$C{r}<>""'], border=Border(bottom=thin(LINE))))
    ws.row_dimensions[41].height = 8
    blk_head(42, 'sec_tight', f'{OP}$C$8="Oui"'); blk_line(43, 8, 'tight'); ws.row_dimensions[44].height = 8
    blk_head(45, 'sec_tr', f'OR({OP}$C$9="Oui",{OP}$C$10="Oui")'); blk_line(46, 9, 'tr_mob', note='tr_note'); blk_line(47, 10, 'tr_dem', note='tr_note'); ws.row_dimensions[48].height = 8
    blk_head(49, 'sec_op', f'OR({OP}$C$6="Oui",{OP}$C$7="Oui")'); blk_line(50, 6, 'op_day'); blk_line(51, 7, 'op_mob'); ws.row_dimensions[52].height = 8
    # bandeau forfait
    inc = f'{OP}$C$13="Oui"'
    ws['M53'] = f'=IF({inc},1,0)'; ws['M53'].font = font(7, c='B8C4D2')
    ws.row_dimensions[53].height = 40; ws.row_dimensions[54].height = 24; ws.row_dimensions[55].height = 10
    ws.merge_cells('B53:H53'); ws['B53'] = f'=IF({inc},UPPER({T("forfait")})&IF({OP}$D$13<>"","   ·   "&{OP}$D$13,""),"")'
    ws['B53'].font = font(16, True, 'FFFFFF'); ws['B53'].alignment = Alignment(indent=1, vertical='center')
    ws.merge_cells('I53:K53'); ws['I53'] = f'=IF({inc},{OP}$H$13,"")'; ws['I53'].number_format = '#,##0.00 "€"'; ws['I53'].font = font(22, True, 'FFFFFF'); ws['I53'].alignment = Alignment(horizontal='right', vertical='center', indent=1)
    calcdet = f'{OP}$C$15&" "&SUBSTITUTE({T("calc_det")},"%s",{OP}$C$16)&"   ·   "&{T("ht")}'
    perdet = f'{OP}$E$13&" j × "&TEXT({OP}$F$13,"#,##0.00")&" €/j   ·   "&{T("ht")}'
    ws.merge_cells('B54:K54'); ws['B54'] = (f'=IF({inc},IF({OP}$G$13="{CALC}",{calcdet},IF({OP}$G$13="Forfait par jour",{perdet},{T("ht")}))'
                                            f'&IF({OP}$D$14<>"","   ·   "&{OP}$D$14,""),"")')
    ws['B54'].font = font(10, i=True, c=NAVY); ws['B54'].alignment = Alignment(indent=1, vertical='center', wrap_text=True)
    ws.conditional_formatting.add('B53:K53', FormulaRule(formula=['$M$53=1'], fill=fill(NAVY)))
    ws.conditional_formatting.add('B54:K54', FormulaRule(formula=['$M$53=1'], fill=fill('EAF6FD')))
    dsec(56, 'sec_cond')
    for r, txt, h in ((57, COND_FR, 66), (58, COND_EN, 66)):
        ws.merge_cells(f'B{r}:K{r}'); ws[f'B{r}'] = txt; ws[f'B{r}'].font = font(8.5, c=MUTED); ws[f'B{r}'].alignment = Alignment(wrap_text=True, vertical='top', indent=1); ws.row_dimensions[r].height = h
    ws.row_dimensions[59].height = 10
    ws.merge_cells('B60:K60'); ws['B60'] = '=' + T('accept'); ws['B60'].font = font(9, True, NAVY); ws['B60'].alignment = Alignment(indent=1)
    for c1, c2, key in [(2, 4, 'sig_name'), (5, 7, 'sig_date'), (8, 11, 'sig_sig')]:
        ws.merge_cells(start_row=61, start_column=c1, end_row=64, end_column=c2)
        ws.cell(61, c1).value = '=' + T(key); ws.cell(61, c1).font = font(8, c=MUTED); ws.cell(61, c1).alignment = Alignment(vertical='top', indent=1)
        for rr in range(61, 65):
            for cc in range(c1, c2 + 1): ws.cell(rr, cc).border = Border(left=thin() if cc == c1 else None, right=thin() if cc == c2 else None, top=thin() if rr == 61 else None, bottom=thin() if rr == 64 else None)
    for r in range(61, 65): ws.row_dimensions[r].height = 16
    ws.merge_cells('B66:K66'); ws['B66'] = SOCIETE; ws['B66'].font = font(8, c=MUTED); ws['B66'].alignment = Alignment(horizontal='center')
    ws.column_dimensions['M'].hidden = True
    page(ws, 'landscape', 0, 'A1:L66'); ws.print_options.horizontalCentered = True
    ws.page_margins.left = ws.page_margins.right = .3; ws.page_margins.top = .35; ws.page_margins.bottom = .4
    ws.row_breaks.append(Break(id=40))
    ws.oddFooter.center.text = 'Enedril · Devis &P / &N'; ws.oddFooter.center.size = 8
    for w in (wsA, wsM, wsO): page(w)
    wb.calculation.fullCalcOnLoad = True; wb.active = 0
    out = os.path.join(OUTDIR, f'Devis_Enedril_2027{SUF}.xlsx'); wb.save(out); print('ok', out)

# ================================================================== CLASSEUR TOOL LIST
def build_tl():
    wb = Workbook()
    wsM = new_sheet(wb, '1 Matériel', CYAN, True); wsT = new_sheet(wb, '2 Tool List', BLUE); build_listes(wb)
    ws = wsM
    for col, w in zip('ABCDEF', (6, 10, 66, 7, 8, 8)): ws.column_dimensions[col].width = w
    banner(ws, 'MATÉRIEL À COLLER', "Dans le classeur Devis, onglet « 2 Matériel » : copier B6:D29 (Bannière, Description, Qté) et coller ici en B6. Aucun prix ici.", 6)
    for i, h in enumerate(['#', 'Bannière ?', 'Description  (ou titre de bannière)', 'Qté', 'Lignes', 'Cumul'], 1):
        c = ws.cell(5, i); c.value = h; c.font = font(9, True, 'FFFFFF'); c.fill = fill(BLUE if i <= 4 else '7A8CA3'); c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    ws.row_dimensions[5].height = 30
    for r in range(M1, M2 + 1):
        ws.row_dimensions[r].height = 21
        ws[f'A{r}'] = f'=IF(AND(E{r}>0,B{r}<>"Oui"),COUNTIFS(E${M1}:E{r},">0",B${M1}:B{r},"<>Oui"),"")'
        ws[f'A{r}'].font = font(10, True, MUTED); ws[f'A{r}'].alignment = Alignment(horizontal='center', vertical='center')
        for col in 'BCD': inp(ws, f'{col}{r}', None, '0' if col == 'D' else None, 'center' if col in 'BD' else 'left')
        ws[f'E{r}'] = f'=IF($C{r}="",0,IF($B{r}="Oui",1,IF(N($D{r})>0,INT($D{r}),1)))'; ws[f'F{r}'] = f'=SUM(E${M1}:E{r})'
        ws[f'E{r}'].number_format = '0;-0;;@'
        for col in 'EF': ws[f'{col}{r}'].font = font(9, c='7A8CA3'); ws[f'{col}{r}'].alignment = Alignment(horizontal='center', vertical='center')
    dv_list(ws, f'B{M1}:B{M2}', 'G')
    ws.conditional_formatting.add(f'A{M1}:D{M2}', FormulaRule(formula=[f'$B{M1}="Oui"'], fill=fill('C9DAF0'), font=Font(name=F, bold=True, color=NAVY)))
    ws.cell(M2 + 2, 3).value = f'=SUM(E{M1}:E{M2})&" ligne(s) sur la tool list"'; ws.cell(M2 + 2, 3).font = font(10, True, BLUE)
    ws.cell(M2 + 3, 3).value = '➜ Étape suivante : onglet « 2 Tool List ». Une quantité de 2 donne 2 lignes ; une bannière donne une ligne de titre.'; ws.cell(M2 + 3, 3).font = font(9, i=True, c=MUTED)
    if EXEMPLE:
        ws['F1'] = 'EXEMPLE'; ws['F1'].font = font(11, True, 'FFFFFF'); ws['F1'].fill = fill(RED); ws['F1'].alignment = Alignment(horizontal='center')
        for i, row in enumerate([('Oui', 'BHA #1', None), ('', 'Stab 5-7/8 OD, 2-1/4" ID - 3-1/2" IF Pin x Box', 1), ('', 'XO 3-1/2" IF Pin x 2-7/8" EU Box', 2),
                                 ('Oui', 'BHA #2', None), ('', 'XO 3-1/2" IF Box x 2-7/8" EU Pin', 1)]):
            for col, v in zip('BCD', row):
                if v not in (None, ''): ws[f'{col}{M1+i}'] = v
    mc = dict(ban='B', desc='C', qty='D', lines='E', cum='F')
    T1, P0 = build_tool_list(wb, wsT, "'1 Matériel'!", mc)
    page(wsM)
    if EXEMPLE:
        t = wsT
        t['A6'] = 'Geopetrol'; t['D6'] = 'Puits Lacq-12'; t['G6'] = '26-82-FR · CLU108'; t['L6'] = 'Geopetrol · Lacq'
        t['A8'] = datetime.date(2026, 11, 9); t['D8'] = datetime.date(2026, 10, 28); t['G8'] = 'TL-26-058'; t['L8'] = 'Paul HYNDERICK'; t['A10'] = 'Stab + XO'
        # lignes : 1 bannière, 2 stab, 3-4 XO, 5 bannière, 6 XO
        data = {T1 + 1: ('PL-0412', 'SN-4471', 5.875, 2.25, 'Taille OK', 'Oui', 'P1'), T1 + 2: ('PL-0377', 'SN-1120', 3.5, 2.0, 'Taille OK', 'Oui', 'P1'),
                T1 + 3: ('PL-0377b', 'SN-1121', 3.5, 2.0, 'Taille OK', 'En cours', 'P1')}
        for r, (ref, sn, od, idd, tt, pr, col) in data.items():
            t[f'B{r}'] = ref; t[f'C{r}'] = sn; t[f'E{r}'] = od; t[f'F{r}'] = idd; t[f'I{r}'] = tt; t[f'L{r}'] = pr; t[f'O{r}'] = col; t[f'J{r}'] = 'Oui'
        t[f'K{T1+1}'] = 'Blades à tester avant départ'; t[f'N{T1+1}'] = 'PH'; t[f'M{T1+1}'] = datetime.date(2026, 10, 29)
        t[f'C{P0+2}'] = 'Fishing basket'; t[f'E{P0+2}'] = 120; t[f'F{P0+2}'] = 80; t[f'G{P0+2}'] = 60; t[f'H{P0+2}'] = 145
    wb.calculation.fullCalcOnLoad = True; wb.active = 0
    out = os.path.join(OUTDIR, f'Tool_List_Enedril_2027{SUF}.xlsx'); wb.save(out); print('ok', out)

build_devis(); build_tl()
