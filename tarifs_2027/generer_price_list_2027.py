"""Price List 2027 Enedril (Fishing) : tarif simple, 3 coefficients (Location / Maintenance / LIH) x 3 matières (Standard / Carbure / Insert), prêt pour un futur ERP.
Usage : python3 -I generer_price_list_2027.py <Fishing_Price_List_2026.xlsx> <Price_List_2027.xlsx>
4 onglets : Coefficients (tout se règle ici), Tarif_2027 (prix 2027), PL_2026 (base), Export_ERP (import ERP).
Les valeurs de coefficients fournies sont des EXEMPLES à confirmer (cases jaunes)."""
import sys,datetime
import openpyxl
from openpyxl.styles import Font,PatternFill,Alignment,Border,Side
from openpyxl.utils import get_column_letter as L
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule
SRC,OUT=sys.argv[1],sys.argv[2]
NAVY,ACCENT,YEL,GREYT="08203F","0A4FA0","FFF2CC","7F8C9B"
MATS=["Standard","Carbure","Insert"]
SEC_COL={"1":"2E75B6","2":"1F9E89","3":"C55A11","4":"7B5EA7","5":"B8860B","6":"3B8EA5","7":"A23B72","8":"5C7F3F","9":"6C757D"}
def tint(hexc,k=0.86):
    r,g,b=(int(hexc[i:i+2],16) for i in (0,2,4));return "%02X%02X%02X"%tuple(int(c+(255-c)*k) for c in (r,g,b))
line=Side(style="thin",color="E3E8EE");bot=Border(bottom=line)
F=lambda **k:Font(name="Calibri",**k)
def fill(c):return PatternFill("solid",fgColor=c)
# ---------- lecture de l'ancien tarif
ws0=openpyxl.load_workbook(SRC,data_only=True)["Inventaire & Tarifs 2026"]
rows=[];fam_prec={};last_sec=None
def matiere(sec,fam,typ):
    t=str(typ or "").strip().lower()
    if t in ("insert","inserts","tci"): return "Insert"
    if t in ("carbure","carbures","pdc","pmt"): return "Carbure"
    if t=="mt": return "Standard"
    if sec[:1] in ("2","3","5") and fam!="Ditch Magnet": return "Carbure"
    return "Standard"
for r in range(3,ws0.max_row+1):
    v=[ws0.cell(r,c).value for c in range(1,11)]
    if v[0] is None and v[1] is None and v[2] is None: continue
    sec,fam,des,typ,sb,op,uc,lih,ins,tail=v
    if not sec: sec=last_sec
    else: last_sec=sec
    if not fam: fam=fam_prec.get(sec)
    else: fam_prec[sec]=fam
    sec=str(sec).strip();fam=str(fam).strip()
    rows.append(dict(sec=sec,fam=fam,des=str(des).strip(),typ=typ,tail=tail,prix=[sb,op,uc,lih,ins],mat=matiere(sec,fam,typ)))
fams=[];seen=set()
for x in rows:
    k=(x["sec"],x["fam"])
    if k not in seen: seen.add(k);fams.append(k)
assert len({f for _,f in fams})==len(fams),"noms de famille en double"
secs=[];[secs.append(s) for s,_ in fams if s not in secs]
NR=len(rows)+1;NRT=len(rows)+1+len(secs)+len(fams)
wb=openpyxl.Workbook();co=wb.active;co.title="Coefficients";ta=wb.create_sheet("Tarif_2027");pl=wb.create_sheet("PL_2026");ex=wb.create_sheet("Export_ERP")
co.sheet_properties.tabColor=ACCENT;ta.sheet_properties.tabColor=NAVY;pl.sheet_properties.tabColor="BFC7D1";ex.sheet_properties.tabColor="BFC7D1"
for w in (co,ta,pl,ex): w.sheet_view.showGridLines=False
# ======== Coefficients
for c,w in zip("ABCDEFGHIJ",(2,40,13,13,15,15,12,3,26,14)): co.column_dimensions[c].width=w
co["B2"]="Price List 2027";co["B2"].font=F(size=24,bold=True,color=NAVY)
co["B3"]="Coefficients de l'année : tout se règle sur cette page. Les cases jaunes sont à renseigner (valeurs actuelles = exemples à confirmer).";co["B3"].font=F(italic=True,color="C00000")
for cell,txt,tgt in (("B4","Tarif 2027  →","Tarif_2027"),("C4","PL 2026  →","PL_2026"),("E4","Export ERP  →","Export_ERP")):
    co[cell]=txt;co[cell].hyperlink=f"#'{tgt}'!A1";co[cell].font=F(color="0563C1",underline="single",bold=True)
def label(cell,txt):
    co[cell]=txt;co[cell].font=F(size=12,bold=True,color=ACCENT)
label("B6","1   COEFFICIENTS DE L'ANNÉE");co["B7"]="Chaque prix est multiplié par le coefficient de son groupe de prix (ligne) et de sa matière (colonne).";co["B7"].font=F(color=GREYT)
for j,h in enumerate(["Groupe de prix"]+MATS):
    c=co.cell(9,2+j,h);c.font=F(bold=True,color="FFFFFF");c.fill=fill(NAVY);c.alignment=Alignment(horizontal="center" if j else "left",vertical="center",indent=0 if j else 1)
co.row_dimensions[9].height=26
GR=[("Location","Stand-by · Operating",(1.03,1.05,1.07)),("Maintenance","Utilisation charge · Inspection",(1.03,1.10,1.15)),("LIH","Valeur de remplacement",(1.04,1.12,1.18))]
for i,(g,d,vals) in enumerate(GR):
    r=10+i;co.row_dimensions[r].height=30
    c=co.cell(r,2,f"{g}   ");c.font=F(size=12,bold=True,color=NAVY);c.alignment=Alignment(vertical="center",indent=1,wrap_text=True)
    co.cell(r,2).value=f"{g}  ·  {d}"
    for j,v in enumerate(vals):
        x=co.cell(r,3+j,v);x.fill=fill(YEL);x.font=F(size=13,bold=True,color="C00000");x.number_format="0.000";x.alignment=Alignment(horizontal="center",vertical="center")
    for cc in range(2,6): co.cell(r,cc).border=bot
co["B14"]="Articles par matière";co["B14"].font=F(color=GREYT)
for j,m in enumerate(MATS):
    c=co.cell(14,3+j,f'=COUNTIF(Tarif_2027!$D$2:$D${NRT},"{m}")');c.alignment=Alignment(horizontal="center");c.font=F(color=GREYT)
label("I6","INFOS DU TARIF")
for i,(a,b) in enumerate([("Version","PL-2027-v1"),("Début de validité",datetime.date(2027,1,1)),("Devise","EUR"),("Arrondi (multiple de)",5)]):
    co.cell(7+i,9,a).font=F(color=GREYT);c=co.cell(7+i,10,b);c.fill=fill(YEL);c.font=F(bold=True,color="C00000");c.alignment=Alignment(horizontal="center")
co["J8"].number_format="dd/mm/yyyy"
label("B17","2   AJUSTEMENT PAR FAMILLE (facultatif)");co["B18"]="Facteur multiplié par le coefficient ci-dessus. 1,000 = pas d'ajustement. Ex. 1,020 = 2 % de plus pour cette famille.";co["B18"].font=F(color=GREYT)
for j,h in enumerate(["Famille","Facteur","Articles","LIH 2026","LIH 2027","Variation"]):
    c=co.cell(20,2+j,h);c.font=F(bold=True,color="FFFFFF");c.fill=fill(NAVY);c.alignment=Alignment(horizontal="center" if j else "left",indent=0 if j else 1)
FAMROW={};r=21
PL_C=f"PL_2026!$C$2:$C${NR}"
for sec in secs:
    col=SEC_COL.get(sec[:1],"6C757D")
    for cc in range(2,8): co.cell(r,cc).fill=fill(col)
    c=co.cell(r,2,sec.upper());c.font=F(bold=True,color="FFFFFF");c.alignment=Alignment(indent=1);r+=1
    for s_,f_ in fams:
        if s_!=sec: continue
        FAMROW[f_]=r
        c=co.cell(r,2,f_);c.fill=fill(tint(col));c.font=F(bold=True,color=NAVY);c.alignment=Alignment(indent=1)
        x=co.cell(r,3,1.0);x.fill=fill(YEL);x.number_format="0.000";x.font=F(bold=True,color="C00000");x.alignment=Alignment(horizontal="center")
        co.cell(r,4,f"=COUNTIF({PL_C},B{r})").alignment=Alignment(horizontal="center")
        co.cell(r,5,f"=SUMIFS(PL_2026!$J$2:$J${NR},{PL_C},B{r})").number_format="#,##0"
        co.cell(r,6,f"=SUMIFS(Tarif_2027!$H$2:$H${NRT},Tarif_2027!$K$2:$K${NRT},B{r})").number_format="#,##0"
        co.cell(r,7,f'=IF(E{r}=0,"",F{r}/E{r}-1)').number_format="0.0%"
        for cc in range(3,8): co.cell(r,cc).border=bot
        r+=1
FIRSTF=21;LASTF=r-1
co.cell(r+1,2,"TOTAL").font=F(bold=True,color=NAVY)
for cc in (4,5,6): c=co.cell(r+1,cc,f"=SUMIFS({L(cc)}{FIRSTF}:{L(cc)}{LASTF},$B{FIRSTF}:$B{LASTF},\"<>\")-SUMIFS({L(cc)}{FIRSTF}:{L(cc)}{LASTF},$C{FIRSTF}:$C{LASTF},\"\")") if False else co.cell(r+1,cc,f"=SUM({L(cc)}{FIRSTF}:{L(cc)}{LASTF})");c.number_format="#,##0";c.font=F(bold=True,color=NAVY)
co.cell(r+1,4).alignment=Alignment(horizontal="center")
co.cell(r+1,7,f'=IF(E{r+1}=0,"",F{r+1}/E{r+1}-1)').number_format="0.0%";co.cell(r+1,7).font=F(bold=True,color=NAVY)
co.conditional_formatting.add(f"G{FIRSTF}:G{LASTF}",CellIsRule(operator="greaterThan",formula=["0.08"],font=F(bold=True,color="C00000")))
FAMKEY=f"Coefficients!$B${FIRSTF}:$B${LASTF}";FAMFAC=f"Coefficients!$C${FIRSTF}:$C${LASTF}"
# ======== PL_2026 (base, à plat)
plh=["ID_Article","Section","Famille","Designation","Type","Detail_tailles","StandBy_2026","Operating_2026","UC_2026","LIH_2026","Inspection_2026"]
for i,h in enumerate(plh):
    c=pl.cell(1,1+i,h);c.font=F(bold=True,color="FFFFFF");c.fill=fill("7F8C9B");c.alignment=Alignment(horizontal="center",vertical="center",wrap_text=True)
pl.row_dimensions[1].height=30
# ======== Tarif_2027 (prix 2027 seuls, lignes de titre par section et par famille)
tah=["ID_Article","Designation","Detail_tailles","Matiere","StandBy","Operating","UC","LIH","Inspection","Variation_vs_2026","Famille"]
for i,h in enumerate(tah):
    c=ta.cell(1,1+i,h);c.font=F(bold=True,color="FFFFFF");c.fill=fill(NAVY);c.alignment=Alignment(horizontal="center" if i>2 else "left",vertical="center",wrap_text=True,indent=1 if i<3 else 0)
ta.row_dimensions[1].height=30
for c,w in zip("ABCDEFGHIJK",(15,44,46,12,12,12,12,12,12,15,2)): ta.column_dimensions[c].width=w
ta.column_dimensions["K"].hidden=True
famcode={k:i+1 for i,k in enumerate(fams)};cnt={};rowmap={};tr_=2;prev_sec=None;prev_fam=None
GROW={0:10,1:10,2:11,3:12,4:11}      # StandBy, Operating -> Location ; UC, Inspection -> Maintenance ; LIH -> LIH
for i,x in enumerate(rows):
    pr=2+i;k=(x["sec"],x["fam"]);cnt[k]=cnt.get(k,0)+1
    idn=f"ENE-{famcode[k]:03d}-{cnt[k]:03d}"
    for j,v in enumerate([idn,x["sec"],x["fam"],x["des"],x["typ"],x["tail"]]+x["prix"]): pl.cell(pr,1+j,v)
    for j in range(5): pl.cell(pr,7+j).number_format="#,##0"
    col=SEC_COL.get(x["sec"][:1],"6C757D")
    if x["sec"]!=prev_sec:
        for cc in range(1,11): ta.cell(tr_,cc).fill=fill(col)
        c=ta.cell(tr_,1,x["sec"].upper());c.font=F(bold=True,color="FFFFFF",size=12);c.alignment=Alignment(indent=1);ta.row_dimensions[tr_].height=24;tr_+=1;prev_sec=x["sec"];prev_fam=None
    if x["fam"]!=prev_fam:
        for cc in range(1,11): ta.cell(tr_,cc).fill=fill(tint(col))
        c=ta.cell(tr_,1,x["fam"]);c.font=F(bold=True,color=NAVY);c.alignment=Alignment(indent=1);ta.row_dimensions[tr_].height=20;tr_+=1;prev_fam=x["fam"]
    r=tr_;rowmap[i]=r;ta.row_dimensions[r].height=18
    ta.cell(r,1,f"=PL_2026!A{pr}").font=F(color=GREYT)
    ta.cell(r,2,f'=IF(PL_2026!D{pr}="","",PL_2026!D{pr})');ta.cell(r,3,f'=IF(PL_2026!F{pr}="","",PL_2026!F{pr})').font=F(color=GREYT)
    ta.cell(r,2).alignment=Alignment(indent=1)
    m=ta.cell(r,4,x["mat"]);m.alignment=Alignment(horizontal="center");m.font=F(color=ACCENT,bold=x["mat"]!="Standard")
    ta.cell(r,11,f"=PL_2026!C{pr}")
    fac=f"INDEX({FAMFAC},MATCH($K{r},{FAMKEY},0))"
    for j in range(5):
        src=f"PL_2026!{L(7+j)}{pr}";g=GROW[j]
        coef=f"INDEX(Coefficients!$C${g}:$E${g},MATCH($D{r},Coefficients!$C$9:$E$9,0))*{fac}"
        c=ta.cell(r,5+j,f'=IF({src}="","",ROUND({src}*{coef}/Coefficients!$J$10,0)*Coefficients!$J$10)');c.number_format="#,##0";c.alignment=Alignment(horizontal="right")
    ta.cell(r,10,f'=IFERROR(SUM(E{r}:I{r})/SUM(PL_2026!G{pr}:K{pr})-1,"")').number_format="0.0%"
    for cc in range(1,11): ta.cell(r,cc).border=bot
    tr_+=1
assert tr_-1==NRT,(tr_,NRT)
dvm=DataValidation(type="list",formula1='"Standard,Carbure,Insert"',allow_blank=True);ta.add_data_validation(dvm);dvm.add(f"D2:D{NRT}")
ta.conditional_formatting.add(f"J2:J{NRT}",CellIsRule(operator="greaterThan",formula=["0.08"],font=F(bold=True,color="C00000")))
ta.freeze_panes="B2";ta.auto_filter.ref=f"A1:J{NRT}"
for c,w in zip(range(1,12),(14,26,26,36,10,46,12,12,12,12,12)): pl.column_dimensions[L(c)].width=w
pl.freeze_panes="E2";pl.auto_filter.ref=f"A1:K{NR}"
# ======== Export_ERP (format long)
eh=["ID_Article","Type_prix","Prix_EUR","Debut_validite","Fin_validite","Devise","Version_tarif","Section","Famille","Designation","Detail_tailles"]
for i,h in enumerate(eh):
    c=ex.cell(1,1+i,h);c.font=F(bold=True,color="FFFFFF");c.fill=fill("7F8C9B")
CODES=["STANDBY_DAY","OPERATING_DAY","USAGE_CHARGE","LIH","INSPECTION"]
r=2
for i in range(len(rows)):
    tr=rowmap[i];pr=2+i
    for j,code in enumerate(CODES):
        ex.cell(r,1,f"=Tarif_2027!A{tr}");ex.cell(r,2,code);ex.cell(r,3,f"=Tarif_2027!{L(5+j)}{tr}")
        ex.cell(r,4,"=Coefficients!$J$8").number_format="yyyy-mm-dd";ex.cell(r,6,"=Coefficients!$J$9");ex.cell(r,7,"=Coefficients!$J$7")
        ex.cell(r,8,f"=PL_2026!B{pr}");ex.cell(r,9,f"=PL_2026!C{pr}");ex.cell(r,10,f"=PL_2026!D{pr}");ex.cell(r,11,f"=PL_2026!F{pr}")
        r+=1
for c,w in zip("ABCDEFGHIJK",(14,16,11,14,12,8,13,24,24,34,44)): ex.column_dimensions[c].width=w
ex.freeze_panes="A2";ex.auto_filter.ref=f"A1:K{r-1}"
wb.calculation.fullCalcOnLoad=True
wb.save(OUT);print("ok",OUT,len(rows),"articles",len(fams),"familles")
