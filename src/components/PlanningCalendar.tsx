"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { setPlanningEntriesBulk, setPlanningEntry } from "@/actions/planning";
import { useToast } from "@/components/Toast";
import { CATEGORIE_PERSONNEL_LABELS, CATEGORIES_PERSONNEL } from "@/lib/company";
import { dateRange, fmtDayLabel, monthDateRange, shiftMonth } from "@/lib/calendar";
import type { Affaire, CategoriePersonnel, Employe, PlanningEntry, PlanningStatut } from "@/lib/types";

type CategorieFiltre = CategoriePersonnel | "tous";

// No entry for a given day is treated as the implicit default rather than
// "unknown" — chantier personnel default to Disponible (matches the
// "Disponibles le" panel), everyone else defaults to Présent — so the whole
// team reads as available/there until someone is explicitly pointed
// otherwise (Congés, Sur chantier, Formation...).
function defaultStatutLibelle(categorie: CategoriePersonnel, rowStatuts: PlanningStatut[]): string | null {
  const preferred = categorie === "chantier" ? "Disponible" : "Présent";
  return rowStatuts.find((s) => s.libelle === preferred)?.libelle ?? rowStatuts[0]?.libelle ?? null;
}

export function PlanningCalendar({
  month,
  employes,
  statuts,
  entries,
  affaires,
}: {
  month: string;
  employes: Employe[];
  statuts: PlanningStatut[];
  entries: PlanningEntry[];
  affaires: Pick<Affaire, "id" | "reference">[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();
  const [categorie, setCategorie] = useState<CategorieFiltre>("chantier");

  const dates = monthDateRange(month);
  // "Tous" ignores the category filter but keeps a stable grouped order
  // (bureaux, atelier, chantier) instead of the raw DB order, so the global
  // view still reads as three sections rather than a random mix.
  const visibleEmployes =
    categorie === "tous"
      ? [...employes]
          .filter((e) => e.actif)
          .sort((a, b) => CATEGORIES_PERSONNEL.indexOf(a.categorie) - CATEGORIES_PERSONNEL.indexOf(b.categorie) || a.nom.localeCompare(b.nom))
      : employes.filter((e) => e.categorie === categorie && e.actif);
  const statutsForCategorie = categorie === "tous" ? [] : statuts.filter((s) => s.categorie === categorie);
  const statutsParCategorie = new Map(CATEGORIES_PERSONNEL.map((c) => [c, statuts.filter((s) => s.categorie === c)]));
  const entryMap = new Map(entries.map((e) => [`${e.employe_id}:${e.date}`, e]));
  const statutByLibelle = new Map(statuts.map((s) => [s.libelle, s]));
  const affaireById = new Map(affaires.map((a) => [a.id, a]));

  // Who's free on a given day — chantier personnel only, since "Disponible"
  // isn't a status the other categories use the same way.
  const todayIso = new Date().toISOString().slice(0, 10);
  const [availDate, setAvailDate] = useState(() => (dates.includes(todayIso) ? todayIso : dates[0]));
  // No entry for a day means "nothing's been pointed yet" — everyone reads
  // as available/présent by default until a day is explicitly marked
  // otherwise, rather than showing a blank/unknown cell.
  const availableEmployes = useMemo(
    () => visibleEmployes.filter((e) => (entryMap.get(`${e.id}:${availDate}`)?.statut ?? "Disponible") === "Disponible"),
    [visibleEmployes, entryMap, availDate],
  );

  function handleChange(employeId: string, date: string, statut: string) {
    // Changing the statut keeps whichever affaire was already picked (clearing
    // the statut clears it too) — no need to re-pick the chantier every time
    // the day's status is nudged from one code to another.
    const currentAffaireId = entryMap.get(`${employeId}:${date}`)?.affaire_id ?? null;
    startTransition(async () => {
      try {
        await setPlanningEntry(employeId, date, statut || null, statut ? currentAffaireId : null);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function handleAffaireChange(employeId: string, date: string, affaireId: string) {
    const currentStatut = entryMap.get(`${employeId}:${date}`)?.statut ?? "";
    if (!currentStatut) return;
    startTransition(async () => {
      try {
        await setPlanningEntry(employeId, date, currentStatut, affaireId || null);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  const [y, m] = month.split("-").map(Number);
  const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));

  // --- Multi-date range tool: select several collaborators + a date span,
  // then apply (or clear) one statut across every resulting cell at once.
  // The per-cell dropdowns above keep working unchanged for manual pointing.
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkEmployeIds, setBulkEmployeIds] = useState<Set<string>>(new Set());
  const [bulkStart, setBulkStart] = useState(dates[0]);
  const [bulkEnd, setBulkEnd] = useState(dates[dates.length - 1]);
  const [bulkStatut, setBulkStatut] = useState("");
  const [bulkAffaireId, setBulkAffaireId] = useState("");
  const [isBulkPending, startBulkTransition] = useTransition();

  const bulkDates = useMemo(() => (bulkStart && bulkEnd ? dateRange(bulkStart, bulkEnd) : []), [bulkStart, bulkEnd]);

  function toggleBulkEmploye(id: string) {
    setBulkEmployeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllBulkEmployes() {
    setBulkEmployeIds((prev) => (prev.size === visibleEmployes.length ? new Set() : new Set(visibleEmployes.map((e) => e.id))));
  }

  function applyBulk() {
    if (bulkEmployeIds.size === 0 || bulkDates.length === 0) {
      showToast("Sélectionnez au moins un collaborateur et une plage de dates.");
      return;
    }
    startBulkTransition(async () => {
      try {
        await setPlanningEntriesBulk(Array.from(bulkEmployeIds), bulkDates, bulkStatut || null, categorie === "chantier" ? bulkAffaireId || null : null);
        router.refresh();
        showToast(`Statut appliqué à ${bulkEmployeIds.size * bulkDates.length} case(s).`);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'application groupée.");
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          <button
            onClick={() => setCategorie("tous")}
            className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold ${categorie === "tous" ? "bg-navy text-white" : "border border-border text-text-muted hover:bg-bg-sunken"}`}
          >
            Vue globale
          </button>
          {CATEGORIES_PERSONNEL.map((c) => (
            <button
              key={c}
              onClick={() => setCategorie(c)}
              className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold ${categorie === c ? "bg-navy text-white" : "border border-border text-text-muted hover:bg-bg-sunken"}`}
            >
              {CATEGORIE_PERSONNEL_LABELS[c]}
            </button>
          ))}
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

      {categorie === "chantier" && (
        <div className="mb-4 rounded-[10px] border border-success/30 bg-success/5 p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] font-semibold text-navy">Disponibles le</span>
            <select
              value={availDate}
              onChange={(e) => setAvailDate(e.target.value)}
              className="rounded-lg border border-border px-2.5 py-1.5 text-[12.5px] focus:border-blue focus:outline-none"
            >
              {dates.map((d) => {
                const { dow, dm } = fmtDayLabel(d);
                return (
                  <option key={d} value={d}>
                    {dow} {dm}
                  </option>
                );
              })}
            </select>
            <span className="text-[11.5px] text-text-muted">({availableEmployes.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableEmployes.map((e) => (
              <span key={e.id} className="rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-[11.5px] font-semibold text-success">
                {e.prenom ? `${e.prenom} ` : ""}
                {e.nom}
              </span>
            ))}
            {availableEmployes.length === 0 && <span className="text-[12px] text-text-muted">Personne de disponible ce jour-là.</span>}
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
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
        {categorie !== "tous" && (
          <button
            onClick={() => setBulkOpen((v) => !v)}
            className={`rounded-lg px-3.5 py-2 text-[12.5px] font-semibold ${bulkOpen ? "bg-navy text-white" : "border border-border text-text-muted hover:bg-bg-sunken"}`}
          >
            📅 Modifier plusieurs dates
          </button>
        )}
      </div>

      {bulkOpen && categorie !== "tous" && (
        <div className="mb-4 rounded-[10px] border border-border bg-bg-card p-4">
          <div className={`mb-3 grid gap-3 max-[700px]:grid-cols-1 ${categorie === "chantier" ? "grid-cols-4" : "grid-cols-3"}`}>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Du</label>
              <input
                type="date"
                value={bulkStart}
                onChange={(e) => setBulkStart(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Au</label>
              <input
                type="date"
                value={bulkEnd}
                onChange={(e) => setBulkEnd(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Statut à appliquer</label>
              <select
                value={bulkStatut}
                onChange={(e) => setBulkStatut(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
              >
                <option value="">— Effacer —</option>
                {statutsForCategorie.map((s) => (
                  <option key={s.id} value={s.libelle}>
                    {s.libelle}
                  </option>
                ))}
              </select>
            </div>
            {categorie === "chantier" && (
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Chantier / affaire</label>
                <select
                  value={bulkAffaireId}
                  onChange={(e) => setBulkAffaireId(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
                >
                  <option value="">—</option>
                  {affaires.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.reference}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[12px] font-semibold text-text-muted">Collaborateurs</label>
              <button onClick={toggleAllBulkEmployes} className="text-[11.5px] font-semibold text-blue hover:underline">
                {bulkEmployeIds.size === visibleEmployes.length ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {visibleEmployes.map((emp) => (
                <label
                  key={emp.id}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium ${
                    bulkEmployeIds.has(emp.id) ? "border-navy bg-navy/10 text-navy" : "border-border text-text-muted"
                  }`}
                >
                  <input type="checkbox" className="hidden" checked={bulkEmployeIds.has(emp.id)} onChange={() => toggleBulkEmploye(emp.id)} />
                  {emp.prenom ? `${emp.prenom} ` : ""}
                  {emp.nom}
                </label>
              ))}
              {visibleEmployes.length === 0 && <span className="text-[12px] text-text-muted">Aucun collaborateur dans cette catégorie.</span>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11.5px] text-text-muted">
              {bulkEmployeIds.size} collaborateur(s) × {bulkDates.length} jour(s) = {bulkEmployeIds.size * bulkDates.length} case(s)
            </span>
            <button
              onClick={applyBulk}
              disabled={isBulkPending}
              className="rounded-lg bg-navy px-4 py-2 text-[13px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
            >
              Appliquer
            </button>
          </div>
        </div>
      )}

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
            {visibleEmployes.map((emp, i) => {
              const prevCategorie = i > 0 ? visibleEmployes[i - 1].categorie : null;
              const showGroupHeader = categorie === "tous" && emp.categorie !== prevCategorie;
              const rowStatuts = categorie === "tous" ? statutsParCategorie.get(emp.categorie) ?? [] : statutsForCategorie;
              const isChantierRow = emp.categorie === "chantier";
              return (
                <>
                  {showGroupHeader && (
                    <tr key={`group-${emp.categorie}`}>
                      <td
                        colSpan={dates.length + 1}
                        className="sticky left-0 border-b border-border bg-bg-sunken px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-navy"
                      >
                        {CATEGORIE_PERSONNEL_LABELS[emp.categorie]}
                      </td>
                    </tr>
                  )}
                  <tr key={emp.id}>
                    <td className="sticky left-0 z-10 border-b border-r border-border bg-white px-3 py-1.5 text-[12px] font-medium">
                      {emp.prenom ? `${emp.prenom} ` : ""}
                      {emp.nom}
                    </td>
                    {dates.map((d) => {
                      const entry = entryMap.get(`${emp.id}:${d}`);
                      const effectiveStatutLibelle = entry?.statut ?? defaultStatutLibelle(emp.categorie, rowStatuts) ?? "";
                      const statut = effectiveStatutLibelle ? statutByLibelle.get(effectiveStatutLibelle) : undefined;
                      return (
                        <td key={d} className="border-b border-border p-0.5 text-center">
                          <select
                            value={effectiveStatutLibelle}
                            onChange={(e) => handleChange(emp.id, d, e.target.value)}
                            style={statut ? { backgroundColor: `${statut.couleur}33`, color: statut.couleur } : undefined}
                            className="h-6 w-8 cursor-pointer appearance-none rounded border-0 text-center text-[9px] font-semibold focus:outline-none"
                          >
                            <option value="" />
                            {rowStatuts.map((s) => (
                              <option key={s.id} value={s.libelle}>
                                {s.libelle}
                              </option>
                            ))}
                          </select>
                          {isChantierRow && entry?.statut && (
                            <select
                              value={entry.affaire_id ?? ""}
                              onChange={(e) => handleAffaireChange(emp.id, d, e.target.value)}
                              title={entry.affaire_id ? affaireById.get(entry.affaire_id)?.reference : "Chantier / affaire"}
                              className="mt-0.5 block h-4 w-8 cursor-pointer appearance-none rounded border-0 bg-bg-sunken text-center text-[7.5px] text-text-muted focus:outline-none"
                            >
                              <option value="">—</option>
                              {affaires.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.reference}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </>
              );
            })}
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
