"""Assemble la vidéo LinkedIn DTU : 2 plans floutés + titre + logo + carton de fin (1080x1920)."""
import subprocess, sys
from PIL import Image, ImageDraw, ImageFont
R = "/home/user/Paul/"; F = R + "voeux_2027/polices/"
W, H = 1080, 1920
logo = Image.open(R + "public/logo-enedril-white.png").convert("RGBA")
def fit(im, w): return im.resize((w, int(im.height*w/im.width)), Image.LANCZOS)
def shadow(canvas, draw_fn, blur=10):
    from PIL import ImageFilter
    s = Image.new("RGBA", canvas.size, (0,0,0,0)); draw_fn(ImageDraw.Draw(s), (0,0,0,170))
    canvas.alpha_composite(s.filter(ImageFilter.GaussianBlur(blur)))
# surcouche permanente : logo en haut à gauche
ov = Image.new("RGBA", (W,H), (0,0,0,0))
ov.alpha_composite(fit(logo, 330), (60, 90))
ov.save("ov_logo.png")
# titre
tt = Image.new("RGBA", (W,H), (0,0,0,0))
f1 = ImageFont.truetype(F+"BarlowCondensed-Bold.ttf", 118); f2 = ImageFont.truetype(F+"Barlow-Medium.ttf", 44)
def draw(d, col):
    d.rectangle([60, 250, 160, 258], fill=(226,35,26,255) if col[3]==255 else col)
    d.text((60, 280), "CONTRÔLE DES BRAS", font=f1, fill=col)
    d.text((60, 400), "DU DTU", font=f1, fill=col)
    d.text((62, 540), "Avant départ sur chantier", font=f2, fill=col)
    d.text((62, 600), "Atelier Enedril · Lons (64)", font=f2, fill=col)
shadow(tt, draw, 12); draw(ImageDraw.Draw(tt), (255,255,255,255)); tt.save("ov_titre.png")
# carton de fin
e = Image.new("RGB", (W,H), (8,32,63)); e = e.convert("RGBA")
e.alpha_composite(fit(logo, 760), (160, 700))
d = ImageDraw.Draw(e)
f3 = ImageFont.truetype(F+"BarlowCondensed-SemiBold.ttf", 64); f4 = ImageFont.truetype(F+"Barlow-Medium.ttf", 38)
def ctr(y, t, f, c):
    w = d.textlength(t, font=f); d.text(((W-w)/2, y), t, font=f, fill=c)
ctr(905, "DIRECTIONAL DRILLING & FISHING", f3, (255,255,255,255))
ctr(1500, "linkedin.com/company/enedril", f4, (200,215,230,255))
e.convert("RGB").save("fin.png")
