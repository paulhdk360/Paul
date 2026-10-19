#!/usr/bin/env python3
"""Génère le bandeau PNG (2x) et une signature HTML par ligne de people.csv."""
import csv, html, re, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent
BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"  # métriques Arial
REG = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"

def banner(path, w=520, h=60, scale=2, ss=4):
    k = scale * ss                       # rendu 4x suréchantillonné puis réduit à 2x
    W, H = w * k, h * k
    c1, c2 = (0x0A, 0x4F, 0xA0), (0x0F, 0x7F, 0xCB)
    img = Image.new("RGB", (W, H))
    px = img.load()
    grad = [tuple(round(a + (b - a) * x / (W - 1)) for a, b in zip(c1, c2)) for x in range(W)]
    d = ImageDraw.Draw(img)
    for x in range(W):
        d.line([(x, 0), (x, H)], fill=grad[x])
    u = k  # 1 px logique
    # pictogramme : 3 segments inclinés de hauteur croissante
    x0, base, sw, gap, sk = 24 * u, 45 * u, 6 * u, 3 * u, 5 * u
    for i, ht in enumerate((18 * u, 26 * u, 34 * u)):
        xl = x0 + i * (sw + gap)
        d.polygon([(xl, base), (xl + sw, base), (xl + sw + sk, base - ht), (xl + sk, base - ht)], fill="white")
    # mot-symbole
    f = ImageFont.truetype(BOLD, 26 * u)
    d.text((x0 + 3 * (sw + gap) + sk + 8 * u, 31 * u), "Enedril", font=f, fill="white", anchor="lm")
    # baseline + trait cyan
    f2 = ImageFont.truetype(BOLD, 12 * u)
    txt = "Fishing and Drilling Solutions"
    tw = d.textlength(txt, font=f2)
    xr = W - 24 * u
    d.text((xr, 31 * u), txt, font=f2, fill="white", anchor="rm")
    d.rectangle([xr - tw - 12 * u - 1 * u, 17 * u, xr - tw - 12 * u, 45 * u], fill="#01ADEE")
    img.resize((w * scale, h * scale), Image.LANCZOS).save(path, optimize=True)

TEL = "+33559045045"
def sig(nom, poste, mobile, email):
    e = html.escape
    mob_tel = "tel:" + re.sub(r"[^\d+]", "", re.sub(r"\(0\)", "", mobile))
    F = "font-family:Arial,Helvetica,sans-serif;"
    a = "color:#194E9A;text-decoration:none;"
    sep = '<span style="color:#51647A;"> | </span>'
    def row(inner, pad=0, size=12, color="#194E9A", extra=""):
        return (f'<tr><td style="{F}font-size:{size}px;line-height:{round(size*1.4)}px;color:{color};padding:{pad}px 0 0 0;{extra}">{inner}</td></tr>')
    rows = [
        row(f'<b>{e(nom)}</b>', 0, 19, "#194E9A", "font-weight:bold;"),
        row(f'<b>{e(poste.upper())}</b>', 2, 12, "#0F7FCB", "font-weight:bold;"),
        row(f'<span style="color:#51647A;">T</span>&nbsp;<a href="tel:{TEL}" style="{a}">+33 (0)559.045.045</a>{sep}'
            f'<a href="https://www.enedril.com" style="{a}">www.enedril.com</a>{sep}'
            f'<a href="https://www.linkedin.com/company/enedril" style="{a}">LinkedIn</a>', 8),
        row(f'<span style="color:#51647A;">M</span>&nbsp;<a href="{mob_tel}" style="{a}">{e(mobile)}</a>{sep}'
            f'<a href="mailto:{e(email)}" style="{a}">{e(email)}</a>', 2),
        row('3 avenue des Lacs, 64140 Lons', 6, 11, "#51647A"),
        '<tr><td height="12" style="height:12px;font-size:0;line-height:0;">&nbsp;</td></tr>',
        ('<tr><td style="padding:0;"><a href="https://www.enedril.com" target="_blank" style="text-decoration:none;border:0;">'
         '<img src="banner-enedril.png" width="520" height="60" alt="Enedril, Fishing and Drilling Solutions" '
         'style="display:block;border:0;width:520px;height:60px;outline:none;text-decoration:none;"></a></td></tr>'),
    ]
    return ('<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" '
            'style="width:520px;max-width:520px;border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;">\n'
            + "\n".join(rows) + "\n</table>")

PAGE = """<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Signature e-mail – {nom}</title></head>
<body style="margin:24px;font-family:Arial,Helvetica,sans-serif;color:#222;">
<p style="font-size:13px;max-width:520px;">Sélectionnez la signature ci-dessous (Ctrl+A puis Ctrl+C), puis collez-la dans
Outlook : <i>Fichier &gt; Options &gt; Courrier &gt; Signatures</i>. Gardez ce fichier à côté de <code>banner-enedril.png</code>.</p>
<div id="signature">
{sig}
</div>
</body></html>
"""

def main():
    banner(HERE / "banner-enedril.png")
    out = HERE / "signatures"; out.mkdir(exist_ok=True)
    (out / "banner-enedril.png").write_bytes((HERE / "banner-enedril.png").read_bytes())
    with open(HERE / "people.csv", encoding="utf-8", newline="") as fh:
        for r in csv.DictReader(fh):
            slug = re.sub(r"[^a-z0-9]+", "-", r["email"].split("@")[0].lower()).strip("-") or "signature"
            (out / f"signature-{slug}.html").write_text(
                PAGE.format(nom=html.escape(r["nom"]), sig=sig(r["nom"], r["poste"], r["mobile"], r["email"])), encoding="utf-8")
            print("ok", slug)

if __name__ == "__main__":
    main()
