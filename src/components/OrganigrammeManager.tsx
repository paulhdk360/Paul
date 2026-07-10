"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateEmploye } from "@/actions/employes";
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
const BOX_WIDTH = 150;
const BOX_HEIGHT_VIEW = 62;
const BOX_HEIGHT_EDIT = 96;
const ROW_GAP = 46;

export function OrganigrammeManager({ employes }: { employes: Employe[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [editMode, setEditMode] = useState(false);

  const nodes = buildOrgTree(employes);
  const flat = flattenOrgTree(nodes);
  const totalUnits = Math.max(orgTreeTotalWidth(nodes), 1);
  const maxDepth = orgTreeMaxDepth(nodes);

  const boxHeight = editMode ? BOX_HEIGHT_EDIT : BOX_HEIGHT_VIEW;
  const rowHeight = boxHeight + ROW_GAP;
  const width = totalUnits * UNIT_WIDTH;
  const height = (maxDepth + 1) * rowHeight + boxHeight;

  const xFor = (n: OrgNode) => n.x * UNIT_WIDTH;
  const yFor = (n: OrgNode) => n.depth * rowHeight;

  const connectors: { x1: number; y1: number; x2: number; y2: number }[] = [];
  function collectConnectors(n: OrgNode) {
    if (!n.children.length) return;
    const parentX = xFor(n);
    const parentBottom = yFor(n) + boxHeight;
    const midY = parentBottom + ROW_GAP / 2;
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

  function setManager(employeId: string, managerId: string) {
    if (managerId === employeId) {
      showToast("Un collaborateur ne peut pas être son propre responsable.");
      return;
    }
    startTransition(async () => {
      try {
        await updateEmploye(employeId, { manager_id: managerId || null });
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="font-display text-[30px] font-bold tracking-wide text-navy">Organigramme</div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditMode((v) => !v)}
            className={`rounded-lg px-4 py-2.5 text-[13.5px] font-semibold ${
              editMode ? "bg-navy text-white" : "border border-border text-text-muted hover:bg-bg-sunken"
            }`}
          >
            {editMode ? "Terminer la modification" : "🔧 Modifier les rattachements"}
          </button>
          <button onClick={downloadPdf} className="rounded-lg bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-dark">
            Télécharger en PDF
          </button>
        </div>
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

      {editMode && (
        <div className="mb-4 rounded-lg border border-blue/30 bg-blue/5 p-3 text-[12.5px] text-text-dark">
          Choisis le responsable direct de chaque collaborateur ci-dessous — celui qui n&apos;a pas de responsable se
          retrouve au sommet de l&apos;organigramme (le PDG, par exemple). Les changements sont enregistrés
          immédiatement.
        </div>
      )}

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
              const isRoot = n.depth === 0;
              return (
                <div
                  key={n.employe.id}
                  className={`absolute rounded-lg border p-2.5 shadow-sm ${isRoot ? "border-navy bg-navy" : "border-border bg-white"}`}
                  style={{
                    left: xFor(n) - BOX_WIDTH / 2,
                    top: yFor(n),
                    width: BOX_WIDTH,
                    height: boxHeight,
                    borderLeft: isRoot ? undefined : `3px solid ${CATEGORIE_COLOR[n.employe.categorie] ?? "#0B2E6B"}`,
                  }}
                >
                  {isRoot && (
                    <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-blue">Sommet</div>
                  )}
                  <div className={`truncate text-[12.5px] font-semibold ${isRoot ? "text-white" : "text-navy"}`}>{nom}</div>
                  <div className={`truncate text-[11px] ${isRoot ? "text-white/70" : "text-text-muted"}`}>
                    {n.employe.fonction || CATEGORIE_PERSONNEL_LABELS[n.employe.categorie]}
                  </div>
                  {editMode && (
                    <select
                      value={n.employe.manager_id ?? ""}
                      disabled={isPending}
                      onChange={(e) => setManager(n.employe.id, e.target.value)}
                      className={`mt-1.5 w-full rounded border px-1 py-1 text-[10.5px] ${
                        isRoot ? "border-white/30 bg-navy-dark text-white" : "border-border bg-bg-sunken text-text-dark"
                      }`}
                    >
                      <option value="">— Aucun (sommet) —</option>
                      {employes
                        .filter((e) => e.id !== n.employe.id)
                        .map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.prenom ? `${e.prenom} ` : ""}
                            {e.nom}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
