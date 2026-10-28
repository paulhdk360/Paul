"""Génère le classeur Devis + Tool List 2027 d'Enedril.
Usage : python3 generer_devis_2027.py <sortie.xlsx> [exemple]
Un seul endroit de saisie (onglets 1 à 3) ; le devis (4) et la tool list (5) se remplissent seuls."""
import sys, datetime, re
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule
from openpyxl.worksheet.formula import ArrayFormula
from openpyxl.drawing.image import Image as XLImage
from openpyxl.worksheet.pagebreak import Break
from openpyxl.utils import get_column_letter as L

OUT = sys.argv[1]; EXEMPLE = len(sys.argv) > 2
LOGO = '/home/user/Paul/public/logo-enedril-white.png'
LOGOC = '/home/user/Paul/certifications/logo_officiel_couleur_avec_baseline.png'
CALC = 'Forfait calculé (S + O + UC)'

NAVY, BLUE, CYAN, RED = '08203F', '0A4FA0', '00AEEF', 'E2231A'
INK, MUTED, LINE, BG, INPUT = '0B1B2E', '51647A', 'D5DEE8', 'F3F6F9', 'EAF6FD'
F = 'Calibri'
def font(sz=10, b=False, c=INK, i=False): return Font(name=F, size=sz, bold=b, color=c, italic=i)
def fill(c): return PatternFill('solid', start_color=c, end_color=c)
thin = lambda c=LINE: Side(style='thin', color=c)
AF, MT, OP, DV, TL = "'1 Affaire'!", "'2 Matériel'!", "'3 Options'!", "'4 Devis'!", "'5 Tool List'!"

wb = Workbook()
wsA = wb.active; wsA.title = '1 Affaire'
wsM = wb.create_sheet('2 Matériel'); wsO = wb.create_sheet('3 Options')
wsD = wb.create_sheet('4 Devis'); wsT = wb.create_sheet('5 Tool List'); wsC = wb.create_sheet('6 Page de garde')
wsL = wb.create_sheet('Listes'); wsX = wb.create_sheet('Textes')
for ws, col in ((wsA, CYAN), (wsM, CYAN), (wsO, CYAN), (wsD, BLUE), (wsT, BLUE), (wsC, BLUE), (wsL, '9FB6CE'), (wsX, '9FB6CE')):
    ws.sheet_properties.tabColor = col; ws.sheet_view.showGridLines = False

# ---------------------------------------------------------------- listes
LISTS = {
 'A': ('Contact Enedril', ['Fabien JACQUOT', 'Alexis ESTINES', 'Paul HYNDERICK', 'Céline CARDONA', 'Koen MONDELAERS', 'Luigi LIBERATORE']),
 'B': ('E-mail', ['fjacquot@enedril.fr', 'aestines@enedril.fr', 'phynderick@enedril.fr', 'ccardona@enedril.fr', 'kmondelaers@enedril.fr', 'lliberatore@enedril.fr']),
 'D': ('Incoterm', ['EXW Lons', 'FCA Lons', 'DAP', 'DDP', 'FOB']),
 'E': ('Validité', ['15 jours / 15 days', '30 jours / 30 days', '60 jours / 60 days', '90 jours / 90 days']),
 'F': ('Règlement', ['30 jours date de facture / 30 days invoice date', '30 jours fin de mois / 30 days end of month', '45 jours fin de mois / 45 days end of month', 'À la commande / Upon order']),
 'G': ('Oui / Non', ['Oui', 'Non']),
 'I': ('Poste opérateur', ['DD', 'MWD', 'Opérateur outils', 'Superviseur fishing', 'Mécanicien']),
 'J': ('Support de colisage', ['Palette', 'Fishing basket', 'Caisse', 'Loose (vrac)']),
 'K': ('N° de colis', ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'Loose']),
 'L': ('Unité', ['forfait', '€/jour', '€/jour/pers', '€/pers', '€/unité']),
 'M': ('Mode transport', ['Coût réel +15 %', 'Forfait']),
 'N': ('Mode forfait', ['Forfait calculé (S + O + UC)', 'Forfait global', 'Forfait par jour']),
 'R': ('Type de prestation', ['Location d’outils de fishing', 'Forage dirigé et MWD', 'Workover', 'Plug & Abandonment', 'Fishing, workover et forage dirigé']),
 'S': ('Type de proposition', ['Technique et commerciale', 'Commerciale']),
 'O': ('Langue', ['FR', 'EN']),
 'P': ('Statut', ['Oui', 'En cours']),
 'Q': ('Test / Taille', ['Taille OK', 'Test OK', 'Taille + test OK', 'À contrôler']),
}
for col, (h, vals) in LISTS.items():
    wsL[f'{col}1'] = h; wsL[f'{col}1'].font = font(9, True, 'FFFFFF'); wsL[f'{col}1'].fill = fill(NAVY)
    for i, v in enumerate(vals): wsL[f'{col}{i+2}'] = v; wsL[f'{col}{i+2}'].font = font(10)
    wsL.column_dimensions[col].width = 30
wsL['H1'] = '=IF(' + AF + '$F$14="EN",2,1)'; wsL['H1'].font = font(9, c=MUTED)
wsL['H2'] = '← index de langue (1 = FR, 2 = EN), ne pas modifier'; wsL['H2'].font = font(8, i=True, c=MUTED)
wsL['A10'] = 'Pour ajouter un contact, une validité, etc. : écrire à la suite dans la colonne (les listes déroulantes lisent les 12 premières lignes).'
wsL['A10'].font = font(9, i=True, c=MUTED)
def lst(col, n=12): return f'=Listes!${col}$2:${col}${n}'

# ---------------------------------------------------------------- textes FR / EN
TXT = {
 'title': ('OFFRE DE LOCATION', 'EQUIPMENT RENTAL QUOTATION'), 'client': ('Client', 'Company'), 'attn': ("À l'attention de", 'Attention'),
 'well': ('Puits / Chantier', 'Well / Location'), 'rigjob': ('Rig · Dossier', 'Rig · Job N°'), 'po': ('PO client', 'Client PO'),
 'offer': ("N° d'offre", 'Offer N°'), 'date': ('Date', 'Date'), 'valid': ("Validité de l'offre", 'Validity'), 'inco': ('Incoterm', 'Incoterm'),
 'lead': ('Délai de mise à dispo', 'Lead time'), 'pay': ('Conditions de règlement', 'Payment terms'), 'we': ('Facturation WE et jours fériés', 'Weekend & holiday billing'),
 'by': ('Établi par', 'Established by'), 'mail': ('E-mail', 'E-mail'), 'tel': ('Téléphone', 'Phone'),
 'sec_eq': ('MATÉRIEL', 'EQUIPMENT'), 'h_n': ('#', '#'), 'h_desc': ('Description', 'Description'), 'h_qty': ('Qté', 'Qty'),
 'h_s': ('Stand-by (S)\n€ / jour / item', 'Stand-by (S)\ndaily rate / item'), 'h_o': ('Opérations (O)\n€ / jour / item', 'Operations (O)\ndaily rate / item'),
 'h_uc': ("Utilisation\nCharge (UC)\n€ / item", 'Utilisation\nCharge (UC)\nper item'), 'h_lih': ('Valeur de remplacement\n(LIH / DBR) € / item', 'Replacement value\n(LIH / DBR) per item'),
 'h_insp': ('Inspection\n€ / item', 'Inspection\nper item'), 'h_rest': ('Restocking\n€', 'Restocking\ncharge'), 'h_ref': ('Remarques', 'Remarks'),
 'incl': ('incl.', 'incl.'), 'incl_long': ('Inclus au forfait', 'Included in lump sum'),
 'sec_opt': ('PRESTATIONS ET OPTIONS', 'SERVICES AND OPTIONS'), 'h_label': ('Prestation', 'Service'), 'h_unit': ('Unité', 'Unit'),
 'h_pu': ('Prix unitaire €', 'Unit price €'), 'h_tot': ('Total €', 'Total €'), 'h_det': ('Détail', 'Details'),
 'op_day': ('Opérateur · tarif journalier', 'Operator · daily rate'), 'op_mob': ('Opérateur · Mob / Demob', 'Operator · Mob / Demob'),
 'tight': ('Serrage · Make-up (forfait)', 'Tong & make-up service (lump sum)'), 'tr_mob': ('Transport MOB (Lons → chantier)', 'Transport MOB (Lons → site)'),
 'tr_dem': ('Transport DEMOB (chantier → Lons)', 'Transport DEMOB (site → Lons)'), 'free': ('Option', 'Option'), 'forfait': ('Forfait', 'Lump sum'),
 'at_cost': ('au coût réel +15 %', 'at cost +15%'), 'tr_note': ('Transport organisé par Enedril', 'Transport organised by Enedril'),
 'est': ('ESTIMATION BUDGÉTAIRE HT (indicative)', 'BUDGET ESTIMATE EXCL. VAT (indicative)'),
 'est_note': ('Basée sur %s j de stand-by et %s j d\'opérations. Hors valeur de remplacement, inspection, restocking et transport au coût réel.',
              'Based on %s stand-by days and %s operation days. Excluding replacement value, inspection, restocking and transport at cost.'),
 'sec_cond': ('CONDITIONS PARTICULIÈRES · SPECIFIC CONDITIONS', 'SPECIFIC CONDITIONS · CONDITIONS PARTICULIÈRES'),
 'accept': ('BON POUR ACCORD', 'ACCEPTED BY'), 'sig_name': ('Nom et qualité', 'Name and title'), 'sig_date': ('Date', 'Date'), 'sig_sig': ('Signature et cachet', 'Signature and stamp'),
 'per_day': ('€/jour', '€/day'), 'lump': ('forfait', 'lump sum'),
}
wsX['A1'], wsX['B1'], wsX['C1'] = 'Clé', 'Français', 'English'
for c in 'ABC': wsX[f'{c}1'].font = font(9, True, 'FFFFFF'); wsX[f'{c}1'].fill = fill(NAVY)
for i, (k, (fr, en)) in enumerate(TXT.items(), start=2):
    wsX[f'A{i}'], wsX[f'B{i}'], wsX[f'C{i}'] = k, fr, en
    for c in 'ABC': wsX[f'{c}{i}'].alignment = Alignment(wrap_text=True, vertical='top')
wsX.column_dimensions['A'].width = 14; wsX.column_dimensions['B'].width = 60; wsX.column_dimensions['C'].width = 60
XEND = len(TXT) + 1
def T(k): return f'INDEX(Textes!$B$2:$C${XEND},MATCH("{k}",Textes!$A$2:$A${XEND},0),Listes!$H$1)'

COND_FR = ("La location s'entend depuis le jour de départ de la base d'origine jusqu'à son retour au même endroit.\n"
 "Le Wear Charge s'applique pour toute usure liée à un usage normal des équipements. En cas de dommages plus importants liés à un usage anormal, la valeur de remplacement sera facturée sur documentation.\n"
 "Charges additionnelles à prévoir pour le colisage d'outils destinés à une expédition en aérien ou maritime.\n"
 "Conditions générales de vente disponibles sur demande ou sur notre site internet www.enedril.com")
COND_EN = ("The rental is from the day of departure from the base of origin until its return to the same place.\n"
 "Wear Charge applies to all wear and tear related to normal use of equipment. In case of greater damage due to abnormal use, the replacement value will be charged based on supporting documentation.\n"
 "Additional charges may apply for packing tools intended for air or ocean shipment.\n"
 "General conditions of sale available upon request or on our website www.enedril.com")
SOCIETE = "ENEDRIL · Z-Induspal · 3 Av. des Lacs · 64140 LONS (France) · SIRET 79464246200020 · TVA FR11794642462"

# ---------------------------------------------------------------- aides de style
def banner(ws, title, sub, last_col, rows=3):
    for r in range(1, rows + 1):
        for c in range(1, last_col + 1): ws.cell(r, c).fill = fill(NAVY)
    ws.row_dimensions[1].height = 30; ws.row_dimensions[2].height = 20; ws.row_dimensions[3].height = 6
    for c in range(1, last_col + 1): ws.cell(3, c).fill = fill(CYAN)
    ws['B1'] = title; ws['B1'].font = font(18, True, 'FFFFFF'); ws['B1'].alignment = Alignment(vertical='center')
    ws['B2'] = sub; ws['B2'].font = font(10, c='9FD8F5'); ws['B2'].alignment = Alignment(vertical='center')
def section(ws, r, c1, c2, text, color=NAVY):
    ws.merge_cells(start_row=r, start_column=c1, end_row=r, end_column=c2)
    c = ws.cell(r, c1); c.value = text; c.font = font(10, True, 'FFFFFF'); c.fill = fill(color); c.alignment = Alignment(vertical='center', indent=1)
    for k in range(c1, c2 + 1): ws.cell(r, k).fill = fill(color)
    ws.row_dimensions[r].height = 20
def label(ws, ref, text):
    ws[ref] = text; ws[ref].font = font(9, True, MUTED); ws[ref].alignment = Alignment(vertical='center', indent=1)
def inp(ws, ref, value=None, fmt=None, align='left'):
    c = ws[ref]
    if value is not None: c.value = value
    c.font = font(10.5, False, BLUE); c.fill = fill(INPUT); c.alignment = Alignment(horizontal=align, vertical='center', indent=1 if align == 'left' else 0, wrap_text=True)
    c.border = Border(bottom=Side(style='thin', color=CYAN))
    if fmt: c.number_format = fmt
def dv_list(ws, rng, col, allow_blank=True, strict=True):
    d = DataValidation(type='list', formula1=lst(col), allow_blank=allow_blank, showErrorMessage=strict)
    d.errorStyle = 'stop' if strict else 'warning'; d.errorTitle = 'Valeur'; d.error = 'Choisir une valeur de la liste.'
    ws.add_data_validation(d); d.add(rng)

# ================================================================ 1 AFFAIRE
ws = wsA
for col, w in zip('ABCDEFG', (2, 28, 38, 3, 30, 46, 2)): ws.column_dimensions[col].width = w
banner(ws, 'DEVIS & TOOL LIST 2027', "Remplir les onglets 1, 2 et 3 : le devis (4) et la tool list (5) se complètent tout seuls. Cases bleues = à saisir.", 7)
if EXEMPLE:
    ws['F1'] = 'EXEMPLE · tarifs fictifs'; ws['F1'].font = font(11, True, 'FFFFFF'); ws['F1'].fill = fill(RED); ws['F1'].alignment = Alignment(horizontal='center', vertical='center')
section(ws, 5, 2, 3, "L'AFFAIRE"); section(ws, 5, 5, 6, "L'OFFRE")
left = [(6, "N° d'offre", 'Offer N°'), (7, 'Date', None), (8, 'Client', None), (9, "À l'attention de", None), (10, 'Puits / Chantier', None),
        (11, 'Rig', None), (12, 'N° de dossier (job)', None), (13, 'PO client', None), (14, 'Description générale', None)]
for r, t, _ in left: label(ws, f'B{r}', t); ws.row_dimensions[r].height = 22
for r, t in [(6, 'Établi par'), (7, 'E-mail'), (8, 'Téléphone'), (9, "Validité de l'offre"), (10, 'Incoterm'), (11, 'Délai de mise à dispo'),
             (12, 'Conditions de règlement'), (13, 'Facturation WE et jours fériés'), (14, 'Langue du devis')]:
    label(ws, f'E{r}', t)
# la langue est en F15 (voir Listes!H1) : on place proprement
label(ws, 'E14', 'Langue du devis')
for r in (6, 7, 8): pass
for ref in ('C6', 'C8', 'C9', 'C10', 'C11', 'C12', 'C13', 'C14'): inp(ws, ref)
inp(ws, 'C7', None, 'dd/mm/yyyy')
inp(ws, 'F6'); dv_list(ws, 'F6', 'A', True, False)
for r in (7, 8): ws[f'F{r}'].font = font(10.5, c=MUTED); ws[f'F{r}'].alignment = Alignment(vertical='center', indent=1); ws[f'F{r}'].border = Border(bottom=Side(style='thin', color=LINE))
ws['F7'] = '=IFERROR(VLOOKUP(F6,Listes!$A$2:$B$12,2,FALSE),"")'
ws['F8'] = '+33 (0)5 59 04 50 45'
inp(ws, 'F9'); dv_list(ws, 'F9', 'E', True, False)
inp(ws, 'F10'); dv_list(ws, 'F10', 'D', True, False)
inp(ws, 'F11')
inp(ws, 'F12'); dv_list(ws, 'F12', 'F', True, False)
inp(ws, 'F13'); dv_list(ws, 'F13', 'G')
ws['F14'] = 'FR'; inp(ws, 'F14'); dv_list(ws, 'F14', 'O')
for r in range(6, 16): ws.row_dimensions[r].height = 22
ws['F9'] = '15 jours / 15 days'; ws['F10'] = 'EXW Lons'; ws['F12'] = '30 jours date de facture / 30 days invoice date'; ws['F13'] = 'Non'
section(ws, 17, 2, 3, 'TOOL LIST'); section(ws, 17, 5, 6, 'TOOL LIST (suite)')
for r, t in [(18, 'N° de tool list'), (19, 'Faite le'), (20, 'Faite par'), (21, 'Date de départ'), (22, 'Destination (A/at)')]: label(ws, f'B{r}', t); ws.row_dimensions[r].height = 22
for r, t in [(18, 'Révisée le'), (19, 'Révisée par'), (20, 'Colisage')]: label(ws, f'E{r}', t)
inp(ws, 'C18'); inp(ws, 'C19', None, 'dd/mm/yyyy'); inp(ws, 'C20'); dv_list(ws, 'C20', 'A', True, False); inp(ws, 'C21', None, 'dd/mm/yyyy'); inp(ws, 'C22')
inp(ws, 'F18', None, 'dd/mm/yyyy'); inp(ws, 'F19'); dv_list(ws, 'F19', 'A', True, False); inp(ws, 'F20', 'A communiquer dès que possible')
section(ws, 24, 2, 6, 'ESTIMATION BUDGÉTAIRE SUR LE DEVIS (facultatif)')
for r, t in [(25, 'Jours de stand-by estimés'), (26, "Jours d'opérations estimés")]: label(ws, f'B{r}', t); ws.row_dimensions[r].height = 22
label(ws, 'E25', "Afficher l'estimation sur le devis"); inp(ws, 'C25', None, '0'); inp(ws, 'C26', None, '0'); inp(ws, 'F25', 'Non'); dv_list(ws, 'F25', 'G')
ws['E26'] = "Calcul indicatif : (S × jours stand-by + O × jours opérations + UC) × quantité, plus les options."; ws['E26'].font = font(9, i=True, c=MUTED)
ws['E26'].alignment = Alignment(wrap_text=True, vertical='top'); ws.merge_cells('E26:F27')
section(ws, 28, 2, 6, 'DOSSIER COMMERCIAL (page de garde et pièces jointes)')
for r, t in [(29, 'Type de prestation'), (30, 'Périmètre du contrat'), (31, 'Type de proposition'), (32, 'Titre du projet (sinon : puits / chantier)')]: label(ws, f'B{r}', t); ws.row_dimensions[r].height = 22
inp(ws, 'C29'); dv_list(ws, 'C29', 'R', True, False); inp(ws, 'C30'); inp(ws, 'C31', 'Technique et commerciale'); dv_list(ws, 'C31', 'S'); inp(ws, 'C32')
for r, t, v in [(29, 'Joindre : présentation de l’entreprise', 'Oui'), (30, 'Joindre : nos engagements (politique QHSE et RSE)', 'Oui'), (31, 'Joindre : certificat ISO 9001', 'Oui'), (32, 'Joindre : proposition technique', 'Oui')]:
    label(ws, f'E{r}', t); inp(ws, f'F{r}', v); dv_list(ws, f'F{r}', 'G')
label(ws, 'E33', 'Proposition commerciale (le devis)'); ws['F33'] = 'toujours jointe'; ws['F33'].font = font(10, i=True, c=MUTED); ws['F33'].alignment = Alignment(indent=1, vertical='center')
ws['B35'] = '➜ Étape suivante : onglet « 2 Matériel »'; ws['B35'].font = font(11, True, BLUE)
if EXEMPLE:
    ws['C6'] = '26-OFF-0123'; ws['C7'] = datetime.date(2026, 10, 28); ws['C8'] = 'Geopetrol'; ws['C9'] = 'M. Dupont'; ws['C10'] = 'Puits Lacq-12'
    ws['C11'] = 'CLU108'; ws['C12'] = '26-82-FR'; ws['C13'] = 'PO-4500123'; ws['C14'] = 'Stab + XO'
    ws['F6'] = 'Paul HYNDERICK'; ws['F11'] = '48 h après commande'; pass
    ws['C18'] = 'TL-26-058'; ws['C19'] = datetime.date(2026, 10, 28); ws['C20'] = 'Paul HYNDERICK'; ws['C21'] = datetime.date(2026, 11, 9); ws['C22'] = 'Geopetrol · Lacq'
    ws['C25'] = 5; ws['C26'] = 3; ws['F25'] = 'Oui'
    ws['C29'] = 'Location d’outils de fishing'; ws['C30'] = 'Location de 3 outils, 9 jours'
ws.freeze_panes = 'A5'

# ================================================================ 2 MATÉRIEL
ws = wsM; M1, M2 = 6, 29                   # lignes de saisie 6..29 (24 lignes)
for col, w in zip('ABCDEFGHIJKLMNO', (5, 30, 52, 7, 12, 12, 12, 14, 12, 12, 11, 12, 8, 8, 12)): ws.column_dimensions[col].width = w
banner(ws, 'MATÉRIEL DU DEVIS', "Une ligne par référence. Si la quantité est 2, la tool list contiendra automatiquement 2 lignes.", 15)
heads = ['#', 'Note pour la tool list', 'Description', 'Qté', 'Stand-by (S)\n€ / jour', 'Opérations (O)\n€ / jour', 'UC\n€ / item', 'LIH / DBR\n€ / item', 'Inspection\n€ / item', 'Restocking\n€', 'Inclus au\nforfait ?', 'Forfait\n€ (calc.)', 'Qté\nretenue', 'Cumul', 'Estim.\n€ (calc.)']
for i, h in enumerate(heads, 1):
    c = ws.cell(5, i); c.value = h; c.font = font(9, True, 'FFFFFF'); c.fill = fill(BLUE if i <= 11 else '7A8CA3')
    c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
ws.row_dimensions[5].height = 34
for r in range(M1, M2 + 1):
    ws.row_dimensions[r].height = 21
    ws[f'A{r}'] = f'=IF(M{r}>0,COUNTIF(M${M1}:M{r},">0"),"")'; ws[f'A{r}'].font = font(10, True, MUTED); ws[f'A{r}'].alignment = Alignment(horizontal='center', vertical='center')
    for col in 'BCDEFGHIJK':
        inp(ws, f'{col}{r}', None, '#,##0.00' if col in 'EFGHIJ' else ('0' if col == 'D' else None), 'center' if col in 'DEFGHIJK' else 'left')
    ws[f'L{r}'] = f'=IF(AND(M{r}>0,K{r}="Oui"),M{r}*(N(E{r})*N({OP}$C$16)+N(F{r})*N({OP}$C$17)+N(G{r})),0)'; ws[f'L{r}'].number_format = '#,##0;-#,##0;;@'
    ws[f'M{r}'] = f'=IF($C{r}="",0,IF(N($D{r})>0,INT($D{r}),1))'
    ws[f'N{r}'] = f'=SUM(M${M1}:M{r})'
    ws[f'O{r}'] = (f'=IF(OR(M{r}=0,AND(K{r}="Oui",{OP}$C$14="Oui")),0,M{r}*(N(E{r})*N({AF}$C$25)+N(F{r})*N({AF}$C$26)+N(G{r})))')
    ws[f'M{r}'].number_format = '0;-0;;@'; ws[f'O{r}'].number_format = '#,##0;-#,##0;;@'
    for col in 'LMNO': ws[f'{col}{r}'].font = font(9, c='7A8CA3'); ws[f'{col}{r}'].alignment = Alignment(horizontal='center', vertical='center')
dv_list(ws, f'K{M1}:K{M2}', 'G')
dvq = DataValidation(type='whole', operator='between', formula1='1', formula2='99', allow_blank=True, showErrorMessage=True, error='Quantité entière entre 1 et 99.')
ws.add_data_validation(dvq); dvq.add(f'D{M1}:D{M2}')
ws.cell(M2 + 2, 3).value = f'=SUM(M{M1}:M{M2})&" ligne(s) sur la tool list  ·  "&COUNTIF(M{M1}:M{M2},">0")&" référence(s) au devis"'
ws.cell(M2 + 2, 3).font = font(10, True, BLUE)
ws.cell(M2 + 3, 3).value = 'Le devis affiche les 14 premières lignes (les suivantes sont repliées dans l’onglet 4, avec une alerte). Colonnes grises (L à O) : calculs, ne pas modifier. « Inclus au forfait » ne s’applique que si l’option Forfait est activée dans l’onglet 3.'
ws.cell(M2 + 3, 3).font = font(9, i=True, c=MUTED)
ws.freeze_panes = 'D6'
ex_items = [('', 'Stab 5-7/8 OD, 2-1/4" ID - 3-1/2" IF Pin x Box', 1, 85, 120, 40, 4200, 150, 600, 'Ouverture à tester'),
            ('', 'XO 3-1/2" IF Pin x 2-7/8" EU Box', 2, 20, 30, 10, 900, 60, 150, ''),
            ('', 'XO 3-1/2" IF Box x 2-7/8" EU Pin', 1, 20, 30, 10, 900, 60, 150, '')]
if EXEMPLE:
    for i, (ref, d, q, s, o, uc, lih, ins, rs, note) in enumerate(ex_items):
        r = M1 + i
        for col, v in zip('BCDEFGHIJ', (note, d, q, s, o, uc, lih, ins, rs)): ws[f'{col}{r}'] = v
        ws[f'K{r}'] = 'Non'

# ================================================================ 3 OPTIONS
ws = wsO
for col, w in zip('ABCDEFGHIJ', (2, 52, 12, 40, 9, 14, 20, 14, 8, 36)): ws.column_dimensions[col].width = w
banner(ws, 'OPTIONS DU DEVIS', "Activez uniquement ce qui doit apparaître : une option sur « Non » disparaît du devis. Le transport reste activé par défaut.", 10)
hd = ['', 'Option', 'Inclure ?', 'Intitulé affiché (facultatif)', 'Qté', 'Prix €', 'Unité / mode', 'Total €', 'Rang', 'Détail affiché sur le devis']
for i, h in enumerate(hd, 1):
    if i == 1: continue
    c = ws.cell(5, i); c.value = h; c.font = font(9, True, 'FFFFFF'); c.fill = fill(BLUE if i < 9 else '7A8CA3'); c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
ws.row_dimensions[5].height = 28
OPTS = [  # (ligne, nom, clé texte, inclure par défaut, qté, unité par défaut, mode?)
 (6, '👷  Opérateur · tarif journalier', 'op_day', 'Non', 1, '€/jour/pers', None),
 (7, '👷  Opérateur · Mob / Demob', 'op_mob', 'Non', 1, '€/pers', None),
 (8, '🔧  Serrage · Make-up', 'tight', 'Non', 1, 'forfait', None),
 (9, '🚚  Transport MOB', 'tr_mob', 'Oui', 1, 'Coût réel +15 %', 'M'),
 (10, '🚚  Transport DEMOB', 'tr_dem', 'Oui', 1, 'Coût réel +15 %', 'M'),
 (11, '➕  Option libre 1', 'free', 'Non', 1, 'forfait', None),
 (12, '➕  Option libre 2', 'free', 'Non', 1, 'forfait', None),
 (13, '➕  Option libre 3', 'free', 'Non', 1, 'forfait', None),
 (14, '📦  FORFAIT (remplace les tarifs des lignes cochées)', 'forfait', 'Non', 1, CALC, 'N'),
]
for r, nom, key, inc, q, unit, mode in OPTS:
    ws.row_dimensions[r].height = 26
    ws[f'B{r}'] = nom; ws[f'B{r}'].font = font(10.5, True, NAVY); ws[f'B{r}'].alignment = Alignment(vertical='center', indent=1)
    inp(ws, f'C{r}', inc, None, 'center'); inp(ws, f'D{r}'); inp(ws, f'E{r}', q, '0', 'center'); inp(ws, f'F{r}', None, '#,##0.00', 'center'); inp(ws, f'G{r}', unit, None, 'center')
    ws[f'H{r}'] = f'=IF(C{r}="Oui",IF(AND(OR(G{r}="Coût réel +15 %"),F{r}=""),0,N(E{r})*N(F{r})),0)'
    if r == 14: ws[f'H{r}'] = f'=IF(C14="Oui",IF(G14="{CALC}",IF(F14<>"",F14,SUM({MT}$L${M1}:$L${M2})),N(E14)*N(F14)),0)'
    ws[f'H{r}'].number_format = '#,##0.00'; ws[f'H{r}'].font = font(10.5, True, INK); ws[f'H{r}'].alignment = Alignment(horizontal='center', vertical='center')
    ws[f'I{r}'] = f'=IF(C{r}="Oui",COUNTIF(C$6:C{r},"Oui"),"")'; ws[f'I{r}'].font = font(9, c='7A8CA3'); ws[f'I{r}'].alignment = Alignment(horizontal='center', vertical='center')
    inp(ws, f'J{r}')
    if mode == 'M': dv_list(ws, f'G{r}', 'M')
    elif mode == 'N': dv_list(ws, f'G{r}', 'N')
    else: dv_list(ws, f'G{r}', 'L', True, False)
    dv_list(ws, f'C{r}', 'G')
ws['J14'].value = None
ws.row_dimensions[14].height = 30
ws['B15'] = 'Forfait · intitulé et périmètre'; label(ws, 'B15', 'Forfait · intitulé et périmètre'); inp(ws, 'D15'); ws.merge_cells('D15:J15')
ws['D15'].alignment = Alignment(wrap_text=True, vertical='center', indent=1); ws.row_dimensions[15].height = 34
label(ws, 'B16', 'Forfait calculé · jours de stand-by (S)'); inp(ws, 'C16', 3, '0', 'center'); label(ws, 'B17', 'Forfait calculé · jours d’opérations (O)'); inp(ws, 'C17', 2, '0', 'center')
label(ws, 'B18', 'Montant calculé des lignes « Inclus au forfait »'); ws['C18'] = f'=SUM({MT}$L${M1}:$L${M2})'; ws['C18'].number_format = '#,##0.00 "€"'; ws['C18'].font = font(10.5, True, INK); ws['C18'].alignment = Alignment(horizontal='center', vertical='center')
ws['D16'] = 'Forfait habituel : 3 jours de stand-by + 2 jours d’opérations + toutes les utilisations de charge (UC). Laisser « Prix € » de la ligne forfait vide pour utiliser ce calcul, ou saisir un prix pour le remplacer.'
ws['D16'].font = font(9, i=True, c=MUTED); ws['D16'].alignment = Alignment(wrap_text=True, vertical='top'); ws.merge_cells('D16:J18')
ws['B20'] = 'Comment utiliser le forfait'; ws['B20'].font = font(10, True, BLUE)
how = ["1. Option « Forfait » sur Oui. Mode « calculé » (3 S + 2 O + UC, jours modifiables), « global » (prix total) ou « par jour » (Qté = nombre de jours).",
       "2. Dans l'onglet 2, mettre « Oui » dans « Inclus au forfait » sur chaque ligne couverte : elles s'affichent « incl. » sur le devis et restent sur la tool list.",
       "3. Écrire le périmètre ci-dessus (ex. « Location 10 jours stab + 2 XO, transport inclus »). Il apparaît sous le forfait.",
       "Transport : « Coût réel +15 % » n'affiche aucun montant. Choisir « Forfait » pour imposer un prix."]
for i, t in enumerate(how): ws[f'B{21+i}'] = t; ws[f'B{21+i}'].font = font(9.5, c=MUTED)
# détail affiché (colonne J) : formule pour options sans texte libre
ws['J6'] = None
for r in (6, 7, 8, 11, 12, 13): pass
if EXEMPLE:
    ws['C6'] = 'Oui'; ws['F6'] = 750; ws['G6'] = '€/jour/pers'
    ws['C7'] = 'Oui'; ws['F7'] = 300; ws['G7'] = '€/pers'
    ws['F9'] = None; ws['F10'] = None
ws.freeze_panes = 'A6'

# ================================================================ 4 DEVIS
ws = wsD
for col, w in zip('ABCDEFGHIJKL', (1.5, 5, 46, 6, 13, 13, 12, 15, 11, 11, 24, 1.5)): ws.column_dimensions[col].width = w
for r in range(1, 4):
    for c in range(1, 13): ws.cell(r, c).fill = fill(NAVY)
for c in range(1, 13): ws.cell(3, c).fill = fill(CYAN)
ws.row_dimensions[1].height = 34; ws.row_dimensions[2].height = 22; ws.row_dimensions[3].height = 5
img = XLImage(LOGO); img.width, img.height = 150, 34; ws.add_image(img, 'B1')
ws.merge_cells('E1:K1'); ws['E1'] = '=' + T('title'); ws['E1'].font = font(17, True, 'FFFFFF'); ws['E1'].alignment = Alignment(horizontal='right', vertical='center')
ws.merge_cells('E2:K2'); ws['E2'] = '="N° "&' + AF + '$C$6&"   ·   "&IF(' + AF + '$C$7="","",TEXT(' + AF + '$C$7,"dd/mm/yyyy"))'
ws['E2'].font = font(11, c='9FD8F5'); ws['E2'].alignment = Alignment(horizontal='right', vertical='center')
ws.row_dimensions[4].height = 8
def txt0(f): return '=""&' + f[1:] if re.match(r"^='[^']+'![$A-Z0-9]+$", f) else f
def info(r, c1, c2, key, formula):
    formula = txt0(formula)
    ws.merge_cells(start_row=r, start_column=c1, end_row=r, end_column=c2); ws.merge_cells(start_row=r+1, start_column=c1, end_row=r+1, end_column=c2)
    a, b = ws.cell(r, c1), ws.cell(r+1, c1)
    a.value = '=UPPER(' + T(key) + ')'; a.font = font(7.5, True, MUTED); a.alignment = Alignment(vertical='bottom', indent=1)
    b.value = formula; b.font = font(10.5, True, INK); b.alignment = Alignment(vertical='top', indent=1, wrap_text=True)
    for k in range(c1, c2 + 1): ws.cell(r+1, k).border = Border(bottom=thin())
GR = [(2, 3), (4, 6), (7, 8), (9, 11)]
a = lambda c: AF + c
rows = [
 (5, [('client', '=' + a('$C$8')), ('offer', '=' + a('$C$6')), ('date', '=IF(' + a('$C$7') + '="","",TEXT(' + a('$C$7') + ',"dd/mm/yyyy"))'), ('by', '=' + a('$F$6'))]),
 (7, [('attn', '=' + a('$C$9')), ('well', '=' + a('$C$10')), ('rigjob', '=' + a('$C$11') + '&IF(' + a('$C$12') + '<>""," · "&' + a('$C$12') + ',"")'), ('mail', '=' + a('$F$7'))]),
 (9, [('po', '=' + a('$C$13')), ('inco', '=' + a('$F$10')), ('valid', '=' + a('$F$9')), ('tel', '=' + a('$F$8'))]),
 (11, [('pay', '=' + a('$F$12')), ('lead', '=' + a('$F$11')), ('we', '=' + a('$F$13')), None]),
]
for r, items in rows:
    for (c1, c2), it in zip(GR, items):
        if it: info(r, c1, c2, it[0], it[1])
    ws.row_dimensions[r].height = 15; ws.row_dimensions[r+1].height = 19
ws.row_dimensions[13].height = 8
def dsec(r, key, c1=2, c2=11):
    ws.merge_cells(start_row=r, start_column=c1, end_row=r, end_column=c2)
    c = ws.cell(r, c1); c.value = '=' + T(key); c.font = font(10, True, 'FFFFFF'); c.alignment = Alignment(vertical='center', indent=1)
    for k in range(c1, c2 + 1): ws.cell(r, k).fill = fill(BLUE)
    ws.row_dimensions[r].height = 20
dsec(14, 'sec_eq')
HD = [('h_n', 'B'), ('h_desc', 'C'), ('h_qty', 'D'), ('h_s', 'E'), ('h_o', 'F'), ('h_uc', 'G'), ('h_lih', 'H'), ('h_insp', 'I'), ('h_rest', 'J'), ('h_ref', 'K')]
for k, col in HD:
    c = ws[f'{col}15']; c.value = '=' + T(k); c.font = font(8, True, NAVY); c.fill = fill('DCE8F5'); c.alignment = Alignment(horizontal='center' if col != 'C' else 'left', vertical='center', wrap_text=True, indent=1 if col == 'C' else 0)
ws.row_dimensions[15].height = 44
D1 = 16                                       # première ligne devis ; ligne matériel = r - 10
for i in range(24):
    r = D1 + i; m = M1 + i; ws.row_dimensions[r].height = 21
    active = f'{MT}$M{m}>0'; forf = f'AND({MT}$K{m}="Oui",{OP}$C$14="Oui")'
    ws[f'B{r}'] = f'=IF({active},{MT}$A{m},"")'
    ws[f'C{r}'] = f'=IF({active},{MT}$C{m},"")'
    ws[f'D{r}'] = f'=IF({active},{MT}$M{m},"")'
    for col, mc in zip('EFGHIJ', 'EFGHIJ'):
        ws[f'{col}{r}'] = f'=IF({active},IF({forf},{T("incl")},IF({MT}${mc}{m}="","",{MT}${mc}{m})),"")'
        ws[f'{col}{r}'].number_format = '#,##0.00'; ws[f'{col}{r}'].alignment = Alignment(horizontal='center', vertical='center')
    ws[f'K{r}'] = f'=IF({active},IF({forf},{T("incl_long")},""),"")'
    for col in 'BCDEFGHIJK':
        ws[f'{col}{r}'].font = font(10 if col != 'K' else 9, col == 'B', MUTED if col in 'BK' else INK)
    ws[f'B{r}'].alignment = Alignment(horizontal='center', vertical='center'); ws[f'C{r}'].alignment = Alignment(vertical='center', indent=1, wrap_text=True)
    ws[f'D{r}'].alignment = Alignment(horizontal='center', vertical='center'); ws[f'K{r}'].alignment = Alignment(vertical='center', indent=1, wrap_text=True)
rng = f'B{D1}:K{D1+23}'
DVIS = 14
ws.row_dimensions.group(D1 + DVIS, D1 + 23, outline_level=1, hidden=True)
ws.merge_cells('B40:K40'); ws['B40'] = f'=IF(SUM({MT}$M${M1+DVIS}:$M${M2})>0,"⚠  Des lignes de matériel au-delà de la ligne {DVIS} sont masquées : cliquer sur le [+] dans la marge gauche pour les afficher.","")'
ws['B40'].font = font(9.5, True, RED); ws['B40'].alignment = Alignment(indent=1, vertical='center'); ws.row_dimensions[40].height = 18
ws.conditional_formatting.add(rng, FormulaRule(formula=[f'$C{D1}<>""'], border=Border(bottom=thin(LINE))))
ws.conditional_formatting.add(rng, FormulaRule(formula=[f'AND($C{D1}<>"",MOD(ROW(),2)=0)'], fill=fill('F6F9FC')))
ws.conditional_formatting.add(f'E{D1}:J{D1+23}', FormulaRule(formula=[f'E{D1}="' + 'incl."' ], font=Font(name=F, italic=True, color=CYAN)))
# options (lignes devis)
dsec(41 + 1, 'sec_opt'); ws.row_dimensions[41].height = 10
OH = [('', 'B'), ('h_label', 'C'), ('h_qty', 'D'), ('h_unit', 'E'), ('h_pu', 'F'), ('h_tot', 'G'), ('h_det', 'H')]
for k, col in OH:
    c = ws[f'{col}43']; c.value = ('=' + T(k)) if k else None; c.font = font(8, True, NAVY); c.alignment = Alignment(horizontal='left' if col in 'CH' else 'center', vertical='center', indent=1 if col in 'CH' else 0)
    for kk in range(2, 12): ws.cell(43, kk).fill = fill('DCE8F5')
ws.merge_cells('H43:K43'); ws.row_dimensions[43].height = 20
OPR = {6: 'op_day', 7: 'op_mob', 8: 'tight', 9: 'tr_mob', 10: 'tr_dem', 11: 'free', 12: 'free', 13: 'free', 14: 'forfait'}
for i in range(9):
    r = 44 + i; ws.row_dimensions[r].height = 21
    rk = f'MATCH({i+1},{OP}$I$6:$I$14,0)'
    idx = lambda col: f'INDEX({OP}${col}$6:${col}$14,{rk})'
    deflabel = f'CHOOSE({rk},{T("op_day")},{T("op_mob")},{T("tight")},{T("tr_mob")},{T("tr_dem")},{T("free")}&" 1",{T("free")}&" 2",{T("free")}&" 3",{T("forfait")})'
    ok = f'ISNUMBER({rk})'
    costmode = f'{idx("G")}="Coût réel +15 %"'
    ws[f'C{r}'] = f'=IF({ok},IF({idx("D")}<>"",{idx("D")},{deflabel}),"")'
    calc = f'AND({rk}=9,{OP}$G$14="{CALC}")'
    ws[f'D{r}'] = f'=IF({ok},IF({costmode},"",IF({calc},1,{idx("E")})),"")'
    ws[f'E{r}'] = f'=IF({ok},IF({costmode},"",IF({calc},{T("lump")},{idx("G")})),"")'
    ws[f'F{r}'] = f'=IF({ok},IF({costmode},{T("at_cost")},IF({calc},IF({OP}$F$14="",SUM({MT}$L${M1}:$L${M2}),{OP}$F$14),IF({idx("F")}="","",{idx("F")}))),"")'
    ws[f'G{r}'] = f'=IF({ok},IF({costmode},"—",{idx("H")}),"")'
    caldet = f'IF(Listes!$H$1=1,{OP}$C$16&" j stand-by + "&{OP}$C$17&" j opérations + UC",{OP}$C$16&" stand-by days + "&{OP}$C$17&" operation days + UC")'
    ws[f'H{r}'] = f'=IF({ok},IF({rk}=9,IF({OP}$G$14="{CALC}",{caldet}&IF({OP}$D$15<>"","  ·  "&{OP}$D$15,""),{OP}$D$15),IF(OR({rk}=4,{rk}=5),{T("tr_note")},"")),"")'
    ws.merge_cells(f'H{r}:K{r}')
    for col in 'CDEFGH': ws[f'{col}{r}'].font = font(10, col in 'CG', INK if col != 'H' else MUTED)
    ws[f'C{r}'].alignment = Alignment(vertical='center', indent=1); ws[f'H{r}'].alignment = Alignment(vertical='center', indent=1, wrap_text=True)
    for col in 'DEFG': ws[f'{col}{r}'].alignment = Alignment(horizontal='center', vertical='center')
    ws[f'F{r}'].number_format = '#,##0.00'; ws[f'G{r}'].number_format = '#,##0.00'
ws.conditional_formatting.add('B44:K52', FormulaRule(formula=['$C44<>""'], border=Border(bottom=thin(LINE))))
ws.row_dimensions[53].height = 8
# estimation
est_on = f'{AF}$F$25="Oui"'
ws.merge_cells('H54:K54'); ws.merge_cells('H55:K55'); ws.merge_cells('C54:G55')
ws['H54'] = f'=IF({est_on},{T("est")},"")'; ws['H54'].font = font(8, True, MUTED); ws['H54'].alignment = Alignment(horizontal='right', vertical='bottom')
PERDAY = f'SUMPRODUCT(({OP}$C$6:$C$14="Oui")*ISNUMBER(SEARCH("€/jour",{OP}$G$6:$G$14))*{OP}$E$6:$E$14*{OP}$F$6:$F$14)'
ws['H55'] = f'=IF({est_on},SUM({MT}$O${M1}:$O${M2})+SUM({OP}$H$6:$H$14)-{PERDAY}+{PERDAY}*N({AF}$C$26),"")'
ws['H55'].font = font(20, True, BLUE); ws['H55'].alignment = Alignment(horizontal='right', vertical='center'); ws['H55'].number_format = '#,##0.00 "€"'
ws['C54'] = f'=IF({est_on},SUBSTITUTE(SUBSTITUTE({T("est_note")},"%s",{AF}$C$25&"|"),"|",""),"")'
ws['C54'] = (f'=IF({est_on},IF(Listes!$H$1=1,"Basée sur "&{AF}$C$25&" j de stand-by et "&{AF}$C$26&" j d\'opérations. Les options « €/jour » sont comptées sur les jours d’opérations. Hors valeur de remplacement, inspection, restocking et transport au coût réel.",'
             f'"Based on "&{AF}$C$25&" stand-by days and "&{AF}$C$26&" operation days. Option day rates are counted on operation days. Excluding replacement value, inspection, restocking and transport at cost."),"")')
ws['C54'].font = font(8.5, i=True, c=MUTED); ws['C54'].alignment = Alignment(wrap_text=True, vertical='center', indent=1)
ws.row_dimensions[54].height = 18; ws.row_dimensions[55].height = 30; ws.row_dimensions[56].height = 8
dsec(57, 'sec_cond')
for r, txt, h in ((58, COND_FR, 66), (59, COND_EN, 66)):
    ws.merge_cells(f'B{r}:K{r}'); ws[f'B{r}'] = txt; ws[f'B{r}'].font = font(8.5, c=MUTED); ws[f'B{r}'].alignment = Alignment(wrap_text=True, vertical='top', indent=1); ws.row_dimensions[r].height = h
ws['B58'].fill = fill('FAFCFE'); ws.row_dimensions[60].height = 10
ws.merge_cells('B61:K61'); ws['B61'] = '=' + T('accept'); ws['B61'].font = font(9, True, NAVY); ws['B61'].alignment = Alignment(indent=1)
for k, (c1, c2, key) in enumerate([(2, 4, 'sig_name'), (5, 7, 'sig_date'), (8, 11, 'sig_sig')]):
    ws.merge_cells(start_row=62, start_column=c1, end_row=65, end_column=c2)
    ws.cell(62, c1).value = '=' + T(key); ws.cell(62, c1).font = font(8, c=MUTED); ws.cell(62, c1).alignment = Alignment(vertical='top', indent=1)
    for rr in range(62, 66):
        for cc in range(c1, c2 + 1):
            ws.cell(rr, cc).border = Border(left=thin() if cc == c1 else None, right=thin() if cc == c2 else None, top=thin() if rr == 62 else None, bottom=thin() if rr == 65 else None)
for r in range(62, 66): ws.row_dimensions[r].height = 16
ws.merge_cells('B67:K67'); ws['B67'] = SOCIETE; ws['B67'].font = font(8, c=MUTED); ws['B67'].alignment = Alignment(horizontal='center')
ws.print_area = 'A1:L67'; ws.page_setup.orientation = 'landscape'; ws.page_setup.paperSize = 9
ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0; ws.sheet_properties.pageSetUpPr.fitToPage = True
ws.print_options.horizontalCentered = True; ws.page_margins.left = ws.page_margins.right = .3; ws.page_margins.top = .35; ws.page_margins.bottom = .4
ws.row_breaks.append(Break(id=40))
ws.oddFooter.center.text = 'Enedril · Devis &P / &N'; ws.oddFooter.center.size = 8

# ================================================================ 5 TOOL LIST
ws = wsT; T1, TN = 15, 40                      # lignes de la tool list 15..54
cols = (5.5, 8, 15, 40, 8, 8, 10, 11, 13, 8, 28, 8, 10, 8, 9, 8, 10, 8, 1.5, 6)
for i, w in enumerate(cols, 1): ws.column_dimensions[L(i)].width = w
LC = 18
for r in range(1, 4):
    for c in range(1, LC + 1): ws.cell(r, c).fill = fill(NAVY)
for c in range(1, LC + 1): ws.cell(3, c).fill = fill(CYAN)
ws.row_dimensions[1].height = 32; ws.row_dimensions[2].height = 20; ws.row_dimensions[3].height = 5
img = XLImage(LOGO); img.width, img.height = 140, 32; ws.add_image(img, 'A1')
ws.merge_cells('F1:R1'); ws['F1'] = 'TOOL LIST  ·  LISTE DE MATÉRIEL'; ws['F1'].font = font(17, True, 'FFFFFF'); ws['F1'].alignment = Alignment(horizontal='right', vertical='center')
ws.merge_cells('F2:R2'); ws['F2'] = '="N° "&' + AF + '$C$18&IF(' + AF + '$C$12="","","   ·   Dossier "&' + AF + '$C$12)'
ws['F2'].font = font(11, c='9FD8F5'); ws['F2'].alignment = Alignment(horizontal='right', vertical='center')
ws.row_dimensions[4].height = 8
def tinfo(r, c1, c2, text, formula, fmt=None):
    formula = txt0(formula)
    ws.merge_cells(start_row=r, start_column=c1, end_row=r, end_column=c2); ws.merge_cells(start_row=r+1, start_column=c1, end_row=r+1, end_column=c2)
    a, b = ws.cell(r, c1), ws.cell(r+1, c1)
    a.value = text.upper(); a.font = font(7.5, True, MUTED); a.alignment = Alignment(vertical='bottom', indent=1)
    b.value = formula; b.font = font(10.5, True, INK); b.alignment = Alignment(vertical='top', indent=1, wrap_text=True)
    if fmt: b.number_format = fmt
    for k in range(c1, c2 + 1): ws.cell(r+1, k).border = Border(bottom=thin())
TG = [(1, 4), (5, 8), (9, 11), (12, 18)]
dt = lambda c: f'=IF({AF}{c}="","",TEXT({AF}{c},"dd/mm/yyyy"))'
trow = [
 (5, [('Client', '=' + AF + '$C$8'), ('Dossier N°', '=' + AF + '$C$12'), ('Rig / Puits', '=' + AF + '$C$11&IF(' + AF + '$C$10<>""," · "&' + AF + '$C$10,"")'), ('A / at (destination)', '=' + AF + '$C$22')]),
 (7, [('Date de départ', dt('$C$21')), ('Faite le', dt('$C$19')), ('Faite par', '=' + AF + '$C$20'), ('Révisée le · par', '=IF(' + AF + '$F$18="","",TEXT(' + AF + '$F$18,"dd/mm/yyyy")&"  ·  "&' + AF + '$F$19)')]),
]
for r, items in trow:
    for (c1, c2), (t, f) in zip(TG, items): tinfo(r, c1, c2, t, f)
    ws.row_dimensions[r].height = 15; ws.row_dimensions[r+1].height = 19
tinfo(9, 1, 11, 'Description générale', '=' + AF + '$C$14'); tinfo(9, 12, 18, 'Colisage', '=' + AF + '$F$20')
ws.row_dimensions[9].height = 15; ws.row_dimensions[10].height = 19
ws.merge_cells('A11:R11'); ws['A11'] = 'Toute modification par rapport à la liste ci-dessous doit être évitée, et impérativement signalée si pas le choix.'
ws['A11'].font = font(9, True, RED); ws['A11'].alignment = Alignment(indent=1, vertical='center'); ws.row_dimensions[11].height = 20; ws.row_dimensions[12].height = 4
# groupes d'en-tête
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
ws['T14'] = 'ptr'; ws['T14'].font = font(8, c='7A8CA3')
TOTQ = f'SUM({MT}$M${M1}:$M${M2})'
for i in range(TN):
    r = T1 + i; ws.row_dimensions[r].height = 27
    ws[f'A{r}'] = f'=IF({i+1}<={TOTQ},{i+1},"")'
    ws[f'T{r}'] = f'=IF(A{r}="","",COUNTIF({MT}$N${M1}:$N${M2},"<"&A{r})+1)'
    p = f'$T{r}'
    q = f'INDEX({MT}$M${M1}:$M${M2},{p})'
    ws[f'D{r}'] = (f'=IF(A{r}="","",INDEX({MT}$C${M1}:$C${M2},{p})&IF({q}>1,"  ("&(A{r}-INDEX({MT}$N${M1}:$N${M2},{p})+{q})&"/"&{q}&")","")'
                   f'&IF(INDEX({MT}$B${M1}:$B${M2},{p})<>"",CHAR(10)&"→ "&INDEX({MT}$B${M1}:$B${M2},{p}),""))')
    for col in 'AD': ws[f'{col}{r}'].font = font(10 if col == 'A' else 9.5, col == 'A', INK if col == 'D' else MUTED)
    ws[f'T{r}'].font = font(8, c='B8C4D2')
    ws[f'A{r}'].alignment = Alignment(horizontal='center', vertical='center')
    ws[f'D{r}'].alignment = Alignment(vertical='center', wrap_text=True, indent=1)
    for col in 'BCEFGHIJKLMNOPQR':
        c = ws[f'{col}{r}']; c.font = font(9.5, False, BLUE)
        c.number_format = '0.000' if col in 'EFGH' else ('dd/mm' if col in 'MQ' else 'General')
        c.alignment = Alignment(horizontal='left' if col in 'CK' else 'center', vertical='center', indent=1 if col in 'CK' else 0, wrap_text=True)
dv_list(ws, f'I{T1}:I{T1+TN-1}', 'Q', True, False); dv_list(ws, f'L{T1}:L{T1+TN-1}', 'P', True, False)
dv_list(ws, f'O{T1}:O{T1+TN-1}', 'K', True, False); dv_list(ws, f'J{T1}:J{T1+TN-1}', 'G', True, False); dv_list(ws, f'P{T1}:P{T1+TN-1}', 'G', True, False)
dv_list(ws, f'N{T1}:N{T1+TN-1}', 'A', True, False); dv_list(ws, f'R{T1}:R{T1+TN-1}', 'A', True, False)
rng = f'A{T1}:R{T1+TN-1}'
ws.conditional_formatting.add(f'A{T1}:R{T1+TN-1}', FormulaRule(formula=[f'$A{T1}<>""'], fill=fill(INPUT), border=Border(bottom=thin('B7DDF2'))))
ws.conditional_formatting.add(f'L{T1}:L{T1+TN-1}', FormulaRule(formula=[f'$L{T1}="Oui"'], fill=fill('DDF3E4')))
TV = 20
ws.row_dimensions.group(T1 + TV, T1 + TN - 1, outline_level=1, hidden=True)
ws.merge_cells(start_row=T1 + TN, start_column=1, end_row=T1 + TN, end_column=18)
ws[f'A{T1+TN}'] = f'=IF({TOTQ}>{TV},"⚠  "&({TOTQ}-{TV})&" ligne(s) au-delà de la ligne {TV} sont masquées : cliquer sur le [+] dans la marge gauche pour les afficher.","")'
ws[f'A{T1+TN}'].font = font(9.5, True, RED); ws[f'A{T1+TN}'].alignment = Alignment(indent=1, vertical='center')
# colisage
P0 = T1 + TN + 2                      # titre
thead(P0, 1, 18, 'COLISAGE  ·  PACKING', NAVY); ws.row_dimensions[P0].height = 20
PH = [(1, 2, 'Colis'), (3, 3, 'Support'), (4, 4, 'Contenu (items de la tool list)'), (5, 5, 'L (cm)'), (6, 6, 'l (cm)'), (7, 7, 'h (cm)'), (8, 8, 'Poids (kg)'), (9, 9, 'Volume (m³)'), (10, 11, 'Remarques')]
for c1, c2, h in PH:
    if c1 != c2: ws.merge_cells(start_row=P0+1, start_column=c1, end_row=P0+1, end_column=c2)
    c = ws.cell(P0+1, c1); c.value = h; c.font = font(8, True, NAVY); c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    for k in range(c1, c2 + 1): ws.cell(P0+1, k).fill = fill('DCE8F5')
ws.row_dimensions[P0+1].height = 22
for i in range(10):
    r = P0 + 2 + i; ws.row_dimensions[r].height = 22
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2); ws.merge_cells(start_row=r, start_column=10, end_row=r, end_column=11)
    ws[f'A{r}'] = f'P{i+1}'; ws[f'A{r}'].font = font(10, True, NAVY); ws[f'A{r}'].alignment = Alignment(horizontal='center', vertical='center')
    inp(ws, f'C{r}', None, None, 'center'); dv_list(ws, f'C{r}', 'J', True, False)
    ws[f'D{r}'] = ArrayFormula(f'D{r}', f'=_xlfn.TEXTJOIN(", ",TRUE,IF(${"O"}${T1}:${"O"}${T1+TN-1}=$A{r},$A${T1}:$A${T1+TN-1},""))')
    ws[f'D{r}'].font = font(9.5, c=INK); ws[f'D{r}'].alignment = Alignment(vertical='center', wrap_text=True, indent=1)
    for col in 'EFGH': inp(ws, f'{col}{r}', None, '#,##0.0' if col == 'H' else '0', 'center')
    ws[f'I{r}'] = f'=IF(COUNT(E{r}:G{r})=3,E{r}*F{r}*G{r}/1000000,"")'; ws[f'I{r}'].number_format = '0.000'; ws[f'I{r}'].font = font(10, c=INK); ws[f'I{r}'].alignment = Alignment(horizontal='center', vertical='center')
    inp(ws, f'J{r}')
    for k in range(1, 12): ws.cell(r, k).border = Border(bottom=thin())
# loose
rl = P0 + 12
ws.merge_cells(start_row=rl, start_column=1, end_row=rl, end_column=2); ws[f'A{rl}'] = 'Loose'; ws[f'A{rl}'].font = font(10, True, NAVY); ws[f'A{rl}'].alignment = Alignment(horizontal='center', vertical='center')
ws[f'C{rl}'] = 'Loose (vrac)'; ws[f'C{rl}'].font = font(9.5, c=MUTED); ws[f'C{rl}'].alignment = Alignment(horizontal='center', vertical='center')
ws[f'D{rl}'] = ArrayFormula(f'D{rl}', f'=_xlfn.TEXTJOIN(", ",TRUE,IF($O${T1}:$O${T1+TN-1}=$A{rl},$A${T1}:$A${T1+TN-1},""))'); ws[f'D{rl}'].font = font(9.5); ws[f'D{rl}'].alignment = Alignment(vertical='center', wrap_text=True, indent=1)
inp(ws, f'H{rl}', None, '#,##0.0', 'center'); ws.row_dimensions[rl].height = 22
for k in range(1, 12): ws.cell(rl, k).border = Border(bottom=thin())
rt = rl + 1
ws.merge_cells(start_row=rt, start_column=1, end_row=rt, end_column=7)
ws[f'A{rt}'] = f'="TOTAL  ·  "&COUNTA(C{P0+2}:C{P0+11})&" colis  ·  "&SUM({MT}$M${M1}:$M${M2})&" outil(s)"'; ws[f'A{rt}'].font = font(10, True, 'FFFFFF'); ws[f'A{rt}'].alignment = Alignment(indent=1, vertical='center')
ws[f'H{rt}'] = f'=SUM(H{P0+2}:H{rl})'; ws[f'H{rt}'].number_format = '#,##0.0 "kg"'; ws[f'I{rt}'] = f'=SUM(I{P0+2}:I{P0+11})'; ws[f'I{rt}'].number_format = '0.000 "m³"'
for k in range(1, 12): ws.cell(rt, k).fill = fill(NAVY); ws.cell(rt, k).font = font(10, True, 'FFFFFF'); ws.cell(rt, k).alignment = Alignment(horizontal='center' if k > 7 else 'left', vertical='center', indent=1 if k == 1 else 0)
ws.row_dimensions[rt].height = 22
# signatures
rs = rt + 2
for c1, c2, t in [(1, 4, 'PRÉPARÉ PAR · Nom, date, signature'), (5, 11, 'CONTRÔLÉ PAR (superviseur) · Nom, date, signature'), (12, 18, 'COLISAGE VÉRIFIÉ PAR · Nom, date')]:
    ws.merge_cells(start_row=rs, start_column=c1, end_row=rs+3, end_column=c2); ws.cell(rs, c1).value = t; ws.cell(rs, c1).font = font(8, True, MUTED); ws.cell(rs, c1).alignment = Alignment(vertical='top', indent=1)
    for rr in range(rs, rs + 4):
        for cc in range(c1, c2 + 1): ws.cell(rr, cc).border = Border(left=thin() if cc == c1 else None, right=thin() if cc == c2 else None, top=thin() if rr == rs else None, bottom=thin() if rr == rs + 3 else None)
for r in range(rs, rs + 4): ws.row_dimensions[r].height = 16
ws.column_dimensions['S'].hidden = False
ws.print_area = f'A1:R{rs+3}'; ws.page_setup.orientation = 'landscape'; ws.page_setup.paperSize = 9
ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0; ws.sheet_properties.pageSetUpPr.fitToPage = True
ws.page_margins.left = ws.page_margins.right = .25; ws.page_margins.top = .3; ws.page_margins.bottom = .4
ws.row_breaks.append(Break(id=P0 - 1))
ws.freeze_panes = 'E15'
ws.oddFooter.center.text = 'Enedril · Tool List &P / &N'; ws.oddFooter.center.size = 8
ws.sheet_view.zoomScale = 90

if EXEMPLE:
    # relevés d'exemple sur la tool list
    ex = {T1: ('PL-0412', 'SN-4471', 5.875, 2.25, None, None, 'Taille OK', 'Oui', 'P1'), T1 + 1: ('PL-0377', 'SN-1120', 3.5, 2.0, None, None, 'Taille OK', 'Oui', 'P1'),
          T1 + 2: ('PL-0377b', 'SN-1121', 3.5, 2.0, None, None, 'Taille OK', 'En cours', 'P1')}
    for r, (ref, sn, od, idd, bl, co, tt, pr, col) in ex.items():
        wsT[f'B{r}'] = ref; wsT[f'C{r}'] = sn; wsT[f'E{r}'] = od; wsT[f'F{r}'] = idd; wsT[f'I{r}'] = tt; wsT[f'L{r}'] = pr; wsT[f'O{r}'] = col; wsT[f'J{r}'] = 'Oui'
    wsT[f'K{T1}'] = 'Blades à tester avant départ'; wsT[f'N{T1}'] = 'PH'; wsT[f'M{T1}'] = datetime.date(2026, 10, 29)
    wsT[f'C{P0+2}'] = 'Fishing basket'; wsT[f'E{P0+2}'] = 120; wsT[f'F{P0+2}'] = 80; wsT[f'G{P0+2}'] = 60; wsT[f'H{P0+2}'] = 145


# ================================================================ 6 PAGE DE GARDE
ws = wsC
for col, w in zip('ABCDEF', (2, 25, 25, 25, 25, 2)): ws.column_dimensions[col].width = w
LE = lambda fr, en: f'IF(Listes!$H$1=1,"{fr}","{en}")'
img = XLImage(LOGOC); img.width, img.height = 210, 74; ws.add_image(img, 'B1')
for r in range(1, 6): ws.row_dimensions[r].height = 20
ws.merge_cells('D1:E1'); ws.merge_cells('D2:E2'); ws.merge_cells('D3:E3'); ws.merge_cells('D4:E4')
ws['D1'] = '="Réf. : "&' + AF + '$C$6'; ws['D2'] = '=' + LE('Date : ', 'Date: ') + '&IF(' + AF + '$C$7="","",TEXT(' + AF + '$C$7,"dd/mm/yyyy"))'
ws['D3'] = '=' + LE('Validité : ', 'Valid: ') + '&' + AF + '$F$9'; ws['D4'] = '=' + LE('Contact : ', 'Contact: ') + '&' + AF + '$F$6&IF(' + AF + '$F$7="","","  ·  "&' + AF + '$F$7)'
for r in (1, 2, 3, 4): ws[f'D{r}'].font = font(9 if r > 1 else 10, r == 1, MUTED if r > 1 else INK); ws[f'D{r}'].alignment = Alignment(horizontal='right', vertical='center')
ws.row_dimensions[6].height = 30
ws.merge_cells('B7:E7'); ws['B7'] = '=UPPER(' + LE('Dossier commercial', 'Commercial folder') + ')'; ws['B7'].font = font(10, True, CYAN); ws['B7'].alignment = Alignment(vertical='bottom')
ws.merge_cells('B8:E9')
ws['B8'] = '=UPPER(IF(' + AF + '$C$31="Commerciale",' + LE('Proposition commerciale', 'Commercial proposal') + ',' + LE('Proposition technique et commerciale', 'Technical and commercial proposal') + '))'
ws['B8'].font = font(26, True, BLUE); ws['B8'].alignment = Alignment(wrap_text=True, vertical='center')
ws.row_dimensions[8].height = 30; ws.row_dimensions[9].height = 30
for c in range(2, 6): ws.cell(10, c).fill = fill(CYAN)
ws.row_dimensions[10].height = 4; ws.row_dimensions[11].height = 16
for c1, c2, key in ((2, 3, 'CLIENT'), (4, 5, 'PROJET · PROJECT')):
    ws.merge_cells(start_row=12, start_column=c1, end_row=12, end_column=c2)
    ws.cell(12, c1).value = key; ws.cell(12, c1).font = font(9, True, 'FFFFFF'); ws.cell(12, c1).alignment = Alignment(indent=1, vertical='center')
    for k in (c1, c2): ws.cell(12, k).fill = fill(BLUE)
    ws.merge_cells(start_row=13, start_column=c1, end_row=14, end_column=c2)
    for rr in (13, 14):
        for k in (c1, c2): ws.cell(rr, k).fill = fill('DCE8F5')
ws['B13'] = '=""&' + AF + '$C$8'; ws['D13'] = '=IF(' + AF + '$C$32<>"",' + AF + '$C$32,' + AF + '$C$10)'
for ref in ('B13', 'D13'): ws[ref].font = font(15, True, NAVY); ws[ref].alignment = Alignment(wrap_text=True, vertical='center', indent=1)
ws.row_dimensions[12].height = 20; ws.row_dimensions[13].height = 24; ws.row_dimensions[14].height = 24; ws.row_dimensions[15].height = 16
ws.merge_cells('B16:E16'); ws['B16'] = '=UPPER(' + LE('Résumé du projet', 'Project summary') + ')'; ws['B16'].font = font(9, True, 'FFFFFF'); ws['B16'].alignment = Alignment(indent=1, vertical='center')
for c in range(2, 6): ws.cell(16, c).fill = fill(NAVY)
ws.row_dimensions[16].height = 20
def cell2(r, c1, c2, lab, val):
    for rr, v, f in ((r, lab, font(8, True, MUTED)), (r + 1, val, font(11, True, INK))):
        ws.merge_cells(start_row=rr, start_column=c1, end_row=rr, end_column=c2)
        ws.cell(rr, c1).value = v; ws.cell(rr, c1).font = f; ws.cell(rr, c1).alignment = Alignment(indent=1, vertical='bottom' if rr == r else 'top', wrap_text=True)
    for k in range(c1, c2 + 1): ws.cell(r + 1, k).border = Border(bottom=thin())
cell2(17, 2, 3, '=UPPER(' + LE('Type de prestation', 'Service type') + ')', '=""&' + AF + '$C$29')
cell2(17, 4, 5, '=UPPER(' + LE('Périmètre du contrat', 'Contract scope') + ')', '=""&' + AF + '$C$30')
cell2(19, 2, 3, '=UPPER(' + LE('Lieu', 'Location') + ')', '=""&' + AF + '$C$10')
cell2(19, 4, 5, '=UPPER(' + LE('Type de proposition', 'Proposal type') + ')', '=""&' + AF + '$C$31')
for r in (17, 19): ws.row_dimensions[r].height = 16
for r in (18, 20): ws.row_dimensions[r].height = 22
ws.row_dimensions[21].height = 14
ws.merge_cells('B22:E22'); ws['B22'] = '=UPPER(' + LE('Contenu du dossier', 'Folder contents') + ')'; ws['B22'].font = font(9, True, 'FFFFFF'); ws['B22'].alignment = Alignment(indent=1, vertical='center')
for c in range(2, 6): ws.cell(22, c).fill = fill(NAVY)
ws.row_dimensions[22].height = 20
DOCS = [(AF + '$F$29', 'Présentation de l’entreprise', 'Company presentation'), (AF + '$F$30', 'Nos engagements : politique QHSE et RSE', 'Our commitments: QHSE and CSR policy'),
        (AF + '$F$31', 'Certificat ISO 9001', 'ISO 9001 certificate'), (AF + '$F$32', 'Proposition technique', 'Technical proposal'), ('"Oui"', 'Proposition commerciale (devis)', 'Commercial proposal (quotation)')]
for i, (flag, fr, en) in enumerate(DOCS):
    r = 40 + i
    ws[f'G{r}'] = '=' + flag; ws[f'H{r}'] = '=' + LE(fr, en); ws[f'I{r}'] = f'=IF(G{r}="Oui",COUNTIF(G$40:G{r},"Oui"),"")'
    for col in 'GHI': ws[f'{col}{r}'].font = font(8, c='B8C4D2')
for k in range(1, 6):
    r = 22 + k; ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=5); ws.row_dimensions[r].height = 22
    ws[f'B{r}'] = f'=IFERROR("{k}     "&INDEX($H$40:$H$44,MATCH({k},$I$40:$I$44,0)),"")'
    ws[f'B{r}'].font = font(11.5, False, INK); ws[f'B{r}'].alignment = Alignment(indent=1, vertical='center')
    for c in range(2, 6): ws.cell(r, c).border = Border(bottom=thin())
ws.row_dimensions[28].height = 16
ws.merge_cells('B29:E29'); ws['B29'] = '=' + LE('Offre valable ', 'Offer valid for ') + '&' + AF + '$F$9&"   ·   Incoterm "&' + AF + '$F$10'
ws['B29'].font = font(10, True, BLUE); ws['B29'].fill = fill('EAF6FD'); ws['B29'].alignment = Alignment(indent=1, vertical='center'); ws.row_dimensions[29].height = 26
for c in range(2, 6): ws.cell(29, c).fill = fill('EAF6FD')
ws.merge_cells('B36:E36'); ws['B36'] = SOCIETE; ws['B36'].font = font(8, c=MUTED); ws['B36'].alignment = Alignment(horizontal='center', wrap_text=True); ws.row_dimensions[36].height = 28
ws.print_area = 'A1:F36'; ws.page_setup.orientation = 'portrait'; ws.page_setup.paperSize = 9; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 1
ws.sheet_properties.pageSetUpPr.fitToPage = True; ws.print_options.horizontalCentered = True
ws.column_dimensions['G'].hidden = False

for w in (wsA, wsM, wsO, wsL, wsX):
    w.page_setup.orientation = 'landscape'; w.page_setup.paperSize = 9; w.page_setup.fitToWidth = 1; w.page_setup.fitToHeight = 0
    w.sheet_properties.pageSetUpPr.fitToPage = True
wb.calculation.fullCalcOnLoad = True
wb.active = 0
wb.save(OUT)
print('ok', OUT)
