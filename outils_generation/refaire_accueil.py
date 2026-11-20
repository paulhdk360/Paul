"""Maquette du site : refait la page d'accueil avec l'ancien modèle (v1 : en-tête plat, hero en deux colonnes,
typographie condensée, bandeau de chiffres) et ajoute une « expérience » : le site se lit comme un puits.
  - jauge de profondeur fixe (0 à 3 000 m) liée au défilement, avec les sections en repères cliquables
  - hero : entrée en cascade, soulignement animé, parallaxe et halo qui suit le curseur sur la photo
  - chiffres du bandeau qui montent au chargement
Un interrupteur « modèle d'origine / expérience » permet de comparer. Mouvement réduit respecté.
Idempotent. Usage : python3 outils_generation/refaire_accueil.py"""
import re

HTML = "enedril-maquette.html"
t = open(HTML, encoding="utf8").read()

CSS = r"""
/* accueil:css:start */
/* ===== A. Ancien modèle (v1) : en-tête plat + hero en deux colonnes ===== */
html[data-home="classic"] .topbar{background:var(--deep);color:var(--on-deep-muted);padding-block:9px}
html[data-home="classic"] .topbar b{color:var(--cyan)}
html[data-home="classic"] header.site{background:var(--surface);border-bottom:1px solid var(--line);padding:0;pointer-events:auto}
html[data-home="classic"] header.site .wrap{max-width:1180px;min-height:72px;padding:0 20px;border-radius:0;border:0;background:none;-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:none}
html[data-home="classic"] .logo img{height:46px}
html[data-home="classic"] nav.main{gap:22px}
html[data-home="classic"] nav.main a{padding:6px 0;border-bottom:2px solid transparent;border-radius:0;background:none}
html[data-home="classic"] nav.main a:hover{border-color:var(--cyan);background:none;color:inherit}
html[data-home="classic"] nav.main .menu a{padding:9px 14px;border-bottom:0}
@media(max-width:1100px){html[data-home="classic"] nav.main{gap:4px}html[data-home="classic"] nav.main a{padding:9px 16px}}
html[data-home="classic"] .hero{margin:0;border-radius:0;isolation:auto}
html[data-home="classic"] .hero-grid{display:grid;grid-template-columns:1.15fr .85fr;min-height:560px;position:relative}
html[data-home="classic"] .hero-photo{position:relative;inset:auto;min-height:320px;z-index:auto;overflow:hidden}
html[data-home="classic"] .hero-photo img{object-position:60% 50%;transform:none;animation:none}
html[data-home="classic"] .hero-photo::after{background:linear-gradient(90deg,var(--deep) 0,rgba(8,32,63,0) 38%)}
html[data-home="classic"] .hero-copy{padding:clamp(48px,7vw,96px) clamp(20px,4vw,56px) clamp(40px,5vw,64px) max(20px,calc((100vw - 1180px)/2 + 20px));max-width:none;gap:26px}
html[data-home="classic"] .hero .eyebrow{background:none;padding:0;border-radius:0;gap:.7em;letter-spacing:.12em}
html[data-home="classic"] .hero .eyebrow::before{width:22px;height:2px;border-radius:0;background:currentColor;box-shadow:none}
html[data-home="classic"] .hero h1{font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:clamp(2.7rem,6.4vw,5.2rem);font-weight:700;text-transform:uppercase;line-height:.96;letter-spacing:.005em}
html[data-home="classic"] .hero h1 em{background:none;-webkit-background-clip:border-box;background-clip:border-box;color:var(--cyan);-webkit-text-fill-color:currentColor}
html[data-home="classic"] .hero p.lead{font:400 1.15rem/1.6 'Barlow','Helvetica Neue',Arial,sans-serif;max-width:50ch;color:var(--on-deep-muted)}
html[lang="en"][data-home="classic"] .hero h1{font-size:clamp(2.3rem,5vw,4.2rem)}
html[data-home="classic"] .hero .btn{font-family:'Barlow','Helvetica Neue',Arial,sans-serif;border-radius:2px;box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none}
html[data-home="classic"] .hero .btn-ghost{border-width:2px}
html[data-home="classic"] .hero-tag{right:16px;left:auto;bottom:16px;top:auto;border:0;border-left:4px solid var(--red);border-radius:0;background:var(--surface);color:var(--ink);-webkit-backdrop-filter:none;backdrop-filter:none;padding:10px 14px}
html[data-home="classic"] .hero-tag b{display:block;margin:0;color:var(--sky)}
html[data-home="classic"] .stats{background:var(--deep2);border-top:1px solid var(--deep-line);margin-top:0}
html[data-home="classic"] .stats .wrap{max-width:1180px;margin-inline:auto;padding:0 20px;gap:0}
html[data-home="classic"] .stat{padding:26px 20px;border:0;border-right:1px solid var(--deep-line);border-radius:0;background:none;-webkit-backdrop-filter:none;backdrop-filter:none}
html[data-home="classic"] .stat:first-child{padding-left:0}
html[data-home="classic"] .stat:last-child{border-right:0}
html[data-home="classic"] .stat b{font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:clamp(2rem,4vw,3rem);font-weight:600;letter-spacing:0}
@media(max-width:900px){html[data-home="classic"] .hero-grid{grid-template-columns:1fr}html[data-home="classic"] .hero-copy{padding:44px 20px 36px}html[data-home="classic"] .hero-photo{min-height:260px;order:2}html[data-home="classic"] .hero-photo::after{background:linear-gradient(180deg,var(--deep) 0,rgba(8,32,63,0) 40%)}}
@media(max-width:700px){html[data-home="classic"] .stats .wrap{grid-template-columns:1fr 1fr}html[data-home="classic"] .stat{border-right:0;border-bottom:1px solid var(--deep-line);padding-left:0}}

/* ===== B. Expérience : le site se lit comme un puits ===== */
.dg{position:fixed;right:18px;top:50%;transform:translateY(-50%);z-index:25;width:58px;display:none;flex-direction:column;align-items:center;gap:10px;padding:14px 0 12px;border:1px solid var(--line);border-radius:999px;background:color-mix(in srgb,var(--surface) 88%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.3);backdrop-filter:blur(14px) saturate(1.3);box-shadow:0 14px 34px -16px rgba(4,16,31,.55)}

.dg-read{text-align:center;line-height:1;font-family:var(--f-mono);color:var(--ink)}
.dg-read b{display:block;font:600 .8rem/1 var(--f-mono);font-variant-numeric:tabular-nums}
.dg-read small{font:400 .6rem var(--f-mono);color:var(--muted);letter-spacing:.08em}
.dg-track{position:relative;width:2px;height:min(46vh,380px);background:var(--line);border-radius:2px}
.dg-fill{position:absolute;left:0;top:0;width:100%;height:var(--p,0%);background:linear-gradient(var(--cyan),var(--blue));border-radius:2px}
.dg-bit{position:absolute;left:50%;top:var(--p,0%);width:12px;height:12px;margin:-6px 0 0 -6px;background:var(--red);border:2px solid var(--surface);border-radius:50%;box-shadow:0 0 0 4px rgba(226,35,26,.2)}
.dg-ticks{list-style:none;margin:0;padding:0}
.dg-ticks button{all:unset;cursor:pointer;position:absolute;left:50%;top:var(--t);width:20px;height:20px;margin:-10px 0 0 -10px;display:grid;place-items:center}
.dg-ticks button::before{content:"";width:8px;height:2px;background:var(--muted);transition:width .2s,background .2s}
.dg-ticks button:hover::before,.dg-ticks button[aria-current="true"]::before{width:16px;background:var(--cyan)}
.dg-ticks button:focus-visible{outline:2px solid var(--cyan);border-radius:4px}
.dg-ticks button span{position:absolute;right:30px;top:50%;transform:translateY(-50%) translateX(6px);white-space:nowrap;opacity:0;pointer-events:none;font:500 .72rem var(--f-mono);letter-spacing:.04em;background:var(--deep);color:var(--on-deep);padding:6px 10px;border-radius:8px;transition:opacity .18s,transform .18s}
.dg-ticks button:hover span,.dg-ticks button:focus-visible span{opacity:1;transform:translateY(-50%)}
.dg-name{writing-mode:vertical-rl;transform:rotate(180deg);font:500 .64rem var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--sky);max-height:96px;overflow:hidden;white-space:nowrap}
@media(max-width:900px){.dg{right:auto;left:50%;top:auto;bottom:14px;transform:translateX(-50%);width:auto;flex-direction:row;padding:8px 16px;gap:10px}.dg-track,.dg-name{display:none}.dg-read{display:flex;gap:6px;align-items:baseline}}
/* hero : entrée, soulignement, parallaxe, halo curseur */
@keyframes hin{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
@keyframes hul{to{background-size:100% 4px}}
html[data-home="classic"][data-exp="on"] .hero-copy>*{animation:hin .8s cubic-bezier(.2,.7,.2,1) both}
html[data-home="classic"][data-exp="on"] .hero-copy>*:nth-child(2){animation-delay:.12s}
html[data-home="classic"][data-exp="on"] .hero-copy>*:nth-child(3){animation-delay:.26s}
html[data-home="classic"][data-exp="on"] .hero-copy>*:nth-child(4){animation-delay:.4s}
html[data-home="classic"][data-exp="on"] .hero h1 em{background:linear-gradient(var(--cyan),var(--cyan)) 0 100%/0 4px no-repeat;padding-bottom:.06em;animation:hul .9s .9s cubic-bezier(.2,.7,.2,1) forwards}
html[data-home="classic"][data-exp="on"] .hero-photo img{transform:translate3d(0,var(--py,0px),0) scale(1.08);will-change:transform}
html[data-exp="on"] .hero-photo::before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(circle 230px at var(--mx,70%) var(--my,45%),rgba(0,174,239,.26),transparent 70%);mix-blend-mode:screen;opacity:var(--mo,0);transition:opacity .35s}
html[data-exp="on"] .stat b{transition:color .3s}
/* interrupteur de comparaison */
.home-sw{position:fixed;left:16px;bottom:16px;z-index:40;display:inline-flex;gap:2px;padding:3px;border-radius:999px;background:var(--deep);border:1px solid var(--deep-line);box-shadow:0 10px 26px -12px rgba(0,0,0,.6)}
.home-sw button{all:unset;cursor:pointer;padding:7px 13px;border-radius:999px;font:500 .7rem var(--f-mono);letter-spacing:.03em;color:var(--on-deep-muted)}
.home-sw button[aria-pressed="true"]{background:var(--cyan);color:#041526}
.home-sw button:focus-visible{outline:3px solid var(--cyan);outline-offset:2px}
@media(max-width:560px){.home-sw{left:8px;bottom:62px}.home-sw button{padding:6px 10px}}
@media(prefers-reduced-motion:reduce){html[data-home="classic"][data-exp="on"] .hero-copy>*{animation:none}html[data-home="classic"][data-exp="on"] .hero h1 em{animation:none;background-size:100% 4px}html[data-home="classic"][data-exp="on"] .hero-photo img{transform:scale(1.04)}}
/* accueil:css:end */
"""

MARKUP = """<!-- accueil:markup:start -->
<div class="home-sw" role="group" aria-label="Maquette : comparer l'accueil"><button type="button" data-exp="off" aria-pressed="false">Accueil · modèle d'origine</button><button type="button" data-exp="on" aria-pressed="true">Accueil · expérience</button></div>
<!-- accueil:markup:end -->
"""

JS = r"""<!-- accueil:js:start -->
<script>
(function(){
  const root=document.documentElement,RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const ph=document.querySelector('.hero-photo');
  function par(){if(!RM&&root.dataset.exp==='on'&&ph&&scrollY<innerHeight*1.2)ph.style.setProperty('--py',(scrollY*.14)+'px')}
  let tk=false;addEventListener('scroll',()=>{if(!tk){tk=true;requestAnimationFrame(()=>{par();tk=false})}},{passive:true});
  if(ph&&!RM){ph.addEventListener('pointermove',e=>{const r=ph.getBoundingClientRect();ph.style.setProperty('--mx',(e.clientX-r.left)+'px');ph.style.setProperty('--my',(e.clientY-r.top)+'px');ph.style.setProperty('--mo',1)});ph.addEventListener('pointerleave',()=>ph.style.setProperty('--mo',0))}
  function countUp(){
    if(RM||root.dataset.exp!=='on')return;
    document.querySelectorAll('.stats .stat b').forEach(b=>{const n=b.firstChild;if(!n||n.nodeType!==3)return;const orig=n.nodeValue,m=orig.match(/^([\d][\d\s\u00a0\u202f.,]*)(.*)$/);if(!m)return;
      const val=+m[1].replace(/\D/g,''),sep=(m[1].match(/\d([^\d])\d/)||[])[1]||'';if(!val)return;const t0=performance.now(),D=1300;
      (function step(now){const k=Math.min(1,(now-t0)/D),e=1-Math.pow(1-k,3),cur=Math.round(val*e);
        n.nodeValue=(sep?String(cur).replace(/\B(?=(\d{3})+(?!\d))/g,sep):String(cur))+m[2];if(k<1)requestAnimationFrame(step);else n.nodeValue=orig})(t0)})}
  const sw=document.querySelectorAll('.home-sw button');
  function setExp(v){root.dataset.exp=v;sw.forEach(b=>b.setAttribute('aria-pressed',b.dataset.exp===v));if(ph){if(v==='on')ph.style.setProperty('--py','0px');else ph.style.removeProperty('--py')}if(v==='on')countUp()}
  sw.forEach(b=>b.addEventListener('click',()=>setExp(b.dataset.exp)));
  countUp();
})();
</script>
<!-- accueil:js:end -->
"""

EN_ADD = {
        "Maquette : comparer l'accueil": "Mockup: compare the home page",
    "Accueil · modèle d'origine": "Home · original model",
    "Accueil · expérience": "Home · experience",
    # clés de l'accueil qui ne s'appliquaient pas (espace insécable dans la clé d'origine)
    "Services et outils de forage pour la géothermie, le pétrole, le gaz, le stockage souterrain et les forages d'eau. Un stock de 2 500 outils, un atelier intégré, des équipes mobilisables sous 24/48h.": "Drilling services and tools for geothermal, oil, gas, underground storage and water wells. A stock of 2,500 tools, an in-house workshop and teams ready to mobilise within 24/48h.",
    "Chantier en France": "Site in France",
    "Géothermie": "Geothermal",
}

# la page n'a pas de balise <html> : les attributs sont posés par un script en tête de fichier
t = re.sub(r"<!-- accueil:attr:start -->.*?<!-- accueil:attr:end -->\n", "", t, flags=re.S)
t = "<!-- accueil:attr:start --><script>document.documentElement.dataset.home='classic';document.documentElement.dataset.exp='on'</script><!-- accueil:attr:end -->\n" + t
# polices de l'ancien modèle
if "family=Barlow+Condensed" not in t.split("</head>")[0] if "</head>" in t else True:
    t = t.replace("family=Plus+Jakarta+Sans", "family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&family=Plus+Jakarta+Sans", 1)
# blocs
t = re.sub(r"\n/\* accueil:css:start \*/.*?/\* accueil:css:end \*/\n", "\n", t, flags=re.S)
t = t.replace("</style>", CSS + "</style>", 1)
t = re.sub(r"<!-- accueil:markup:start -->.*?<!-- accueil:markup:end -->\n", "", t, flags=re.S)
t = re.sub(r"<!-- accueil:js:start -->.*?<!-- accueil:js:end -->\n", "", t, flags=re.S)
tail = MARKUP + JS
if "</body>" in t: t = t.replace("</body>", tail + "</body>", 1)
elif "</html>" in t: t = t.replace("</html>", tail + "</html>", 1)
else: t = t.rstrip("\n") + "\n" + tail
# traductions
t = re.sub(r'/\*accueil-en\*/(?:"[^"]*":"[^"]*",)*/\*end\*/', "", t)
js = "".join('"%s":"%s",' % (k.replace('"', '\\"'), v.replace('"', '\\"')) for k, v in EN_ADD.items())
t = t.replace("const EN={", "const EN={/*accueil-en*/" + js + "/*end*/", 1)
open(HTML, "w", encoding="utf8").write(t)
print("ok", len(t))
