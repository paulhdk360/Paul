"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAchat, deleteAchat, updateAchat } from "@/actions/achats";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { ACHAT_CATEGORIES } from "@/lib/company";
import { fmtDate, fmtEUR } from "@/lib/format";
import type { Achat, Affaire } from "@/lib/types";

const EMPTY: Partial<Achat> = {
  designation: "",
  fournisseur: "",
  montant: null,
  date_achat: "",
  categorie: "Bureaux",
  affaire_id: null,
  notes: "",
};

const CATEGORIE_TONE: Record<string, "neutral" | "blue" | "navy" | "success" | "warning" | "danger"> = {
  Bureaux: "neutral",
  Atelier: "warning",
  Opérateurs: "blue",
  Affaire: "success",
};

export function AchatsManager({ achats, affaires }: { achats: Achat[]; affaires: Pick<Affaire, "id" | "reference">[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Achat | null>(null);
  const [form, setForm] = useState<Partial<Achat>>(EMPTY);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categorieFilter, setCategorieFilter] = useState<Achat["categorie"] | "Tous">("Tous");

  const affaireById = new Map(affaires.map((a) => [a.id, a]));
  const filtered = achats.filter(
    (a) =>
      `${a.designation} ${a.fournisseur ?? ""}`.toLowerCase().includes(search.toLowerCase()) &&
      (categorieFilter === "Tous" || a.categorie === categorieFilter),
  );
  const totalFiltre = filtered.reduce((sum, a) => sum + (a.montant || 0), 0);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(a: Achat) {
    setEditing(a);
    setForm(a);
    setOpen(true);
  }

  function submit() {
    if (!form.designation) {
      showToast("La désignation est requise.");
      return;
    }
    startTransition(async () => {
      try {
        const payload = { ...form, affaire_id: form.categorie === "Affaire" ? form.affaire_id || null : null };
        if (editing) {
          await updateAchat(editing.id, payload);
        } else {
          await createAchat(payload);
        }
        setOpen(false);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function remove(a: Achat) {
    if (!confirm(`Supprimer l'achat « ${a.designation} » ?`)) return;
    startTransition(async () => {
      try {
        await deleteAchat(a.id, a.affaire_id);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide text-navy">Achats</div>
      <div className="mb-6 text-[13.5px] text-text-muted">{achats.length} achat(s) enregistré(s)</div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une désignation, un fournisseur…"
          className="w-full max-w-[380px] rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
        />
        <button
          onClick={openCreate}
          className="whitespace-nowrap rounded-lg bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-dark"
        >
          + Nouvel achat
        </button>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategorieFilter("Tous")}
            className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
              categorieFilter === "Tous" ? "border-navy bg-navy text-white" : "border-border text-text-muted hover:bg-bg-sunken"
            }`}
          >
            Tous ({achats.length})
          </button>
          {ACHAT_CATEGORIES.map((c) => {
            const count = achats.filter((a) => a.categorie === c).length;
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
        <div className="text-[13px] font-semibold text-navy">Total : {fmtEUR(totalFiltre)}</div>
      </div>
      <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
        <table className="w-full min-w-[880px] text-[13.5px]">
          <thead>
            <tr className="bg-bg-sunken">
              {["Désignation", "Catégorie", "Affaire liée", "Fournisseur", "Montant", "Date", ""].map((h) => (
                <th key={h} className="border-b border-border px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-bg-sunken/50">
                <td className="border-b border-border/60 px-3 py-2.5 font-medium">{a.designation}</td>
                <td className="border-b border-border/60 px-3 py-2.5">
                  <Badge label={a.categorie} tone={CATEGORIE_TONE[a.categorie]} />
                </td>
                <td className="border-b border-border/60 px-3 py-2.5">
                  {a.affaire_id ? affaireById.get(a.affaire_id)?.reference ?? "—" : "—"}
                </td>
                <td className="border-b border-border/60 px-3 py-2.5">{a.fournisseur || "—"}</td>
                <td className="border-b border-border/60 px-3 py-2.5">{a.montant ? fmtEUR(a.montant) : "—"}</td>
                <td className="border-b border-border/60 px-3 py-2.5 text-text-muted">{fmtDate(a.date_achat)}</td>
                <td className="border-b border-border/60 px-3 py-2.5 text-right">
                  <button onClick={() => openEdit(a)} className="mr-2 text-blue hover:underline">
                    Modifier
                  </button>
                  <button onClick={() => remove(a)} className="text-danger hover:underline">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-muted">
                  Aucun achat trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? "Modifier l'achat" : "Nouvel achat"} onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Désignation</label>
              <input
                value={form.designation ?? ""}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Catégorie</label>
              <div className="flex flex-wrap gap-1.5">
                {ACHAT_CATEGORIES.map((c) => (
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
            {form.categorie === "Affaire" && (
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Affaire liée</label>
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
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Fournisseur</label>
              <input
                value={form.fournisseur ?? ""}
                onChange={(e) => setForm({ ...form, fournisseur: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Montant (€)</label>
                <input
                  type="number"
                  value={form.montant?.toString() ?? ""}
                  onChange={(e) => setForm({ ...form, montant: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Date d&apos;achat</label>
                <input
                  type="date"
                  value={form.date_achat ?? ""}
                  onChange={(e) => setForm({ ...form, date_achat: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
                />
              </div>
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
