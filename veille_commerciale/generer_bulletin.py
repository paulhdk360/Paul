#!/usr/bin/env python3
"""Génère le bulletin de veille commerciale Enedril (HTML + PDF).

Usage : python3 generer_bulletin.py <rig_count.xlsx> <contenu.json> <sortie_sans_extension>
 - rig_count.xlsx : fichier mensuel « Worldwide Rig Count Report » de Baker Hughes (onglet WW Monthly)
 - contenu.json   : projets, marchés et notes de la semaine (rédigés lors de la veille)
Le PDF est produit avec Chromium (headless) si disponible.
"""
import sys, json, subprocess, shutil, html, warnings
warnings.filterwarnings('ignore')
import openpyxl, pandas as pd

def charger_rigs(path):
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    rows = list(wb['WW Monthly'].iter_rows(values_only=True))
    h = next(i for i, r in enumerate(rows) if r[0] == 'Region')
    df = pd.DataFrame([r[:8] for r in rows[h + 1:] if r[0]], columns=rows[h][:8])
    df['date'] = pd.to_datetime(dict(year=df.Year, month=df.Month, day=1))
    return df[(df['Rig Status'] == 'Active Rigs')]

NOMS = {'FRANCE': 'France', 'GERMANY': 'Allemagne', 'ITALY': 'Italie', 'NETHERLANDS': 'Pays-Bas', 'NORWAY': 'Norvège',
        'UNITED KINGDOM OFFSHORE': 'Royaume-Uni (offshore)', 'UNITED KINGDOM': 'Royaume-Uni', 'TURKEY': 'Turquie', 'UKRAINE': 'Ukraine',
        'ROMANIA': 'Roumanie', 'POLAND': 'Pologne', 'HUNGARY': 'Hongrie', 'SPAIN': 'Espagne', 'AUSTRIA': 'Autriche', 'CROATIA': 'Croatie',
        'CZECH REPUBLIC': 'Rép. tchèque', 'SERBIA AND MONTENEGRO': 'Serbie et Monténégro', 'DENMARK': 'Danemark', 'SWITZERLAND': 'Suisse'}

def courbe(serie, w=700, h=170):
    xs = list(serie.index); ys = list(serie.values)
    lo, hi = min(ys) - 5, max(ys) + 5
    px = lambda i: 40 + i * (w - 60) / (len(xs) - 1)
    py = lambda v: 10 + (hi - v) * (h - 40) / (hi - lo)
    pts = ' '.join('%.1f,%.1f' % (px(i), py(v)) for i, v in enumerate(ys))
    g = ''.join('<line x1="40" x2="%d" y1="%.1f" y2="%.1f" stroke="#D5E1EE"/><text x="34" y="%.1f" font-size="9" text-anchor="end" fill="#5A6B7F">%d</text>' % (w - 20, py(v), py(v), py(v) + 3, v) for v in range(int(lo // 10 * 10 + 10), int(hi), 10))
    lab = ''.join('<text x="%.1f" y="%d" font-size="9" text-anchor="middle" fill="#5A6B7F">%s</text>' % (px(i), h - 8, xs[i].strftime('%m/%y')) for i in range(0, len(xs), 3))
    last = '<circle cx="%.1f" cy="%.1f" r="4" fill="#0A4FA0"/><text x="%.1f" y="%.1f" font-size="11" font-weight="700" fill="#0A4FA0" text-anchor="end">%d</text>' % (px(len(xs) - 1), py(ys[-1]), px(len(xs) - 1) - 8, py(ys[-1]) - 6, ys[-1])
    return '<svg viewBox="0 0 %d %d" width="100%%">%s<polyline points="%s" fill="none" stroke="#0F7FCB" stroke-width="2.4"/>%s%s</svg>' % (w, h, g, pts, last, lab)

def barres(pays, w=700):
    mx = max(max(a, b) for _, a, b in pays) or 1
    out = []
    for i, (nom, a, b) in enumerate(pays):
        y = 6 + i * 19
        out.append('<text x="130" y="%d" font-size="10" text-anchor="end" fill="#0B1B2E">%s</text>' % (y + 11, html.escape(nom)))
        out.append('<rect x="136" y="%d" width="%.1f" height="7" fill="#B9CCE0"/>' % (y, b * 520 / mx))
        out.append('<rect x="136" y="%d" width="%.1f" height="9" fill="#0A4FA0"/>' % (y + 8, a * 520 / mx))
        out.append('<text x="%.1f" y="%d" font-size="9.5" fill="#0A4FA0" font-weight="700">%d</text>' % (140 + a * 520 / mx, y + 16, a))
    return '<svg viewBox="0 0 %d %d" width="100%%">%s</svg>' % (w, 14 + 19 * len(pays), ''.join(out))


POS = {'FRANCE': (2.5, 46.8), 'GERMANY': (10.3, 51.2), 'ITALY': (12.3, 42.8), 'NETHERLANDS': (5.5, 52.3), 'NORWAY': (3.8, 60.8),
       'UNITED KINGDOM OFFSHORE': (1.6, 56.2), 'UNITED KINGDOM': (-1.8, 53.0), 'TURKEY': (34.5, 39.0), 'UKRAINE': (31.5, 49.0), 'ROMANIA': (25.0, 45.8),
       'POLAND': (19.5, 52.0), 'HUNGARY': (19.3, 47.1), 'SPAIN': (-3.7, 40.2), 'AUSTRIA': (14.5, 47.5), 'CROATIA': (16.0, 45.3),
       'CZECH REPUBLIC': (15.5, 49.8), 'SERBIA AND MONTENEGRO': (20.8, 44.0), 'DENMARK': (9.5, 56.0)}
NOMS_NE = {'FRANCE': ['France'], 'GERMANY': ['Germany'], 'ITALY': ['Italy'], 'NETHERLANDS': ['Netherlands'], 'NORWAY': ['Norway'],
           'UNITED KINGDOM OFFSHORE': ['United Kingdom'], 'UNITED KINGDOM': ['United Kingdom'], 'TURKEY': ['Turkey'], 'UKRAINE': ['Ukraine'],
           'ROMANIA': ['Romania'], 'POLAND': ['Poland'], 'HUNGARY': ['Hungary'], 'SPAIN': ['Spain'], 'AUSTRIA': ['Austria'], 'CROATIA': ['Croatia'],
           'CZECH REPUBLIC': ['Czechia'], 'SERBIA AND MONTENEGRO': ['Serbia', 'Montenegro'], 'DENMARK': ['Denmark']}

def carte(cur, dossier):
    import math, os
    f = json.load(open(os.path.join(dossier, 'europe_paths.json')))
    actifs = {n for k, v in cur.items() if v for n in NOMS_NE.get(k, [])}
    fond = ''.join('<path d="%s" fill="%s" stroke="#fff" stroke-width="0.8"/>' % (d, '#CFE3F6' if n in actifs else '#EEF3F8') for n, d in f['paths'].items())
    def xy(lon, lat): return ((lon - f['lon0']) * f['cos'] * f['k'], (f['lat1'] - lat) * f['k'])
    bulles = ''
    for k, v in sorted(cur.items(), key=lambda t: -t[1]):
        if not v or k not in POS: continue
        x, y = xy(*POS[k]); r = 9 + 4.6 * math.sqrt(v)
        bulles += '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#0A4FA0" fill-opacity="0.82" stroke="#fff" stroke-width="1.2"/>' % (x, y, r)
        bulles += '<text x="%.1f" y="%.1f" font-size="%d" font-weight="700" fill="#fff" text-anchor="middle">%d</text>' % (x, y + 4.5, 14, v)
        bulles += '<text x="%.1f" y="%.1f" font-size="11" font-weight="700" fill="#0B1B2E" text-anchor="middle">%s</text>' % (x, y + r + 12, html.escape(NOMS.get(k, k.title())))
    return '<svg viewBox="0 0 %s %s" width="100%%">%s%s</svg>' % (f['w'], f['h'], fond, bulles)

def lien(l): return ('<a href="%s">%s</a>' % (html.escape(l['url']), html.escape(l['titre']))) if l.get('url') else html.escape(l['titre'])

def bulletin(xlsx, contenu_json, sortie):
    df = charger_rigs(xlsx); c = json.load(open(contenu_json))
    eu = df[df.Region == 'Europe']
    tot = eu.groupby('date')['Rig Count Value'].sum()
    d = tot.index.max(); d1 = d - pd.DateOffset(months=1); da = d - pd.DateOffset(years=1)
    cur = eu[eu.date == d].groupby('Country')['Rig Count Value'].sum()
    an = eu[eu.date == da].groupby('Country')['Rig Count Value'].sum()
    pays = sorted([(NOMS.get(k, k.title()), int(cur.get(k, 0)), int(an.get(k, 0))) for k in set(cur.index) | set(an.index)], key=lambda t: -t[1])
    pays_aff = [p for p in pays if p[1] or p[2]][:10]
    cat = eu[eu.date == d].groupby('DrillFor')['Rig Count Value'].sum()
    mois = d.strftime('%m/%Y')
    var1 = int(tot[d] - tot.get(d1, tot[d])); vara = int(tot[d] - tot.get(da, tot[d]))
    sig = lambda v: ('+%d' % v) if v > 0 else str(v)
    france = int(cur.get('FRANCE', 0))

    dd = eu[eu.date == d]
    lignes = []
    for k, tot_k in sorted(cur.items(), key=lambda t: -t[1]):
        if not tot_k: continue
        sub = dd[dd.Country == k]
        loc = sub.groupby('Location')['Rig Count Value'].sum(); dr = sub.groupby('DrillFor')['Rig Count Value'].sum()
        terre = int(loc.get('Land', 0)); mer = int(loc.get('Offshore', 0)); eau = int(loc.get('Inland Waters', 0) + loc.get('Inland waters', 0))
        lignes.append('<tr><td>%s</td><td><b>%d</b></td><td>%d</td><td>%d</td><td>%d</td><td>%d</td><td>%d</td><td>%d</td></tr>' % (NOMS.get(k, k.title()), tot_k, terre, mer, eau, dr.get('Oil', 0), dr.get('Gas', 0), dr.get('Miscellaneous', 0)))
    import os
    dossier = os.path.dirname(os.path.abspath(__file__))
    H = ['<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Veille commerciale Enedril</title><style>',
         '@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:"Ubuntu Mono",monospace;color:#0B1B2E;font-size:9.6pt;line-height:1.35;margin:0}',
         'h1{font-size:19pt;color:#0A4FA0;margin:0}h2{font-size:12pt;color:#0F7FCB;border-bottom:2px solid #1CB2FE;padding-bottom:2px;margin:16px 0 6px}',
         '.hd{background:#08203F;color:#fff;padding:10px 14px;margin-bottom:10px}.hd p{margin:2px 0 0;color:#1CB2FE;font-size:9pt}',
         '.k{display:flex;gap:8px}.k div{flex:1;background:#0A4FA0;color:#fff;padding:7px;text-align:center}.k b{display:block;font-size:17pt}.k span{font-size:8pt}',
         'table{border-collapse:collapse;width:100%;font-size:8.2pt}td,th{border-bottom:1px solid #D5E1EE;padding:3px 5px;text-align:left;vertical-align:top}th{background:#194E9A;color:#fff}',
         '.n{font-size:8pt;color:#5A6B7F}.al{background:#EAF4FC;border-left:4px solid #01ADEE;padding:6px 9px;margin:6px 0}a{color:#0A4FA0}.pb{page-break-before:always}',
         '</style></head><body>',
         '<div class="hd"><h1 style="color:#fff">VEILLE COMMERCIALE ENEDRIL</h1><p>%s · données Baker Hughes jusqu\'à %s</p></div>' % (html.escape(c['periode']), mois),
         '<h2>À RETENIR</h2>', '<ul>' + ''.join('<li>%s</li>' % x for x in c['points_cles']) + '</ul>',
         '<h2>RIGS ACTIFS EN EUROPE (pétrole et gaz, Baker Hughes)</h2>',
         '<div class="k"><div><b>%d</b><span>rigs actifs, %s</span></div><div><b>%s</b><span>vs mois précédent</span></div><div><b>%s</b><span>vs il y a un an</span></div><div><b>%d</b><span>France</span></div></div>' % (tot[d], mois, sig(var1), sig(vara), france),
         '<p class="n">Évolution mensuelle du nombre de rigs actifs en Europe</p>', courbe(tot.loc['2024-01-01':]),
         '<p class="n">Par pays : %s (bleu foncé) contre %s (bleu clair)</p>' % (mois, da.strftime('%m/%Y')), barres(pays_aff),
         '<p class="n">Répartition %s : pétrole %d · gaz %d · autres %d. Limite : le décompte Baker Hughes ne couvre pas les foreuses de géothermie, seules les foreuses « Miscellaneous » en sont proches.</p>' % (mois, cat.get('Oil', 0), cat.get('Gas', 0), cat.get('Miscellaneous', 0)),
         '<h2 class="pb">OÙ LES RIGS SONT ACTIFS (%s)</h2>' % mois,
         '<div style="display:flex;gap:12px;align-items:flex-start"><div style="flex:0 0 55%%">' + carte(dict(cur), dossier) + '</div><div style="flex:1"><table><tr><th>Pays</th><th>Total</th><th>Terre</th><th>Mer</th><th>Eaux int.</th><th>Pétrole</th><th>Gaz</th><th>Autres</th></tr>' + ''.join(lignes) + '</table><p class="n">Les chiffres de la carte sont les rigs actifs par pays. « Autres » = foreuses non classées pétrole ou gaz. La carte donne la position moyenne du pays ; le Royaume-Uni et la Norvège sont surtout offshore.</p></div></div>',
         '<h2>ACTIONS CONSEILLÉES</h2>', '<div class="al">' + '<br>'.join('› ' + x for x in c['actions']) + '</div>',
         '<h2>LIMITES DE CE BULLETIN</h2><p class="n">' + ' '.join(html.escape(x) for x in c['limites']) + '</p>',
         '<h2 class="pb">PROJETS ET APPELS D\'OFFRES</h2>',
         '<table><tr><th>Pays</th><th>Projet</th><th>Stade</th><th>Source</th></tr>' + ''.join('<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>' % (html.escape(p['pays']), html.escape(p['projet']), html.escape(p['stade']), lien(p['source'])) for p in c['projets']) + '</table>',
         '<h2>MARCHÉS : ACIER, TUNGSTÈNE, DEVISES</h2>',
         '<table><tr><th>Indicateur</th><th>Dernière valeur trouvée</th><th>Tendance</th><th>Date / source</th></tr>' + ''.join('<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>' % (html.escape(m['nom']), html.escape(m['valeur']), html.escape(m['tendance']), lien(m['source'])) for m in c['marches']) + '</table></body></html>']
    open(sortie + '.html', 'w', encoding='utf-8').write(''.join(H))
    chrome = shutil.which('chromium') or shutil.which('google-chrome') or '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
    subprocess.run([chrome, '--headless', '--no-sandbox', '--disable-gpu', '--no-pdf-header-footer', '--print-to-pdf=' + sortie + '.pdf', 'file://' + __import__('os').path.abspath(sortie + '.html')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return sortie

if __name__ == '__main__':
    bulletin(*sys.argv[1:4])
