"""Ajoute l'onglet « Chrono 2027 » (France_Chrono_2027.xlsx) dans l'ancien France Chrono, SANS toucher aux autres onglets
(tableaux croisés, segments, mises en forme restent intacts : fusion directe des fichiers XML).
Usage : python3 integrer_dans_ancien.py <ancien_chrono.xlsx> <France_Chrono_2027.xlsx> <sortie.xlsx>"""
import sys, re, copy, zipfile
from lxml import etree

OLD, NEW, OUT = sys.argv[1:4]
NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
RNS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
q = lambda t: '{%s}%s' % (NS, t)
SHEET_NAME = 'Chrono 2027'; NEW_PATH = 'xl/worksheets/sheet_chrono2027.xml'

zo = zipfile.ZipFile(OLD); zn = zipfile.ZipFile(NEW)
parse = lambda z, p: etree.fromstring(z.read(p))
so, sn = parse(zo, 'xl/styles.xml'), parse(zn, 'xl/styles.xml')

def child(root, tag):
    e = root.find(q(tag)); return e
def append_all(tag):
    eo, en = child(so, tag), child(sn, tag)
    base = len(eo)
    for x in en: eo.append(copy.deepcopy(x))
    eo.set('count', str(len(eo))); return base
fo, fi, bo = append_all('fonts'), append_all('fills'), append_all('borders')
# formats numériques personnalisés
nf_o = child(so, 'numFmts'); nf_n = child(sn, 'numFmts')
if nf_o is None:
    nf_o = etree.Element(q('numFmts')); so.insert(0, nf_o)
codes = {e.get('formatCode'): int(e.get('numFmtId')) for e in nf_o}
nxt = max([163] + list(codes.values())) + 1
nfmap = {}
if nf_n is not None:
    for e in nf_n:
        c, i = e.get('formatCode'), int(e.get('numFmtId'))
        if c not in codes:
            codes[c] = nxt; etree.SubElement(nf_o, q('numFmt'), numFmtId=str(nxt), formatCode=c); nxt += 1
        nfmap[i] = codes[c]
nf_o.set('count', str(len(nf_o)))
# styles de cellules
xo, xn = child(so, 'cellXfs'), child(sn, 'cellXfs'); xbase = len(xo)
for x in xn:
    y = copy.deepcopy(x)
    y.set('fontId', str(int(y.get('fontId', 0)) + fo)); y.set('fillId', str(int(y.get('fillId', 0)) + fi)); y.set('borderId', str(int(y.get('borderId', 0)) + bo))
    nid = int(y.get('numFmtId', 0)); y.set('numFmtId', str(nfmap.get(nid, nid))); y.set('xfId', '0')
    for a in ('applyFont', 'applyFill', 'applyBorder', 'applyNumberFormat'): y.set(a, '1')
    xo.append(y)
xo.set('count', str(len(xo)))
do_ = child(so, 'dxfs'); dn = child(sn, 'dxfs'); dbase = len(do_) if do_ is not None else 0
if dn is not None:
    if do_ is None:
        do_ = etree.Element(q('dxfs')); so.find(q('cellStyles')).addnext(do_)
    for x in dn: do_.append(copy.deepcopy(x))
    do_.set('count', str(len(do_)))

# --- feuille
ss = [''.join(si.itertext()) for si in parse(zn, 'xl/sharedStrings.xml')] if 'xl/sharedStrings.xml' in zn.namelist() else []
sh = parse(zn, 'xl/worksheets/sheet1.xml')
for c in sh.iter(q('c')):
    if c.get('s') is not None: c.set('s', str(int(c.get('s')) + xbase))
    if c.get('t') == 's':
        v = c.find(q('v')); txt = ss[int(v.text)]; c.remove(v); c.set('t', 'inlineStr')
        is_ = etree.SubElement(c, q('is')); t = etree.SubElement(is_, q('t')); t.text = txt
        if txt != txt.strip(): t.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
for r in sh.iter(q('row')):
    if r.get('s') is not None: r.set('s', str(int(r.get('s')) + xbase))
for c in sh.iter(q('col')):
    if c.get('style') is not None: c.set('style', str(int(c.get('style')) + xbase))
for rule in sh.iter(q('cfRule')):
    if rule.get('dxfId') is not None: rule.set('dxfId', str(int(rule.get('dxfId')) + dbase))
for v in sh.iter(q('sheetView')):
    if 'tabSelected' in v.attrib: del v.attrib['tabSelected']

# --- classeur
wb = parse(zo, 'xl/workbook.xml'); sheets = wb.find(q('sheets'))
sid = max(int(s.get('sheetId')) for s in sheets) + 1; idx = len(sheets)
etree.SubElement(sheets, q('sheet'), name=SHEET_NAME, sheetId=str(sid)).set('{%s}id' % RNS, 'rIdChrono2027')
dnm = wb.find(q('definedNames'))
if dnm is None:
    dnm = etree.Element(q('definedNames')); sheets.addnext(dnm)
nl = parse(zn, 'xl/workbook.xml').find(q('definedNames'))
if nl is not None:
    for d in nl:
        e = etree.SubElement(dnm, q('definedName'), name=d.get('name'), localSheetId=str(idx)); e.text = d.text
        if d.get('hidden'): e.set('hidden', d.get('hidden'))
af = sh.find(q('autoFilter'))
if af is not None:
    e = etree.SubElement(dnm, q('definedName'), name='_xlnm._FilterDatabase', localSheetId=str(idx), hidden='1'); e.text = "'%s'!%s" % (SHEET_NAME, re.sub(r'([A-Z]+)(\d+)', r'$\1$\2', af.get('ref')))
cp = wb.find(q('calcPr')); cp.set('fullCalcOnLoad', '1')
rels = parse(zo, 'xl/_rels/workbook.xml.rels')
etree.SubElement(rels, '{http://schemas.openxmlformats.org/package/2006/relationships}Relationship', Id='rIdChrono2027',
                 Type='http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet', Target='worksheets/sheet_chrono2027.xml')
ct = parse(zo, '[Content_Types].xml')
etree.SubElement(ct, '{http://schemas.openxmlformats.org/package/2006/content-types}Override', PartName='/' + NEW_PATH,
                 ContentType='application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml')
ser = lambda e: etree.tostring(e, xml_declaration=True, encoding='UTF-8', standalone=True)
repl = {'xl/styles.xml': ser(so), 'xl/workbook.xml': ser(wb), 'xl/_rels/workbook.xml.rels': ser(rels), '[Content_Types].xml': ser(ct)}
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
    for it in zo.infolist():
        z.writestr(it, repl.get(it.filename, zo.read(it.filename)))
    z.writestr(NEW_PATH, ser(sh))
print('ok', OUT, '· onglet', SHEET_NAME, 'en position', idx + 1)
