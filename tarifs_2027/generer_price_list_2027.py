"""Price List 2027 Enedril (Fishing) : tarif normalisé, 3 coefficients (Location / Maintenance / LIH) par famille, prêt pour un futur ERP.
Usage : python3 -I generer_price_list_2027.py <Fishing_Price_List_2026.xlsx> <Price_List_2027.xlsx>
3 onglets : Coefficients (tout se règle ici), Tarif_2027 (article par article), Export_ERP (format d'import).
Les valeurs de coefficients fournies sont des EXEMPLES à confirmer (cellules jaunes)."""
import sys,datetime
import openpyxl
from openpyxl.styles import Font,PatternFill,Alignment,Border,Side
from openpyxl.utils import get_column_letter as L
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule,FormulaRule
SRC,OUT=sys.argv[1],sys.argv[2]
NAVY,BLUE,YEL="08203F","0A4FA0","FFF2CC"
GROUPS=["Location","Maintenance","LIH"]
STRONG={"Location":NAVY,"Maintenance":NAVY,"LIH":NAVY}
PALE={"Location":"EAF3FB","Maintenance":"EAF3FB","LIH":"EAF3FB"}
MID={"Location":"BDD7EE","Maintenance":"F8CBAD","LIH":"C6E0B4"}
SECPAL=["FFF2CC","DDEBF7","E2EFDA","FCE4D6","EDE7F6","E0F2F1","FFF9C4","F3E5F5","ECEFF1"]
thin=Side(style="thin",color="D5DEE8");box=Border(left=thin,right=thin,top=thin,bottom=thin)
white=Font(name="Calibri",bold=True,color="FFFFFF");inp=PatternFill("solid",fgColor=YEL);inpf=Font(color="C00000",bold=True)
def head(c,fill=NAVY,wrap=True):
    c.font=white;c.fill=PatternFill("solid",fgColor=fill);c.alignment=Alignment(horizontal="center",vertical="center",wrap_text=wrap);c.border=box
# ---------- lecture de l'ancien tarif
ws0=openpyxl.load_workbook(SRC,data_only=True)["Inventaire & Tarifs 2026"]
rows=[];fam_prec={};last_sec=None
for r in range(3,ws0.max_row+1):
    v=[ws0.cell(r,c).value for c in range(1,11)]
    if v[0] is None and v[1] is None and v[2] is None: continue
    sec,fam,des,typ,sb,op,uc,lih,ins,tail=v
    if not sec: sec=last_sec
    else: last_sec=sec
    sub=isinstance(des,str) and des.strip().startswith("↳")
    if not fam: fam=fam_prec.get(sec)
    else: fam_prec[sec]=fam
    rows.append(dict(sec=str(sec).strip(),fam=str(fam).strip(),des=str(des).strip(),sub="Oui" if sub else "Non",typ=typ,tail=tail,prix=[sb,op,uc,lih,ins]))
fams=[];seen=set()
for x in rows:
    k=(x["sec"],x["fam"])
    if k not in seen: seen.add(k);fams.append(k)
CARBURE_SECTIONS=("2 ","3 ","5 ");STANDARD_EXC={"Ditch Magnet"}
A_CONFIRMER={"WO Shoe":"Sabot de washover : habillage carbure ? à confirmer","PKR Milling Tool":"Fraisage de packer (section Repêchage) : carbure ? à confirmer"}
PRIX=[("Stand-by (€/jour)","STANDBY_DAY","Location"),("Operating (€/jour)","OPERATING_DAY","Location"),("Utilisation charge (€)","USAGE_CHARGE","Maintenance"),("LIH (€)","LIH","LIH"),("Inspection (€)","INSPECTION","Maintenance")]
wb=openpyxl.Workbook();co=wb.active;co.title="Coefficients";ta=wb.create_sheet("Tarif_2027");pl=wb.create_sheet("PL_2026");ex=wb.create_sheet("Export_ERP")
co.sheet_properties.tabColor=BLUE;ta.sheet_properties.tabColor=NAVY;pl.sheet_properties.tabColor="A6A6A6";ex.sheet_properties.tabColor="A6A6A6"
NR=len(rows)+1;NF=len(fams)
NSEC=len({x['sec'] for x in rows});NRT=len(rows)+1+NSEC+NF     # Tarif_2027 : lignes d'articles + 1 ligne de titre par section et par famille
# ---------- onglet Coefficients
co["A1"]="PRICE LIST 2027 — COEFFICIENTS";co["A1"].font=Font(size=18,bold=True,color=NAVY)
co["A2"]="Tout se règle sur cette page : 3 coefficients (Location, Maintenance, LIH), selon la famille. Les cases jaunes sont à renseigner ; les valeurs actuelles sont des EXEMPLES à confirmer.";co["A2"].font=Font(italic=True,color="C00000")
co["A3"]="→ Tarif 2027";co["A3"].hyperlink="#'Tarif_2027'!A1";co["A3"].font=Font(color="0563C1",underline="single",bold=True)
co["B3"]="→ PL 2026 (base)";co["B3"].hyperlink="#'PL_2026'!A1";co["B3"].font=Font(color="0563C1",underline="single",bold=True)
co["C3"]="→ Export ERP";co["C3"].hyperlink="#'Export_ERP'!A1";co["C3"].font=Font(color="0563C1",underline="single",bold=True)
def band(r,txt):
    for c in range(1,14): co.cell(r,c).fill=PatternFill("solid",fgColor=NAVY)
    co.cell(r,1,txt).font=white
band(5,"1 · INFOS DU TARIF")
for i,(a,b) in enumerate([("Version du tarif","PL-2027-v1"),("Début de validité",datetime.date(2027,1,1)),("Devise","EUR")]):
    co.cell(6+i,1,a).font=Font(bold=True);c=co.cell(6+i,2,b);c.fill=inp;c.font=inpf;c.border=box;c.alignment=Alignment(horizontal="center")
co["B7"].number_format="dd/mm/yyyy"
band(10,"2 · COEFFICIENTS PAR DÉFAUT (famille Standard / famille Carbure)")
for i,h in enumerate(["Groupe de prix","Standard","Carbure","Prix concernés (modifiable en 3)"]): head(co.cell(11,1+i,h),NAVY)
DEF={"Location":(1.03,1.05),"Maintenance":(1.03,1.10),"LIH":(1.04,1.12)}
DESC={"Location":"Stand-by et Operating (jours de location)","Maintenance":"Maintenance : utilisation charge et inspection","LIH":"LIH : valeur de remplacement"}
for i,g in enumerate(GROUPS):
    r=12+i;c=co.cell(r,1,g);c.font=white;c.fill=PatternFill("solid",fgColor=STRONG[g]);c.border=box
    for j,v in enumerate(DEF[g]):
        x=co.cell(r,2+j,v);x.fill=inp;x.font=inpf;x.number_format="0.000";x.border=box;x.alignment=Alignment(horizontal="center")
    co.cell(r,4,DESC[g]).font=Font(color="51647A")
band(16,"3 · COLONNES DE PRIX : groupe de coefficient et arrondi")
for i,h in enumerate(["Colonne de prix","Code ERP","Groupe de coefficient","Arrondi (pas en €)"]): head(co.cell(17,1+i,h),NAVY)
for i,(n,code,g) in enumerate(PRIX):
    r=18+i;co.cell(r,1,n).border=box;co.cell(r,2,code).border=box
    for col,val in ((3,g),(4,5)):
        c=co.cell(r,col,val);c.fill=inp;c.font=inpf;c.border=box;c.alignment=Alignment(horizontal="center")
dvg=DataValidation(type="list",formula1='"Location,Maintenance,LIH"',allow_blank=False);co.add_data_validation(dvg);dvg.add("C18:C22")
for g in GROUPS:
    co.conditional_formatting.add("A18:A22",FormulaRule(formula=[f'$C18="{g}"'],fill=PatternFill("solid",bgColor=PALE[g])))
band(24,"4 · COEFFICIENTS PAR FAMILLE (laisser « Forcé » vide pour garder le coefficient par défaut)")
co["A25"]="Catégorie « Carbure » = fraisage, élargissage, coupe (plaquettes, cutters). Pour une famille précise, saisir un coefficient dans « Forcé » : il remplace le défaut.";co["A25"].font=Font(italic=True,color="51647A")
T0=27
heads=[("Section",NAVY),("Famille",NAVY),("Catégorie",NAVY),("Location\\nforcé",NAVY),("Location\\nappliqué",NAVY),("Maintenance\\nforcé",NAVY),("Maintenance\\nappliqué",NAVY),("LIH\\nforcé",NAVY),("LIH\\nappliqué",NAVY),("Nb\\narticles",NAVY),("LIH 2026\\n(somme)",NAVY),("LIH 2027\\n(somme)",NAVY),("Variation\\nLIH",NAVY)]
for i,(h,f) in enumerate(heads): head(co.cell(T0,1+i,h.replace("\\n","\n")),f)
co.row_dimensions[T0].height=34
rg=lambda col:f"Tarif_2027!${col}$2:${col}${NRT}"
rp=lambda col:f"PL_2026!${col}$2:${col}${NR}"
for i,(sec,fam) in enumerate(fams):
    r=T0+1+i;carb=sec.startswith(CARBURE_SECTIONS) and fam not in STANDARD_EXC
    co.cell(r,1,sec);co.cell(r,2,fam)
    c=co.cell(r,3,"Carbure" if carb else "Standard");c.fill=inp;c.font=inpf;c.alignment=Alignment(horizontal="center")
    for k,g in enumerate(GROUPS):
        fcol=4+2*k;acol=5+2*k;mr=12+k
        x=co.cell(r,fcol);x.fill=inp;x.number_format="0.000";x.alignment=Alignment(horizontal="center")
        y=co.cell(r,acol,f'=IF({L(fcol)}{r}<>"",{L(fcol)}{r},IF($C{r}="Carbure",$C${mr},$B${mr}))');y.number_format="0.000";y.font=Font(bold=True);y.fill=PatternFill("solid",fgColor=PALE[g]);y.alignment=Alignment(horizontal="center")
    co.cell(r,10,f'=COUNTIFS({rg("B")},$A{r},{rg("C")},$B{r})').alignment=Alignment(horizontal="center")
    co.cell(r,11,f'=SUMIFS({rp("J")},{rp("B")},$A{r},{rp("C")},$B{r})').number_format="#,##0"
    co.cell(r,12,f'=SUMIFS({rg("J")},{rg("B")},$A{r},{rg("C")},$B{r})').number_format="#,##0"
    co.cell(r,13,f'=IF(K{r}=0,"",L{r}/K{r}-1)').number_format="0.0%"
    for cc in range(1,14): co.cell(r,cc).border=box
    n=A_CONFIRMER.get(fam)
    if n: co.cell(r,14,n).font=Font(italic=True,color="C00000")
last=T0+NF;tr=last+1
co.cell(tr,1,"TOTAL").font=Font(bold=True)
for col in (10,11,12): co.cell(tr,col,f"=SUM({L(col)}{T0+1}:{L(col)}{last})").number_format="#,##0";co.cell(tr,col).font=Font(bold=True)
co.cell(tr,13,f'=IF(K{tr}=0,"",L{tr}/K{tr}-1)').number_format="0.0%";co.cell(tr,13).font=Font(bold=True)
dvc=DataValidation(type="list",formula1='"Carbure,Standard"',allow_blank=False);co.add_data_validation(dvc);dvc.add(f"C{T0+1}:C{last}")
co.conditional_formatting.add(f"C{T0+1}:C{last}",CellIsRule(operator="equal",formula=['"Carbure"'],fill=PatternFill("solid",bgColor="F4B183")))
co.conditional_formatting.add(f"M{T0+1}:M{last}",CellIsRule(operator="greaterThan",formula=["0.08"],fill=PatternFill("solid",bgColor="FCE4D6")))
for c,w in zip("ABCDEFGHIJKLMN",(36,28,14,13,13,14,14,12,12,10,14,14,11,55)): co.column_dimensions[c].width=w
co.sheet_view.showGridLines=False;co.auto_filter.ref=f"A{T0}:M{last}"
# ---------- onglet PL_2026 (base : le tarif 2026 d'origine, à plat) et Tarif_2027 (uniquement les prix 2027)
plh=["ID_Article","Section","Famille","Designation","Type","Detail_tailles","StandBy_2026","Operating_2026","UC_2026","LIH_2026","Inspection_2026"]
for i,h in enumerate(plh): head(pl.cell(1,1+i,h),"7F7F7F")
tah=["ID_Article","Section","Famille","Designation","Type","Detail_tailles","StandBy","Operating","UC","LIH","Inspection","Variation_vs_2026","Index_famille"]
for i,h in enumerate(tah): head(ta.cell(1,1+i,h),NAVY)
famcode={k:i+1 for i,k in enumerate(fams)};cnt={}
FR=f"Coefficients!$A${T0+1}:$A${last}";FB=f"Coefficients!$B${T0+1}:$B${last}"
rowmap={};tr_=2;prev_sec=None;prev_fam=None
for i,x in enumerate(rows):
    pr=2+i;k=(x["sec"],x["fam"]);cnt[k]=cnt.get(k,0)+1
    idn=f"ENE-{famcode[k]:03d}-{cnt[k]:03d}"
    vals=[idn,x["sec"],x["fam"],x["des"],x["typ"],x["tail"]]+x["prix"]
    for j,v in enumerate(vals): pl.cell(pr,1+j,v)
    for j in range(5): pl.cell(pr,7+j).number_format="#,##0"
    if x["sec"]!=prev_sec:        # ligne de titre de section (marine)
        for cc in range(1,13): ta.cell(tr_,cc).fill=PatternFill("solid",fgColor=NAVY)
        ta.cell(tr_,1,x["sec"].upper()).font=Font(bold=True,color="FFFFFF",size=12);ta.row_dimensions[tr_].height=22
        tr_+=1;prev_sec=x["sec"];prev_fam=None
    if x["fam"]!=prev_fam:        # ligne de titre de famille (bleu clair)
        for cc in range(1,13): ta.cell(tr_,cc).fill=PatternFill("solid",fgColor="D9E7F5")
        ta.cell(tr_,1,x["fam"]).font=Font(bold=True,color=NAVY)
        tr_+=1;prev_fam=x["fam"]
    r=tr_;rowmap[i]=r
    for j in range(6): ta.cell(r,1+j,f'=IF(PL_2026!{L(1+j)}{pr}="","",PL_2026!{L(1+j)}{pr})')
    ta.cell(r,13,f'=MATCH(1,INDEX(({FR}=B{r})*({FB}=C{r}),0),0)')
    for j in range(5):
        src=f"PL_2026!{L(7+j)}{pr}";gr=f"Coefficients!$C${18+j}";step=f"Coefficients!$D${18+j}"
        cl=lambda kk:f"INDEX(Coefficients!${L(5+2*kk)}${T0+1}:${L(5+2*kk)}${last},$M{r})"
        coef=f'IF({gr}="Location",{cl(0)},IF({gr}="Maintenance",{cl(1)},{cl(2)}))'
        c=ta.cell(r,7+j,f'=IF({src}="","",ROUND({src}*{coef}/{step},0)*{step})');c.number_format="#,##0"
    ta.cell(r,12,f'=IFERROR(SUM(G{r}:K{r})/SUM(PL_2026!G{pr}:K{pr})-1,"")').number_format="0.0%"
    tr_+=1
assert tr_-1==NRT,(tr_,NRT)
for c,w in zip(range(1,14),(14,26,26,36,10,46,12,12,12,12,12,16,8)): ta.column_dimensions[L(c)].width=w
for c,w in zip(range(1,12),(14,26,26,36,10,46,12,12,12,12,12)): pl.column_dimensions[L(c)].width=w
ta.column_dimensions["M"].hidden=True
for sh in (ta,pl): sh.freeze_panes="E2";sh.row_dimensions[1].height=30
ta.auto_filter.ref=f"A1:L{NRT}";pl.auto_filter.ref=f"A1:K{NR}"
ta.conditional_formatting.add(f"L2:L{NRT}",CellIsRule(operator="greaterThan",formula=["0.08"],font=Font(bold=True,color="C00000")))
# ---------- onglet Export_ERP (format long)
eh=["ID_Article","Type_prix","Prix_EUR","Debut_validite","Fin_validite","Devise","Version_tarif","Section","Famille","Designation","Detail_tailles"]
for i,h in enumerate(eh): head(ex.cell(1,1+i,h),"595959")
r=2
for i in range(len(rows)):
    tr=rowmap[i]
    for j in range(5):
        ex.cell(r,1,f"=Tarif_2027!A{tr}");ex.cell(r,2,f"=Coefficients!B{18+j}");ex.cell(r,3,f"=Tarif_2027!{L(7+j)}{tr}")
        ex.cell(r,4,"=Coefficients!$B$7").number_format="yyyy-mm-dd";ex.cell(r,6,"=Coefficients!$B$8");ex.cell(r,7,"=Coefficients!$B$6")
        ex.cell(r,8,f"=Tarif_2027!B{tr}");ex.cell(r,9,f"=Tarif_2027!C{tr}");ex.cell(r,10,f"=Tarif_2027!D{tr}");ex.cell(r,11,f"=Tarif_2027!F{tr}")
        r+=1
for c,w in zip("ABCDEFGHIJK",(14,16,11,14,12,8,13,24,24,34,44)): ex.column_dimensions[c].width=w
ex.freeze_panes="A2";ex.auto_filter.ref=f"A1:K{r-1}"
wb.calculation.fullCalcOnLoad=True
wb.save(OUT);print("ok",OUT,len(rows),"articles",NF,"familles")
