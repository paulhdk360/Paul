"""Carte de visite Enedril - Paul Hynderick (85 x 55 mm, fond perdu 3 mm).
Génère : recto/verso HTML, PDF avec repères de coupe, masques de vernis sélectif, aperçus PNG.
Usage : python3 generer_cartes.py   (nécessite segno, playwright/chromium, pypdf, reportlab, pdftoppm)"""
import io, math, os, subprocess, sys
import segno
from pypdf import PdfReader, PdfWriter, Transformation
from pypdf.generic import RectangleObject
from reportlab.pdfgen import canvas

HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)
ROOT = os.path.dirname(HERE)
FONTS = "../voeux_2027/polices"
LOGO_B = "../stand-geotherm-2027/00_Logo_vectoriel/Enedril_logo_blanc_sans_baseline.svg"
LOGO_C = "../stand-geotherm-2027/00_Logo_vectoriel/Enedril_logo_couleur_sans_baseline.svg"

P = dict(nom="Paul Hynderick", titre="Chargé de marketing &amp; commercial francophone",
         titre_en="Marketing &amp; Sales · French-speaking markets",
         tel="+33 (0)5 59 04 50 45", mail="phynderick@enedril.fr", web="www.enedril.com",
         adr1="3 avenue des Lacs", adr2="64140 Lons · France")

# --- QR vCard (enregistrement du contact en un scan)
vcard = ("BEGIN:VCARD\nVERSION:3.0\nN:Hynderick;Paul;;;\nFN:Paul Hynderick\nORG:Enedril\n"
         "TITLE:Chargé de marketing & commercial francophone\nTEL;TYPE=WORK,VOICE:+33559045045\n"
         f"EMAIL;TYPE=WORK:{P['mail']}\nURL:https://{P['web']}\n"
         "ADR;TYPE=WORK:;;3 avenue des Lacs;Lons;;64140;France\nEND:VCARD")
qr = segno.make(vcard, error="m", micro=False)
buf = io.BytesIO(); qr.save(buf, kind="svg", scale=1, border=0, dark="#08203F", light=None, xmldecl=False, svgns=True, nl=False)
QR_SVG = buf.getvalue().decode()

CSS = f"""
@font-face{{font-family:'BC';src:url('{FONTS}/BarlowCondensed-Bold.ttf');font-weight:700}}
@font-face{{font-family:'BC';src:url('{FONTS}/BarlowCondensed-SemiBold.ttf');font-weight:600}}
@font-face{{font-family:'BC';src:url('{FONTS}/BarlowCondensed-Medium.ttf');font-weight:500}}
@font-face{{font-family:'B';src:url('{FONTS}/Barlow-Regular.ttf');font-weight:400}}
@font-face{{font-family:'B';src:url('{FONTS}/Barlow-Medium.ttf');font-weight:500}}
@font-face{{font-family:'B';src:url('{FONTS}/Barlow-SemiBold.ttf');font-weight:600}}
@page{{size:91mm 61mm;margin:0}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:91mm;height:61mm;overflow:hidden;background:#fff}}
.card{{position:relative;width:91mm;height:61mm;overflow:hidden}}
.abs{{position:absolute}}
svg.full{{position:absolute;left:0;top:0;width:91mm;height:61mm}}
/* masque vernis : tout est invisible sauf les zones .uv, rendues en noir plein */
body.mask .card{{background:#fff !important}}
body.mask .card *{{visibility:hidden}}
body.mask .uv,body.mask .uv *{{visibility:visible}}
body.mask .uv text,body.mask .uv path,body.mask .uv circle{{fill:#000;stroke:#000}}
body.mask .uv.nofill circle{{fill:none}}
body.mask .uv{{color:#000 !important}}
body.mask img.uv{{filter:brightness(0)}}
"""

def rings(cx, cy, uv_r, fine, stroke_fine, stroke_uv, opac_fine, col_fine="#33b5ff", col_uv="#5fd0ff"):
    s = ""
    r = 3.5
    while r < 70:
        if not any(abs(r - u) < .01 for u in uv_r):
            o = max(.12, opac_fine * (1 - r / 110))
            s += f'<circle cx="{cx}" cy="{cy}" r="{r:.2f}" fill="none" stroke="{col_fine}" stroke-width="{stroke_fine}" opacity="{o:.3f}"/>'
        r += fine
    return s

def recto(mask=False):
    cx, cy = 80, 57
    uv = [9.0, 16.0, 23.0, 30.0]
    fine = rings(cx, cy, uv, 3.5, .14, .5, .75, col_fine="url(#fade)")
    uvc = "".join(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#7fe0ff" stroke-width=".55" opacity="1"/>' for r in uv)
    ticks = ""
    for i in range(0, 41):
        y = 12 + i * 1.0; big = i % 5 == 0
        ticks += f'<line x1="{88 - (2.6 if big else 1.4)}" y1="{y}" x2="88" y2="{y}" stroke="#bfe8ff" stroke-width="{.14 if big else .09}" opacity="{.55 if big else .32}"/>'
    labels = "".join(f'<text x="{83.6}" y="{12 + i * 5 + .55}" font-family="B" font-size="1.55" fill="#9fdcff" opacity=".6" text-anchor="end">0 m</text>' for i in range(0, 1))
    body = f"""
<div class="card" style="background:radial-gradient(130% 150% at 86% 100%,#12498f 0%,#0b2f5d 32%,#071c38 62%,#030a14 100%)">
 <svg class="full" viewBox="0 0 91 61" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="fade" gradientUnits="userSpaceOnUse" x1="36" y1="0" x2="74" y2="0"><stop offset="0" stop-color="#33b5ff" stop-opacity="0"/><stop offset="1" stop-color="#33b5ff" stop-opacity="1"/></linearGradient></defs>
  <g>{fine}</g><g>{ticks}</g><g>{labels}</g>
  <g class="uv nofill">{uvc}</g>
  <line x1="0" y1="0.01" x2="91" y2="0.01" stroke="#000" stroke-width="0" />
 </svg>
 <img class="abs uv" src="{LOGO_B}" style="left:11mm;top:22mm;width:43mm">
 <div class="abs" style="left:11.1mm;top:34.6mm;width:9mm;height:.7mm;background:#e2231a"></div>
 <div class="abs uv" style="left:11mm;top:37.6mm;font:600 6pt 'BC';letter-spacing:.24em;color:#8fdcff;white-space:nowrap">DIRECTIONAL DRILLING &amp; FISHING</div>
 <div class="abs" style="left:11mm;top:50.8mm;font:500 4.5pt 'B';letter-spacing:.22em;color:#7fa9cf;opacity:.85">LONS · FRANCE</div>
</div>"""
    return html(body, mask)

def verso(mask=False):
    arcs = "".join(f'<circle cx="86" cy="6" r="{r}" fill="none" stroke="#0A4FA0" stroke-width="{w}" opacity="{o}"/>' for r, w, o in ((10, .1, .22), (14, .1, .18), (18, .1, .14), (22, .1, .1), (26, .1, .08)))
    arcs_uv = "".join(f'<circle cx="86" cy="6" r="{r}" fill="none" stroke="#0A4FA0" stroke-width=".45"/>' for r in (12, 20))
    icon = lambda d: f'<svg viewBox="0 0 24 24" width="2.6mm" height="2.6mm" style="flex:none"><path d="{d}" fill="#0083CB"/></svg>'
    I_TEL = "M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"
    I_MAIL = "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4.2 7 4 7.2V8l8 5 8-5V7.2L19.8 7z"
    I_WEB = "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 9h-3a15.6 15.6 0 0 0-1.4-6A8 8 0 0 1 18.9 11zM12 4c.8 1 1.7 3.2 1.9 7h-3.8C10.3 7.200 11.200 5 12 4zM4.600 13h3a15.600 15.600 0 0 0 1.400 6A8 8 0 0 1 4.600 13zm3-2h-3A8 8 0 0 1 9 5a15.600 15.600 0 0 0-1.400 6zM12 20c-.8-1-1.700-3.200-1.900-7h3.800c-.2 3.800-1.100 6-1.900 7zm3-1a15.600 15.600 0 0 0 1.400-6h3A8 8 0 0 1 15 19z"
    I_PIN = "M12 2a7 7 0 0 0-7 7c0 5.200 7 13 7 13s7-7.800 7-13a7 7 0 0 0-7-7zm0 9.500A2.500 2.500 0 1 1 12 6.500a2.500 2.500 0 0 1 0 5z"
    row = lambda ic, tx, bold=False: f'<div style="display:flex;align-items:center;gap:1.7mm;height:3.9mm">{icon(ic)}<span style="font:{500 if not bold else 600} 6.4pt \'B\';color:#0B1B2E;white-space:nowrap">{tx}</span></div>'
    body = f"""
<div class="card" style="background:linear-gradient(180deg,#ffffff 0%,#f1f6fb 100%)">
 <svg class="full" viewBox="0 0 91 61" xmlns="http://www.w3.org/2000/svg"><g>{arcs}</g><g class="uv nofill">{arcs_uv}</g></svg>
 <img class="abs" src="{LOGO_C}" style="left:7.2mm;top:7mm;width:21mm">
 <div class="abs" style="left:7.2mm;top:16.4mm;font:700 17.5pt/1 'BC';letter-spacing:.015em;color:#08203F;text-transform:uppercase;white-space:nowrap">Paul <span style="color:#0A4FA0">Hynderick</span></div>
 <div class="abs" style="left:7.2mm;top:22.4mm;font:600 6.5pt 'B';color:#0A4FA0;white-space:nowrap">{P['titre']}</div>
 <div class="abs" style="left:7.2mm;top:25.7mm;font:400 italic 5pt 'B';color:#51647A;white-space:nowrap">{P['titre_en']}</div>
 <div class="abs" style="left:7.2mm;top:30.2mm;width:8mm;height:.5mm;background:#e2231a"></div>
 <div class="abs" style="left:7.2mm;top:32.6mm">{row(I_TEL,P['tel'])}{row(I_MAIL,P['mail'])}{row(I_WEB,P['web'],True)}{row(I_PIN,P['adr1']+' · '+P['adr2'])}</div>
 <div class="abs" style="left:62.2mm;top:10mm;width:22.6mm;height:25.6mm;background:#fff;border-radius:2mm;box-shadow:0 .4mm 1.6mm rgba(8,32,63,.22);border:.25mm solid #d5dee8">
   <div style="position:absolute;left:2.4mm;top:2.4mm;width:17.8mm;height:17.8mm">{QR_SVG.replace('<svg ','<svg style="width:100%;height:100%;display:block" ',1)}</div>
   <div style="position:absolute;left:0;right:0;top:20.7mm;text-align:center;font:600 4.3pt 'B';letter-spacing:.06em;color:#08203F">SCAN · SAVE CONTACT</div>
 </div>
 <div class="abs" style="left:0;top:52.1mm;width:91mm;height:8.9mm;background:linear-gradient(90deg,#08203F,#0c2d57)"></div>
 <div class="abs" style="left:7.2mm;top:55.3mm;font:600 5.2pt 'BC';letter-spacing:.3em;color:#fff;white-space:nowrap">DIRECTIONAL DRILLING &amp; FISHING</div>
 <div class="abs" style="right:6.2mm;top:55.3mm;font:600 5.2pt 'BC';letter-spacing:.24em;color:#00AEEF;white-space:nowrap">GEOTHERMAL · OIL &amp; GAS</div>
</div>"""
    return html(body, mask)

def html(body, mask):
    return f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Carte de visite Enedril</title><style>{CSS}</style></head><body class="{"mask" if mask else ""}">{body}</body></html>'

pages = {"recto": recto(), "verso": verso(), "vernis_recto": recto(True), "vernis_verso": verso(True)}
for n, h in pages.items(): open(f"carte_{n}.html", "w", encoding="utf8").write(h)

# --- rendu PDF (Chromium)
js = """const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});
for(const n of %s){const pg=await b.newPage();await pg.goto('file://'+process.cwd()+'/carte_'+n+'.html');await pg.waitForTimeout(900);
await pg.pdf({path:'_'+n+'.pdf',width:'91mm',height:'61mm',printBackground:true,preferCSSPageSize:true});await pg.close()}
await b.close()})();""" % list(pages)
open("_rendre.cjs", "w").write(js)
subprocess.run(["node", "_rendre.cjs"], check=True)

# --- repères de coupe
mm = 72 / 25.4; BLEED = 3; SLUG = 8; W, H = 85, 55
def marks(srcs, out, title):
    w = PdfWriter(); PW, PH = (91 + 2 * SLUG) * mm, (61 + 2 * SLUG) * mm
    for s in srcs:
        p = PdfReader(s).pages[0]
        buf = io.BytesIO(); c = canvas.Canvas(buf, pagesize=(PW, PH)); c.setLineWidth(.25); c.setStrokeColorRGB(0, 0, 0)
        x0 = y0 = (SLUG + BLEED) * mm; x1, y1 = x0 + W * mm, y0 + H * mm; off, ln = BLEED * mm + 1.2 * mm, 4 * mm
        for x in (x0, x1):
            for y, sg in ((y0, -1), (y1, 1)): c.line(x, y + sg * off, x, y + sg * (off + ln))
        for y in (y0, y1):
            for x, sg in ((x0, -1), (x1, 1)): c.line(x + sg * off, y, x + sg * (off + ln), y)
        c.save(); buf.seek(0); pg = PdfReader(buf).pages[0]
        pg.merge_transformed_page(p, Transformation().translate(SLUG * mm, SLUG * mm))
        pg.trimbox = RectangleObject([x0, y0, x1, y1]); pg.bleedbox = RectangleObject([SLUG * mm, SLUG * mm, (SLUG + 91) * mm, (SLUG + 61) * mm]); w.add_page(pg)
    w.add_metadata({"/Title": title}); w.write(out)

os.makedirs("1_IMPRESSION", exist_ok=True); os.makedirs("2_VERNIS_SELECTIF", exist_ok=True); os.makedirs("3_FICHIERS_SEPARES", exist_ok=True); os.makedirs("apercus", exist_ok=True)
marks(["_recto.pdf", "_verso.pdf"], "1_IMPRESSION/Carte_visite_Paul_Hynderick_recto_verso_reperes_coupe.pdf", "Carte de visite Paul Hynderick - Enedril")
marks(["_vernis_recto.pdf", "_vernis_verso.pdf"], "2_VERNIS_SELECTIF/Vernis_selectif_recto_verso_noir_100.pdf", "Vernis selectif - Carte de visite Paul Hynderick")
for n, t in (("recto", "recto"), ("verso", "verso")):
    os.replace(f"_{n}.pdf", f"3_FICHIERS_SEPARES/Carte_{t}_fond_perdu_91x61.pdf")
for n in ("vernis_recto", "vernis_verso"): os.replace(f"_{n}.pdf", f"3_FICHIERS_SEPARES/{n}_fond_perdu_91x61.pdf")
os.remove("_rendre.cjs")
for n in ("recto", "verso", "vernis_recto", "vernis_verso"):
    src = f"3_FICHIERS_SEPARES/{'Carte_' + n if 'vernis' not in n else n}_fond_perdu_91x61.pdf"
    subprocess.run(["pdftoppm", "-png", "-r", "600", "-singlefile", src, f"apercus/{n}_600dpi"], check=True)
print("ok")
