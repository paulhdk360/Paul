"""Ajoute à la maquette du site (enedril-maquette.html) la section « Où nous trouver » :
carte de l'Europe (SVG inline, thème clair/sombre, FR/EN) avec Enedril positionné à Lons, près de Pau, et Berne.
Deux présentations, au choix dans la maquette (interrupteur A / B) :
  A : carte + encarts côte à côte   B : carte immersive pleine largeur avec panneau flottant
Les encarts sont des boutons : un clic met en valeur le siège, la France ou l'Europe sur la carte.
Idempotent : remplace les blocs s'ils existent déjà. Usage : python3 outils_generation/ajouter_carte_site.py"""
import re

HTML = "enedril-maquette.html"
SVG = "carte_europe/carte_europe_site.svg"
t = open(HTML, encoding="utf8").read()
svg = open(SVG, encoding="utf8").read()
svg = re.sub(r' width="\d+" height="\d+"', ' preserveAspectRatio="xMidYMid slice"', svg, count=1)
svg = svg.replace("<svg ", '<svg id="map-eu" data-mode="hq" ', 1)
MOBILE_FIX = "#localisation[data-view=\"b\"] .map{height:auto}#localisation[data-view=\"b\"] .map svg{height:auto}"

CSS = """
/* carte-europe:css:start */
#localisation{background:var(--bg)}
.loc{display:grid;grid-template-columns:1.55fr .85fr;gap:clamp(24px,4vw,48px);align-items:stretch;position:relative}
.loc>*{min-width:0}
.map{margin:0;position:relative;background:var(--deep);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 18px 40px -24px rgba(4,16,31,.55)}
.map svg{display:block;width:100%;height:auto}
.map figcaption{position:absolute;left:14px;bottom:12px;font:400 .68rem var(--f-mono);letter-spacing:.06em;color:var(--on-deep-muted);background:rgba(4,16,31,.72);padding:5px 9px;border-radius:6px}
.m-sea{fill:var(--deep)}
.m-grat{fill:none;stroke:var(--deep-line);stroke-width:.6;opacity:.75}
.m-land{fill:var(--deep2);stroke:var(--deep-line);stroke-width:.8;stroke-linejoin:round;transition:fill .45s,opacity .45s,fill-opacity .45s}
.m-fr{fill:var(--sky);stroke:rgba(255,255,255,.7);stroke-width:.9;stroke-linejoin:round;transition:fill .45s,stroke .45s,stroke-width .45s,filter .45s}
.m-city{fill:var(--on-deep-muted)} .m-city.on-fr{fill:#fff}
.m-lab{font:500 15px var(--f-mono);fill:var(--on-deep-muted);letter-spacing:.04em;transition:fill .45s}
.m-lab.on-fr{fill:#fff}
.m-ring{fill:none;stroke:var(--cyan);stroke-width:1.4;transform-box:fill-box;transform-origin:center}
.m-dot{fill:var(--red);stroke:#fff;stroke-width:2.2}
.m-lead{stroke:var(--on-deep);stroke-width:1.2;fill:none;opacity:.85}
.m-tag{fill:var(--surface);stroke:var(--cyan);stroke-width:1}
.m-tagt{font:700 18.5px var(--f-mono);fill:var(--ink);letter-spacing:.06em}
.m-tags{font:400 14.5px var(--f-mono);fill:var(--sky)}
@keyframes mring{0%{transform:scale(.5);opacity:.95}100%{transform:scale(1.6);opacity:0}}
.m-ring{animation:mring 3.4s ease-out infinite}.m-ring.r1{animation-delay:1.1s}.m-ring.r2{animation-delay:2.2s}
@media(prefers-reduced-motion:reduce){.m-ring{animation:none}.m-land,.m-fr,.m-lab{transition:none}}
/* modes de la carte (clic sur un encart) */
#map-eu[data-mode="fr"] .m-land{fill-opacity:.45}
#map-eu[data-mode="fr"] .m-fr{stroke:var(--cyan);stroke-width:2.4;filter:drop-shadow(0 0 9px rgba(0,174,239,.65))}
#map-eu[data-mode="eu"] .m-land{fill:var(--sky);fill-opacity:.34;stroke:rgba(255,255,255,.3)}
#map-eu[data-mode="eu"] .m-lab{fill:#fff}
.loc-facts{display:grid;gap:14px;align-content:start}
.fact{all:unset;box-sizing:border-box;cursor:pointer;background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--cyan);border-radius:6px;padding:16px 18px;display:grid;gap:4px;transition:transform .15s,box-shadow .15s,background .2s}
.fact:hover{transform:translateX(3px);box-shadow:0 10px 24px -16px rgba(4,16,31,.5)}
.fact:focus-visible{outline:3px solid var(--cyan);outline-offset:2px}
.fact:nth-child(1){border-left-color:var(--blue)}.fact:nth-child(2){border-left-color:var(--sky)}
.fact[aria-pressed="true"]{box-shadow:0 0 0 2px var(--cyan) inset}
.fact small{font:500 .7rem var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--sky)}
.fact b{font:600 1.35rem/1.1 var(--f-display);letter-spacing:.005em}
.fact span{color:var(--muted);font-size:.95rem}
.mock-switch{display:inline-flex;gap:2px;padding:3px;margin-bottom:24px;border:1px dashed var(--line);border-radius:999px}
.mock-switch button{all:unset;cursor:pointer;padding:7px 14px;border-radius:999px;font:500 .72rem var(--f-mono);letter-spacing:.04em;color:var(--muted)}
.mock-switch button[aria-pressed="true"]{background:var(--blue);color:#fff}
.mock-switch button:focus-visible{outline:3px solid var(--cyan);outline-offset:2px}
@media(max-width:900px){.loc{grid-template-columns:1fr}}
@media(max-width:560px){.map figcaption{display:none}}
/* présentation B : carte immersive pleine largeur, panneau flottant */
#localisation[data-view="b"]{background:var(--deep);color:var(--on-deep);overflow:hidden}
#localisation[data-view="b"] .eyebrow{color:var(--cyan)}
#localisation[data-view="b"] .sec-head p{color:var(--on-deep-muted)}
#localisation[data-view="b"] .mock-switch{border-color:var(--deep-line)}
#localisation[data-view="b"] .mock-switch button{color:var(--on-deep-muted)}
#localisation[data-view="b"] .mock-switch button[aria-pressed="true"]{background:var(--cyan);color:#041526}
#localisation[data-view="b"] .loc{display:block}
#localisation[data-view="b"] .map{width:100vw;margin-inline:calc(50% - 50vw);border-radius:0;border-inline:0;box-shadow:none;height:clamp(440px,54vw,640px)}
#localisation[data-view="b"] .map svg{width:100%;height:100%}
#localisation[data-view="b"] .m-lab{font-size:11.5px}
#localisation[data-view="b"] .map figcaption{left:max(20px,calc(50vw - 590px));bottom:16px}
#localisation[data-view="b"] .loc-facts{position:absolute;right:0;top:50%;transform:translateY(-50%);width:min(390px,40%);gap:8px;padding:12px;background:rgba(4,16,31,.74);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--deep-line);border-radius:18px}
#localisation[data-view="b"] .fact{background:rgba(255,255,255,.04);border-color:var(--deep-line);border-left-width:4px;padding:12px 14px}
#localisation[data-view="b"] .fact b{font-size:1.2rem;color:var(--on-deep)}
#localisation[data-view="b"] .fact span{color:var(--on-deep-muted);font-size:.86rem}
#localisation[data-view="b"] .fact small{color:var(--cyan)}
#localisation[data-view="b"] .fact[aria-pressed="true"]{background:rgba(0,174,239,.16);box-shadow:0 0 0 1px var(--cyan) inset}
@media(max-width:900px){#localisation[data-view="b"] .loc-facts{position:static;transform:none;width:auto;margin-top:14px}#localisation[data-view="b"] .map{height:clamp(300px,70vw,460px)}#localisation[data-view="b"] .map svg{preserveAspectRatio:xMidYMid meet}}
@media(max-width:900px){#localisation[data-view="b"] .map{height:auto}#localisation[data-view="b"] .map svg{height:auto}#localisation[data-view="b"] .m-lab{font-size:15px}}
/* carte-europe:css:end */
"""

SECTION = """<!-- carte-europe:start -->
<section id="localisation" data-depth="2900" data-view="a">
  <div class="wrap">
    <div class="sec-head"><div class="eyebrow">Où nous trouver</div><h2>Basés à Lons, près de Pau, au service de la France et de l'Europe</h2><p>Deux ateliers, un stock d'outils et des équipes mobilisables depuis le sud-ouest de la France.</p></div>
    <div class="mock-switch" role="group" aria-label="Maquette : choisir la présentation de la carte"><button type="button" data-v="a" aria-pressed="true">Présentation A · carte et encarts</button><button type="button" data-v="b" aria-pressed="false">Présentation B · carte immersive</button></div>
    <div class="loc">
      <figure class="map">
        %s
        <figcaption>43°19′ N · 0°22′ O</figcaption>
      </figure>
      <div class="loc-facts" role="group" aria-label="Zones d'intervention">
        <button type="button" class="fact" data-mode="hq" aria-pressed="true"><small>Siège et ateliers</small><b>Lons (64), près de Pau</b><span>Deux ateliers de plus de 1 000 m² et 3 500 m² de parc extérieur.</span></button>
        <button type="button" class="fact" data-mode="fr" aria-pressed="false"><small>France métropolitaine</small><b>Intervention sous 24/48 h</b><span>Fishing : une réponse rapide partout en France.</span></button>
        <button type="button" class="fact" data-mode="eu" aria-pressed="false"><small>Europe et Afrique du Nord</small><b>Interventions à l'international</b><span>Géothermie, pétrole et gaz, stockage souterrain de gaz.</span></button>
      </div>
    </div>
  </div>
</section>
<!-- carte-europe:end -->
""" % svg

JS = """<!-- carte-europe:js:start -->
<script>
(function(){
  const sec=document.getElementById('localisation'),map=document.getElementById('map-eu');if(!sec||!map)return;
  sec.querySelectorAll('.mock-switch button').forEach(b=>b.addEventListener('click',()=>{
    sec.dataset.view=b.dataset.v;sec.querySelectorAll('.mock-switch button').forEach(x=>x.setAttribute('aria-pressed',x===b))}));
  sec.querySelectorAll('.fact').forEach(f=>f.addEventListener('click',()=>{
    map.dataset.mode=f.dataset.mode;sec.querySelectorAll('.fact').forEach(x=>x.setAttribute('aria-pressed',x===f))}));
})();
</script>
<!-- carte-europe:js:end -->
"""

EN_ADD = {
    "Où nous trouver": "Where to find us",
    "Basés à Lons, près de Pau, au service de la France et de l'Europe": "Based in Lons, near Pau, serving France and Europe",
    "Deux ateliers, un stock d'outils et des équipes mobilisables depuis le sud-ouest de la France.": "Two workshops, a tool stock and teams ready to mobilise from the south-west of France.",
    "Siège et ateliers": "Headquarters and workshops",
    "Lons (64), près de Pau": "Lons (64), near Pau",
    "Deux ateliers de plus de 1 000 m² et 3 500 m² de parc extérieur.": "Two workshops of more than 1,000 m² and a 3,500 m² outdoor yard.",
    "France métropolitaine": "Metropolitan France",
    "Intervention sous 24/48 h": "Response within 24/48 h",
    "Fishing : une réponse rapide partout en France.": "Fishing: a fast response anywhere in France.",
    "Europe et Afrique du Nord": "Europe and North Africa",
    "Interventions à l'international": "International interventions",
    "Géothermie, pétrole et gaz, stockage souterrain de gaz.": "Geothermal, oil and gas, underground gas storage.",
    "Londres": "London", "Alger": "Algiers", "Berne": "Bern",
    "43°19′ N · 0°22′ O": "43°19′ N · 0°22′ W",
    "Carte de l'Europe : Enedril est basé à Lons, près de Pau (France)": "Map of Europe: Enedril is based in Lons, near Pau (France)",
    "Maquette : choisir la présentation de la carte": "Mockup: choose the map layout",
    "Présentation A · carte et encarts": "Layout A · map and cards",
    "Présentation B · carte immersive": "Layout B · immersive map",
    "Zones d'intervention": "Areas of operation",
}

# 1) CSS
t = re.sub(r"\n/\* carte-europe:css:start \*/.*?/\* carte-europe:css:end \*/\n", "\n", t, flags=re.S)
t = t.replace("</style>", CSS + "</style>", 1)
# 2) section (juste avant Contact)
t = re.sub(r"<!-- carte-europe:start -->.*?<!-- carte-europe:end -->\n", "", t, flags=re.S)
t = t.replace('<section id="contact"', SECTION + '\n<section id="contact"', 1)
# 3) script d'interaction (avant la fin du body)
t = re.sub(r"<!-- carte-europe:js:start -->.*?<!-- carte-europe:js:end -->\n", "", t, flags=re.S)
if "</body>" in t: t = t.replace("</body>", JS + "</body>", 1)
elif "</html>" in t: t = t.replace("</html>", JS + "</html>", 1)
else: t = t.rstrip("\n") + "\n" + JS
# 4) traductions FR -> EN
t = re.sub(r'/\*carte-europe-en\*/(?:"[^"]*":"[^"]*",)*/\*end\*/', "", t)
js = "".join('"%s":"%s",' % (k.replace('"', '\\"'), v.replace('"', '\\"')) for k, v in EN_ADD.items())
assert "const EN={" in t
t = t.replace("const EN={", "const EN={/*carte-europe-en*/" + js + "/*end*/", 1)
open(HTML, "w", encoding="utf8").write(t)
print("ok", len(t))
