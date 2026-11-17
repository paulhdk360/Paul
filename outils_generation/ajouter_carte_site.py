"""Ajoute à la maquette du site (enedril-maquette.html) la section « Où nous trouver » :
carte de l'Europe (SVG inline, thème clair/sombre, FR/EN) avec Enedril positionné à Lons, près de Pau.
Idempotent : remplace le bloc s'il existe déjà. Usage : python3 outils_generation/ajouter_carte_site.py"""
import re

HTML = "enedril-maquette.html"
SVG = "carte_europe/carte_europe_site.svg"
t = open(HTML, encoding="utf8").read()
svg = open(SVG, encoding="utf8").read()
svg = re.sub(r' width="\d+" height="\d+"', ' preserveAspectRatio="xMidYMid slice"', svg, count=1)

CSS = """
/* carte-europe:css:start */
#localisation{background:var(--bg)}
.loc{display:grid;grid-template-columns:1.55fr .85fr;gap:clamp(24px,4vw,48px);align-items:stretch}
.loc>*{min-width:0}
.map{margin:0;position:relative;background:var(--deep);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 18px 40px -24px rgba(4,16,31,.55)}
.map svg{display:block;width:100%;height:auto}
.map figcaption{position:absolute;left:14px;bottom:12px;font:400 .68rem var(--f-mono);letter-spacing:.06em;color:var(--on-deep-muted);background:rgba(4,16,31,.72);padding:5px 9px;border-radius:6px}
.m-sea{fill:var(--deep)}
.m-grat{fill:none;stroke:var(--deep-line);stroke-width:.6;opacity:.75}
.m-land{fill:var(--deep2);stroke:var(--deep-line);stroke-width:.8;stroke-linejoin:round}
.m-fr{fill:var(--sky);stroke:rgba(255,255,255,.7);stroke-width:.9;stroke-linejoin:round}
.m-city{fill:var(--on-deep-muted)} .m-city.on-fr{fill:#fff}
.m-lab{font:500 15px var(--f-mono);fill:var(--on-deep-muted);letter-spacing:.04em}
.m-lab.on-fr{fill:#fff}
.m-ring{fill:none;stroke:var(--cyan);stroke-width:1.4;transform-box:fill-box;transform-origin:center}
.m-dot{fill:var(--red);stroke:#fff;stroke-width:2.2}
.m-lead{stroke:var(--on-deep);stroke-width:1.2;fill:none;opacity:.85}
.m-tag{fill:var(--surface);stroke:var(--cyan);stroke-width:1}
.m-tagt{font:700 18.5px var(--f-mono);fill:var(--ink);letter-spacing:.06em}
.m-tags{font:400 14.5px var(--f-mono);fill:var(--sky)}
@keyframes mring{0%{transform:scale(.5);opacity:.95}100%{transform:scale(1.6);opacity:0}}
.m-ring{animation:mring 3.4s ease-out infinite}.m-ring.r1{animation-delay:1.1s}.m-ring.r2{animation-delay:2.2s}
@media(prefers-reduced-motion:reduce){.m-ring{animation:none}}
.loc-facts{display:grid;gap:14px;align-content:start}
.loc-facts>div{background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--cyan);border-radius:6px;padding:16px 18px;display:grid;gap:4px}
.loc-facts>div:nth-child(1){border-left-color:var(--blue)}.loc-facts>div:nth-child(2){border-left-color:var(--sky)}
.loc-facts small{font:500 .7rem var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--sky)}
.loc-facts b{font:600 1.35rem/1.1 var(--f-display);letter-spacing:.005em}
.loc-facts span{color:var(--muted);font-size:.95rem}
@media(max-width:900px){.loc{grid-template-columns:1fr}}
@media(max-width:560px){.map figcaption{display:none}}
/* carte-europe:css:end */
"""

SECTION = """<!-- carte-europe:start -->
<section id="localisation" data-depth="2900">
  <div class="wrap">
    <div class="sec-head"><div class="eyebrow">Où nous trouver</div><h2>Basés à Lons, près de Pau, au service de la France et de l'Europe</h2><p>Deux ateliers, un stock d'outils et des équipes mobilisables depuis le sud-ouest de la France.</p></div>
    <div class="loc">
      <figure class="map">
        %s
        <figcaption>43°19′ N · 0°22′ O</figcaption>
      </figure>
      <div class="loc-facts">
        <div><small>Siège et ateliers</small><b>Lons (64), près de Pau</b><span>Deux ateliers de plus de 1 000 m² et 3 500 m² de parc extérieur.</span></div>
        <div><small>France métropolitaine</small><b>Intervention sous 24/48 h</b><span>Fishing : une réponse rapide partout en France.</span></div>
        <div><small>Europe et Afrique du Nord</small><b>Interventions à l'international</b><span>Géothermie, pétrole et gaz, stockage souterrain de gaz.</span></div>
      </div>
    </div>
  </div>
</section>
<!-- carte-europe:end -->
""" % svg

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
    "Londres": "London", "Alger": "Algiers",
    "43°19′ N · 0°22′ O": "43°19′ N · 0°22′ W",
    "Carte de l'Europe : Enedril est basé à Lons, près de Pau (France)": "Map of Europe: Enedril is based in Lons, near Pau (France)",
}

# 1) CSS (avant la fin du premier bloc <style>)
t = re.sub(r"\n/\* carte-europe:css:start \*/.*?/\* carte-europe:css:end \*/\n", "\n", t, flags=re.S)
t = t.replace("</style>", CSS + "</style>", 1)
# 2) section (juste avant Contact)
t = re.sub(r"<!-- carte-europe:start -->.*?<!-- carte-europe:end -->\n", "", t, flags=re.S)
t = t.replace('<section id="contact"', SECTION + '\n<section id="contact"', 1)
# 3) traductions FR -> EN
t = re.sub(r'/\*carte-europe-en\*/(?:"[^"]*":"[^"]*",)*/\*end\*/', "", t)
js = "".join('"%s":"%s",' % (k.replace('"', '\\"'), v.replace('"', '\\"')) for k, v in EN_ADD.items())
assert "const EN={" in t
t = t.replace("const EN={", "const EN={/*carte-europe-en*/" + js + "/*end*/", 1)
open(HTML, "w", encoding="utf8").write(t)
print("ok", len(t))
