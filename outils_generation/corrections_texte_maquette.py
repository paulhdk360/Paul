"""Corrections de texte de la maquette : hero « 3 000 mètres et plus », MWD sans mention -20 °C (185 °C conservé),
tableau des capteurs MWD en blanc. Idempotent. Usage : python3 outils_generation/corrections_texte_maquette.py"""
import re
H = "enedril-maquette.html"
t = open(H, encoding="utf8").read()
t = t.replace("&amp; fishing, <em>de 300<br>à 3 000 m</em>", "&amp; fishing,<br><em>3 000 mètres et plus</em>")
t = t.replace("&amp; fishing, <em>3 000 mètres<br>et plus</em>", "&amp; fishing,<br><em>3 000 mètres et plus</em>")
t = t.replace("&amp; fishing,<br><em>3 000 mètres<br>et plus</em>", "&amp; fishing,<br><em>3 000 mètres et plus</em>")
t = t.replace('<b>−20 à 185 <i>°C</i></b>', '<b>185 <i>°C</i></b>')
CSS = "\n/* corr:css:start */\n.sensor td{color:#fff}\n.sensor tbody td:first-child{color:#fff;font-weight:500}\n/* corr:css:end */\n"
t = re.sub(r"\n/\* corr:css:start \*/.*?/\* corr:css:end \*/\n", "\n", t, flags=re.S)
t = t.replace("</style>", CSS + "</style>", 1)
t = re.sub(r'/\*corr-en\*/(?:"[^"]*":"[^"]*",)*/\*end\*/', "", t)
t = t.replace("const EN={", 'const EN={/*corr-en*/"3 000 mètres et plus":"3,000 metres and more",/*end*/', 1)
open(H, "w", encoding="utf8").write(t)
print("ok", "<em>3 000 mètres et plus</em>" in t, "<b>185 <i>°C</i></b>" in t)
