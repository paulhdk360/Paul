"""Price List 2027 Enedril (Fishing) : tarif normalisé, coefficients par famille, prêt pour un futur ERP.
Usage : python3 -I generer_price_list_2027.py <Fishing_Price_List_2026.xlsx> <Price_List_2027.xlsx>
Lit l'onglet « Inventaire & Tarifs 2026 » et construit : Lisez-moi, Parametres, Familles, Tarif_2027, Synthese, Export_ERP.
Les valeurs de coefficients fournies sont des EXEMPLES à confirmer (cellules jaunes de Parametres)."""
import sys,datetime
import openpyxl
from openpyxl.styles import Font,PatternFill,Alignment,Border,Side
from openpyxl.utils import get_column_letter as L
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule,FormulaRule
SRC,OUT=sys.argv[1],sys.argv[2]
NAVY,BLUE,LIGHT,YEL,GREY="08203F","0A4FA0","EAF3FB","FFF2CC","F2F2F2"
hdr=Font(name="Calibri",bold=True,color="FFFFFF");hfill=PatternFill("solid",fgColor=NAVY)
thin=Side(style="thin",color="D5DEE8");box=Border(left=thin,right=thin,top=thin,bottom=thin)
inp=PatternFill("solid",fgColor=YEL);inpf=Font(color="C00000",bold=True)
# ---------- lecture de l'ancien tarif
ws0=openpyxl.load_workbook(SRC,data_only=True)["Inventaire & Tarifs 2026"]
rows=[];fam_prec={};last_sec=None
for r in range(3,ws0.max_row+1):
    v=[ws0.cell(r,c).value for c in range(1,11)]
    if v[0] is None and v[1] is None and v[2] is None: continue
    sec,fam,des,typ,sb,op,uc,lih,ins,tail=v
    if not sec: sec=last_sec               # lignes de suite sans section : mêmes section et famille que la ligne du dessus
    else: last_sec=sec
    sub=isinstance(des,str) and des.strip().startswith("↳")
    if not fam: fam=fam_prec.get(sec)          # les sous-ensembles (↳ Set Cutters, Arm Set) héritent de la famille du dessus
    else: fam_prec[sec]=fam
    rows.append(dict(sec=str(sec).strip(),fam=str(fam).strip(),des=str(des).strip(),sub="Oui" if sub else "Non",typ=typ,tail=tail,prix=[sb,op,uc,lih,ins]))
fams=[];seen=set()
for x in rows:
    k=(x["sec"],x["fam"])
    if k not in seen: seen.add(k);fams.append(k)
CARBURE_SECTIONS=("2 ","3 ","5 ")                  # élargissage, coupe, fraisage
STANDARD_EXC={"Ditch Magnet"}                      # aimant : pas de carbure
A_CONFIRMER={"WO Shoe":"Sabot de washover : habillage carbure ? à confirmer","PKR Milling Tool":"Fraisage de packer (section Repêchage) : carbure ? à confirmer"}
wb=openpyxl.Workbook()
lm=wb.active;lm.title="Lisez-moi";par=wb.create_sheet("Parametres");fa=wb.create_sheet("Familles");ta=wb.create_sheet("Tarif_2027");sy=wb.create_sheet("Synthese");ex=wb.create_sheet("Export_ERP")
# ---------- Parametres
par["A1"]="PARAMÈTRES DU TARIF";par["A1"].font=Font(size=16,bold=True,color=NAVY)
par["A2"]="Les cellules jaunes sont à renseigner. Les valeurs de coefficients ci-dessous sont des EXEMPLES à confirmer."; par["A2"].font=Font(italic=True,color="C00000")
labs=[("Année du tarif",2027),("Début de validité",datetime.date(2027,1,1)),("Version du tarif","PL-2027-v1"),("Devise","EUR")]
for i,(a,b) in enumerate(labs):
    par.cell(4+i,1,a).font=Font(bold=True);c=par.cell(4+i,2,b);c.fill=inp;c.font=inpf;c.border=box
par["B5"].number_format="dd/mm/yyyy"
par["A9"]="Coefficient de base (toutes familles)";par["B9"]=1.03
par["A10"]="Coefficient « carbure » (fraisage, élargissage, coupe)";par["B10"]=1.08
for a in ("B9","B10"): par[a].fill=inp;par[a].font=inpf;par[a].number_format="0.000";par[a].border=box
par["C9"]="ex. 1,03 = +3 %";par["C10"]="ex. 1,08 = +8 % : carbure, plaquettes, cutters"
for a in ("A9","A10"): par[a].font=Font(bold=True)
par["A12"]="COLONNES DE PRIX";par["A12"].font=Font(bold=True,color=BLUE,size=12)
for i,h in enumerate(["Colonne de prix","Code ERP","Appliquer le coefficient ?","Arrondi (pas en €)"]):
    c=par.cell(13,1+i,h);c.font=hdr;c.fill=hfill;c.alignment=Alignment(horizontal="center",wrap_text=True)
PRIX=[("Stand-by (€/jour)","STANDBY_DAY"),("Operating (€/jour)","OPERATING_DAY"),("Utilisation charge (€)","USAGE_CHARGE"),("LIH (€)","LIH"),("Inspection (€)","INSPECTION")]
for i,(n,code) in enumerate(PRIX):
    r=14+i;par.cell(r,1,n);par.cell(r,2,code)
    for col,val in ((3,"Oui"),(4,5)): c=par.cell(r,col,val);c.fill=inp;c.font=inpf;c.border=box;c.alignment=Alignment(horizontal="center")
dv=DataValidation(type="list",formula1='"Oui,Non"',allow_blank=False);par.add_data_validation(dv);dv.add("C14:C18")
par.column_dimensions["A"].width=52;par.column_dimensions["B"].width=18;par.column_dimensions["C"].width=26;par.column_dimensions["D"].width=18
# ---------- Familles
fh=["Section","Famille","Catégorie","Coef. de la catégorie","Coef. forcé (facultatif)","Coef. appliqué","Nb articles","Note"]
for i,h in enumerate(fh):
    c=fa.cell(1,1+i,h);c.font=hdr;c.fill=hfill;c.alignment=Alignment(horizontal="center",wrap_text=True)
NR=len(rows)+1
for i,(sec,fam) in enumerate(fams):
    r=2+i;carb=sec.startswith(CARBURE_SECTIONS) and fam not in STANDARD_EXC
    fa.cell(r,1,sec);fa.cell(r,2,fam)
    c=fa.cell(r,3,"Carbure" if carb else "Standard");c.fill=inp;c.font=inpf
    fa.cell(r,4,f'=IF(C{r}="Carbure",Parametres!$B$10,Parametres!$B$9)').number_format="0.000"
    c=fa.cell(r,5);c.fill=inp;c.number_format="0.000"
    fa.cell(r,6,f'=IF(E{r}<>"",E{r},D{r})').number_format="0.000"
    fa.cell(r,7,f'=COUNTIFS(Tarif_2027!$B$2:$B${NR},A{r},Tarif_2027!$C$2:$C${NR},B{r})')
    fa.cell(r,8,A_CONFIRMER.get(fam,""))
    for cc in range(1,9): fa.cell(r,cc).border=box
dv2=DataValidation(type="list",formula1='"Carbure,Standard"',allow_blank=False);fa.add_data_validation(dv2);dv2.add(f"C2:C{len(fams)+1}")
for c,w in zip("ABCDEFGH",(30,28,13,16,18,14,12,60)): fa.column_dimensions[c].width=w
fa.freeze_panes="C2";fa.auto_filter.ref=f"A1:H{len(fams)+1}"
NF=len(fams)+1
# ---------- Tarif_2027
th=["ID_Article","Section","Famille","Designation","Sous_ensemble","Type","Detail_tailles","StandBy_2026","Operating_2026","UC_2026","LIH_2026","Inspection_2026","Categorie","Coef_applique","StandBy_2027","Operating_2027","UC_2027","LIH_2027","Inspection_2027","Variation_moyenne"]
for i,h in enumerate(th):
    c=ta.cell(1,1+i,h);c.font=hdr;c.fill=hfill;c.alignment=Alignment(horizontal="center",wrap_text=True)
famcode={k:i+1 for i,k in enumerate(fams)};cnt={}
for i,x in enumerate(rows):
    r=2+i;k=(x["sec"],x["fam"]);cnt[k]=cnt.get(k,0)+1
    ta.cell(r,1,f"ENE-{famcode[k]:03d}-{cnt[k]:03d}");ta.cell(r,2,x["sec"]);ta.cell(r,3,x["fam"]);ta.cell(r,4,x["des"]);ta.cell(r,5,x["sub"]);ta.cell(r,6,x["typ"]);ta.cell(r,7,x["tail"])
    for j,p in enumerate(x["prix"]): ta.cell(r,8+j,p)
    ta.cell(r,13,f'=INDEX(Familles!$C$2:$C${NF},MATCH(1,INDEX((Familles!$A$2:$A${NF}=B{r})*(Familles!$B$2:$B${NF}=C{r}),0),0))')
    ta.cell(r,14,f'=INDEX(Familles!$F$2:$F${NF},MATCH(1,INDEX((Familles!$A$2:$A${NF}=B{r})*(Familles!$B$2:$B${NF}=C{r}),0),0))').number_format="0.000"
    for j in range(5):
        src=L(8+j);pr=14+j
        ta.cell(r,15+j,f'=IF({src}{r}="","",IF(Parametres!$C${pr}="Oui",ROUND({src}{r}*$N{r}/Parametres!$D${pr},0)*Parametres!$D${pr},{src}{r}))').number_format="#,##0"
        ta.cell(r,8+j).number_format="#,##0"
    ta.cell(r,20,f'=IFERROR(SUM(O{r}:S{r})/SUM(H{r}:L{r})-1,"")').number_format="0.0%"
for c,w in zip(range(1,21),(14,24,24,34,11,9,44,11,11,10,10,11,11,9,11,11,10,10,11,11)): ta.column_dimensions[L(c)].width=w
ta.freeze_panes="E2";ta.auto_filter.ref=f"A1:T{NR}"
ta.conditional_formatting.add(f"T2:T{NR}",CellIsRule(operator="greaterThan",formula=["0.05"],fill=PatternFill("solid",bgColor="FCE4D6")))
# ---------- Synthese
sy["A1"]="SYNTHÈSE DE L'AUGMENTATION";sy["A1"].font=Font(size=16,bold=True,color=NAVY)
sy["A2"]="Par famille : somme des valeurs LIH (valeur de remplacement) avant et après, pour mesurer l'effet du coefficient.";sy["A2"].font=Font(italic=True,color="51647A")
for i,h in enumerate(["Section","Famille","Catégorie","Coef.","Nb articles","LIH 2026 (somme)","LIH 2027 (somme)","Variation"]):
    c=sy.cell(4,1+i,h);c.font=hdr;c.fill=hfill;c.alignment=Alignment(horizontal="center",wrap_text=True)
for i in range(len(fams)):
    r=5+i;fr=2+i
    sy.cell(r,1,f"=Familles!A{fr}");sy.cell(r,2,f"=Familles!B{fr}");sy.cell(r,3,f"=Familles!C{fr}");sy.cell(r,4,f"=Familles!F{fr}").number_format="0.000";sy.cell(r,5,f"=Familles!G{fr}")
    sy.cell(r,6,f'=SUMIFS(Tarif_2027!$K$2:$K${NR},Tarif_2027!$B$2:$B${NR},A{r},Tarif_2027!$C$2:$C${NR},B{r})').number_format="#,##0"
    sy.cell(r,7,f'=SUMIFS(Tarif_2027!$R$2:$R${NR},Tarif_2027!$B$2:$B${NR},A{r},Tarif_2027!$C$2:$C${NR},B{r})').number_format="#,##0"
    sy.cell(r,8,f'=IF(F{r}=0,"",G{r}/F{r}-1)').number_format="0.0%"
rt=5+len(fams)
sy.cell(rt,1,"TOTAL").font=Font(bold=True)
for col in (5,6,7): sy.cell(rt,col,f"=SUM({L(col)}5:{L(col)}{rt-1})").number_format="#,##0";sy.cell(rt,col).font=Font(bold=True)
sy.cell(rt,8,f'=IF(F{rt}=0,"",G{rt}/F{rt}-1)').number_format="0.0%";sy.cell(rt,8).font=Font(bold=True)
for c,w in zip("ABCDEFGH",(28,28,12,9,11,18,18,11)): sy.column_dimensions[c].width=w
sy.freeze_panes="A5"
# ---------- Export_ERP (format long : une ligne par article et par type de prix)
eh=["ID_Article","Type_prix","Prix_EUR","Debut_validite","Fin_validite","Devise","Version_tarif","Section","Famille","Designation","Detail_tailles"]
for i,h in enumerate(eh):
    c=ex.cell(1,1+i,h);c.font=hdr;c.fill=hfill
r=2
for i in range(len(rows)):
    tr=2+i
    for j,(n,code) in enumerate(PRIX):
        ex.cell(r,1,f"=Tarif_2027!A{tr}");ex.cell(r,2,f"=Parametres!B{14+j}");ex.cell(r,3,f"=Tarif_2027!{L(15+j)}{tr}")
        ex.cell(r,4,"=Parametres!$B$5").number_format="yyyy-mm-dd";ex.cell(r,5,"");ex.cell(r,6,"=Parametres!$B$7");ex.cell(r,7,"=Parametres!$B$6")
        ex.cell(r,8,f"=Tarif_2027!B{tr}");ex.cell(r,9,f"=Tarif_2027!C{tr}");ex.cell(r,10,f"=Tarif_2027!D{tr}");ex.cell(r,11,f"=Tarif_2027!G{tr}")
        r+=1
for c,w in zip("ABCDEFGHIJK",(14,16,11,14,12,8,13,24,24,34,44)): ex.column_dimensions[c].width=w
ex.freeze_panes="A2";ex.auto_filter.ref=f"A1:K{r-1}"
# ---------- Lisez-moi
txt=[("PRICE LIST 2027 — ENEDRIL (FISHING)",18,True),("",11,False),
("Principe",13,True),("Les prix 2026 de l'ancien tarif sont conservés tels quels (colonnes *_2026). Les prix 2027 sont CALCULÉS : prix 2026 × coefficient de la famille, arrondi. Rien n'est saisi à la main dans les prix 2027.",11,False),("",11,False),
("Comment augmenter les prix",13,True),
("1. Parametres : le coefficient de base (toutes familles) et le coefficient « carbure » (fraisage, élargissage, coupe : carbure, plaquettes, cutters).",11,False),
("2. Familles : chaque famille est « Carbure » ou « Standard » (liste déroulante). Pour une famille précise, on peut forcer un coefficient (colonne « Coef. forcé »).",11,False),
("3. Parametres, colonnes de prix : choisir quelles colonnes augmentent (stand-by, operating, UC, LIH, inspection) et le pas d'arrondi.",11,False),
("4. Synthese : l'effet par famille (valeur LIH avant / après). Tarif_2027 : le détail article par article, la variation en %.",11,False),("",11,False),
("Chaque année",13,True),
("Pour 2028 : copier les colonnes *_2027 en valeurs vers de nouvelles colonnes de base *_2027 de départ, puis refaire les coefficients de l'année. Garder une version du fichier par année (ex. PL-2027-v1, PL-2028-v1).",11,False),("",11,False),
("Futur ERP",13,True),
("• Tarif_2027 : une ligne par article, aucune cellule fusionnée, un identifiant unique ID_Article (provisoire : à remplacer par le code article de l'ERP une fois créé), des noms de colonnes sans accents.",11,False),
("• Export_ERP : format « long » (une ligne par article et par type de prix : STANDBY_DAY, OPERATING_DAY, USAGE_CHARGE, LIH, INSPECTION), avec date de début de validité, devise et version du tarif. C'est le fichier à enregistrer en CSV pour importer dans l'ERP.",11,False),
("• Les identifiants ENE-xxx-yyy sont fixés d'après l'ordre actuel des familles et des articles : ne pas les renuméroter ensuite ; un nouvel article reçoit le numéro suivant de sa famille.",11,False),("",11,False),
("À valider",13,True),
("• Les coefficients (3 % et 8 %) sont des EXEMPLES. Ils sont à remplacer par les hausses réelles des fournisseurs (carbure, plaquettes).",11,False),
("• Les familles marquées « à confirmer » (WO Shoe, PKR Milling Tool) pourraient contenir du carbure : à classer. Ditch Magnet (aimant) est classé Standard bien qu'il soit dans la section Fraisage.",11,False),
("• Les onglets Overshot Grapples et Spear Grapples du fichier d'origine sont des prix d'ACHAT fournisseurs : ils ne font pas partie de ce tarif de vente. Un coefficient d'achat pourra être ajouté dans un second temps.",11,False)]
for i,(t_,sz,b) in enumerate(txt):
    c=lm.cell(1+i,1,t_);c.font=Font(size=sz,bold=b,color=NAVY if b else "000000");c.alignment=Alignment(wrap_text=True,vertical="top")
lm.column_dimensions["A"].width=130;lm.sheet_view.showGridLines=False
for w_ in (par,sy): w_.sheet_view.showGridLines=False
wb.calculation.fullCalcOnLoad=True
wb.save(OUT);print("ok",OUT,len(rows),"articles",len(fams),"familles")
