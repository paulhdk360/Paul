"""Démo « jours par mois » pour la paie (demande de Stéphanie, via Fabien) : SANS macro, uniquement des formules.
À partir du fichier EN COURS (onglet CALENDRIER), construit un classeur de démonstration indépendant :
  PAIE (choix du mois -> voyage, OPS, TW, base, 2 chantiers par personne), Codes (catégorie de chaque code, modifiable),
  Calc (calculs), CALENDRIER (copie réduite : noms, statuts et jours 2026 uniquement, sans téléphones ni mails), Mode d'emploi.
Usage : python3 generer_demo_paie.py <EN_COURS_MTG.xlsx> <sortie.xlsx>"""
import sys, collections, datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter as L, column_index_from_string as CI
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from openpyxl.workbook.defined_name import DefinedName

SRC, OUT = sys.argv[1], sys.argv[2]
src = openpyxl.load_workbook(SRC)["CALENDRIER"]
FIRST_ROW, LAST_ROW = 6, 108
c0 = CI("BES")                                   # 1er janvier 2026 dans le fichier d'origine
NDAYS = 365
NCODES = 130
MONTHS = ["JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"]

# ---------- codes : tous les codes courts du calendrier, avec une catégorie proposée
cnt = collections.Counter(); cnt26 = collections.Counter()
for r in range(FIRST_ROW, LAST_ROW + 1):
    for c in range(36, src.max_column + 1):
        v = src.cell(r, c).value
        if v is None: continue
        v = str(v).strip()
        if not v or len(v) > 18 or any(ch in v for ch in "?*~"): continue
        cnt[v] += 1
        if c >= c0: cnt26[v] += 1
codes = [k for k, n in cnt.most_common() if n >= 2 or cnt26[k] >= 1][:NCODES]
VOY, TWC, BASE = {"T"}, {"TW"}, {"base"}
ABS = {"CP", "off", "FIN"}
OPS = {"DRC", "PSG", "KEM", "GGR", "GLCR", "SPPE", "SD", "DUG", "GCTM", "CHA", "GGAR", "GMX", "ALF", "MEU", "MAL", "DRA", "MON", "ASB", "VLT", "MTG", "IPC",
       "TOU", "BDX", "Kem1", "MdM", "CS29", "ROC", "CLU", "MOU", "CZX", "CLU1", "CHM", "CAM", "VML", "CHAD", "DEN", "DSTR"}
def cat(k):
    if k in VOY: return "Voyage"
    if k in TWC: return "TW"
    if k in BASE: return "Base"
    if k in ABS: return "Absence"
    if k in OPS: return "OPS"
    return "À vérifier"
codes.sort(key=lambda k: (["Voyage", "TW", "Base", "Absence", "OPS", "À vérifier"].index(cat(k)), -cnt[k]))

NAVY, BLUE, SKY, LIGHT = "08203F", "0A4FA0", "0083CB", "EAF3FB"
hdr = Font(name="Calibri", bold=True, color="FFFFFF"); hfill = PatternFill("solid", fgColor=NAVY)
thin = Side(style="thin", color="D5DEE8"); box = Border(left=thin, right=thin, top=thin, bottom=thin)
wb = openpyxl.Workbook()
paie = wb.active; paie.title = "PAIE"
cod = wb.create_sheet("Codes"); calc = wb.create_sheet("Calc"); calc2 = wb.create_sheet("Calc2"); att = wb.create_sheet("Attrib"); cal = wb.create_sheet("CALENDRIER"); aide = wb.create_sheet("Mode d'emploi")

# ---------- CALENDRIER (copie réduite)
cal["A1"] = "Copie réduite pour la démonstration (noms, statuts et jours 2026). Dans le vrai fichier : onglet CALENDRIER d'origine."
cal["A5"], cal["B5"] = "Opérateurs", "Statut"
colors = {"T": "FFE699", "TW": "F8CBAD", "base": "D9D9D9", "CP": "FFF2CC", "off": "EDEDED"}
for d in range(NDAYS):
    c = 8 + d; sc = c0 + d
    for r in (2, 3, 4):
        v = src.cell(r, sc).value
        if v is not None and not (r == 2 and False): cal.cell(r, c, v)
    cal.column_dimensions[L(c)].width = 4.2
cal.column_dimensions["A"].width = 26; cal.column_dimensions["B"].width = 11
for r in range(FIRST_ROW, LAST_ROW + 1):
    name = src.cell(r, 1).value
    if name is None: continue
    cal.cell(r, 1, name); cal.cell(r, 2, src.cell(r, 2).value)
    for d in range(NDAYS):
        v = src.cell(r, c0 + d).value
        if v is not None and str(v).strip():
            cell = cal.cell(r, 8 + d, v); cell.alignment = Alignment(horizontal="center"); cell.font = Font(size=8)
            k = str(v).strip()
            if k in colors: cell.fill = PatternFill("solid", fgColor=colors[k])
for c in (1, 2): cal.cell(5, c).font = hdr; cal.cell(5, c).fill = hfill
for c in range(8, 8 + NDAYS):
    for r in (2, 3, 4): cal.cell(r, c).font = Font(size=8, bold=(r == 2), color=BLUE)
cal.freeze_panes = "H6"

# ---------- Codes
cod["A1"], cod["B1"], cod["C1"], cod["D1"] = "Code (tel qu'écrit dans le calendrier)", "Catégorie", "Libellé chantier (facultatif)", "Cases en 2026"
for c in "ABCD": cod[c + "1"].font = hdr; cod[c + "1"].fill = hfill
for i, k in enumerate(codes):
    r = 2 + i
    cod.cell(r, 1, k); cod.cell(r, 2, cat(k)); cod.cell(r, 4, cnt26[k])
    cod.cell(r, 2).fill = PatternFill("solid", fgColor={"OPS": "DDEBF7", "Voyage": "FFE699", "TW": "F8CBAD", "Base": "E2E2E2", "Absence": "FFF2CC", "À vérifier": "FFD966"}[cat(k)])
dv = DataValidation(type="list", formula1='"OPS,Voyage,TW,Base,Absence,À vérifier"', allow_blank=True); cod.add_data_validation(dv); dv.add(f"B2:B{NCODES + 1}")
cod.column_dimensions["A"].width = 34; cod.column_dimensions["B"].width = 14; cod.column_dimensions["C"].width = 34; cod.column_dimensions["D"].width = 14
cod["F1"] = "Comment ça marche"; cod["F1"].font = Font(bold=True, color=BLUE)
for i, t in enumerate(["OPS = code d'un chantier : jour de chantier.", "Voyage = « T » : jour de voyage, compté en bonus (1 jour). TW : jour de travail pendant le déplacement, compté en ½ bonus.", "Base = travail à l'atelier. Absence = congés, off. Aucun jour n'est compté deux fois : OPS, base, T, TW sont 4 catégories séparées.",
                       "« À vérifier » : code dont le sens n'est pas confirmé (compté à part, jamais dans les totaux).", "Ajouter un code : le taper dans la 1re case libre de la colonne A, choisir sa catégorie.",
                       "Les textes libres du calendrier (visas, notes) qui ne sont pas dans cette liste sont comptés dans « Cases à vérifier » de la feuille PAIE."]):
    cod.cell(2 + i, 6, t)
cod.freeze_panes = "A2"

# ---------- PAIE : paramètres
paie["A1"] = "Jours par mois pour la paie"; paie["A1"].font = Font(size=18, bold=True, color=NAVY)
paie["A2"] = "Choisir le mois et l'année dans les cases bleues : tout se met à jour. Sans macro."; paie["A2"].font = Font(italic=True, color="51647A")
paie["A3"], paie["A4"] = "Mois", "Année"
paie["B3"], paie["B4"] = "NOVEMBRE", 2026
for a in ("B3", "B4"): paie[a].fill = PatternFill("solid", fgColor="D5ECFA"); paie[a].font = Font(bold=True, size=12, color=BLUE); paie[a].border = box; paie[a].alignment = Alignment(horizontal="center")
dvm = DataValidation(type="list", formula1='"' + ",".join(MONTHS) + '"', allow_blank=False); paie.add_data_validation(dvm); dvm.add("B3")
dvy = DataValidation(type="whole", operator="between", formula1="2020", formula2="2100"); paie.add_data_validation(dvy); dvy.add("B4")
paie["D3"] = "Période"; paie["E3"] = '=IF(N4=0,"",TEXT(DATE(B4,MATCH(B3,{"' + '","'.join(MONTHS) + '"},0),1),"dd/mm/yyyy")&" au "&TEXT(DATE(B4,MATCH(B3,{"' + '","'.join(MONTHS) + '"},0)+1,0),"dd/mm/yyyy")&"  ("&N5&" jours)")'
paie["D4"] = "Contrôle"
paie["E4"] = '=IF(N4=0,"⚠ Ce mois n\'existe pas dans le calendrier.",IF(N6>0,"⚠ "&N6&" case(s) à vérifier : voir la dernière colonne et la feuille Codes.","OK : tous les codes du mois sont reconnus."))'
for a in ("D3", "D4"): paie[a].font = Font(bold=True, color=NAVY)
# technique (colonnes M:N)
paie["M2"] = "technique"; paie["M3"] = "Libellé"; paie["N3"] = '=B3&" "&B4'
paie["M4"] = "1re colonne"; paie["N4"] = "=IFERROR(MATCH(N3,CALENDRIER!$A$2:$ZZ$2,0),0)"
paie["M5"] = "Nb jours"; paie["N5"] = "=DAY(DATE(B4,MATCH(B3,{\"" + '","'.join(MONTHS) + "\"},0)+1,0))"
paie["M6"] = "À vérifier"; paie["N6"] = "=SUM(P9:P68)"
for r in range(2, 7):
    for c in "MN": paie[f"{c}{r}"].font = Font(size=8, color="A0A0A0")
wb.defined_names["MDebut"] = DefinedName("MDebut", attr_text="PAIE!$N$4")
wb.defined_names["MNb"] = DefinedName("MNb", attr_text="PAIE!$N$5")

# ---------- Calc
C1 = 16; C2 = C1 + NCODES + 1                      # bloc 1 : comptes bruts par code ; bloc 2 : comptes OPS seulement
last1, last2 = L(C1 + NCODES - 1), L(C2 + NCODES - 1)
heads = ["Ligne cal.", "Nom", "Statut", "Cases remplies", "Voyage", "TW", "Base", "Absence", "OPS (chantier)", "Actif", "Rang", "Chantier 1 (jours)", "Chantier 1 (pos.)", "Chantier 2 (jours)", "Chantier 2 (pos.)"]
for i, h in enumerate(heads): calc.cell(1, 1 + i, h)
calc.cell(2, 2, "catégorie →")
for j in range(NCODES):
    calc.cell(1, C1 + j, f"=IF(Codes!A{2 + j}=\"\",\"\",Codes!A{2 + j})")
    calc.cell(2, C1 + j, f"=IF(Codes!A{2 + j}=\"\",\"\",Codes!B{2 + j})")
    calc.cell(1, C2 + j, f"={L(C1 + j)}1"); calc.cell(2, C2 + j, f"={L(C1 + j)}2")
R0 = 3
for i, R in enumerate(range(FIRST_ROW, LAST_ROW + 3)):
    row = R0 + i
    rng = f"INDEX(CALENDRIER!$A{R}:$ZZ{R},MDebut):INDEX(CALENDRIER!$A{R}:$ZZ{R},MDebut+MNb-1)"
    calc.cell(row, 1, R)
    calc.cell(row, 2, f'=IF(CALENDRIER!$A{R}="","",CALENDRIER!$A{R})')
    calc.cell(row, 3, f'=IF(B{row}="","",CALENDRIER!$B{R}&"")')
    calc.cell(row, 4, f'=IF(OR(B{row}="",MDebut=0),0,SUMPRODUCT(--(LEN(TRIM({rng}))>0)))')
    cnts = f"{L(C1)}{row}:{last1}{row}"; cats = f"${L(C1)}$2:${last1}$2"
    for col, name in ((5, "Voyage"), (6, "TW"), (7, "Base"), (8, "Absence"), (9, "OPS")):
        calc.cell(row, col, f'=SUMPRODUCT(({cats}="{name}")*{cnts})')
    calc.cell(row, 10, f"=IF(E{row}+F{row}+G{row}+I{row}>0,1,0)")
    calc.cell(row, 11, f'=IF(J{row}=1,SUM(J${R0}:J{row}),"")')
    o2 = f"{L(C2)}{row}:{last2}{row}"
    calc.cell(row, 12, f"=MAX({o2})")
    calc.cell(row, 13, f"=IF(L{row}=0,0,MATCH(L{row},{o2},0))")
    calc.cell(row, 14, f"=IF(COUNT({o2})<2,0,LARGE({o2},2))")
    calc.cell(row, 15, f"=IF(N{row}=0,0,IF(N{row}=L{row},IF(M{row}>=100,0,M{row}+IFERROR(MATCH(N{row},INDEX({o2},M{row}+1):{last2}{row},0),0)),MATCH(N{row},{o2},0)))")
    for j in range(NCODES):
        c1 = L(C1 + j)
        calc.cell(row, C1 + j, f'=IF(OR($B{row}="",{c1}$1="",MDebut=0),0,IFERROR(COUNTIF({rng},{c1}$1),0))')
        calc.cell(row, C2 + j, f'=IF({c1}$2="OPS",{c1}{row},0)')
CEND = R0 + (LAST_ROW + 2 - FIRST_ROW)
for c in range(1, 16): calc.cell(1, c).font = Font(bold=True)
calc.freeze_panes = "C3"; calc.sheet_properties.tabColor = "A0A0A0"

# ---------- Attrib : chantier auquel est rattaché chaque jour T / TW (chantier du lendemain s'il y en a un, sinon celui de la veille)
CATR = lambda ref: f'IFERROR(INDEX(Codes!$B$2:$B${NCODES + 1},MATCH({ref},Codes!$A$2:$A${NCODES + 1},0)),"")'
att["A1"] = "Rattachement des jours T / TW à un chantier (même disposition que CALENDRIER). Règle : le chantier du lendemain s'il y en a un, sinon celui de la veille."
for R in range(FIRST_ROW, LAST_ROW + 3):
    if src.cell(R, 1).value is None: continue
    for d in range(NDAYS):
        c = 8 + d; X = f"CALENDRIER!{L(c)}{R}"; Y = f"CALENDRIER!{L(c + 1)}{R}"; Wp = f"CALENDRIER!{L(c - 1)}{R}"
        att.cell(R, c, f'=IF(OR({X}="T",{X}="TW"),IF({CATR(Y)}="OPS",{Y},IF({CATR(Wp)}="OPS",{Wp},"")),"")')
att.sheet_properties.tabColor = "A0A0A0"
# ---------- Calc2 : T et TW par chantier (chantier 1 et chantier 2 de chaque personne)
for i, h in enumerate(["Ligne cal.", "Code chantier 1", "Code chantier 2", "T chantier 1", "TW chantier 1", "T chantier 2", "TW chantier 2"]): calc2.cell(1, 1 + i, h).font = Font(bold=True)
for i, R in enumerate(range(FIRST_ROW, LAST_ROW + 3)):
    row = R0 + i
    rc = f"INDEX(CALENDRIER!$A{R}:$ZZ{R},MDebut):INDEX(CALENDRIER!$A{R}:$ZZ{R},MDebut+MNb-1)"
    ra = f"INDEX(Attrib!$A{R}:$ZZ{R},MDebut):INDEX(Attrib!$A{R}:$ZZ{R},MDebut+MNb-1)"
    calc2.cell(row, 1, R)
    calc2.cell(row, 2, f'=IF(Calc!L{row}=0,"",INDEX(Codes!$A$2:$A${NCODES + 1},Calc!M{row}))')
    calc2.cell(row, 3, f'=IF(Calc!N{row}=0,"",INDEX(Codes!$A$2:$A${NCODES + 1},Calc!O{row}))')
    for col, code, kind in ((4, "B", "T"), (5, "B", "TW"), (6, "C", "T"), (7, "C", "TW")):
        calc2.cell(row, col, f'=IF(OR({code}{row}="",MDebut=0),0,SUMPRODUCT(({ra}={code}{row})*({rc}="{kind}")))')
calc2.freeze_panes = "B2"; calc2.sheet_properties.tabColor = "A0A0A0"

# ---------- PAIE : tableau (une ligne par personne : chantier 1, chantier 2, base ; T et TW rattachés à leur chantier)
H = 7
cols = ["Nom", "Statut", "Chantier 1", "OPS", "T\n(bonus)", "TW\n(½ bonus)", "Chantier 2", "OPS", "T\n(bonus)", "TW\n(½ bonus)", "Base", "Absences\n(CP, off)", "Autres chantiers\n(OPS)", "T non rattachés\n(autres chantiers)", "TW non rattachés\n(autres chantiers)", "Cases à vérifier", "n°"]
for i, h in enumerate(cols):
    c = paie.cell(H, 1 + i, h); c.font = hdr; c.fill = hfill; c.alignment = Alignment(wrap_text=True, horizontal="center", vertical="center"); c.border = box
paie.cell(H, 17).font = Font(size=8, color="A0A0A0"); paie.cell(H, 17).fill = PatternFill(fill_type=None)
for col in (3, 4, 5, 6):
    paie.cell(H, col).fill = PatternFill("solid", fgColor=BLUE)
for col in (7, 8, 9, 10):
    paie.cell(H, col).fill = PatternFill("solid", fgColor=SKY)
paie.row_dimensions[H].height = 48
paie.cell(8, 1, "TOTAL")
for col in (4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16):
    paie.cell(8, col, f"=SUM({L(col)}9:{L(col)}68)")
for c in range(1, 17):
    paie.cell(8, c).font = Font(bold=True, color=NAVY); paie.cell(8, c).fill = PatternFill("solid", fgColor="D5ECFA"); paie.cell(8, c).border = box; paie.cell(8, c).alignment = Alignment(horizontal="center" if c > 2 else "left")
CODES = f"Codes!$A$2:$A${NCODES + 1}"; LAB = f"Codes!$C$2:$C${NCODES + 1}"
def chant(pos):
    return (f'=IF(OR($Q{{r}}=0,INDEX(Calc!${pos[0]}${R0}:${pos[0]}${CEND},$Q{{r}})=0),"",INDEX({CODES},INDEX(Calc!${pos[1]}${R0}:${pos[1]}${CEND},$Q{{r}}))'
            f'&IF(INDEX({LAB},INDEX(Calc!${pos[1]}${R0}:${pos[1]}${CEND},$Q{{r}}))="",""," – "&INDEX({LAB},INDEX(Calc!${pos[1]}${R0}:${pos[1]}${CEND},$Q{{r}}))))')
for n in range(1, 61):
    r = 8 + n
    ix = lambda col: f"INDEX(Calc!${col}${R0}:${col}${CEND},$Q{r})"
    i2 = lambda col: f"INDEX(Calc2!${col}${R0}:${col}${CEND},$Q{r})"
    paie.cell(r, 17, f"=IFERROR(MATCH({n},Calc!$K${R0}:$K${CEND},0),0)")
    paie.cell(r, 1, f'=IF($Q{r}=0,"",{ix("B")})'); paie.cell(r, 2, f'=IF($Q{r}=0,"",{ix("C")})')
    paie.cell(r, 3, chant(("L", "M")).format(r=r)); paie.cell(r, 4, f'=IF($Q{r}=0,"",IF(C{r}="","",{ix("L")}))')
    paie.cell(r, 5, f'=IF($Q{r}=0,"",IF(C{r}="","",{i2("D")}))'); paie.cell(r, 6, f'=IF($Q{r}=0,"",IF(C{r}="","",{i2("E")}))')
    paie.cell(r, 7, chant(("N", "O")).format(r=r)); paie.cell(r, 8, f'=IF($Q{r}=0,"",IF(G{r}="","",{ix("N")}))')
    paie.cell(r, 9, f'=IF($Q{r}=0,"",IF(G{r}="","",{i2("F")}))'); paie.cell(r, 10, f'=IF($Q{r}=0,"",IF(G{r}="","",{i2("G")}))')
    paie.cell(r, 11, f'=IF($Q{r}=0,"",{ix("G")})'); paie.cell(r, 12, f'=IF($Q{r}=0,"",{ix("H")})')
    paie.cell(r, 13, f'=IF($Q{r}=0,"",{ix("I")}-N(D{r})-N(H{r}))')
    paie.cell(r, 14, f'=IF($Q{r}=0,"",{ix("E")}-N(E{r})-N(I{r}))'); paie.cell(r, 15, f'=IF($Q{r}=0,"",{ix("F")}-N(F{r})-N(J{r}))')
    paie.cell(r, 16, f'=IF($Q{r}=0,"",{ix("D")}-{ix("E")}-{ix("F")}-{ix("G")}-{ix("H")}-{ix("I")})')
    for c in range(1, 17):
        cell = paie.cell(r, c); cell.border = box
        if c > 2 and c not in (3, 7): cell.alignment = Alignment(horizontal="center")
    paie.cell(r, 17).font = Font(size=8, color="A0A0A0")
paie.conditional_formatting.add("A9:P68", FormulaRule(formula=['AND($A9<>"",MOD(ROW(),2)=0)'], fill=PatternFill("solid", bgColor="F3F8FC")))
paie.conditional_formatting.add("P9:P68", CellIsRule(operator="greaterThan", formula=["0"], fill=PatternFill("solid", bgColor="FFD966"), font=Font(bold=True, color="7A4B00")))
paie.conditional_formatting.add("M9:O68", CellIsRule(operator="greaterThan", formula=["0"], fill=PatternFill("solid", bgColor="FCE4D6")))
for c, w in zip("ABCDEFGHIJKLMNOPQ", (26, 11, 20, 7, 9, 11, 20, 7, 9, 11, 8, 11, 13, 15, 15, 11, 5)): paie.column_dimensions[c].width = w
paie.freeze_panes = "C9"; paie.sheet_view.showGridLines = False
paie.sheet_properties.tabColor = BLUE

# ---------- Mode d'emploi
lines = ["MODE D'EMPLOI — Jours par mois pour la paie (démonstration)", "",
 "1. Feuille PAIE : choisir le mois (liste) et l'année. Une ligne par personne ayant travaillé dans le mois, comme demandé par Fabien :",
 "   • Chantier 1 (le plus travaillé du mois) : OPS = jours de chantier, T = jours de voyage (bonus), TW = jours TW (½ bonus)",
 "   • Chantier 2 (le suivant) : mêmes colonnes     • Base = jours « base »     • Absences = CP, off",
 "   • Autres chantiers (OPS) = jours de chantier au-delà des deux chantiers affichés ; T / TW non rattachés = ceux qui ne tombent sur aucun des deux chantiers affichés.",
 "   • Cases à vérifier = cases remplies dont le code n'est pas connu (visas, notes, code à classer) : jamais comptées dans les totaux.",
 "   • Aucun jour n'est compté deux fois : chantier, base, T et TW sont des catégories séparées.",
 "2. Feuille Codes : donne la catégorie de chaque code. Un code nouveau ? Le taper en bas de la colonne A et choisir sa catégorie.",
 "3. Aucune macro : tout est calculé par formules, le fichier reste un .xlsx.", "",
 "À SAVOIR",
 "• Un jour T ou TW est rattaché au chantier du LENDEMAIN s'il y en a un, sinon à celui de la VEILLE (feuille Attrib). Exemple : « T » après 15 jours de CS29 = T de CS29 ; « TW » juste avant GMX = TW de GMX. Un T isolé reste « non rattaché ».",
 "• Les jours de base ne sont pas rattachés à un chantier.",
 "• Un jour est compté une fois par case. Les samedis et dimanches sont comptés comme les autres jours.",
 "• Les codes D et N (équipes jour et nuit ?) et les codes de formation sont classés « À vérifier » en attendant confirmation.",
 "", "INTÉGRATION DANS LE VRAI FICHIER (SharePoint)",
 "1. Faire une copie de sauvegarde du fichier EN COURS. Travailler avec Excel sur ordinateur (pas Excel en ligne : il ne copie pas de feuilles entre classeurs).",
 "2. Ouvrir EN COURS depuis SharePoint (« Ouvrir dans l'application ») et cette démo, les deux ouverts en même temps.",
 "3. Dans la démo : clic droit sur l'onglet PAIE > Déplacer ou copier > Classeur de destination : EN COURS > cocher « Créer une copie ». Refaire pour Codes, Calc, Calc2, Attrib puis Mode d'emploi.",
 "4. Données > Modifier les liens > Changer la source : choisir le fichier EN COURS lui-même. Les formules lisent alors son vrai onglet CALENDRIER (le lien vers la démo disparaît).",
 "5. Ctrl+H (classeur entier, dans les formules) : remplacer $ZZ par $CZZ. Le vrai calendrier va jusqu'à la colonne BSS et au-delà, la démo s'arrêtait à ZZ.",
 "6. Contrôle : choisir un mois sur PAIE, la case « Contrôle » doit afficher OK. Comparer 2 ou 3 personnes avec le calendrier à la main.",
 "7. Les lignes lues vont de la ligne 6 à la ligne 110 du calendrier. Si le tableau gagne des lignes, étendre les formules de Calc, Calc2 et Attrib vers le bas.",
 "8. Chaque nouvelle année ajoute des colonnes au calendrier : la plage $CZZ laisse de la marge. Un mois s'identifie par son libellé de la ligne 2 (ex. « NOVEMBRE 2026 »), à garder tel quel.",
 "9. Le nom de la feuille doit rester CALENDRIER. Les feuilles PAIE, Codes, Calc, Calc2 et Attrib ne modifient jamais le calendrier : elles ne font que le lire."]
for i, t in enumerate(lines):
    aide.cell(1 + i, 1, t); aide.cell(1 + i, 1).font = Font(bold=(i == 0 or t.isupper() and t), size=14 if i == 0 else 11, color=NAVY if i == 0 else "000000")
aide.column_dimensions["A"].width = 150; aide.sheet_view.showGridLines = False
wb.save(OUT)
print("ok", OUT, len(codes), "codes")
