"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateEmploye } from "@/actions/employes";
import { useToast } from "@/components/Toast";
import { CATEGORIE_PERSONNEL_LABELS, SPECIALITES_PAR_CATEGORIE } from "@/lib/company";
import { AUTRES_LABEL, groupEmployesForOrganigramme } from "@/lib/orgchart";
import type { Employe } from "@/lib/types";

const CATEGORIE_COLOR: Record<string, string> = {
  bureaux: "#1477C6",
  consultant: "#8B5CF6",
  atelier: "#C98A1E",
  chantier: "#1C9A6C",
};

export function OrganigrammeManager({ employes }: { employes: Employe[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const groupedByCategorie = groupEmployesForOrganigramme(employes);

  async function downloadPdf() {
    try {
      const { generateOrganigrammePdf } = await import("@/lib/pdf/organigrammePdf");
      generateOrganigrammePdf(employes);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Échec de la génération du PDF.");
    }
  }

  function setSpecialite(employeId: string, specialite: string) {
    startTransition(async () => {
      try {
        await updateEmploye(employeId, { specialite: specialite || null });
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
        <button onClick={downloadPdf} className="rounded-lg bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-dark">
          Télécharger en PDF
        </button>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-4 text-[12.5px] text-text-muted">
        <span>{employes.length} collaborateur(s) actif(s)</span>
      </div>

      {employes.length === 0 ? (
        <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center text-text-muted">Aucun collaborateur actif.</div>
      ) : (
        <div className="flex flex-col gap-5">
          {groupedByCategorie.map(({ categorie, groupes }) => {
            const total = groupes.reduce((sum, g) => sum + g.membres.length, 0);
            const color = CATEGORIE_COLOR[categorie];
            const hasSubGroupes = !!SPECIALITES_PAR_CATEGORIE[categorie];
            return (
              <div key={categorie} className="overflow-hidden rounded-[12px] border border-border bg-bg-card">
                <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ backgroundColor: `${color}14`, borderBottom: `1px solid ${color}33` }}>
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-display text-[17px] font-semibold text-navy">{CATEGORIE_PERSONNEL_LABELS[categorie]}</span>
                  <span className="text-[12px] text-text-muted">({total})</span>
                </div>
                <div className="flex flex-col gap-4 p-5">
                  {groupes.map((g) => (
                    <div key={g.label ?? "flat"}>
                      {hasSubGroupes && (
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                          {g.label} <span className="font-normal normal-case">({g.membres.length})</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {g.membres.map((m) => {
                          const nom = `${m.prenom ? `${m.prenom} ` : ""}${m.nom}`;
                          return (
                            <div
                              key={m.id}
                              className="min-w-[170px] rounded-lg border border-border bg-white p-3"
                              style={{ borderLeft: `3px solid ${color}` }}
                            >
                              <div className="truncate text-[13px] font-semibold text-navy">{nom}</div>
                              <div className="truncate text-[11px] text-text-muted">{m.fonction || CATEGORIE_PERSONNEL_LABELS[m.categorie]}</div>
                              {hasSubGroupes && (
                                <select
                                  value={m.specialite ?? ""}
                                  disabled={isPending}
                                  onChange={(e) => setSpecialite(m.id, e.target.value)}
                                  className="mt-2 w-full rounded border border-border bg-bg-sunken px-1 py-1 text-[10.5px] text-text-dark"
                                >
                                  <option value="">— {AUTRES_LABEL} —</option>
                                  {SPECIALITES_PAR_CATEGORIE[categorie].map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
