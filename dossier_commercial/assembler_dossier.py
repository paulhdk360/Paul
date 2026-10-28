"""Assemble le dossier commercial envoyé au client, dans l'ordre :
présentation de l'entreprise, engagements (politique QHSE et RSE), certificat ISO 9001,
proposition technique, devis.
Les pièces de l'entreprise viennent du dossier « bibliotheque ». Installation : pip install pypdf

Exemple :
  python3 assembler_dossier.py --devis devis.pdf --technique proposition.pdf -o Dossier_Client.pdf
  python3 assembler_dossier.py --devis devis.pdf --sans presentation iso --langue en -o Dossier_EN.pdf
"""
import argparse, os
from pypdf import PdfReader, PdfWriter

BIB = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bibliotheque')
ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--garde', help="PDF d'une page de garde (facultatif)")
ap.add_argument('--devis', required=True, help="PDF du devis (onglet « 4 Devis » du classeur Devis)")
ap.add_argument('--technique', help="PDF de la proposition technique (facultatif)")
ap.add_argument('--langue', choices=['fr', 'en'], default='fr')
ap.add_argument('--sans', nargs='*', default=[], choices=['presentation', 'engagements', 'iso'], help="pièces de l'entreprise à ne pas joindre")
ap.add_argument('-o', '--sortie', required=True)
a = ap.parse_args()

w = PdfWriter()
def add(path, pages=None):
    r = PdfReader(path)
    for i in (pages if pages is not None else range(len(r.pages))): w.add_page(r.pages[i])
if a.garde: add(a.garde)
if 'presentation' not in a.sans: add(os.path.join(BIB, f'01_Presentation_entreprise_{a.langue.upper()}.pdf'))
if 'engagements' not in a.sans: add(os.path.join(BIB, '02_Politique_QHSE_RSE_EN_FR.pdf'), [1 if a.langue == 'fr' else 0])   # page 1 = EN, page 2 = FR
if 'iso' not in a.sans: add(os.path.join(BIB, '03_Certificat_ISO9001_LRQA.pdf'))
if a.technique: add(a.technique)
add(a.devis)
with open(a.sortie, 'wb') as f: w.write(f)
print(f'{len(w.pages)} pages → {a.sortie}')
