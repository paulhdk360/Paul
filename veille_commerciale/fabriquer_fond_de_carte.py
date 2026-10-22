#!/usr/bin/env python3
"""Outil à lancer une seule fois : produit europe_paths.json (fond de carte simplifié) avec geopandas 0.14 (pip install geopandas==0.14.4)."""
import json, math, warnings
warnings.filterwarnings('ignore')
import geopandas as gpd
from shapely.geometry import box, MultiPolygon, Polygon
LON0, LON1, LAT0, LAT1 = -12, 45, 34, 71
K = 15.0; COS = math.cos(math.radians(52))
def proj(lon, lat): return ((lon - LON0) * COS * K, (LAT1 - lat) * K)
w = gpd.read_file(gpd.datasets.get_path('naturalearth_lowres'))
w = w[(w.continent == 'Europe') | (w.name.isin(['Turkey']))]
clip = box(LON0, LAT0, LON1, LAT1)
out = {}
for _, r in w.iterrows():
    g = r.geometry.intersection(clip)
    if g.is_empty: continue
    g = g.simplify(0.06)
    polys = list(g.geoms) if isinstance(g, MultiPolygon) else [g]
    d = ''
    for p in polys:
        if not isinstance(p, Polygon) or p.area < 0.05: continue
        pts = [proj(x, y) for x, y in p.exterior.coords]
        d += 'M' + 'L'.join('%.1f,%.1f' % q for q in pts) + 'Z'
    if d: out[r['name']] = d
W, H = proj(LON1, LAT1)[0], proj(LON0, LAT0)[1]
json.dump({'w': round(W, 1), 'h': round(H, 1), 'k': K, 'cos': COS, 'lon0': LON0, 'lat1': LAT1, 'paths': out}, open('europe_paths.json', 'w'))
print(len(out), W, H)
