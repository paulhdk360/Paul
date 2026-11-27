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

# code couleur (demande de la direction) : chantier = bleu, base = vert, T (voyage) = jaune, TW = orange, absences = gris
PAL = {"OPS": "BDD7EE", "Voyage": "FFE699", "TW": "F4B183", "Base": "C6E0B4", "Absence": "E7E6E6", "À vérifier": "FFD966"}
STRONG = {"OPS": "2E75B6", "Voyage": "BF9000", "TW": "C55A11", "Base": "548235", "Absence": "7F7F7F"}
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
for c in (1, 2): cal.cell(5, c).font = hdr; cal.cell(5, c).fill = hfill
for c in range(8, 8 + NDAYS):
    for r in (2, 3, 4): cal.cell(r, c).font = Font(size=8, bold=(r == 2), color=BLUE)
cal.freeze_panes = "H6"
_rng = f"H{FIRST_ROW}:{L(8 + NDAYS - 1)}{LAST_ROW + 2}"
for cat_, key in (("OPS", "OPS"), ("Voyage", "Voyage"), ("TW", "TW"), ("Base", "Base"), ("Absence", "Absence")):
    cal.conditional_formatting.add(_rng, FormulaRule(formula=[f'IFERROR(INDEX(Codes!$B$2:$B${NCODES + 1},MATCH(H{FIRST_ROW},Codes!$A$2:$A${NCODES + 1},0)),"")="{cat_}"'], fill=PatternFill("solid", bgColor=PAL[key])))

# ---------- Codes
cod["A1"], cod["B1"], cod["C1"], cod["D1"] = "Code (tel qu'écrit dans le calendrier)", "Catégorie", "Libellé chantier (facultatif)", "Cases en 2026"
for c in "ABCD": cod[c + "1"].font = hdr; cod[c + "1"].fill = hfill
for i, k in enumerate(codes):
    r = 2 + i
    cod.cell(r, 1, k); cod.cell(r, 2, cat(k)); cod.cell(r, 4, cnt26[k])
    cod.cell(r, 2).fill = PatternFill("solid", fgColor=PAL[cat(k)])
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
paie["M6"] = "À vérifier"; paie["N6"] = "=SUM(AB9:AB68)"
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
# ---------- Calc2 : les 5 chantiers les plus travaillés de chaque personne, avec leurs jours T et TW rattachés
NCH = 5; ADJ0 = 30
o2c = lambda row: f"Calc!${L(C2)}{row}:${L(C2 + NCODES - 1)}{row}"
heads2 = ["Ligne cal."]
for k in range(1, NCH + 1): heads2 += [f"pos {k}", f"code {k}", f"OPS {k}", f"T {k}", f"TW {k}"]
for i, h in enumerate(heads2): calc2.cell(1, 1 + i, h).font = Font(bold=True)
for j in range(NCODES): calc2.cell(1, ADJ0 + j, f"=Calc!{L(C2 + j)}1")
for i, R in enumerate(range(FIRST_ROW, LAST_ROW + 3)):
    row = R0 + i
    rc = f"INDEX(CALENDRIER!$A{R}:$ZZ{R},MDebut):INDEX(CALENDRIER!$A{R}:$ZZ{R},MDebut+MNb-1)"
    ra = f"INDEX(Attrib!$A{R}:$ZZ{R},MDebut):INDEX(Attrib!$A{R}:$ZZ{R},MDebut+MNb-1)"
    calc2.cell(row, 1, R)
    for j in range(NCODES):   # jours par code, départagés (égalités) par un infime écart propre à chaque code
        calc2.cell(row, ADJ0 + j, f"=IF(Calc!{L(C2 + j)}{row}>0,Calc!{L(C2 + j)}{row}+({NCODES}-{j})/1000000,0)")
    adj = f"${L(ADJ0)}{row}:${L(ADJ0 + NCODES - 1)}{row}"
    for k in range(1, NCH + 1):
        b0 = 2 + (k - 1) * 5; P_, C_, O_, T_, W_ = (L(b0 + x) for x in range(5))
        calc2.cell(row, b0, f"=IF(LARGE({adj},{k})>0,MATCH(LARGE({adj},{k}),{adj},0),0)")
        calc2.cell(row, b0 + 1, f'=IF({P_}{row}=0,"",INDEX(Codes!$A$2:$A${NCODES + 1},{P_}{row}))')
        calc2.cell(row, b0 + 2, f"=IF({P_}{row}=0,0,INDEX({o2c(row)},{P_}{row}))")
        calc2.cell(row, b0 + 3, f'=IF(OR({C_}{row}="",MDebut=0),0,SUMPRODUCT(({ra}={C_}{row})*({rc}="T")))')
        calc2.cell(row, b0 + 4, f'=IF(OR({C_}{row}="",MDebut=0),0,SUMPRODUCT(({ra}={C_}{row})*({rc}="TW")))')
calc2.freeze_panes = "B2"; calc2.sheet_properties.tabColor = "A0A0A0"

# ---------- PAIE : tableau (une ligne par personne : jusqu'à 5 chantiers avec OPS, T et TW ; base ; code couleur)
H = 7
NB = 4 * NCH                                   # colonnes des blocs chantier : C à V
cBASE, cABS, cAUT, cTN, cWN, cCHK, cN = 3 + NB, 4 + NB, 5 + NB, 6 + NB, 7 + NB, 8 + NB, 9 + NB     # W X Y Z AA AB AC
NL = L(cN)
cols = ["Nom", "Statut"]
for k in range(1, NCH + 1): cols += [f"Chantier {k}", "OPS", "T\n(bonus)", "TW\n(½ bonus)"]
cols += ["Base", "Absences\n(CP, off)", "Autres chantiers\n(OPS)", "T non rattachés", "TW non rattachés", "Cases à vérifier", "n°"]
catcol = {}
for k in range(NCH):
    b = 3 + 4 * k; catcol[b] = "OPS"; catcol[b + 1] = "OPS"; catcol[b + 2] = "Voyage"; catcol[b + 3] = "TW"
catcol[cBASE] = "Base"; catcol[cABS] = "Absence"
for i, h in enumerate(cols):
    c = paie.cell(H, 1 + i, h); c.font = Font(name="Calibri", bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor=STRONG.get(catcol.get(1 + i), NAVY)); c.alignment = Alignment(wrap_text=True, horizontal="center", vertical="center"); c.border = box
paie.cell(H, cN).font = Font(size=8, color="A0A0A0"); paie.cell(H, cN).fill = PatternFill(fill_type=None)
paie.row_dimensions[H].height = 48
# légende du code couleur
paie["A6"] = "Code couleur :"; paie["A6"].font = Font(bold=True, color=NAVY)
for cell_, txt_, key_ in (("B6", "Chantier", "OPS"), ("C6", "Base", "Base"), ("E6", "T bonus", "Voyage"), ("F6", "TW ½ bonus", "TW")):
    paie[cell_] = txt_; paie[cell_].fill = PatternFill("solid", fgColor=PAL[key_]); paie[cell_].font = Font(bold=True, size=9); paie[cell_].alignment = Alignment(horizontal="center"); paie[cell_].border = box
paie.cell(8, 1, "TOTAL")
for col in [3 + 4 * k + o for k in range(NCH) for o in (1, 2, 3)] + [cBASE, cABS, cAUT, cTN, cWN, cCHK]:
    paie.cell(8, col, f"=SUM({L(col)}9:{L(col)}68)")
for c in range(1, cCHK + 1):
    cl = paie.cell(8, c); cl.font = Font(bold=True, color=NAVY); cl.fill = PatternFill("solid", fgColor=PAL.get(catcol.get(c), "D5ECFA")); cl.border = box; cl.alignment = Alignment(horizontal="center" if c > 2 else "left")
CODES = f"Codes!$A$2:$A${NCODES + 1}"; LAB = f"Codes!$C$2:$C${NCODES + 1}"
for n in range(1, 61):
    r = 8 + n
    ix = lambda col: f"INDEX(Calc!${col}${R0}:${col}${CEND},${NL}{r})"
    i2 = lambda col: f"INDEX(Calc2!${col}${R0}:${col}${CEND},${NL}{r})"
    paie.cell(r, cN, f"=IFERROR(MATCH({n},Calc!$K${R0}:$K${CEND},0),0)")
    paie.cell(r, 1, f'=IF(${NL}{r}=0,"",{ix("B")})'); paie.cell(r, 2, f'=IF(${NL}{r}=0,"",{ix("C")})')
    for k in range(NCH):
        b0 = 2 + k * 5; P_, C_, O_, T_, W_ = (L(b0 + x) for x in range(5)); pc = 3 + 4 * k
        cc = L(pc)
        paie.cell(r, pc, f'=IF(OR(${NL}{r}=0,{i2(O_)}=0),"",{i2(C_)}&IF(INDEX({LAB},{i2(P_)})="",""," – "&INDEX({LAB},{i2(P_)})))')
        paie.cell(r, pc + 1, f'=IF(${NL}{r}=0,"",IF({cc}{r}="","",{i2(O_)}))')
        paie.cell(r, pc + 2, f'=IF(${NL}{r}=0,"",IF({cc}{r}="","",{i2(T_)}))')
        paie.cell(r, pc + 3, f'=IF(${NL}{r}=0,"",IF({cc}{r}="","",{i2(W_)}))')
    paie.cell(r, cBASE, f'=IF(${NL}{r}=0,"",{ix("G")})'); paie.cell(r, cABS, f'=IF(${NL}{r}=0,"",{ix("H")})')
    oc = [L(3 + 4 * k + 1) for k in range(NCH)]; tc = [L(3 + 4 * k + 2) for k in range(NCH)]; wc = [L(3 + 4 * k + 3) for k in range(NCH)]
    paie.cell(r, cAUT, f'=IF(${NL}{r}=0,"",{ix("I")}' + "".join(f"-N({c}{r})" for c in oc) + ")")
    paie.cell(r, cTN, f'=IF(${NL}{r}=0,"",{ix("E")}' + "".join(f"-N({c}{r})" for c in tc) + ")")
    paie.cell(r, cWN, f'=IF(${NL}{r}=0,"",{ix("F")}' + "".join(f"-N({c}{r})" for c in wc) + ")")
    paie.cell(r, cCHK, f'=IF(${NL}{r}=0,"",{ix("D")}-{ix("E")}-{ix("F")}-{ix("G")}-{ix("H")}-{ix("I")})')
    for c in range(1, cCHK + 1):
        cell = paie.cell(r, c); cell.border = box
        if c in catcol: cell.fill = PatternFill("solid", fgColor=PAL[catcol[c]])
        if c > 2 and not (c in catcol and catcol[c] == "OPS" and (c - 3) % 4 == 0): cell.alignment = Alignment(horizontal="center")
    paie.cell(r, cN).font = Font(size=8, color="A0A0A0")
paie.conditional_formatting.add(f"{L(cCHK)}9:{L(cCHK)}68", CellIsRule(operator="greaterThan", formula=["0"], fill=PatternFill("solid", bgColor="FFD966"), font=Font(bold=True, color="7A4B00")))
paie.conditional_formatting.add(f"{L(cAUT)}9:{L(cWN)}68", CellIsRule(operator="greaterThan", formula=["0"], font=Font(bold=True, color="C00000")))
widths = {1: 26, 2: 11}
for k in range(NCH): b = 3 + 4 * k; widths.update({b: 17, b + 1: 6, b + 2: 8, b + 3: 10})
widths.update({cBASE: 7, cABS: 10, cAUT: 12, cTN: 11, cWN: 11, cCHK: 10, cN: 5})
for c_, w_ in widths.items(): paie.column_dimensions[L(c_)].width = w_
paie.freeze_panes = "C9"; paie.sheet_view.showGridLines = False
paie.sheet_properties.tabColor = BLUE

# ---------- Mode d'emploi
lines = ["MODE D'EMPLOI — Jours par mois pour la paie (démonstration)", "",
 "1. Feuille PAIE : choisir le mois (liste) et l'année. Une ligne par personne ayant travaillé dans le mois :",
 "   • Jusqu'à 5 chantiers, du plus au moins travaillé du mois : OPS = jours de chantier, T = jours de voyage (bonus), TW = jours TW (½ bonus). Les blocs inutilisés restent vides.",
 "   • Base = jours « base »     • Absences = CP, off     • Autres chantiers (OPS) = jours de chantier au-delà des 5 chantiers affichés",
 "   • T / TW non rattachés = T ou TW qui ne tombent sur aucun des 5 chantiers affichés (ex. T du 31 qui prépare un chantier du mois suivant).",
 "   • Cases à vérifier = cases remplies dont le code n'est pas connu (visas, notes, code à classer) : jamais comptées dans les totaux.",
 "   • Aucun jour n'est compté deux fois : chantier, base, T et TW sont des catégories séparées.",
 "   • CODE COULEUR (PAIE, CALENDRIER et Codes) : chantier = bleu, base = vert, T = jaune, TW = orange, absences = gris. Dans le calendrier la couleur suit la catégorie de la feuille Codes : un nouveau code prend sa couleur tout seul.",
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
