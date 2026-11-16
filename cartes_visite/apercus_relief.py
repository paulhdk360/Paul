"""Simulation du vernis sélectif (brillance) et mise en situation des cartes. Usage : python3 apercus_relief.py"""
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

mm600 = 600 / 25.4


def trim(im):  # retire le fond perdu de 3 mm
    b = int(round(3 * mm600))
    return im.crop((b, b, im.width - b, im.height - b))


rec = trim(Image.open("apercus/recto_600dpi.png").convert("RGB"))
ver = trim(Image.open("apercus/verso_600dpi.png").convert("RGB"))
mr = trim(Image.open("apercus/vernis_recto_600dpi.png").convert("L"))
mv = trim(Image.open("apercus/vernis_verso_600dpi.png").convert("L"))


def gloss(img, mask, base_matte=.93):
    a = np.asarray(img).astype(np.float32) / 255
    m = (np.asarray(mask) < 128).astype(np.float32)
    mb = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32) / 255
    h, w = m.shape
    yy, xx = np.mgrid[0:h, 0:w]
    sheen = np.clip(1 - np.abs((xx / w * 1.0 + yy / h * .55) - .62) / .16, 0, 1) ** 1.6  # reflet diagonal
    out = a * base_matte * (1 - mb[..., None]) + (np.clip(a * 1.25 + .06, 0, 1) + sheen[..., None] * .55) * mb[..., None]
    edge = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(5))).astype(np.float32) / 255
    sh = np.roll(edge, (6, 6), (0, 1)) * (1 - m)  # ombre sous la zone vernie
    out = out * (1 - .28 * sh[..., None])
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))


rg, vg = gloss(rec, mr), gloss(ver, mv)
rg.save("apercus/Simulation_vernis_recto.png")


def card_on(canvas, im, pos, angle, scale=.62):
    im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    pad = 160
    r = Image.new("RGBA", (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0))
    r.paste(im.convert("RGBA"), (pad, pad))
    m = Image.new("L", r.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((pad, pad, pad + im.width - 1, pad + im.height - 1), radius=int(1.2 * mm600 * scale), fill=255)
    r.putalpha(m)
    r = r.rotate(angle, expand=True, resample=Image.BICUBIC)
    sh = Image.new("RGBA", r.size, (0, 0, 0, 0))
    sh.putalpha(r.getchannel("A").point(lambda v: int(v * .5)))
    sh = sh.filter(ImageFilter.GaussianBlur(26))
    canvas.alpha_composite(sh, (pos[0] + 22, pos[1] + 38))
    canvas.alpha_composite(r, pos)


W, H = 3200, 2000
yy, xx = np.mgrid[0:H, 0:W]
d = np.sqrt(((xx - W * .55) / W) ** 2 + ((yy - H * .45) / H) ** 2)
base = np.clip(1 - d * 1.6, 0, 1)
a = np.zeros((H, W, 3), np.float32)
a[..., 0] = 205 + 40 * base
a[..., 1] = 212 + 36 * base
a[..., 2] = 222 + 30 * base
bg = Image.fromarray(a.astype(np.uint8)).convert("RGBA")
card_on(bg, vg, (1580, 880), 5)
card_on(bg, rg, (240, 140), -8)
bg.convert("RGB").resize((W // 2, H // 2), Image.LANCZOS).save("apercus/Mise_en_situation.png")
print("ok")
