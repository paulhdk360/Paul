# Complément au dossier stand 274 : plan à jour, options, Fixndril, décisions. python3 generer_complement.py
import os,subprocess
here=os.path.dirname(os.path.abspath(__file__))
s=96;ox=150;oy=70
X=lambda x:ox+x*s;Y=lambda y:oy+(6-y)*s
def R(x0,x1,y0,y1,fill,stroke='none',sw=1.5,extra=''):return f'<rect x="{X(x0)}" y="{Y(y1)}" width="{(x1-x0)*s}" height="{(y1-y0)*s}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>'
def C(x,y,r,fill,stroke='none'):return f'<circle cx="{X(x)}" cy="{Y(y)}" r="{r*s}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>'
def T(x,y,t,size=13,fill='#0B1B2E',anchor='middle',w=600,rot=0):
    r=f' transform="rotate({rot} {X(x)} {Y(y)})"' if rot else ''
    return f'<text x="{X(x)}" y="{Y(y)}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" font-weight="{w}"{r}>{t}</text>'
plan=[R(-1.2,4.4,-0.8,6.8,'#F1F5F9'),R(0,3,0,6,'#6FA8E8'),R(3,3.14,0,6,'#08203F'),R(3.14,4.4,0,6,'#DCE3EA'),
R(2,3,4,6,'#F6F8FA','#0A4FA0',2.5),T(2.5,5,'RANGEMENT 2 × 1 m',12,'#51647A',rot=-90),
R(.65,1.23,4,6,'#FFFFFF','#0A4FA0',2.5),T(.94,5,'BAR D\'ACCUEIL',12,'#0A4FA0',rot=-90),
C(.3,4.5,.18,'#0A4FA0'),C(.3,5.5,.18,'#0A4FA0'),
R(1.37,1.43,4.15,5.0,'#08203F'),R(1.37,1.43,5.02,5.88,'#08203F'),T(1.75,4.58,'Roll-up',11,'#08203F'),T(1.75,5.45,'Roll-up',11,'#08203F'),
R(.23,.47,3.08,3.52,'#08203F'),T(.7,3.3,'Brochures',11,'#08203F',anchor='start'),
C(.6,1.5,.36,'#FFFFFF','#0A4FA0'),T(.6,1.5,'Mange-debout',9.5,'#0A4FA0'),C(.6,.95,.18,'#0A4FA0'),C(.6,2.05,.18,'#0A4FA0'),
C(1.55,2.65,.45,'#EEF3F8','#9FB0C0'),T(1.55,2.65,'Table',12),
R(1.55-.2,1.55+.2,2.65+.62-.2,2.65+.62+.2,'#DCE3EA','#9FB0C0'),R(1.55-.2,1.55+.2,2.65-.62-.2,2.65-.62+.2,'#DCE3EA','#9FB0C0'),R(1.55+.62-.2,1.55+.62+.2,2.65-.2,2.65+.2,'#DCE3EA','#9FB0C0'),R(1.55-.62-.2,1.55-.62+.2,2.65-.2,2.65+.2,'#DCE3EA','#9FB0C0'),
R(2.86,2.97,.07,.93,'#111111'),R(2.86,2.97,.07,.93,'none','#2FB34A',2),T(2.55,.5,'Roll-up FIXNDRIL',11,'#1E8A36',w=700,rot=-90),
R(-.04,.04,0,6,'#00AEEF'),C(0,2,.07,'#51647A'),C(0,4,.07,'#51647A'),T(.17,.6,'Bande H30 : enseigne 3 × 2 m',10.5,'#0A4FA0',anchor='start',rot=-90),
T(3.07,3,'MUR DU FOND 6 m (4 m visibles)',12,'#FFFFFF',rot=-90,w=700),T(3.8,3,'Stands 275 et 286',12,'#51647A',rot=-90),
T(-.7,3,'ALLÉE PRINCIPALE',13,'#51647A',rot=-90,w=700),T(1.5,6.55,'NORD · côté ouvert',12,'#51647A'),T(1.5,-.5,'SUD · côté ouvert',12,'#51647A'),
f'<line x1="{X(0)}" y1="{Y(-.3)}" x2="{X(3)}" y2="{Y(-.3)}" stroke="#51647A"/>'+T(1.5,-.17,'3,00 m',12,'#51647A',w=700),
f'<line x1="{X(-.35)}" y1="{Y(0)}" x2="{X(-.35)}" y2="{Y(6)}" stroke="#51647A"/>'+T(-.45,3.0,'6,00 m',1,'#fff')]
for y in (.5,1.5,2.5,3.5):plan.append(R(2.72,3,y-.07,y+.07,'#F2B705'))
planx=''.join(plan)
css='''@font-face{font-family:B;src:url(polices/Barlow-Regular.ttf)}@font-face{font-family:B;font-weight:600;src:url(polices/Barlow-SemiBold.ttf)}@font-face{font-family:BC;font-weight:700;src:url(polices/BarlowCondensed-Bold.ttf)}
@page{size:420mm 297mm;margin:0}*{box-sizing:border-box}body{margin:0;font-family:B;color:#0B1B2E;font-size:16px}
.p{width:420mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;padding:34px 48px;background:#fff}
h1{font-family:BC;font-weight:700;font-size:56px;color:#0A4FA0;margin:0;line-height:1}h2{font-family:BC;font-weight:700;font-size:28px;color:#0A4FA0;margin:0 0 6px}
.k{font-size:15px;color:#51647A;margin:6px 0 18px}.bar{height:5px;width:70px;background:#E2231A;margin:10px 0 6px}
.ft{position:absolute;left:48px;right:48px;bottom:18px;font-size:12px;color:#51647A;display:flex;justify-content:space-between;border-top:1px solid #D5DEE8;padding-top:6px}
.g{display:grid;gap:18px}.c{background:#EAF3FB;border-radius:14px;padding:14px 16px}.c img,.im img{width:100%;border-radius:10px;display:block;height:var(--ih,310px);object-fit:cover}
.tag{display:inline-block;background:#0A4FA0;color:#fff;border-radius:20px;padding:3px 14px;font-weight:600;font-size:14px;margin-bottom:8px}.tag.r{background:#E2231A}.tag.g{background:#1E8A36}
table{width:100%;border-collapse:collapse;font-size:16px}th{background:#0A4FA0;color:#fff;text-align:left;padding:7px 9px;font-weight:600}td{padding:7px 9px;border-bottom:1px solid #D5DEE8;vertical-align:top}tr.ok td{background:#EAF3FB;font-weight:600}
ul{margin:4px 0 0;padding-left:18px}li{margin:3px 0}.n{font-family:BC;font-weight:700;font-size:30px;color:#00AEEF;line-height:1}'''
foot=lambda n:f'<div class="ft"><span>Enedril · Fishing and Drilling Solutions · info@enedril.fr · +33 (0)5 59 04 50 45 · www.enedril.com</span><span>Complément · page {n}</span></div>'
I=lambda f:f'img/{f}.jpg'
def opt(n,t,f,sub):return f'<div class="c"><span class="tag{" r" if n==1 else ""}">Option {n}{" · retenue" if n==1 else ""}</span><h2 style="font-size:24px">{t}</h2><img src="{I(f)}"><div style="margin-top:6px;color:#51647A">{sub}</div></div>'
html=f'''<html><head><meta charset="utf-8"><style>{css}</style></head><body>
<div class="p"><div style="font-size:12px;color:#00AEEF;font-weight:600;letter-spacing:1px">GEOTHERM 2027 · OFFENBURG · STAND 274</div><h1>PLAN D'AMÉNAGEMENT À JOUR</h1><div class="bar"></div>
<div class="k">Remplace le plan de la page 2 : 2 roll-ups Enedril derrière le bar, 1 roll-up Fixndril (co-exposant) au fond sud. 3 × 6 m = 18 m² · bout de rangée.</div>
<div style="display:flex;gap:30px"><svg width="768" height="912" viewBox="0 0 640 760" font-family="B">{planx}</svg>
<div style="flex:1"><div class="c"><h2>Ce qui change par rapport au premier plan</h2><ul><li><b>Roll-ups Enedril : 2 au lieu de 3</b>, placés derrière le bar d'accueil, côté meuble de rangement, face à l'allée ouest (forage dirigé et fishing ; MWD clair en réserve).</li><li><b>Fixndril</b> : un seul roll-up noir et vert adossé au mur du fond, angle sud. Pas de comptoir personnalisé, pas de cloison séparée.</li><li>La bande H30 ouest est habillée sur 6 m : lettrage central + 2 lettrages logo seul.</li></ul></div>
<div class="c" style="margin-top:14px"><h2>Légende et repères</h2><ul><li><b>Bar d'accueil</b> : 2 comptoirs bout à bout (2 m), face imprimée logo + QR code, 2 tabourets.</li><li><b>Mange-debout</b> Ø70 avec 2 tabourets, au sud-ouest.</li><li><b>Table de réunion</b> ronde + 4 chaises, adossée au mur du fond.</li><li><b>Présentoir à brochures</b> entre le bar et le mange-debout.</li><li><b>Rangement 2 × 1 m</b> contre le mur, au nord ; sa face ouest est habillée (option A ou C).</li><li><b>Spots</b> : 4 muraux (jaune) pour le mur du fond, 3 HQ/LED sur la bande de maillage.</li><li>Face imprimée du rangement et mur du fond en panneaux de 1000 × 2500 mm.</li></ul></div>
<div class="c" style="margin-top:14px"><h2>À confirmer avec Messe Offenburg</h2><ul><li>Position exacte du rangement le long du mur (extrémité nord supposée).</li><li>Teinte de la moquette bleu clair (aucune référence dans le kit).</li><li>Fond perdu et traits de coupe des panneaux imprimés.</li><li>Croquis joint à la commande à redessiner avec ce plan, puis à signer.</li></ul></div></div></div>{foot(11)}</div>
<div class="p"><h1>LES 4 OPTIONS DU STAND</h1><div class="bar"></div><div class="k">Deux choix à faire : la moquette (bleu clair ou grise incluse) et la face du rangement (A « Our services » ou C bleu uni + logo). Rendus 3D illustratifs, même vue pour comparer.</div>
<div class="g" style="grid-template-columns:1fr 1fr;--ih:330px">{opt(1,'Moquette bleu clair · face rangement A "Our services"','Option1_Vue_d_ensemble','Le plus vivant : le bleu clair ressort sous le mur du fond foncé. Surcoût moquette +270 €.')}{opt(2,'Moquette bleu clair · face rangement C bleu uni + logo','Option2_Vue_d_ensemble','Plus sobre : le rangement se fond avec le mur du fond. Surcoût moquette +270 €.')}{opt(3,'Moquette grise (incluse) · face rangement A','Option3_Vue_d_ensemble','Aucun surcoût de moquette. Le rangement porte les services.')}{opt(4,'Moquette grise (incluse) · face rangement C','Option4_Vue_d_ensemble','Le plus économique et le plus sobre.')}</div>{foot(12)}</div>
<div class="p"><h1>FACE DU RANGEMENT ET MOQUETTE</h1><div class="bar"></div><div class="k">Zooms pour trancher. Les panneaux A et C coûtent pareil (2 panneaux de 330 €) : le choix est visuel.</div>
<div class="g" style="grid-template-columns:1fr 1fr;--ih:340px"><div class="c"><span class="tag">Face A · « Our services »</span><img src="{I('Option1_Face_rangement')}"><div style="margin-top:6px">Fond blanc, liste des services (sans MWD). Informe le visiteur dès l'allée.</div></div><div class="c"><span class="tag">Face C · bleu uni + logo</span><img src="{I('Option2_Face_rangement')}"><div style="margin-top:6px">Prolonge le mur du fond. Image de marque forte, mais aucun message sur les services.</div></div>
<div class="c"><span class="tag">Moquette bleu clair</span><img src="{I('Option1_Allee_ouest')}"><div style="margin-top:6px">Vue depuis l'allée : contraste avec le mur. 15 €/m² soit 270 €.</div></div><div class="c"><span class="tag">Moquette grise (incluse)</span><img src="{I('Option3_Allee_ouest')}"><div style="margin-top:6px">Neutre, sans frais. Les roll-ups bleus et noirs ressortent bien.</div></div></div>{foot(13)}</div>
<div class="p"><h1>CO-EXPOSANT FIXNDRIL ET ROLL-UPS</h1><div class="bar"></div><div class="k">Fixndril expose avec Enedril (stand 274). Il garde un seul roll-up noir et vert, séparé visuellement de l'univers Enedril.</div>
<div class="g" style="grid-template-columns:1.1fr 1fr 1fr;align-items:start;--ih:420px"><div class="c"><span class="tag g">Roll-up Fixndril</span><img src="{I('13_Zoom_roll_up_Fixndril')}"></div><div class="c"><span class="tag g">Vu de l'intérieur</span><img src="{I('14_Vue_roll_up_Fixndril_depuis_l_interieur')}"></div><div class="c"><span class="tag">2 roll-ups Enedril</span><img src="{I('15_Roll_ups_Enedril_a_cote_du_bar')}"></div></div>
<div class="g" style="grid-template-columns:1fr 1fr;margin-top:18px"><div class="c"><h2>Fixndril</h2><ul><li>Frais de co-exposant 350 € + forfait marketing 120 € = <b>470 € HT</b>, à inscrire avant le <b>27 novembre 2026</b>.</li><li>À décider : qui règle (Enedril ou Fixndril), case à cocher page 8 du livret.</li><li>À recevoir de Fixndril : logo vectoriel (le logo actuel fait 640 px) et la liste de ses produits exposés.</li></ul></div><div class="c"><h2>Roll-ups Enedril</h2><ul><li>2 roll-ups 850 × 2000 mm : forage dirigé et fishing / workover / P&A.</li><li>MWD clair et MWD sombre disponibles en réserve.</li><li>Impression à chiffrer chez l'imprimeur : environ 100 € pièce.</li></ul></div></div>{foot(14)}</div>
<div class="p"><h1>DÉCISIONS ET BUDGET PAR OPTION</h1><div class="bar"></div><div class="k">Montants hors TVA, estimés à partir du kit exposant. Base : page 10 du dossier, avec 2 roll-ups Enedril au lieu de 3 (-100 €).</div>
<table><tr><th>Option</th><th>Moquette</th><th>Face rangement</th><th>Total aménagement estimé</th><th>Avec Fixndril (470 €)</th></tr>
<tr class="ok"><td>1 · retenue</td><td>Bleu clair (+270 €)</td><td>A « Our services »</td><td>≈ 6 453 €</td><td>≈ 6 923 €</td></tr><tr><td>2</td><td>Bleu clair (+270 €)</td><td>C bleu uni + logo</td><td>≈ 6 453 €</td><td>≈ 6 923 €</td></tr><tr><td>3</td><td>Grise (incluse)</td><td>A « Our services »</td><td>≈ 6 183 €</td><td>≈ 6 653 €</td></tr><tr><td>4</td><td>Grise (incluse)</td><td>C bleu uni + logo</td><td>≈ 6 183 €</td><td>≈ 6 653 €</td></tr></table>
<div class="g" style="grid-template-columns:1fr 1fr;margin-top:22px"><div class="c"><h2>À faire, dans l'ordre</h2><ul><li><b>Avant le 27 nov. 2026</b> : inscrire Fixndril en co-exposant (470 €) et décider qui paie.</li><li><b>Choisir l'option</b> (moquette et face du rangement).</li><li>Redessiner le croquis de la commande avec le plan à jour (page 11), cocher et signer les pages du livret.</li><li><b>Avant le 11 déc. 2026</b> : envoyer la commande à geotherm@messe-offenburg.de (sinon +10 %, minimum 25 €).</li><li>Envoyer les fichiers d'impression : panneaux, lettrages EPS, face du bar.</li><li>Faire imprimer les 2 roll-ups Enedril.</li></ul></div>
<div class="c"><h2>Rappels</h2><ul><li><b>Pages 2 et 7 du dossier</b> montrent encore 3 roll-ups Enedril : voir le plan à jour.</li><li>Le prix du bandeau de comptoir (95 × 80 cm) est à confirmer pour la face 100 × 90 cm du bar.</li><li>Montage 23-24 février, salon 25-26 février 2027.</li><li>Les rendus 3D sont illustratifs : mobilier et maquettes d'outils indicatifs.</li></ul></div></div>{foot(15)}</div></body></html>'''
import sys
OUT='Complement_options_et_plans'
if 'rouge' in sys.argv:
    OUT+='_rouge_orange'
    html=html.replace('.tag.r{background:#E2231A}','.tag.r{background:#F58220}')
    for a,b in [('#0A4FA0','#D9261C'),('#00AEEF','#F58220'),('#EAF3FB','#FEF0E7'),('#D5DEE8','#F3D9CA'),('#51647A','#7A5A4D'),('#E2231A','#F58220')]:html=html.replace(a,b)
    html=html.replace('.bar{height:5px;width:70px;background:#F58220','.bar{height:5px;width:70px;background:#D9261C')
open(os.path.join(here,'complement.html'),'w').write(html)
js=f"""const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();const p=await b.newPage();await p.goto('file://{here}/complement.html');await p.waitForTimeout(800);await p.pdf({{path:'{here}/{OUT}.pdf',width:'420mm',height:'297mm',printBackground:true}});await b.close()}})()"""
open(os.path.join(here,'_pdf.cjs'),'w').write(js);subprocess.run(['node',os.path.join(here,'_pdf.cjs')],check=True,env={**os.environ,'NODE_PATH':'/opt/node-tools/node_modules'});os.remove(os.path.join(here,'_pdf.cjs'))
