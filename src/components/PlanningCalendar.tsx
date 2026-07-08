"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setPlanningEntry } from "@/actions/planning";
import { useToast } from "@/components/Toast";
import { monthDateRange, shiftMonth } from "@/lib/calendar";
import type { CategoriePersonnel, Employe, PlanningEntry, PlanningStatut } from "@/lib/types";

export function PlanningCalendar({
  month,
  employes,
  statuts,
  entries,
}: {
  month: string;
  employes: Employe[];
  statuts: PlanningStatut[];
  entries: PlanningEntry[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();
  const [categorie, setCategorie] = useState<CategoriePersonnel>("terrain");

  const dates = monthDateRange(month);
  const visibleEmployes = employes.filter((e) => e.categorie === categorie && e.actif);
  const statutsForCategorie = statuts.filter((s) => s.categorie === categorie);
  const entryMap = new Map(entries.map((e) => [`${e.employe_id}:${e.date}`, e]));
  const statutByLibelle = new Map(statuts.map((s) => [s.libelle, s]));

  function handleChange(employeId: string, date: string, statut: string) {
    startTransition(async () => {
      try {
        await setPlanningEntry(employeId, date, statut || null, null);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  const [y, m] = month.split("-").map(Number);
  const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          <button
            onClick={() => setCategorie("terrain")}
            className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold ${categorie === "terrain" ? "bg-navy text-white" : "border border-border text-text-muted hover:bg-bg-sunken"}`}
          >
            Terrain
          </button>
          <button
            onClick={() => setCategorie("administratif")}
            className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold ${categorie === "administratif" ? "bg-navy text-white" : "border border-border text-text-muted hover:bg-bg-sunken"}`}
          >
            Administratif
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/rh/planning?month=${shiftMonth(month, -1)}`} className="rounded-lg border border-border px-3 py-1.5 text-[13px] font-semibold hover:bg-bg-sunken">
            ←
          </Link>
          <div className="min-w-[130px] text-center text-[14px] font-semibold capitalize text-navy">{monthLabel}</div>
          <Link href={`/rh/planning?month=${shiftMonth(month, 1)}`} className="rounded-lg border border-border px-3 py-1.5 text-[13px] font-semibold hover:bg-bg-sunken">
            →
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {statutsForCategorie.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.couleur }} />
            {s.libelle}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
        <table className="border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 border-b border-r border-border bg-bg-sunken px-3 py-2 text-left text-[10.5px] font-semibold uppercase text-text-muted">
                Collaborateur
              </th>
              {dates.map((d) => (
                <th key={d} className="min-w-[34px] border-b border-border bg-bg-sunken px-1 py-1.5 text-center text-[10px] font-medium text-text-muted">
                  {d.slice(8, 10)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleEmployes.map((emp) => (
              <tr key={emp.id}>
                <td className="sticky left-0 z-10 border-b border-r border-border bg-white px-3 py-1.5 text-[12px] font-medium">
                  {emp.prenom ? `${emp.prenom} ` : ""}
                  {emp.nom}
                </td>
                {dates.map((d) => {
                  const entry = entryMap.get(`${emp.id}:${d}`);
                  const statut = entry ? statutByLibelle.get(entry.statut) : undefined;
                  return (
                    <td key={d} className="border-b border-border p-0.5 text-center">
                      <select
                        value={entry?.statut ?? ""}
                        onChange={(e) => handleChange(emp.id, d, e.target.value)}
                        style={statut ? { backgroundColor: `${statut.couleur}33`, color: statut.couleur } : undefined}
                        className="h-6 w-8 rounded border-0 text-center text-[9px] font-semibold focus:outline-none"
                      >
                        <option value="" />
                        {statutsForCategorie.map((s) => (
                          <option key={s.id} value={s.libelle}>
                            {s.libelle}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
            {visibleEmployes.length === 0 && (
              <tr>
                <td colSpan={dates.length + 1} className="p-6 text-center text-text-muted">
                  Aucun collaborateur actif dans cette catégorie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
