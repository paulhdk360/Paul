"use client";

import Link from "next/link";
import { fmtDate } from "@/lib/format";
import { monthLabel, rangeOverlapsMonth, shiftMonth } from "@/lib/calendar";
import type { Affaire, CatalogueOutil, Client, Devis, DevisLigne } from "@/lib/types";

export function PlanningMaterielManager({
  month,
  devis,
  lignes,
  affaires,
  clients,
  outils,
}: {
  month: string;
  devis: Devis[];
  lignes: DevisLigne[];
  affaires: Affaire[];
  clients: Client[];
  outils: Pick<CatalogueOutil, "id" | "designation" | "numero_article">[];
}) {
  const affaireById = new Map(affaires.map((a) => [a.id, a]));
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const outilById = new Map(outils.map((o) => [o.id, o]));

  const lignesByDevis = new Map<string, DevisLigne[]>();
  for (const l of lignes) {
    const arr = lignesByDevis.get(l.devis_id) ?? [];
    arr.push(l);
    lignesByDevis.set(l.devis_id, arr);
  }

  const enPeriode = devis.filter((d) => {
    if (!d.periode_prevue_debut) return false;
    const fin = d.periode_prevue_fin ?? d.periode_prevue_debut;
    return rangeOverlapsMonth(d.periode_prevue_debut, fin, month);
  });

  const outilsConcernes = new Set<string>();
  for (const d of enPeriode) {
    for (const l of lignesByDevis.get(d.id) ?? []) {
      if (l.outil_id) outilsConcernes.add(l.outil_id);
    }
  }

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide text-navy">Planning matériel</div>
      <div className="mb-6 text-[13.5px] text-text-muted">
        Périodes prévisionnelles renseignées sur les devis — vue d&apos;ensemble du matériel engagé sur l&apos;année,
        même pour des affaires pas encore confirmées.
      </div>

      <div className="mb-5 flex items-center gap-2.5">
        <Link
          href={`/planning-materiel?month=${shiftMonth(month, -1)}`}
          className="rounded-lg border border-border px-3 py-1.5 text-[13px] font-semibold hover:bg-bg-sunken"
        >
          ← Mois précédent
        </Link>
        <div className="min-w-[150px] text-center text-[15px] font-semibold capitalize text-navy">{monthLabel(month)}</div>
        <Link
          href={`/planning-materiel?month=${shiftMonth(month, 1)}`}
          className="rounded-lg border border-border px-3 py-1.5 text-[13px] font-semibold hover:bg-bg-sunken"
        >
          Mois suivant →
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
        <div className="rounded-[10px] border border-border bg-bg-card p-4">
          <div className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-text-muted">Devis concernés</div>
          <div className="font-mono text-[24px] font-semibold text-navy">{enPeriode.length}</div>
        </div>
        <div className="rounded-[10px] border border-border bg-bg-card p-4">
          <div className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-text-muted">Références catalogue engagées</div>
          <div className="font-mono text-[24px] font-semibold text-navy">{outilsConcernes.size}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {enPeriode.map((d) => {
          const affaire = affaireById.get(d.affaire_id);
          const client = affaire?.client_id ? clientById.get(affaire.client_id) : null;
          const equipements = (lignesByDevis.get(d.id) ?? [])
            .filter((l) => l.outil_id)
            .map((l) => outilById.get(l.outil_id!)?.designation ?? l.designation);
          const uniqueEquipements = Array.from(new Set(equipements));

          return (
            <div key={d.id} className="rounded-[10px] border border-border bg-bg-card p-4">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[14px] font-semibold text-navy">
                  {affaire?.reference ?? "—"} — {client?.raison_sociale ?? "Client non renseigné"}
                </div>
                <Link
                  href={`/affaires/${d.affaire_id}/devis/${d.id}`}
                  className="text-[12.5px] text-blue hover:underline"
                >
                  Ouvrir le devis →
                </Link>
              </div>
              <div className="mb-2 text-[12.5px] text-text-muted">
                Période prévisionnelle : {fmtDate(d.periode_prevue_debut)} → {fmtDate(d.periode_prevue_fin ?? d.periode_prevue_debut)}
                {" · "}Devis {d.reference} ({d.version})
              </div>
              {uniqueEquipements.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {uniqueEquipements.map((e) => (
                    <span key={e} className="rounded-full border border-border bg-bg-sunken px-2.5 py-0.5 text-[11.5px] text-text-dark">
                      {e}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-[11.5px] text-text-muted">Aucune ligne liée au catalogue outils sur ce devis.</div>
              )}
            </div>
          );
        })}
        {enPeriode.length === 0 && (
          <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center text-text-muted">
            Aucun devis avec une période prévisionnelle sur {monthLabel(month).toLowerCase()}.
          </div>
        )}
      </div>
    </div>
  );
}
