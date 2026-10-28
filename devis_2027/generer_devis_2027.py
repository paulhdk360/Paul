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
 'J': ('Support de colisage', ['Palette', 'Fishing basket', 'Caisse', 'Vrac']),
 'K': ('N° de colis', ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'Vrac']),
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
 "Tous les transports effectués auprès d'un fournisseur pour la fourniture des équipements sont facturés au coût réel +15 % (idem pour les frais de douane, etc.).\n"
 "Conditions générales de vente disponibles sur demande ou sur notre site internet www.enedril.com")
COND_EN = ("The rental is from the day of departure from the base of origin until its return to the same place.\n"
 "Wear Charge applies to all wear and tear related to normal use of equipment. In case of greater damage due to abnormal use, the replacement value will be charged based on supporting documentation.\n"
 "Additional charges may apply for packing tools intended for air or ocean shipment.\n"
 "All transport carried out through a supplier for the supply of equipment is invoiced at cost +15% (same for customs fees, etc.).\n"
 "General conditions of sale available upon request or on our website www.enedril.com")

# ------------------------------------------------------------------ aides
def new_sheet(wb, title, tab, first=False):
    ws = wb.active if first else wb.create_sheet(); ws.title = title
    ws.sheet_properties.tabColor = tab; ws.sheet_view.showGridLines = False; return ws
def build_listes(wb, lang=1):
    ws = new_sheet(wb, 'Listes', '9FB6CE')
    for col, (h, vals) in LISTS.items():
        ws[f'{col}1'] = h; ws[f'{col}1'].font = font(9, True, 'FFFFFF'); ws[f'{col}1'].fill = fill(NAVY)
        for i, v in enumerate(vals): ws[f'{col}{i+2}'] = v; ws[f'{col}{i+2}'].font = font(10)
        ws.column_dimensions[col].width = 30
    ws['H1'] = lang; ws['H1'].font = font(9, c=MUTED)
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
def build_tool_list(wb, ws, mt, mc, USED, T1=15, TN=40):
    """mt = nom de la feuille source (entre apostrophes) ; mc = colonnes : ban, desc, qty, lines, cum"""
    for i, w in enumerate((5.5, 14, 15, 46, 9, 9, 11, 12, 14, 9, 34, 10), 1): ws.column_dimensions[L(i)].width = w
    LC = 12
    for r in (1, 2, 3):
        for c in range(1, LC + 1): ws.cell(r, c).fill = fill(NAVY if r < 3 else CYAN)
    ws.row_dimensions[1].height = 32; ws.row_dimensions[2].height = 20; ws.row_dimensions[3].height = 5
    img = XLImage(LOGO); img.width, img.height = 140, 32; ws.add_image(img, 'A1')
    ws.merge_cells('F1:L1'); ws['F1'] = 'LISTE DE MATÉRIEL'; ws['F1'].font = font(17, True, 'FFFFFF'); ws['F1'].alignment = Alignment(horizontal='right', vertical='center')
    ws.merge_cells('F2:L2'); ws['F2'] = '="N° "&G8&IF(G6="","","   ·   "&G6)'; ws['F2'].font = font(11, c='9FD8F5'); ws['F2'].alignment = Alignment(horizontal='right', vertical='center')
    ws.row_dimensions[4].height = 8
    def tin(r, c1, c2, text, fmt=None):
        ws.merge_cells(start_row=r, start_column=c1, end_row=r, end_column=c2); ws.merge_cells(start_row=r+1, start_column=c1, end_row=r+1, end_column=c2)
        a = ws.cell(r, c1); a.value = text.upper(); a.font = font(7.5, True, MUTED); a.alignment = Alignment(vertical='bottom', indent=1)
        for k in range(c1, c2 + 1): ws.cell(r+1, k).fill = fill(INPUT); ws.cell(r+1, k).border = Border(bottom=Side(style='thin', color=CYAN))
        b = ws.cell(r+1, c1); b.font = font(10.5, True, BLUE); b.alignment = Alignment(horizontal='left', vertical='center', indent=1, wrap_text=True)
        if fmt: b.number_format = fmt
    tin(5, 1, 3, 'Client'); tin(5, 4, 6, 'Puits / chantier'); tin(5, 7, 9, 'Dossier N° · Rig'); tin(5, 10, 12, 'Destination')
    tin(7, 1, 3, 'Date de départ', 'dd/mm/yyyy'); tin(7, 4, 6, 'Faite le', 'dd/mm/yyyy'); tin(7, 7, 9, 'N° de liste'); tin(7, 10, 12, 'Préparée par')
    tin(9, 1, 4, 'Description générale'); tin(9, 5, 9, 'Colisage'); tin(9, 10, 12, 'Validée par')
    ws['E10'] = 'A communiquer dès que possible'
    for r in (5, 7, 9): ws.row_dimensions[r].height = 15; ws.row_dimensions[r+1].height = 21
    ws.merge_cells('A11:L11'); ws['A11'] = 'Toute modification par rapport à la liste ci-dessous doit être évitée, et impérativement signalée si pas le choix.'
    ws['A11'].font = font(9, True, RED); ws['A11'].alignment = Alignment(indent=1, vertical='center'); ws.row_dimensions[11].height = 20; ws.row_dimensions[12].height = 4
    def thead(r, c1, c2, text, color):
        if c1 != c2: ws.merge_cells(start_row=r, start_column=c1, end_row=r, end_column=c2)
        c = ws.cell(r, c1); c.value = text; c.font = font(8.5, True, 'FFFFFF'); c.alignment = Alignment(horizontal='center', vertical='center')
        for k in range(c1, c2 + 1): ws.cell(r, k).fill = fill(color)
    thead(13, 1, 4, 'ÉQUIPEMENT', NAVY); thead(13, 5, 9, 'RELEVÉS (pouces)', BLUE); thead(13, 10, 11, 'STOCK ET REMARQUES', NAVY); thead(13, 12, 12, 'COLIS', BLUE)
    TH = ['Item', 'Référence\n(PL)', 'N° de série', 'Description', 'OD', 'ID', 'Ouverture\nblades', 'Ouverture max\ncouteaux', 'Taille / test\nconfirmé', 'Stock\n@CC', 'Commentaire', 'N° colis']
    for i, h in enumerate(TH, 1):
        c = ws.cell(14, i); c.value = h; c.font = font(8, True, NAVY); c.fill = fill('DCE8F5'); c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    ws.row_dimensions[14].height = 34
    for col, t in (('T', 'ligne'), ('U', 'réf.'), ('V', 'bannière')): ws[f'{col}14'] = t; ws[f'{col}14'].font = font(7, c='7A8CA3')
    S = lambda col: f'{mt}${mc[col]}${M1}:${mc[col]}${M2}'
    TOT = f'SUM({S("lines")})'
    for i in range(TN):
        r = T1 + i; ws.row_dimensions[r].height = 27
        ws[f'T{r}'] = f'=IF({i+1}<={TOT},{i+1},0)'
        ws[f'U{r}'] = f'=IF(T{r}=0,"",COUNTIF({S("cum")},"<"&T{r})+1)'
        ws[f'V{r}'] = f'=IF(U{r}="","",IF(INDEX({S("ban")},U{r})="Oui",1,0))'
        ws[f'A{r}'] = f'=IF(OR(T{r}=0,V{r}=1),"",T{r}-COUNTIF(V${T1}:V{r},1))'
        q = f'INDEX({S("lines")},U{r})'
        ws[f'D{r}'] = (f'=IF(T{r}=0,"",IF(V{r}=1,UPPER(INDEX({S("desc")},U{r})),INDEX({S("desc")},U{r})&IF({q}>1,"  ("&(T{r}-INDEX({S("cum")},U{r})+{q})&"/"&{q}&")","")))')
        for col in 'TUV': ws[f'{col}{r}'].font = font(7, c='B8C4D2')
        ws[f'A{r}'].font = font(10, True, MUTED); ws[f'A{r}'].alignment = Alignment(horizontal='center', vertical='center')
        ws[f'D{r}'].font = font(9.5, c=INK); ws[f'D{r}'].alignment = Alignment(vertical='center', wrap_text=True, indent=1)
        for col in 'BCEFGHIJKL':
            c = ws[f'{col}{r}']; c.font = font(9.5, False, BLUE)
            c.number_format = '0.000' if col in 'EFGH' else 'General'
            c.alignment = Alignment(horizontal='left' if col in 'BCK' else 'center', vertical='center', indent=1 if col in 'BCK' else 0, wrap_text=True)
    last = T1 + TN - 1
    for col, lc in (('I', 'Q'), ('J', 'G'), ('L', 'K')): dv_list(ws, f'{col}{T1}:{col}{last}', lc, False)
    ws.conditional_formatting.add(f'A{T1}:L{last}', FormulaRule(formula=[f'$V{T1}=1'], fill=fill(BLUE), font=Font(name=F, bold=True, color='FFFFFF'), stopIfTrue=True))
    ws.conditional_formatting.add(f'A{T1}:L{last}', FormulaRule(formula=[f'$T{T1}>0'], fill=fill(INPUT), border=Border(bottom=thin('B7DDF2'))))
    # lignes vides masquées par un filtre ; Ctrl+Alt+L (Réappliquer) le met à jour
    from openpyxl.worksheet.filters import FilterColumn, CustomFilters, CustomFilter
    ws.auto_filter.ref = f'A14:V{last}'
    for cid in range(22):
        ws.auto_filter.filterColumn.append(FilterColumn(colId=cid, hiddenButton=True, showButton=False, customFilters=CustomFilters(customFilter=[CustomFilter(operator='greaterThan', val='0')]) if cid == 19 else None))
    for i in range(USED, TN): ws.row_dimensions[T1 + i].hidden = True
    ws.merge_cells('A12:L12'); ws['A12'] = f'=IF(SUBTOTAL(103,A{T1}:A{last})<MIN({TOT},{TN}),"⚠  Appuyer sur Ctrl + Alt + L pour afficher toutes les lignes de la liste.","")'
    ws['A12'].font = font(9, True, RED); ws['A12'].alignment = Alignment(indent=1, vertical='center'); ws.row_dimensions[12].height = 14
    # colisage (sous les items)
    P0 = T1 + TN + 2
    ws.row_dimensions[T1 + TN].height = 18; ws.row_dimensions[T1 + TN + 1].height = 18
    thead(P0, 1, 12, 'COLISAGE', NAVY); ws.row_dimensions[P0].height = 20
    for c1, c2, h in [(1, 2, 'Colis'), (3, 3, 'Type de colisage'), (4, 4, 'Contenu (items de la liste)'), (5, 5, 'Longueur\n(cm)'), (6, 6, 'Largeur\n(cm)'), (7, 7, 'Hauteur\n(cm)'), (8, 8, 'Poids\n(kg)'), (9, 9, 'Volume\n(m³)'), (10, 11, 'Remarques')]:
        if c1 != c2: ws.merge_cells(start_row=P0+1, start_column=c1, end_row=P0+1, end_column=c2)
        c = ws.cell(P0+1, c1); c.value = h; c.font = font(8, True, NAVY); c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        for k in range(c1, c2 + 1): ws.cell(P0+1, k).fill = fill('DCE8F5')
    ws.row_dimensions[P0+1].height = 26
    Ar = f'$A${T1}:$A${last}'; Or = f'$L${T1}:$L${last}'
    for i in range(10):
        r = P0 + 2 + i; ws.row_dimensions[r].height = 17
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2); ws.merge_cells(start_row=r, start_column=10, end_row=r, end_column=11)
        ws[f'A{r}'] = f'P{i+1}'; ws[f'A{r}'].font = font(10, True, NAVY); ws[f'A{r}'].alignment = Alignment(horizontal='center', vertical='center')
        inp(ws, f'C{r}', None, None, 'center'); dv_list(ws, f'C{r}', 'J', False)
        ws[f'D{r}'] = ArrayFormula(f'D{r}', f'=_xlfn.TEXTJOIN(", ",TRUE,IF({Or}=$A{r},{Ar},""))'); ws[f'D{r}'].font = font(9.5); ws[f'D{r}'].alignment = Alignment(vertical='center', wrap_text=True, indent=1)
        for col in 'EFGH': inp(ws, f'{col}{r}', None, '#,##0.0' if col == 'H' else '0', 'center')
        ws[f'I{r}'] = f'=IF(COUNT(E{r}:G{r})=3,E{r}*F{r}*G{r}/1000000,"")'; ws[f'I{r}'].number_format = '0.000'; ws[f'I{r}'].font = font(10); ws[f'I{r}'].alignment = Alignment(horizontal='center', vertical='center')
        inp(ws, f'J{r}')
        for k in range(1, 12): ws.cell(r, k).border = Border(bottom=thin())
    rl = P0 + 12
    ws.merge_cells(start_row=rl, start_column=1, end_row=rl, end_column=2); ws[f'A{rl}'] = 'Vrac'; ws[f'A{rl}'].font = font(10, True, NAVY); ws[f'A{rl}'].alignment = Alignment(horizontal='center', vertical='center')
    ws[f'C{rl}'] = 'Vrac'; ws[f'C{rl}'].font = font(9.5, c=MUTED); ws[f'C{rl}'].alignment = Alignment(horizontal='center', vertical='center')
    ws[f'D{rl}'] = ArrayFormula(f'D{rl}', f'=_xlfn.TEXTJOIN(", ",TRUE,IF({Or}=$A{rl},{Ar},""))'); ws[f'D{rl}'].font = font(9.5); ws[f'D{rl}'].alignment = Alignment(vertical='center', wrap_text=True, indent=1)
    inp(ws, f'H{rl}', None, '#,##0.0', 'center'); ws.row_dimensions[rl].height = 17
    for k in range(1, 12): ws.cell(rl, k).border = Border(bottom=thin())
    rt = rl + 1
    ws.merge_cells(start_row=rt, start_column=1, end_row=rt, end_column=7)
    ws[f'A{rt}'] = f'="TOTAL  ·  "&COUNTA(C{P0+2}:C{P0+11})&" colis  ·  "&COUNT({Ar})&" outil(s)"'
    ws[f'H{rt}'] = f'=SUM(H{P0+2}:H{rl})'; ws[f'H{rt}'].number_format = '#,##0.0 "kg"'; ws[f'I{rt}'] = f'=SUM(I{P0+2}:I{P0+11})'; ws[f'I{rt}'].number_format = '0.000 "m³"'
    for k in range(1, 12): ws.cell(rt, k).fill = fill(NAVY); ws.cell(rt, k).font = font(10, True, 'FFFFFF'); ws.cell(rt, k).alignment = Alignment(horizontal='center' if k > 7 else 'left', vertical='center', indent=1 if k == 1 else 0)
    ws.row_dimensions[rt].height = 20
    # serrages effectués
    rs = rt + 2
    ws.merge_cells(start_row=rs, start_column=1, end_row=rs, end_column=4); ws[f'A{rs}'] = 'NOMBRE DE SERRAGES EFFECTUÉS'
    ws[f'A{rs}'].font = font(10, True, NAVY); ws[f'A{rs}'].alignment = Alignment(vertical='center', indent=1)
    inp(ws, f'E{rs}', None, '0', 'center'); ws.merge_cells(start_row=rs, start_column=5, end_row=rs, end_column=6); inp(ws, f'F{rs}')
    ws.row_dimensions[rs].height = 22
    for k in range(1, 7): ws.cell(rs, k).border = Border(bottom=thin())
    page(ws, 'landscape', 0, f'A1:L{rs}')
    ws.page_margins.left = ws.page_margins.right = .3; ws.page_margins.top = .3; ws.page_margins.bottom = .4
    ws.freeze_panes = 'E15'; ws.sheet_view.zoomScale = 90
    ws.oddFooter.center.text = 'Enedril · Liste de matériel &P / &N'; ws.oddFooter.center.size = 8
    return T1, P0, rs

# ================================================================== CLASSEUR DEVIS
def build_devis(USED, LANG):
    wb = Workbook()
    wsA = new_sheet(wb, '1 Affaire', CYAN, True); wsM = new_sheet(wb, '2 Matériel', CYAN); wsO = new_sheet(wb, '3 Options', CYAN); wsD = new_sheet(wb, '4 Devis', BLUE)
    build_listes(wb, LANG)
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
     'sec_cond': ('CONDITIONS PARTICULIÈRES', 'SPECIFIC CONDITIONS'), 'cond': (COND_FR, COND_EN),
     'accept': ('BON POUR ACCORD', 'ACCEPTED BY'), 'sig_name': ('Nom et qualité', 'Name and title'), 'sig_date': ('Date', 'Date'), 'sig_sig': ('Signature et cachet', 'Signature and stamp'),
     'lump': ('forfait', 'lump sum'), 'days': ('JOURS', 'DAYS'), 'in_tight': ('serrage compris', 'make-up included'), 'in_tr': ('transport compris', 'transport included'), 'in_both': ('serrage et transport compris', 'make-up and transport included'),
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
    for r, t in [(6, 'Établi par'), (7, 'E-mail'), (8, 'Téléphone'), (9, "Validité de l'offre"), (10, 'Incoterm'), (11, 'Conditions de règlement'), (12, 'Facturation WE et jours fériés')]: label(ws, f'E{r}', t)
    for ref in ('C6', 'C8', 'C9', 'C10'): inp(ws, ref)
    inp(ws, 'C7', None, 'dd/mm/yyyy')
    inp(ws, 'F6'); dv_list(ws, 'F6', 'A', False)
    for r in (7, 8): ws[f'F{r}'].font = font(10.5, c=MUTED); ws[f'F{r}'].alignment = Alignment(vertical='center', indent=1); ws[f'F{r}'].border = Border(bottom=thin())
    ws['F7'] = '=IFERROR(VLOOKUP(F6,Listes!$A$2:$B$12,2,FALSE),"")'; ws['F8'] = '+33 (0)5 59 04 50 45'
    for ref, col, v in (('F9', 'E', '15 jours / 15 days'), ('F10', 'D', 'EXW Lons'), ('F11', 'F', '30 jours date de facture / 30 days invoice date'), ('F12', 'G', 'Non')):
        inp(ws, ref, v); dv_list(ws, ref, col, col == 'G')
    for r in range(6, 14): ws.row_dimensions[r].height = 22
    ws['B16'] = '➜ Étape suivante : onglet « 2 Matériel »'; ws['B16'].font = font(11, True, BLUE)
    if EXEMPLE:
        ws['C6'] = '26-OFF-0123'; ws['C7'] = datetime.date(2026, 10, 28); ws['C8'] = 'Geopetrol'; ws['C9'] = 'M. Dupont'; ws['C10'] = 'Puits Lacq-12 · CLU108'
        ws['F6'] = 'Paul HYNDERICK'

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
    ws.cell(M2 + 3, 3).value = 'Pour la liste de matériel : copier les colonnes B à D (Bannière, Description, Qté) et les coller dans le classeur « Tool List » (sans les prix).'
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
    ws['H13'] = (f'=IF(C13="Oui",IF(G13="{CALC}",IF(F13<>"",F13,C17+IF(AND(C19="Oui",C8="Oui"),H8,0)+IF(C20="Oui",IF(C9="Oui",H9,0)+IF(C10="Oui",H10,0),0)),N(E13)*N(F13)),0)')
    label(ws, 'B14', 'Périmètre affiché sous le forfait'); inp(ws, 'D14'); ws.merge_cells('D14:H14'); ws.row_dimensions[14].height = 30
    label(ws, 'B15', 'Forfait calculé · jours de stand-by (S)'); inp(ws, 'C15', 3, '0', 'center')
    label(ws, 'B16', 'Forfait calculé · jours d’opérations (O)'); inp(ws, 'C16', 2, '0', 'center')
    label(ws, 'B17', 'Montant calculé des lignes « Inclus au forfait »'); ws['C17'] = f'=SUM({MT}$N${M1}:$N${M2})'
    ws['C17'].number_format = '#,##0.00 "€"'; ws['C17'].font = font(10.5, True); ws['C17'].alignment = Alignment(horizontal='center', vertical='center')
    ws['D15'] = ('Forfait habituel : 3 jours de stand-by + 2 jours d’opérations + toutes les utilisations de charge (UC), sur les lignes « Inclus au forfait » de l’onglet 2. '
                 'Laisser « Prix € » vide pour utiliser ce calcul (plus serrage et transport si cochés), ou saisir un prix pour le remplacer. Qté sert pour le mode « par jour » (nombre de jours).')
    ws['D15'].font = font(9, i=True, c=MUTED); ws['D15'].alignment = Alignment(wrap_text=True, vertical='top', indent=1); ws.merge_cells('D15:H17')
    for r, t, v, note in [(18, 'Afficher les prix des lignes du forfait sur le devis', 'Non', 'Oui : chaque ligne garde ses tarifs ; Non : « incl. ». Dans les deux cas le prix final du forfait apparaît dans le bandeau.'),
                          (19, 'Inclure le serrage dans le forfait', 'Oui', 'Le prix du serrage s’ajoute au montant calculé du forfait.'),
                          (20, 'Inclure le transport dans le forfait', 'Oui', 'Le transport MOB et DEMOB (s’ils ont un prix forfaitaire) s’ajoute au montant calculé.')]:
        label(ws, f'B{r}', t); inp(ws, f'C{r}', v, None, 'center'); dv_list(ws, f'C{r}', 'G'); ws.row_dimensions[r].height = 22
        ws[f'D{r}'] = note; ws[f'D{r}'].font = font(9, i=True, c=MUTED); ws[f'D{r}'].alignment = Alignment(wrap_text=True, vertical='center', indent=1); ws.merge_cells(f'D{r}:H{r}')
    ws['B22'] = 'Rappels'; ws['B22'].font = font(10, True, BLUE)
    for i, t in enumerate(["Transport « Coût réel +15 % » : aucun montant affiché. Choisir « Forfait » pour imposer un prix.",
                           "Lignes couvertes par le forfait : mettre « Oui » dans « Inclus au forfait » (onglet 2). Elles s’affichent « incl. » sur le devis."]):
        ws[f'B{23+i}'] = t; ws[f'B{23+i}'].font = font(9.5, c=MUTED)
    if EXEMPLE:
        ws['C6'] = 'Oui'; ws['F6'] = 750; ws['C7'] = 'Oui'; ws['F7'] = 300; ws['C8'] = 'Oui'; ws['E8'] = 4; ws['F8'] = 180
        ws['C13'] = 'Oui'; ws['D14'] = 'Location du stabilisateur et des 3 XO'
    ws.freeze_panes = 'A6'

    # ================= 4 DEVIS (portrait A4) : flux dynamique, sans lignes vides entre matériel et prestations
    # --- feuille de calcul masquée « Flux » : liste compactée des lignes à afficher
    wsF = new_sheet(wb, 'Flux', '9FB6CE'); wsF.sheet_state = 'hidden'
    for i, h in enumerate(['actif', 'rang', 'type', '#', 'libellé', 'qté', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6'], 1): wsF.cell(1, i).value = h
    FR0, FR1 = 2, 35
    for i in range(24):
        r = 2 + i; m = M1 + i
        forfd = f'AND({MT}$K{m}="Oui",{OP}$C$13="Oui")'; forf = f'AND({forfd},{OP}$C$18<>"Oui")'
        wsF[f'A{r}'] = f'=IF({MT}$L{m}>0,1,0)'
        wsF[f'B{r}'] = f'=IF(A{r}=1,COUNTIF(A$2:A{r},1),"")'
        wsF[f'C{r}'] = f'=IF(A{r}=1,IF({MT}$B{m}="Oui","BAN","ITM"),"")'
        wsF[f'D{r}'] = f'=IF(C{r}="ITM",{MT}$A{m},"")'
        wsF[f'E{r}'] = f'=IF(C{r}="BAN",UPPER({MT}$C{m}),IF(C{r}="ITM",{MT}$C{m}&IF({forfd},"  ·  "&{T("incl_long")},""),""))'
        wsF[f'F{r}'] = f'=IF(C{r}="ITM",{MT}$L{m},"")'
        for col, mc in zip('GHIJKL', 'EFGHIJ'):
            wsF[f'{col}{r}'] = f'=IF(C{r}="ITM",IF({forf},{T("incl")},IF({MT}${mc}{m}="","",{MT}${mc}{m})),"")'
    def f_head(r, flag, hkey):
        wsF[f'A{r}'] = f'=IF({flag},1,0)'; wsF[f'B{r}'] = f'=IF(A{r}=1,COUNTIF(A$2:A{r},1),"")'; wsF[f'C{r}'] = f'=IF(A{r}=1,"HDR","")'
        wsF[f'E{r}'] = f'={T(hkey)}'; wsF[f'F{r}'] = f'={T("h_qty")}'; wsF[f'G{r}'] = f'={T("h_unit")}'; wsF[f'H{r}'] = f'={T("h_pu")}'; wsF[f'I{r}'] = f'={T("h_tot")}'
    def f_line(r, o, defkey, note=None, fi='FALSE'):
        inc = f'{OP}$C${o}="Oui"'; cost = f'{OP}$G${o}="Coût réel +15 %"'; masked = f'AND({fi},{OP}$C$18<>"Oui")'
        wsF[f'A{r}'] = f'=IF({inc},1,0)'; wsF[f'B{r}'] = f'=IF(A{r}=1,COUNTIF(A$2:A{r},1),"")'; wsF[f'C{r}'] = f'=IF(A{r}=1,"LIN","")'
        wsF[f'E{r}'] = (f'=IF({OP}$D${o}<>"",{OP}$D${o},{T(defkey)})' + (f'&"  ·  "&{T(note)}' if note else '') + f'&IF({fi},"  ·  "&{T("incl_long")},"")')
        wsF[f'F{r}'] = f'=IF({cost},"",{OP}$E${o})'
        wsF[f'G{r}'] = f'=IF({cost},"",IF(Listes!$H$1=2,SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE({OP}$G${o},"jour","day"),"serrage","make-up"),"unité","unit"),"forfait","lump sum"),{OP}$G${o}))'
        wsF[f'H{r}'] = f'=IF({masked},{T("incl")},IF({cost},{T("at_cost")},IF({OP}$F${o}="","",{OP}$F${o})))'
        wsF[f'I{r}'] = f'=IF({masked},{T("incl")},IF({cost},"—",{OP}$H${o}))'
    fo = f'AND({OP}$C$13="Oui",{OP}$C$19="Oui")'; ft = f'AND({OP}$C$13="Oui",{OP}$C$20="Oui")'
    f_head(26, f'{OP}$C$8="Oui"', 'sec_tight'); f_line(27, 8, 'tight', None, fo)
    f_head(28, f'OR({OP}$C$9="Oui",{OP}$C$10="Oui")', 'sec_tr'); f_line(29, 9, 'tr_mob', None, ft); f_line(30, 10, 'tr_dem', None, ft)
    f_head(31, f'OR({OP}$C$6="Oui",{OP}$C$7="Oui")', 'sec_op'); f_line(32, 6, 'op_day'); f_line(33, 7, 'op_mob')
    inc = f'{OP}$C$13="Oui"'
    wsF['A34'] = f'=IF({inc},1,0)'; wsF['B34'] = '=IF(A34=1,COUNTIF(A$2:A34,1),"")'; wsF['C34'] = '=IF(A34=1,"FB","")'
    days = f'IF({OP}$G$13="{CALC}",{OP}$C$15+{OP}$C$16,IF({OP}$G$13="Forfait par jour",{OP}$E$13,""))'
    sin = f'AND({OP}$C$8="Oui",{OP}$C$19="Oui")'; tin = f'AND(OR({OP}$C$9="Oui",{OP}$C$10="Oui"),{OP}$C$20="Oui")'
    incl = f'IF(AND({sin},{tin}),{T("in_both")},IF({sin},{T("in_tight")},IF({tin},{T("in_tr")},"")))'
    wsF['E34'] = f'=UPPER({T("forfait")})&IF({days}<>"","  "&{days}&" "&{T("days")},"")&IF({incl}<>"","   ·   "&{incl},"")&IF({OP}$D$13<>"","   ·   "&{OP}$D$13,"")'
    wsF['L34'] = f'=TEXT({OP}$H$13,"#,##0.00")&" € HT"'
    wsF['E35'] = f'={OP}$D$14'
    wsF['A35'] = f'=IF(AND({inc},E35<>""),1,0)'; wsF['B35'] = '=IF(A35=1,COUNTIF(A$2:A35,1),"")'; wsF['C35'] = '=IF(A35=1,"FD","")'
    for rr in range(FR0, FR1 + 1):
        for cc in 'DEFGHIJKL':
            if wsF[f'{cc}{rr}'].value is None: wsF[f'{cc}{rr}'] = '=""'
    FL = lambda col: f'Flux!${col}${FR0}:${col}${FR1}'

    ws = wsD
    for col, w in zip('ABCDEFGHIJK', (1.5, 4.5, 46, 5, 10, 10, 10, 12, 9.5, 9.5, 1.5)): ws.column_dimensions[col].width = w
    for r in (1, 2, 3):
        for c in range(1, 12): ws.cell(r, c).fill = fill(NAVY if r < 3 else CYAN)
    ws.row_dimensions[1].height = 34; ws.row_dimensions[2].height = 22; ws.row_dimensions[3].height = 5
    img = XLImage(LOGO); img.width, img.height = 140, 32; ws.add_image(img, 'B1')
    ws.merge_cells('D1:J1'); ws['D1'] = '=' + T('title'); ws['D1'].font = font(14, True, 'FFFFFF'); ws['D1'].alignment = Alignment(horizontal='right', vertical='center')
    ws.merge_cells('D2:J2'); ws['D2'] = f'="N° "&{AF}$C$6&"   ·   "&IF({AF}$C$7="","",TEXT({AF}$C$7,"dd/mm/yyyy"))'
    ws['D2'].font = font(11, c='9FD8F5'); ws['D2'].alignment = Alignment(horizontal='right', vertical='center')
    ws.row_dimensions[4].height = 8
    txt0 = lambda f: f'=""&{f[1:]}' if f.count('!') == 1 and '&' not in f and 'IF(' not in f else f
    def info(r, c1, c2, key, formula):
        ws.merge_cells(start_row=r, start_column=c1, end_row=r, end_column=c2); ws.merge_cells(start_row=r+1, start_column=c1, end_row=r+1, end_column=c2)
        x, y = ws.cell(r, c1), ws.cell(r+1, c1)
        x.value = '=UPPER(' + T(key) + ')'; x.font = font(7.5, True, MUTED); x.alignment = Alignment(vertical='bottom', indent=1)
        y.value = txt0(formula); y.font = font(10.5, True); y.alignment = Alignment(vertical='top', indent=1, wrap_text=True)
        for k in range(c1, c2 + 1): ws.cell(r+1, k).border = Border(bottom=thin())
    GR = [(2, 3), (4, 7), (8, 10)]; a = lambda c: AF + c
    for r, items in [(5, [('client', '=' + a('$C$8')), ('offer', '=' + a('$C$6')), ('date', f'=IF({a("$C$7")}="","",TEXT({a("$C$7")},"dd/mm/yyyy"))')]),
                     (7, [('attn', '=' + a('$C$9')), ('well', '=' + a('$C$10')), ('by', '=' + a('$F$6'))]),
                     (9, [('inco', '=' + a('$F$10')), ('valid', '=' + a('$F$9')), ('mail', '=' + a('$F$7'))]),
                     (11, [('pay', '=' + a('$F$11')), ('we', '=' + a('$F$12')), ('tel', '=' + a('$F$8'))])]:
        for (c1, c2), it in zip(GR, items):
            if it: info(r, c1, c2, it[0], it[1])
        ws.row_dimensions[r].height = 15; ws.row_dimensions[r+1].height = 19
    ws.row_dimensions[13].height = 8
    def dsec(r, key):
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=10)
        c = ws.cell(r, 2); c.value = '=' + T(key); c.font = font(10, True, 'FFFFFF'); c.alignment = Alignment(vertical='center', indent=1)
        for k in range(2, 11): ws.cell(r, k).fill = fill(BLUE)
        ws.row_dimensions[r].height = 20
    dsec(14, 'sec_eq')
    ws['K14'] = None
    for k, col in [('h_n', 'B'), ('h_desc', 'C'), ('h_qty', 'D'), ('h_s', 'E'), ('h_o', 'F'), ('h_uc', 'G'), ('h_lih', 'H'), ('h_insp', 'I'), ('h_rest', 'J')]:
        c = ws[f'{col}15']; c.value = '=' + T(k); c.font = font(7.5, True, NAVY); c.fill = fill('DCE8F5')
        c.alignment = Alignment(horizontal='center' if col != 'C' else 'left', vertical='center', wrap_text=True, indent=1 if col == 'C' else 0)
    ws.row_dimensions[15].height = 46
    D1, SCAP, SVIS = 16, 40, 26
    for i in range(SCAP):
        r = D1 + i; ws.row_dimensions[r].height = 22
        ws[f'L{r}'] = f'=IFERROR(MATCH({i+1},{FL("B")},0),0)'; ws[f'M{r}'] = f'=IF(L{r}=0,"",INDEX({FL("C")},L{r}))'; ws[f'N{r}'] = f'=IF(L{r}>0,1,0)'
        for col, fc in zip('BCDEFGHIJ', 'DEFGHIJKL'):
            ws[f'{col}{r}'] = f'=IF($L{r}=0,"",INDEX({FL(fc)},$L{r}))'
            ws[f'{col}{r}'].font = font(9.5, col == 'B', MUTED if col == 'B' else INK)
            ws[f'{col}{r}'].number_format = '#,##0.00' if col in 'EFGHIJ' else 'General'
            ws[f'{col}{r}'].alignment = Alignment(horizontal='left' if col == 'C' else 'center', vertical='center', indent=1 if col == 'C' else 0, wrap_text=(col == 'C'), shrink_to_fit=(col in 'EFGHIJ'))
        for hc in 'LMN': ws[f'{hc}{r}'].font = font(7, c='B8C4D2')
    LAST = D1 + SCAP - 1; rng = f'B{D1}:J{LAST}'
    # le filtre masque les lignes vides ; Ctrl+Alt+L (Réappliquer) le met à jour après une modification
    from openpyxl.worksheet.filters import FilterColumn, CustomFilters, CustomFilter
    for hc, t in (('L', 'pos'), ('M', 'type'), ('N', 'actif')): ws[f'{hc}15'] = t; ws[f'{hc}15'].font = font(7, c='B8C4D2')
    ws.auto_filter.ref = f'B15:N{LAST}'
    for cid in range(13):
        ws.auto_filter.filterColumn.append(FilterColumn(colId=cid, hiddenButton=True, showButton=False, customFilters=CustomFilters(customFilter=[CustomFilter(operator='greaterThan', val='0')]) if cid == 10 else None))
    for i in range(USED, SCAP): ws.row_dimensions[D1 + i].hidden = True
    ws.merge_cells('B13:J13'); ws['B13'] = f'=IF(SUBTOTAL(103,B{D1}:B{LAST})<>SUM(N{D1}:N{LAST}),"⚠  Appuyer sur Ctrl + Alt + L pour mettre à jour les lignes du devis (matériel ou options modifiés).","")'
    ws['B13'].font = font(9, True, RED); ws['B13'].alignment = Alignment(indent=1, vertical='center'); ws.row_dimensions[13].height = 14
    cf = ws.conditional_formatting
    cf.add(rng, FormulaRule(formula=[f'OR($M{D1}="BAN",$M{D1}="FB")'], fill=fill(NAVY), font=Font(name=F, bold=True, color='FFFFFF'), stopIfTrue=True))
    cf.add(rng, FormulaRule(formula=[f'$M{D1}="HDR"'], fill=fill(BLUE), font=Font(name=F, bold=True, color='FFFFFF'), stopIfTrue=True))
    cf.add(rng, FormulaRule(formula=[f'$M{D1}="FD"'], fill=fill('EAF6FD'), font=Font(name=F, italic=True, color=NAVY), stopIfTrue=True))
    cf.add(rng, FormulaRule(formula=[f'OR($M{D1}="ITM",$M{D1}="LIN")'], border=Border(bottom=thin(LINE))))
    cf.add(rng, FormulaRule(formula=[f'AND($M{D1}="ITM",MOD(ROW(),2)=0)'], fill=fill('F6F9FC')))
    cf.add(f'E{D1}:J{LAST}', FormulaRule(formula=[f'E{D1}="incl."'], font=Font(name=F, italic=True, color=CYAN)))
    # ---- page 2 : conditions et signature
    r4 = LAST + 3
    ws.row_dimensions[LAST + 1].height = 22; ws.row_dimensions[LAST + 2].height = 22
    dsec(r4, 'sec_cond')
    rr = r4 + 1
    ws.merge_cells(f'B{rr}:J{rr}'); ws[f'B{rr}'] = '=' + T('cond'); ws[f'B{rr}'].font = font(8.5, c=MUTED); ws[f'B{rr}'].alignment = Alignment(wrap_text=True, vertical='top', indent=1); ws.row_dimensions[rr].height = 92
    ws.row_dimensions[r4 + 2].height = 10
    r5 = r4 + 3
    ws.merge_cells(f'B{r5}:J{r5}'); ws[f'B{r5}'] = '=' + T('accept'); ws[f'B{r5}'].font = font(9, True, NAVY); ws[f'B{r5}'].alignment = Alignment(indent=1)
    for c1, c2, key in [(2, 3, 'sig_name'), (4, 7, 'sig_date'), (8, 10, 'sig_sig')]:
        ws.merge_cells(start_row=r5 + 1, start_column=c1, end_row=r5 + 4, end_column=c2)
        ws.cell(r5 + 1, c1).value = '=' + T(key); ws.cell(r5 + 1, c1).font = font(8, c=MUTED); ws.cell(r5 + 1, c1).alignment = Alignment(vertical='top', indent=1)
        for rr in range(r5 + 1, r5 + 5):
            for cc in range(c1, c2 + 1): ws.cell(rr, cc).border = Border(left=thin() if cc == c1 else None, right=thin() if cc == c2 else None, top=thin() if rr == r5 + 1 else None, bottom=thin() if rr == r5 + 4 else None)
    for rr in range(r5 + 1, r5 + 5): ws.row_dimensions[rr].height = 17
    rf = r5 + 6
    ws.merge_cells(f'B{rf}:J{rf}'); ws[f'B{rf}'] = SOCIETE; ws[f'B{rf}'].font = font(7.5, c=MUTED); ws[f'B{rf}'].alignment = Alignment(horizontal='center', wrap_text=True); ws.row_dimensions[rf].height = 26
    ws.column_dimensions['L'].hidden = True; ws.column_dimensions['M'].hidden = True
    page(ws, 'portrait', 0, f'A1:K{rf}'); ws.print_options.horizontalCentered = True
    ws.page_margins.left = ws.page_margins.right = .35; ws.page_margins.top = .4; ws.page_margins.bottom = .5
    ws.oddFooter.center.text = 'Enedril · Devis &P / &N'; ws.oddFooter.center.size = 8
    for w in (wsA, wsM, wsO): page(w)
    wb.calculation.fullCalcOnLoad = True; wb.active = 0
    out = os.path.join(OUTDIR, f'Devis_Enedril_2027_{"FR" if LANG == 1 else "EN"}{SUF}.xlsx'); wb.save(out); print('ok', out)

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
    T1, P0, RS = build_tool_list(wb, wsT, "'1 Matériel'!", mc, 6 if EXEMPLE else 5)
    page(wsM)
    if EXEMPLE:
        t = wsT
        t['A6'] = 'Geopetrol'; t['D6'] = 'Puits Lacq-12'; t['G6'] = '26-82-FR · CLU108'; t['J6'] = 'Geopetrol · Lacq'
        t['A8'] = datetime.date(2026, 11, 9); t['D8'] = datetime.date(2026, 10, 28); t['G8'] = 'TL-26-058'; t['J8'] = 'Paul HYNDERICK'; t['J10'] = 'Fabien JACQUOT'; t['A10'] = 'Stab + XO'
        data = {T1 + 1: ('PL-0412', 'SN-4471', 5.875, 2.25, 'Taille OK', 'P1'), T1 + 2: ('PL-0377', 'SN-1120', 3.5, 2.0, 'Taille OK', 'P1'), T1 + 3: ('PL-0377b', 'SN-1121', 3.5, 2.0, 'Taille OK', 'P1')}
        for r, (ref, sn, od, idd, tt, col) in data.items():
            t[f'B{r}'] = ref; t[f'C{r}'] = sn; t[f'E{r}'] = od; t[f'F{r}'] = idd; t[f'I{r}'] = tt; t[f'L{r}'] = col; t[f'J{r}'] = 'Oui'
        t[f'K{T1+1}'] = 'Blades à tester avant départ'
        t[f'C{P0+2}'] = 'Fishing basket'; t[f'E{P0+2}'] = 120; t[f'F{P0+2}'] = 80; t[f'G{P0+2}'] = 60; t[f'H{P0+2}'] = 145
        t[f'E{RS}'] = 4
    wb.calculation.fullCalcOnLoad = True; wb.active = 0
    out = os.path.join(OUTDIR, f'Tool_List_Enedril_2027{SUF}.xlsx'); wb.save(out); print('ok', out)

build_devis(15 if EXEMPLE else 3, 1); build_devis(15 if EXEMPLE else 3, 2); build_tl()
