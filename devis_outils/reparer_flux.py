"""Répare l'onglet caché « Flux » des devis Enedril (modèle 1 Affaire / 2 Matériel / 3 Options / 4 Devis).
Symptôme : des lignes de « 2 Matériel » n'arrivent pas sur « 4 Devis » (lignes supprimées ou déplacées dans Matériel => formules de Flux décalées ou en #REF!).
Réparation : Flux ligne r (2 à 26) lit 2 Matériel ligne r+4 ; les 10 lignes d'options suivent ; les plages Flux!$X$2:$X$35 du devis passent à $60.
Usage : python3 -I reparer_flux.py <devis.xlsx> <sortie.xlsx>   (édition XML : mise en forme, images et textes conservés)"""
import sys,re,zipfile,shutil,os
from xml.sax.saxutils import escape,unescape
from openpyxl.formula.translate import Translator
SRC,OUT=sys.argv[1],sys.argv[2]
NMAT=25            # lignes de 2 Matériel (6 à 30)
z=zipfile.ZipFile(SRC);files={n:z.read(n) for n in z.namelist()}
x7=files['xl/worksheets/sheet7.xml'].decode('utf8')
rows=dict((int(m.group(1)),m.group(0)) for m in re.finditer(r'<row r="(\d+)".*?</row>',x7,re.S))
cell_re=re.compile(r'<c r="([A-Z]+)(\d+)"([^>]*?)(?:/>|>(.*?)</c>)',re.S)
def cells(rowxml):
    out={}
    for m in cell_re.finditer(rowxml):
        col,r,attrs,inner=m.groups();f=re.search(r'<f>(.*?)</f>',inner or '',re.S)
        s=re.search(r' s="(\d+)"',attrs);out[col]=(unescape(f.group(1)) if f else None,s.group(1) if s else None)
    return out
tpl=cells(rows[3])                       # ligne type (Matériel ligne 7)
old_opt=[cells(rows[r]) for r in range(26,36)]  # 10 lignes d'options actuelles (Flux 26 à 35)
COLS='ABCDEFGHIJKL'
def rowxml(r,cs):
    body=''
    for c in COLS:
        f,s=cs.get(c,(None,None));sa=f' s="{s}"' if s else ''
        body+=f'<c r="{c}{r}"{sa}><f>{escape(f)}</f></c>' if f else f'<c r="{c}{r}"{sa}/>'
    return f'<row r="{r}" spans="1:12" x14ac:dyDescent="0.25">{body}</row>'
new=[]
for r in range(2,2+NMAT):                # lignes matériel
    new.append(rowxml(r,{c:(Translator('='+f,origin=f'{c}3').translate_formula(f'{c}{r}')[1:] if f else None,s) for c,(f,s) in tpl.items()}))
for i,cs in enumerate(old_opt):          # options : décalées d'une ligne si besoin
    src=26+i;dst=2+NMAT+i
    new.append(rowxml(dst,{c:(Translator('='+f,origin=f'{c}{src}').translate_formula(f'{c}{dst}')[1:] if f else None,s) for c,(f,s) in cs.items()}))
last=2+NMAT+len(old_opt)-1
head=x7[:x7.index('<row r="2"')];tail=x7[x7.index('</sheetData>'):]
x7n=head+''.join(new)+tail
x7n=re.sub(r'<dimension ref="[^"]+"/>',f'<dimension ref="A1:L{last}"/>',x7n)
files['xl/worksheets/sheet7.xml']=x7n.encode('utf8')
# devis : plages de Flux élargies, valeurs en cache retirées pour forcer le recalcul
x4=files['xl/worksheets/sheet4.xml'].decode('utf8')
x4,n=re.subn(r'(Flux!\$[A-Z]\$2:\$[A-Z]\$)35',r'\g<1>60',x4)
files['xl/worksheets/sheet4.xml']=x4.encode('utf8')
def vide_cache(s):
    def cell(m):
        attrs,inner=m.group(1),m.group(2)
        if '<f' not in inner:return m.group(0)
        attrs=re.sub(r' t="(?:str|e|b|n)"','',attrs);inner=re.sub(r'<v[^>]*?/>','',inner);inner=re.sub(r'<v[^>]*>.*?</v>','',inner,flags=re.S)
        return f'<c{attrs}>{inner}</c>'
    return re.sub(r'<c((?: [^>]*?)?)>(.*?)</c>',cell,s,flags=re.S)
for n_ in ('xl/worksheets/sheet4.xml','xl/worksheets/sheet7.xml'):
    files[n_]=vide_cache(files[n_].decode('utf8')).encode('utf8')
# recalcul complet à l'ouverture ; suppression de calcChain
wbx=files['xl/workbook.xml'].decode('utf8');wbx=re.sub(r'<calcPr [^>]*/>','<calcPr calcId="191029" fullCalcOnLoad="1"/>',wbx);files['xl/workbook.xml']=wbx.encode('utf8')
files.pop('xl/calcChain.xml',None)
ct=files['[Content_Types].xml'].decode('utf8');ct=re.sub(r'<Override PartName="/xl/calcChain.xml"[^>]*/>','',ct);files['[Content_Types].xml']=ct.encode('utf8')
rel=files['xl/_rels/workbook.xml.rels'].decode('utf8');rel=re.sub(r'<Relationship [^>]*calcChain[^>]*/>','',rel);files['xl/_rels/workbook.xml.rels']=rel.encode('utf8')
with zipfile.ZipFile(OUT,'w',zipfile.ZIP_DEFLATED) as zo:
    for n_,b in files.items():zo.writestr(n_,b)
print('ok',OUT,'plages Flux élargies :',n)
