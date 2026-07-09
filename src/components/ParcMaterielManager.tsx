"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createMateriel, deleteMateriel, updateMateriel } from "@/actions/parcMateriel";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { PARC_MATERIEL_CATEGORIES, PARC_MATERIEL_LOCALISATIONS, PARC_MATERIEL_STATUTS } from "@/lib/company";
import { fmtDate } from "@/lib/format";
import { rappelStatut } from "@/lib/rappels";
import type { Affaire, ParcMateriel } from "@/lib/types";

const EMPTY: Partial<ParcMateriel> = {
  categorie: "Véhicule",
  designation: "",
  numero_identification: "",
  statut: "Disponible",
  localisation: "À la base",
  affaire_id: null,
  date_prochain_controle: "",
  notes: "",
};

const CATEGORIE_TONE: Record<string, "neutral" | "blue" | "navy" | "warning"> = {
  Véhicule: "blue",
  Chariot: "navy",
  "Machine atelier": "warning",
  Autre: "neutral",
};

const LOCALISATION_TONE: Record<string, "success" | "blue" | "warning"> = {
  "À la base": "success",
  "Sur chantier": "blue",
  "Au garage": "warning",
};

const CONTROLE_BADGE: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
  ok: { label: "Contrôle à jour", tone: "success" },
  bientot: { label: "Contrôle bientôt", tone: "warning" },
  expire: { label: "Contrôle dépassé", tone: "danger" },
};

export function ParcMaterielManager({
  materiels,
  affaires,
}: {
  materiels: ParcMateriel[];
  affaires: Pick<Affaire, "id" | "reference">[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<ParcMateriel | null>(null);
  const [form, setForm] = useState<Partial<ParcMateriel>>(EMPTY);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categorieFilter, setCategorieFilter] = useState<ParcMateriel["categorie"] | "Tous">("Tous");

  const affaireById = new Map(affaires.map((a) => [a.id, a]));
  const filtered = materiels.filter(
    (m) =>
      `${m.designation} ${m.numero_identification ?? ""}`.toLowerCase().includes(search.toLowerCase()) &&
      (categorieFilter === "Tous" || m.categorie === categorieFilter),
  );

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(m: ParcMateriel) {
    setEditing(m);
    setForm(m);
    setOpen(true);
  }

  function submit() {
    if (!form.designation) {
      showToast("La désignation est requise.");
      return;
    }
    startTransition(async () => {
      try {
        const payload = { ...form, affaire_id: form.localisation === "Sur chantier" ? form.affaire_id || null : null };
        if (editing) {
          await updateMateriel(editing.id, payload);
        } else {
          await createMateriel(payload);
        }
        setOpen(false);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function remove(m: ParcMateriel) {
    if (!confirm(`Supprimer « ${m.designation} » du parc matériel ?`)) return;
    startTransition(async () => {
      try {
        await deleteMateriel(m.id);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide text-navy">Parc matériel</div>
      <div className="mb-6 text-[13.5px] text-text-muted">
        Véhicules de service, chariots, machines d&apos;atelier — {materiels.length} élément(s)
      </div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une désignation, un n° d'identification…"
          className="w-full max-w-[380px] rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
        />
        <button
          onClick={openCreate}
          className="whitespace-nowrap rounded-lg bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-dark"
        >
          + Nouveau matériel
        </button>
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          onClick={() => setCategorieFilter("Tous")}
          className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
            categorieFilter === "Tous" ? "border-navy bg-navy text-white" : "border-border text-text-muted hover:bg-bg-sunken"
          }`}
        >
          Tous ({materiels.length})
        </button>
        {PARC_MATERIEL_CATEGORIES.map((c) => {
          const count = materiels.filter((m) => m.categorie === c).length;
          if (count === 0) return null;
          return (
            <button
              key={c}
              onClick={() => setCategorieFilter(c)}
              className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
                categorieFilter === c ? "border-navy bg-navy text-white" : "border-border text-text-muted hover:bg-bg-sunken"
              }`}
            >
              {c} ({count})
            </button>
          );
        })}
      </div>
      <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
        <table className="w-full min-w-[1080px] text-[13.5px]">
          <thead>
            <tr className="bg-bg-sunken">
              {["Catégorie", "Désignation", "N° identification", "Statut", "Localisation", "Prochain contrôle", "Rappel", ""].map((h) => (
                <th key={h} className="border-b border-border px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const statut = rappelStatut(m.date_prochain_controle);
              return (
                <tr key={m.id} className="hover:bg-bg-sunken/50">
                  <td className="border-b border-border/60 px-3 py-2.5">
                    <Badge label={m.categorie} tone={CATEGORIE_TONE[m.categorie]} />
                  </td>
                  <td className="border-b border-border/60 px-3 py-2.5 font-medium">{m.designation}</td>
                  <td className="border-b border-border/60 px-3 py-2.5">{m.numero_identification || "—"}</td>
                  <td className="border-b border-border/60 px-3 py-2.5">
                    <Badge label={m.statut} />
                  </td>
                  <td className="border-b border-border/60 px-3 py-2.5">
                    <Badge label={m.localisation} tone={LOCALISATION_TONE[m.localisation]} />
                    {m.localisation === "Sur chantier" && m.affaire_id && (
                      <div className="mt-1 text-[11px] text-text-muted">{affaireById.get(m.affaire_id)?.reference ?? "—"}</div>
                    )}
                  </td>
                  <td className="border-b border-border/60 px-3 py-2.5 text-text-muted">{fmtDate(m.date_prochain_controle)}</td>
                  <td className="border-b border-border/60 px-3 py-2.5">
                    {statut ? <Badge label={CONTROLE_BADGE[statut].label} tone={CONTROLE_BADGE[statut].tone} /> : "—"}
                  </td>
                  <td className="border-b border-border/60 px-3 py-2.5 text-right">
                    <button onClick={() => openEdit(m)} className="mr-2 text-blue hover:underline">
                      Modifier
                    </button>
                    <button onClick={() => remove(m)} className="text-danger hover:underline">
                      Supprimer
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-text-muted">
                  Aucun matériel trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? "Modifier le matériel" : "Nouveau matériel"} onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Catégorie</label>
              <div className="flex flex-wrap gap-1.5">
                {PARC_MATERIEL_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, categorie: c })}
                    className={`rounded-lg border px-3 py-2 text-[13px] font-semibold ${
                      form.categorie === c ? "border-navy bg-navy text-white" : "border-border text-text-muted hover:bg-bg-sunken"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Désignation</label>
              <input
                value={form.designation ?? ""}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                placeholder="ex: Renault Master, Chariot Manitou MT..."
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">N° d&apos;identification</label>
              <input
                value={form.numero_identification ?? ""}
                onChange={(e) => setForm({ ...form, numero_identification: e.target.value })}
                placeholder="Immatriculation, n° de série..."
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Statut</label>
              <select
                value={form.statut ?? "Disponible"}
                onChange={(e) => setForm({ ...form, statut: e.target.value as ParcMateriel["statut"] })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              >
                {PARC_MATERIEL_STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Localisation</label>
              <div className="flex flex-wrap gap-1.5">
                {PARC_MATERIEL_LOCALISATIONS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setForm({ ...form, localisation: l })}
                    className={`rounded-lg border px-3 py-2 text-[13px] font-semibold ${
                      form.localisation === l ? "border-navy bg-navy text-white" : "border-border text-text-muted hover:bg-bg-sunken"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {form.localisation === "Sur chantier" && (
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Affaire / chantier</label>
                <select
                  value={form.affaire_id ?? ""}
                  onChange={(e) => setForm({ ...form, affaire_id: e.target.value || null })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
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
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Prochain contrôle</label>
              <input
                type="date"
                value={form.date_prochain_controle ?? ""}
                onChange={(e) => setForm({ ...form, date_prochain_controle: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-text-muted">
                Contrôle technique, vérification périodique... un rappel automatique est envoyé aux administrateurs à
                l&apos;approche de l&apos;échéance.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Notes</label>
              <textarea
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg border border-border px-4 py-2 text-[13.5px] font-semibold hover:bg-bg-sunken">
                Annuler
              </button>
              <button
                onClick={submit}
                disabled={isPending}
                className="rounded-lg bg-navy px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
