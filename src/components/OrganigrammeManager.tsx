"use client";

import { useToast } from "@/components/Toast";
import { CATEGORIE_PERSONNEL_LABELS } from "@/lib/company";
import { generateOrganigrammePdf } from "@/lib/pdf/organigrammePdf";
import { buildOrgTree, flattenOrgTree, orgTreeMaxDepth, orgTreeTotalWidth, type OrgNode } from "@/lib/orgchart";
import type { Employe } from "@/lib/types";

const CATEGORIE_COLOR: Record<string, string> = {
  bureaux: "#1477C6",
  atelier: "#C98A1E",
  chantier: "#1C9A6C",
};

const UNIT_WIDTH = 168;
const ROW_HEIGHT = 108;
const BOX_WIDTH = 150;
const BOX_HEIGHT = 62;

export function OrganigrammeManager({ employes }: { employes: Employe[] }) {
  const { showToast } = useToast();
  const nodes = buildOrgTree(employes);
  const flat = flattenOrgTree(nodes);
  const totalUnits = Math.max(orgTreeTotalWidth(nodes), 1);
  const maxDepth = orgTreeMaxDepth(nodes);

  const width = totalUnits * UNIT_WIDTH;
  const height = (maxDepth + 1) * ROW_HEIGHT + BOX_HEIGHT;

  const xFor = (n: OrgNode) => n.x * UNIT_WIDTH;
  const yFor = (n: OrgNode) => n.depth * ROW_HEIGHT;

  const connectors: { x1: number; y1: number; x2: number; y2: number }[] = [];
  function collectConnectors(n: OrgNode) {
    if (!n.children.length) return;
    const parentX = xFor(n);
    const parentBottom = yFor(n) + BOX_HEIGHT;
    const midY = parentBottom + (ROW_HEIGHT - BOX_HEIGHT) / 2;
    connectors.push({ x1: parentX, y1: parentBottom, x2: parentX, y2: midY });
    const firstX = xFor(n.children[0]);
    const lastX = xFor(n.children[n.children.length - 1]);
    connectors.push({ x1: firstX, y1: midY, x2: lastX, y2: midY });
    for (const c of n.children) {
      connectors.push({ x1: xFor(c), y1: midY, x2: xFor(c), y2: yFor(c) });
      collectConnectors(c);
    }
  }
  nodes.forEach(collectConnectors);

  function downloadPdf() {
    try {
      generateOrganigrammePdf(employes);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Échec de la génération du PDF.");
    }
  }

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="font-display text-[30px] font-bold tracking-wide text-navy">Organigramme</div>
        <button onClick={downloadPdf} className="rounded-lg bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-dark">
          Télécharger en PDF
        </button>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-4 text-[12.5px] text-text-muted">
        <span>{employes.length} collaborateur(s) actif(s)</span>
        {(["bureaux", "atelier", "chantier"] as const).map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORIE_COLOR[c] }} />
            {CATEGORIE_PERSONNEL_LABELS[c]}
          </span>
        ))}
      </div>

      {employes.length === 0 ? (
        <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center text-text-muted">Aucun collaborateur actif.</div>
      ) : (
        <div className="overflow-auto rounded-[10px] border border-border bg-bg-card p-6">
          <div className="relative" style={{ width, height }}>
            <svg className="absolute inset-0" width={width} height={height}>
              {connectors.map((c, i) => (
                <line key={i} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke="#DCE3EF" strokeWidth={1.5} />
              ))}
            </svg>
            {flat.map((n) => {
              const nom = `${n.employe.prenom ? `${n.employe.prenom} ` : ""}${n.employe.nom}`;
              return (
                <div
                  key={n.employe.id}
                  className="absolute rounded-lg border border-border bg-white p-2.5 shadow-sm"
                  style={{
                    left: xFor(n) - BOX_WIDTH / 2,
                    top: yFor(n),
                    width: BOX_WIDTH,
                    height: BOX_HEIGHT,
                    borderLeft: `3px solid ${CATEGORIE_COLOR[n.employe.categorie] ?? "#0B2E6B"}`,
                  }}
                >
                  <div className="truncate text-[12.5px] font-semibold text-navy">{nom}</div>
                  <div className="truncate text-[11px] text-text-muted">{n.employe.fonction || CATEGORIE_PERSONNEL_LABELS[n.employe.categorie]}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
