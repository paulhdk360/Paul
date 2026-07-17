"use client";

import { useState } from "react";
import Link from "next/link";
import { fmtDate } from "@/lib/format";
import { fmtDayLabel, monthDateRange, monthLabel, rangeOverlapsMonth, shiftMonth } from "@/lib/calendar";
import type { Affaire, CatalogueOutil, Client, Devis, DevisLigne } from "@/lib/types";

const FIRST_COL_WIDTH = 190;
const CLIENT_COL_WIDTH = 170;

interface Engagement {
  affaireRef: string;
  clientName: string;
}

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
  const [vue, setVue] = useState<"calendrier" | "liste">("calendrier");

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

  // Which affaires/clients have each catalogue reference engaged on which day
  // of the selected month, derived from each devis's forecast window — the
  // only date-range signal available (no per-unit reservation table exists).
  // Keyed "outilId:date" so a given reference booked by two overlapping
  // devis shows both instead of silently picking one.
  const monthDays = monthDateRange(month);
  const engagementByOutilDay = new Map<string, Engagement[]>();
  for (const d of enPeriode) {
    const start = d.periode_prevue_debut!;
    const end = d.periode_prevue_fin ?? start;
    const affaire = affaireById.get(d.affaire_id);
    const client = affaire?.client_id ? clientById.get(affaire.client_id) : null;
    const engagement: Engagement = { affaireRef: affaire?.reference ?? "—", clientName: client?.raison_sociale ?? "Client non renseigné" };
    const outilIds = new Set((lignesByDevis.get(d.id) ?? []).map((l) => l.outil_id).filter((id): id is string => !!id));
    for (const day of monthDays) {
      if (day < start || day > end) continue;
      for (const outilId of outilIds) {
        const key = `${outilId}:${day}`;
        const arr = engagementByOutilDay.get(key) ?? [];
        arr.push(engagement);
        engagementByOutilDay.set(key, arr);
      }
    }
  }

  const calendarRows = Array.from(outilsConcernes)
    .map((id) => outilById.get(id))
    .filter((o): o is Pick<CatalogueOutil, "id" | "designation" | "numero_article"> => !!o)
    .sort((a, b) => a.designation.localeCompare(b.designation))
    .map((outil) => {
      const clientNames = new Set<string>();
      for (const day of monthDays) {
        for (const e of engagementByOutilDay.get(`${outil.id}:${day}`) ?? []) clientNames.add(e.clientName);
      }
      return { outil, clients: Array.from(clientNames) };
    });

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

      <div className="mb-4 flex items-center gap-1.5 rounded-lg border border-border bg-bg-sunken p-1 w-fit">
        <button
          type="button"
          onClick={() => setVue("calendrier")}
          className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${
            vue === "calendrier" ? "bg-white text-navy shadow-sm" : "text-text-muted hover:text-navy"
          }`}
        >
          🗓️ Calendrier
        </button>
        <button
          type="button"
          onClick={() => setVue("liste")}
          className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${
            vue === "liste" ? "bg-white text-navy shadow-sm" : "text-text-muted hover:text-navy"
          }`}
        >
          📋 Liste
        </button>
      </div>

      {vue === "calendrier" && (
        <div className="flex flex-col gap-3">
          <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
            <table className="border-collapse text-[11.5px]">
              <thead>
                <tr>
                  <th
                    style={{ width: FIRST_COL_WIDTH, minWidth: FIRST_COL_WIDTH }}
                    className="sticky left-0 z-10 border-b border-r border-border bg-bg-sunken px-3 py-2 text-left text-[10.5px] font-semibold uppercase text-text-muted"
                  >
                    Référence catalogue
                  </th>
                  <th
                    style={{ left: FIRST_COL_WIDTH, width: CLIENT_COL_WIDTH, minWidth: CLIENT_COL_WIDTH }}
                    className="sticky z-10 border-b border-r border-border bg-bg-sunken px-3 py-2 text-left text-[10.5px] font-semibold uppercase text-text-muted"
                  >
                    Client(s) du mois
                  </th>
                  {monthDays.map((day) => {
                    const { dow, dm } = fmtDayLabel(day);
                    return (
                      <th key={day} className="min-w-[34px] border-b border-border bg-bg-sunken px-1 py-1.5 text-center text-[10px] font-medium text-text-muted">
                        <div>{dow}</div>
                        <div>{dm}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {calendarRows.map(({ outil, clients: rowClients }) => (
                  <tr key={outil.id}>
                    <td
                      style={{ width: FIRST_COL_WIDTH, minWidth: FIRST_COL_WIDTH }}
                      className="sticky left-0 z-10 border-b border-r border-border bg-white px-3 py-1.5 text-[12px] font-medium"
                    >
                      <div>{outil.designation}</div>
                      {outil.numero_article && <div className="text-[10.5px] font-normal text-text-muted">{outil.numero_article}</div>}
                    </td>
                    <td
                      style={{ left: FIRST_COL_WIDTH, width: CLIENT_COL_WIDTH, minWidth: CLIENT_COL_WIDTH }}
                      className="sticky z-10 border-b border-r border-border bg-white px-3 py-1.5 text-[11.5px] text-text-dark"
                      title={rowClients.join(" · ")}
                    >
                      {rowClients.join(", ") || "—"}
                    </td>
                    {monthDays.map((day) => {
                      const engagements = engagementByOutilDay.get(`${outil.id}:${day}`) ?? [];
                      const engaged = engagements.length > 0;
                      const multiple = engagements.length > 1;
                      const tooltip = engagements.map((e) => `${e.affaireRef} — ${e.clientName}`).join(" · ");
                      return (
                        <td key={day} className="border-b border-border p-0.5 text-center">
                          <div
                            title={engaged ? tooltip : undefined}
                            className={`h-6 w-full rounded text-[10px] font-semibold leading-6 ${
                              multiple ? "bg-warning/20 text-warning" : engaged ? "bg-blue/20 text-blue" : ""
                            }`}
                          >
                            {multiple ? engagements.length : ""}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {calendarRows.length === 0 && (
                  <tr>
                    <td colSpan={monthDays.length + 2} className="p-6 text-center text-text-muted">
                      Aucune référence engagée sur {monthLabel(month).toLowerCase()}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11.5px] text-text-muted">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-5 rounded bg-blue/20" /> Engagé (période prévisionnelle d&apos;un devis)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-5 rounded bg-warning/20" /> Engagé par plusieurs affaires le même jour
            </div>
          </div>
        </div>
      )}

      {vue === "liste" && (
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
      )}
    </div>
  );
}
