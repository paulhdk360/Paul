"""Ajoute des repères de coupe à un PDF recto/verso déjà en fond perdu (154 x 111 mm = A6 + 3 mm).
Usage : python3 reperes_coupe.py <entree.pdf> <sortie.pdf> "<titre>" """
import io, sys
from pypdf import PdfReader, PdfWriter, Transformation
from pypdf.generic import RectangleObject
from reportlab.pdfgen import canvas
SRC, OUT, TITLE = sys.argv[1:4]
mm = 72 / 25.4; BLEED = 3; SLUG = 8                      # fond perdu 3 mm ; marge de repères 8 mm
rd = PdfReader(SRC); w = PdfWriter(); PW, PH = (154 + 2 * SLUG) * mm, (111 + 2 * SLUG) * mm
for p in rd.pages:
    buf = io.BytesIO(); c = canvas.Canvas(buf, pagesize=(PW, PH)); c.setLineWidth(.25); c.setStrokeColorRGB(0, 0, 0)
    x0 = y0 = (SLUG + BLEED) * mm; x1, y1 = x0 + 148 * mm, y0 + 105 * mm; off, ln = BLEED * mm + 1.2 * mm, 4 * mm
    for x in (x0, x1):
        for y, sg in ((y0, -1), (y1, 1)): c.line(x, y + sg * off, x, y + sg * (off + ln))
    for y in (y0, y1):
        for x, sg in ((x0, -1), (x1, 1)): c.line(x + sg * off, y, x + sg * (off + ln), y)
    c.save(); buf.seek(0); page = PdfReader(buf).pages[0]
    page.merge_transformed_page(p, Transformation().translate(SLUG * mm, SLUG * mm))
    page.trimbox = RectangleObject([x0, y0, x1, y1]); page.bleedbox = RectangleObject([SLUG * mm, SLUG * mm, (SLUG + 154) * mm, (SLUG + 111) * mm]); w.add_page(page)
w.add_metadata({'/Title': TITLE}); w.write(OUT); print('ok', OUT)
