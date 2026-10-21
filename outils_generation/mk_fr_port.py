import sys; sys.path.insert(0,'.')
import tr_fr, build_plaquette as BP
miss=set()
orig=BP.run
def run(p,t,size,color=BP.INK,bold=False,italic=False,spc=None):
    v=tr_fr.fr(t)
    if v is None:
        if t.strip() and not t.strip().isdigit(): miss.add(t)
        v=t
    orig(p,v,size,color,bold,italic,spc)
    try: p.runs[-1]._r.get_or_add_rPr().set('lang','fr-FR')
    except Exception: pass
BP.run=run
BP.OUT='/home/user/Paul/_fr_tmp_'
BP.complement()
print('MISSING',len(miss))
for t in sorted(miss): print(repr(t))
