"""Reconstruit tous les livrables de la carte de voeux (FR) : PDF d'impression, version globale, recto/verso séparés, visuel seul, PPTX, zip.
Usage : python3 reconstruire_tout.py <dossier_de_sortie>     (nécessite node + playwright, pdftoppm, pypdf, reportlab, python-pptx)"""
import os, shutil, subprocess, sys, zipfile
from PIL import Image
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject
OUT = os.path.abspath(sys.argv[1]); HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)
m_pt = 3 / 25.4 * 72; m_px = round(3 / 25.4 * 300)
R = OUT + '/Carte_postale_voeux_2027_FR'; shutil.rmtree(R, ignore_errors=True)
D = {k: f'{R}/{v}' for k, v in dict(imp='1_IMPRESSION', glob='2_VERSION_GLOBALE', rv='2b_RECTO_VERSO_SEPARES', vs='3_VISUEL_SEUL', ppt='4_PPTX_calques', src='5_SOURCES_images', pol='polices').items()}
for d in D.values(): os.makedirs(d)
subprocess.run(['node', 'rendre.cjs'], check=True); subprocess.run(['node', 'rendre_visuel_seul.cjs'], check=True)
SRC = 'carte_F_jour_FR_fond_perdu.pdf'
subprocess.run(['python3', 'reperes_coupe.py', SRC, D['imp'] + '/Carte_postale_voeux_2027_FR_IMPRESSION_fond_perdu_reperes.pdf', 'Carte postale voeux Enedril 2027 FR - impression (fond perdu 3 mm, reperes de coupe)'], check=True)
shutil.copy(SRC, D['imp'] + '/Carte_postale_voeux_2027_FR_fond_perdu_3mm_sans_reperes.pdf')
def trim(src, i=None):
    rd = PdfReader(src); w = PdfWriter()
    for k, p in enumerate(rd.pages):
        if i is not None and k != i: continue
        W, H = float(p.mediabox.width), float(p.mediabox.height); box = RectangleObject([m_pt, m_pt, W - m_pt, H - m_pt])
        p.mediabox = p.cropbox = p.trimbox = p.bleedbox = box; w.add_page(p)
    return w
trim(SRC).write(D['glob'] + '/Carte_postale_voeux_2027_FR_version_globale_A6.pdf')
tmp = OUT + '/_tmp'; os.makedirs(tmp, exist_ok=True)
subprocess.run(['pdftoppm', '-r', '300', '-png', SRC, tmp + '/c'], check=True); subprocess.run(['pdftoppm', '-r', '300', '-png', 'visuel_seul_fond_perdu.pdf', tmp + '/v'], check=True)
ims = []
for i, side in ((1, 'recto'), (2, 'verso')):
    im = Image.open(f'{tmp}/c-{i}.png').convert('RGB'); fp = im.copy(); a, b = im.size; im = im.crop((m_px, m_px, a - m_px, b - m_px)); ims.append(im)
    im.save(f'{D["glob"]}/Carte_postale_voeux_2027_FR_{side}_A6_300dpi.png'); im.save(f'{D["rv"]}/Carte_voeux_2027_FR_{side}.png')
    fp.save(f'{D["rv"]}/Carte_voeux_2027_FR_{side}_fond_perdu.png')
    trim(SRC, i - 1).write(f'{D["rv"]}/Carte_voeux_2027_FR_{side}.pdf')
    w = PdfWriter(); w.add_page(PdfReader(SRC).pages[i - 1]); w.write(f'{D["rv"]}/Carte_voeux_2027_FR_{side}_fond_perdu.pdf')
    v = Image.open(f'{tmp}/v-{i}.png').convert('RGB'); v.crop((m_px, m_px, a - m_px, b - m_px)).save(f'{D["vs"]}/Visuel_seul_{side}_A6_300dpi.png')
sh = Image.new('RGB', (ims[0].width * 2 + 60, ims[0].height), (255, 255, 255)); sh.paste(ims[0], (0, 0)); sh.paste(ims[1], (ims[0].width + 60, 0)); sh.save(D['glob'] + '/Carte_postale_voeux_2027_FR_recto_verso.png')
shutil.copy('visuel_seul_fond_perdu.pdf', D['vs'] + '/Visuel_seul_recto_verso_fond_perdu_3mm.pdf')
subprocess.run(['python3', 'construire_pptx.py', 'FR', D['ppt'] + '/Carte_postale_voeux_2027_FR_calques.pptx'], check=True)
for s, n in (('visuel_jour.jpg', 'Recto_visuel_rig_trajectoire_original.jpg'), ('visuel_jour_ombre.jpg', 'Recto_visuel_rig_trajectoire_avec_ombre_logo.jpg'), ('chantier_coucher_soleil_large.jpg', 'Verso_photo_chantier_non_fondue.jpg'),
             ('chantier_fondu.png', 'Verso_photo_chantier_fondue.png'), ('neige_recto.png', 'Calque_neige_recto.png'), ('neige_verso.png', 'Calque_neige_verso_guirlande.png'), ('logo-blanc.png', 'Logo_Enedril_blanc.png')):
    shutil.copy('photos/' + s, f'{D["src"]}/{n}')
for f in os.listdir('polices'): shutil.copy('polices/' + f, D['pol'])
shutil.copy('LISEZ-MOI_pack_FR.txt', R + '/LISEZ-MOI.txt'); shutil.rmtree(tmp)
zp = OUT + '/Carte_postale_voeux_2027_FR_complet.zip'
with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
    for r, _, fs in os.walk(OUT):
        for f in sorted(fs):
            p = os.path.join(r, f)
            if p != zp and p.startswith(R): z.write(p, os.path.relpath(p, OUT))
print('ok', zp)
