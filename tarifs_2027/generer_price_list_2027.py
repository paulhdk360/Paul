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
STRONG={"Location":"2E75B6","Maintenance":"C55A11","LIH":"548235"}
PALE={"Location":"DDEBF7","Maintenance":"FCE4D6","LIH":"E2EFDA"}
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
wb=openpyxl.Workbook();co=wb.active;co.title="Coefficients";ta=wb.create_sheet("Tarif_2027");ex=wb.create_sheet("Export_ERP")
co.sheet_properties.tabColor=BLUE;ta.sheet_properties.tabColor="548235";ex.sheet_properties.tabColor="7F7F7F"
NR=len(rows)+1;NF=len(fams)
# ---------- onglet Coefficients
co["A1"]="PRICE LIST 2027 — COEFFICIENTS";co["A1"].font=Font(size=18,bold=True,color=NAVY)
co["A2"]="Tout se règle sur cette page : 3 coefficients (Location, Maintenance, LIH), selon la famille. Les cases jaunes sont à renseigner ; les valeurs actuelles sont des EXEMPLES à confirmer.";co["A2"].font=Font(italic=True,color="C00000")
co["A3"]="→ Voir le tarif article par article";co["A3"].hyperlink="#'Tarif_2027'!A1";co["A3"].font=Font(color="0563C1",underline="single",bold=True)
co["D3"]="→ Export pour l'ERP";co["D3"].hyperlink="#'Export_ERP'!A1";co["D3"].font=Font(color="0563C1",underline="single",bold=True)
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
heads=[("Section",NAVY),("Famille",NAVY),("Catégorie",NAVY),("Location\\nforcé",STRONG["Location"]),("Location\\nappliqué",STRONG["Location"]),("Maintenance\\nforcé",STRONG["Maintenance"]),("Maintenance\\nappliqué",STRONG["Maintenance"]),("LIH\\nforcé",STRONG["LIH"]),("LIH\\nappliqué",STRONG["LIH"]),("Nb\\narticles",NAVY),("LIH 2026\\n(somme)",NAVY),("LIH 2027\\n(somme)",NAVY),("Variation\\nLIH",NAVY)]
for i,(h,f) in enumerate(heads): head(co.cell(T0,1+i,h.replace("\\n","\n")),f)
co.row_dimensions[T0].height=34
rg=lambda col:f"Tarif_2027!${col}$2:${col}${NR}"
for i,(sec,fam) in enumerate(fams):
    r=T0+1+i;carb=sec.startswith(CARBURE_SECTIONS) and fam not in STANDARD_EXC
    co.cell(r,1,sec);co.cell(r,2,fam)
    c=co.cell(r,3,"Carbure" if carb else "Standard");c.fill=inp;c.font=inpf;c.alignment=Alignment(horizontal="center")
    for k,g in enumerate(GROUPS):
        fcol=4+2*k;acol=5+2*k;mr=12+k
        x=co.cell(r,fcol);x.fill=inp;x.number_format="0.000";x.alignment=Alignment(horizontal="center")
        y=co.cell(r,acol,f'=IF({L(fcol)}{r}<>"",{L(fcol)}{r},IF($C{r}="Carbure",$C${mr},$B${mr}))');y.number_format="0.000";y.font=Font(bold=True);y.fill=PatternFill("solid",fgColor=PALE[g]);y.alignment=Alignment(horizontal="center")
    co.cell(r,10,f'=COUNTIFS({rg("B")},$A{r},{rg("C")},$B{r})').alignment=Alignment(horizontal="center")
    co.cell(r,11,f'=SUMIFS({rg("L")},{rg("B")},$A{r},{rg("C")},$B{r})').number_format="#,##0"
    co.cell(r,12,f'=SUMIFS({rg("T")},{rg("B")},$A{r},{rg("C")},$B{r})').number_format="#,##0"
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
# ---------- onglet Tarif_2027
th=[("ID_Article",NAVY),("Section",NAVY),("Famille",NAVY),("Categorie",NAVY),("Designation",NAVY),("Sous_ensemble",NAVY),("Type",NAVY),("Detail_tailles",NAVY)]
for i,(h,f) in enumerate(th): head(ta.cell(1,1+i,h),f)
P26=9;CF=14;P27=17     # colonnes : prix 2026 I..M ; coefficients N..P ; prix 2027 Q..U
nm=["StandBy","Operating","UC","LIH","Inspection"]
for j in range(5):
    head(ta.cell(1,P26+j,f"{nm[j]}_2026"),"7F7F7F");head(ta.cell(1,P27+j,f"{nm[j]}_2027"),NAVY)
for k,g in enumerate(GROUPS): head(ta.cell(1,CF+k,f"Coef_{g}"),STRONG[g])
head(ta.cell(1,22,"Variation_moyenne"),NAVY)
famcode={k:i+1 for i,k in enumerate(fams)};cnt={}
FR=f"Coefficients!$A${T0+1}:$A${last}";FB=f"Coefficients!$B${T0+1}:$B${last}"
for i,x in enumerate(rows):
    r=2+i;k=(x["sec"],x["fam"]);cnt[k]=cnt.get(k,0)+1
    ta.cell(r,1,f"ENE-{famcode[k]:03d}-{cnt[k]:03d}");ta.cell(r,2,x["sec"]);ta.cell(r,3,x["fam"])
    mt=f"MATCH(1,INDEX(({FR}=B{r})*({FB}=C{r}),0),0)"
    ta.cell(r,4,f'=INDEX(Coefficients!$C${T0+1}:$C${last},{mt})').alignment=Alignment(horizontal="center")
    ta.cell(r,5,x["des"]);ta.cell(r,6,x["sub"]);ta.cell(r,7,x["typ"]);ta.cell(r,8,x["tail"])
    for j,p in enumerate(x["prix"]): ta.cell(r,P26+j,p).number_format="#,##0"
    for kk,g in enumerate(GROUPS):
        ta.cell(r,CF+kk,f'=INDEX(Coefficients!${L(5+2*kk)}${T0+1}:${L(5+2*kk)}${last},{mt})').number_format="0.000"
        ta.cell(r,CF+kk).alignment=Alignment(horizontal="center");ta.cell(r,CF+kk).fill=PatternFill("solid",fgColor=PALE[g])
    for j in range(5):
        src=f"{L(P26+j)}{r}";gr=f"Coefficients!$C${18+j}";step=f"Coefficients!$D${18+j}"
        coef=f'IF({gr}="Location",${L(CF)}{r},IF({gr}="Maintenance",${L(CF+1)}{r},${L(CF+2)}{r}))'
        ta.cell(r,P27+j,f'=IF({src}="","",ROUND({src}*{coef}/{step},0)*{step})').number_format="#,##0"
    ta.cell(r,22,f'=IFERROR(SUM({L(P27)}{r}:{L(P27+4)}{r})/SUM({L(P26)}{r}:{L(P26+4)}{r})-1,"")').number_format="0.0%"
for c,w in zip(range(1,23),(14,24,24,11,34,13,9,44,13,13,13,13,13,15,17,12,13,13,13,13,13,13)): ta.column_dimensions[L(c)].width=w
ta.row_dimensions[1].height=34
ta.freeze_panes="F2";ta.auto_filter.ref=f"A1:V{NR}"
for kk,g in enumerate(GROUPS):   # couleurs des colonnes de prix : suivent le groupe choisi dans Coefficients
    for j in range(5):
        for base,pal in ((P26,PALE),(P27,MID)):
            col=L(base+j)
            ta.conditional_formatting.add(f"{col}2:{col}{NR}",FormulaRule(formula=[f'Coefficients!$C${18+j}="{g}"'],fill=PatternFill("solid",bgColor=pal[g])))
        ta.conditional_formatting.add(f"{L(P27+j)}1",FormulaRule(formula=[f'Coefficients!$C${18+j}="{g}"'],fill=PatternFill("solid",bgColor=STRONG[g])))
        ta.conditional_formatting.add(f"{L(P26+j)}1",FormulaRule(formula=[f'Coefficients!$C${18+j}="{g}"'],fill=PatternFill("solid",bgColor=STRONG[g])))
for n,colr in enumerate(SECPAL):   # une couleur pale par section
    ta.conditional_formatting.add(f"A2:H{NR}",FormulaRule(formula=[f'LEFT($B2,1)="{n+1}"'],fill=PatternFill("solid",bgColor=colr)))
ta.conditional_formatting.add(f"V2:V{NR}",CellIsRule(operator="greaterThan",formula=["0.08"],font=Font(bold=True,color="C00000")))
# ---------- onglet Export_ERP (format long)
eh=["ID_Article","Type_prix","Prix_EUR","Debut_validite","Fin_validite","Devise","Version_tarif","Section","Famille","Designation","Detail_tailles"]
for i,h in enumerate(eh): head(ex.cell(1,1+i,h),"595959")
r=2
for i in range(len(rows)):
    tr=2+i
    for j in range(5):
        ex.cell(r,1,f"=Tarif_2027!A{tr}");ex.cell(r,2,f"=Coefficients!B{18+j}");ex.cell(r,3,f"=Tarif_2027!{L(P27+j)}{tr}")
        ex.cell(r,4,"=Coefficients!$B$7").number_format="yyyy-mm-dd";ex.cell(r,6,"=Coefficients!$B$8");ex.cell(r,7,"=Coefficients!$B$6")
        ex.cell(r,8,f"=Tarif_2027!B{tr}");ex.cell(r,9,f"=Tarif_2027!C{tr}");ex.cell(r,10,f"=Tarif_2027!E{tr}");ex.cell(r,11,f"=Tarif_2027!H{tr}")
        r+=1
for c,w in zip("ABCDEFGHIJK",(14,16,11,14,12,8,13,24,24,34,44)): ex.column_dimensions[c].width=w
ex.freeze_panes="A2";ex.auto_filter.ref=f"A1:K{r-1}"
wb.calculation.fullCalcOnLoad=True
wb.save(OUT);print("ok",OUT,len(rows),"articles",NF,"familles")
