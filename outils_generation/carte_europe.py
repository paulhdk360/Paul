"""Carte de l'Europe (Natural Earth 50 m, domaine public) avec Enedril positionné à Lons (64), près de Pau.
Génère un SVG vectoriel simplifié, en deux variantes :
  - "web"   : classes CSS (.m-sea, .m-land, .m-fr...) stylées par la page (thème clair / sombre)
  - "print" : couleurs intégrées, pour la plaquette (SVG + PNG)
Usage : python3 carte_europe.py <ne_50m_admin_0_countries.geojson> <dossier_sortie>"""
import json, math, os, sys

LONS = (-0.3667, 43.3167)          # Lons (64140) : 43°19' N, 0°22' O
CITIES = {                          # nom: (lon, lat, dx, dy, ancrage)
    "Paris": (2.352, 48.857, 7, -6, "start"),
    "London": (-0.128, 51.507, -7, -5, "end"),
    "Madrid": (-3.704, 40.417, 7, 14, "start"),
    "Berlin": (13.405, 52.52, 7, -6, "start"),
    "Rome": (12.496, 41.903, 7, 14, "start"),
    "Algiers": (3.059, 36.753, 7, 14, "start"),
    "Bern": (7.447, 46.948, 8, 4, "start"),
}
CITIES_FR = {"London": "Londres", "Algiers": "Alger", "Bern": "Berne"}

R = 6371.0
LON0, LAT0 = math.radians(8.0), math.radians(47.0)


def laea(lon, lat):
    l, p = math.radians(lon), math.radians(lat)
    k = math.sqrt(2 / (1 + math.sin(LAT0) * math.sin(p) + math.cos(LAT0) * math.cos(p) * math.cos(l - LON0)))
    return R * k * math.cos(p) * math.sin(l - LON0), R * k * (math.cos(LAT0) * math.sin(p) - math.sin(LAT0) * math.cos(p) * math.cos(l - LON0))


def clip(poly, x0, y0, x1, y1):      # Sutherland-Hodgman sur un rectangle
    def inside(p, e): return (p[0] >= x0, p[0] <= x1, p[1] >= y0, p[1] <= y1)[e]
    def inter(a, b, e):
        if e < 2:
            x = x0 if e == 0 else x1; t = (x - a[0]) / (b[0] - a[0]); return (x, a[1] + t * (b[1] - a[1]))
        y = y0 if e == 2 else y1; t = (y - a[1]) / (b[1] - a[1]); return (a[0] + t * (b[0] - a[0]), y)
    out = poly
    for e in range(4):
        inp, out = out, []
        if not inp: break
        s = inp[-1]
        for p in inp:
            if inside(p, e):
                if not inside(s, e): out.append(inter(s, p, e))
                out.append(p)
            elif inside(s, e): out.append(inter(s, p, e))
            s = p
    return out


def dp(pts, tol):                    # Douglas-Peucker (itératif)
    if len(pts) < 4: return pts
    keep = [False] * len(pts); keep[0] = keep[-1] = True; st = [(0, len(pts) - 1)]
    while st:
        a, b = st.pop(); ax, ay = pts[a]; bx, by = pts[b]; dx, dy = bx - ax, by - ay; n = math.hypot(dx, dy) or 1e-9
        m, idx = 0, None
        for i in range(a + 1, b):
            d = abs(dy * (pts[i][0] - ax) - dx * (pts[i][1] - ay)) / n
            if d > m: m, idx = d, i
        if m > tol: keep[idx] = True; st += [(a, idx), (idx, b)]
    return [p for p, k in zip(pts, keep) if k]


def build(geojson, W, H, cx_km, cy_km, width_km, variant="web", lang="fr", tol=.55, tag_dx=300, tag_dy=70, ts=1.0):
    """Carte centrée en (cx_km, cy_km) (projection LAEA), largeur visible width_km, rapport W:H."""
    k = W / width_km; height_km = H / k
    x0, x1, y0, y1 = cx_km - width_km / 2, cx_km + width_km / 2, cy_km - height_km / 2, cy_km + height_km / 2
    sx = lambda x: (x - x0) * k
    sy = lambda y: (y1 - y) * k
    pad = 40 / k
    land, fr = [], []
    for f in geojson["features"]:
        pr = f["properties"]; name = pr.get("ADMIN"); geom = f["geometry"]
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        for rings in polys:
            for ri, ring in enumerate(rings):
                pts = [laea(lo, la) for lo, la in ring]
                if max(p[0] for p in pts) < x0 - pad or min(p[0] for p in pts) > x1 + pad or max(p[1] for p in pts) < y0 - pad or min(p[1] for p in pts) > y1 + pad: continue
                pts = clip(pts, x0 - pad, y0 - pad, x1 + pad, y1 + pad)
                if len(pts) < 3: continue
                pts = [(sx(x), sy(y)) for x, y in pts]
                if pts[0] == pts[-1]: pts = pts[:-1]
                far = max(range(len(pts)), key=lambda i: (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2)   # anneau fermé : on coupe en deux
                pts = dp(pts[:far + 1], tol)[:-1] + dp(pts[far:] + [pts[0]], tol)[:-1]
                if len(pts) < 3: continue
                d = "M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + "Z"
                (fr if name == "France" else land).append((name, ri, d))
    def path_of(items):
        # un seul <path> par pays (anneaux extérieurs et trous ensemble, règle evenodd)
        by = {}
        for n, ri, d in items: by.setdefault(n, []).append(d)
        return by
    grat = ""
    for lon in range(-30, 61, 10):
        pts = [laea(lon, la) for la in range(25, 76, 1)]
        pts = [(sx(x), sy(y)) for x, y in pts]
        if any(-50 < x < W + 50 and -50 < y < H + 50 for x, y in pts): grat += '<path d="M' + "L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + '"/>'
    for lat in range(30, 76, 10):
        pts = [(sx(x), sy(y)) for x, y in (laea(lo, lat) for lo in range(-40, 71, 1))]
        grat += '<path d="M' + "L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + '"/>'
    px, py = laea(*LONS); px, py = sx(px), sy(py)
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-labelledby="mt">']
    out.append('<title id="mt">%s</title>' % ("Carte de l'Europe : Enedril est basé à Lons, près de Pau (France)" if lang == "fr" else "Map of Europe: Enedril is based in Lons, near Pau (France)"))
    if variant == "print":
        out.append("""<style>
.m-sea{fill:#EAF3FB}.m-grat{fill:none;stroke:#B9D3EA;stroke-width:.6;opacity:.8}
.m-land{fill:#C9DEF2;stroke:#FFFFFF;stroke-width:.9;stroke-linejoin:round}
.m-fr{fill:#0A4FA0;stroke:#FFFFFF;stroke-width:1;stroke-linejoin:round}
.m-ring{fill:none;stroke:#00AEEF;stroke-width:1.4}.m-dot{fill:#E2231A;stroke:#FFFFFF;stroke-width:2.2}
.m-city{fill:#51647A}.m-city.on-fr{fill:#FFFFFF}.m-lab.on-fr{fill:#FFFFFF}.m-lab{font:500 11px 'Ubuntu Mono',monospace;fill:#51647A;letter-spacing:.04em}
.m-tag{fill:#08203F}.m-tagt{font:700 13px 'Ubuntu Mono',monospace;fill:#FFFFFF;letter-spacing:.06em}.m-tags{font:400 10.5px 'Ubuntu Mono',monospace;fill:#9FDCFF}
.m-lead{stroke:#08203F;stroke-width:1.2;fill:none}
</style>""")
    out.append(f'<rect class="m-sea" width="{W}" height="{H}"/><g class="m-grat">{grat}</g>')
    land_by, fr_by = path_of(land), path_of(fr)
    out.append('<g class="m-land">' + "".join(f'<path d="{"".join(ds)}" fill-rule="evenodd"/>' for n, ds in land_by.items()) + "</g>")
    out.append('<g class="m-fr">' + "".join(f'<path d="{"".join(ds)}" fill-rule="evenodd"/>' for n, ds in fr_by.items()) + "</g>")
    for name, (lo, la, dx, dy, an) in CITIES.items():
        cx, cy = laea(lo, la); cx, cy = sx(cx), sy(cy)
        if not (8 < cx < W - 8 and 8 < cy < H - 8): continue
        label = CITIES_FR.get(name, name) if lang == "fr" else name
        cls = " on-fr" if name == "Paris" else ""
        out.append(f'<circle class="m-city{cls}" cx="{cx:.1f}" cy="{cy:.1f}" r="2.6"/><text class="m-lab{cls}" x="{cx + dx:.1f}" y="{cy + dy:.1f}" text-anchor="{an}">{label}</text>')
    # repère Enedril : anneaux, point, étiquette avec trait de rappel vers la mer (côté ouest)
    rings = "".join(f'<circle class="m-ring r{i}" cx="{px:.1f}" cy="{py:.1f}" r="{r * ts:.1f}" opacity="{o}"/>' for i, (r, o) in enumerate(((10, .95), (20, .6), (32, .35))))
    lx, ly = max(14, px - tag_dx), py - tag_dy
    tag_w, tag_h = 112 * ts, 38 * ts
    out.append(f'<g class="m-pin">{rings}<path class="m-lead" d="M{px:.1f},{py:.1f}L{lx + tag_w:.1f},{ly + tag_h / 2:.1f}"/>'
               f'<circle class="m-dot" cx="{px:.1f}" cy="{py:.1f}" r="{6 * ts:.1f}"/>'
               f'<g><rect class="m-tag" x="{lx:.1f}" y="{ly:.1f}" width="{tag_w}" height="{tag_h}" rx="3"/>'
               f'<text class="m-tagt" x="{lx + 10 * ts:.1f}" y="{ly + 16 * ts:.1f}">ENEDRIL</text>'
               f'<text class="m-tags" x="{lx + 10 * ts:.1f}" y="{ly + 30 * ts:.1f}">Lons · Pau (64)</text></g></g>')
    out.append("</svg>")
    return "".join(out), (px, py)


PRESETS = {   # nom: (W, H, cx_km, cy_km, width_km, tag_dx, tag_dy)
    "large": (1000, 620, -80, 10, 4500, 300, 75),       # site et plaquette portrait
    "compact": (1000, 840, -250, 0, 3700, 280, 80),     # plaquette paysage
}


def main(geo, outdir):
    import subprocess
    gj = json.load(open(geo, encoding="utf8")); os.makedirs(outdir, exist_ok=True)
    W, H, cx, cy, w, tdx, tdy = PRESETS["large"]
    svg, _ = build(gj, W, H, cx, cy, w, "web", "fr", .6, tdx, tdy, 1.45)
    open(os.path.join(outdir, "carte_europe_site.svg"), "w", encoding="utf8").write(svg)
    for name, (W, H, cx, cy, w, tdx, tdy) in PRESETS.items():
        for lang in ("fr", "en"):
            svg, _ = build(gj, W, H, cx, cy, w, "print", lang, .45, tdx, tdy)
            f = os.path.join(outdir, f"carte_europe_plaquette_{name}_{lang}.svg"); open(f, "w", encoding="utf8").write(svg)
            html = f"<html><body style='margin:0;background:transparent'>{svg}</body></html>"
            h = f.replace(".svg", ".html"); open(h, "w").write(html)
            js = f"""const {{chromium}}=require('/opt/node-tools/node_modules/playwright');(async()=>{{const b=await chromium.launch({{args:['--no-sandbox']}});
const p=await b.newPage({{viewport:{{width:{W},height:{H}}},deviceScaleFactor:2.4}});await p.goto('file://{os.path.abspath(h)}');await p.waitForTimeout(400);
await p.screenshot({{path:'{f.replace(".svg", ".png")}',omitBackground:true}});await b.close()}})();"""
            open("_r.cjs", "w").write(js); subprocess.run(["node", "_r.cjs"], check=True); os.remove("_r.cjs"); os.remove(h)
    print("ok", os.listdir(outdir))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
