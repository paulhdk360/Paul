"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createFormation, deleteFormation, updateFormation } from "@/actions/formations";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { fmtDate } from "@/lib/format";
import { rappelStatut } from "@/lib/rappels";
import type { Employe, Formation } from "@/lib/types";

const EMPTY: Partial<Formation> = { employe_id: "", intitule: "", organisme: "", date_obtention: "", date_expiration: "", notes: "" };

const STATUT_BADGE: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
  ok: { label: "À jour", tone: "success" },
  bientot: { label: "Expire bientôt", tone: "warning" },
  expire: { label: "Expirée", tone: "danger" },
};

export function FormationsManager({ formations, employes }: { formations: Formation[]; employes: Employe[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Formation | null>(null);
  const [form, setForm] = useState<Partial<Formation>>(EMPTY);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const employeById = new Map(employes.map((e) => [e.id, e]));
  const employeName = (id: string) => {
    const e = employeById.get(id);
    if (!e) return "—";
    return e.prenom ? `${e.prenom} ${e.nom}` : e.nom;
  };

  const filtered = formations.filter((f) => `${f.intitule} ${employeName(f.employe_id)}`.toLowerCase().includes(search.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => (a.date_expiration ?? "9999").localeCompare(b.date_expiration ?? "9999"));

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(f: Formation) {
    setEditing(f);
    setForm(f);
    setOpen(true);
  }

  function submit() {
    if (!form.employe_id) {
      showToast("Le collaborateur est requis.");
      return;
    }
    if (!form.intitule) {
      showToast("L'intitulé est requis.");
      return;
    }
    startTransition(async () => {
      try {
        if (editing) {
          await updateFormation(editing.id, form);
        } else {
          await createFormation(form);
        }
        setOpen(false);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function remove(f: Formation) {
    if (!confirm(`Supprimer la formation « ${f.intitule} » ?`)) return;
    startTransition(async () => {
      try {
        await deleteFormation(f.id);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide text-navy">Formations</div>
      <div className="mb-6 text-[13.5px] text-text-muted">
        {formations.length} formation(s)/habilitation(s) enregistrée(s) — un rappel automatique est envoyé aux
        administrateurs quand une échéance approche.
      </div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un collaborateur, une formation…"
          className="w-full max-w-[380px] rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
        />
        <button
          onClick={openCreate}
          className="whitespace-nowrap rounded-lg bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-dark"
        >
          + Nouvelle formation
        </button>
      </div>
      <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
        <table className="w-full min-w-[880px] text-[13.5px]">
          <thead>
            <tr className="bg-bg-sunken">
              {["Collaborateur", "Formation", "Organisme", "Obtenue le", "Expire le", "Statut", ""].map((h) => (
                <th key={h} className="border-b border-border px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((f) => {
              const statut = rappelStatut(f.date_expiration);
              return (
                <tr key={f.id} className="hover:bg-bg-sunken/50">
                  <td className="border-b border-border/60 px-3 py-2.5 font-medium">{employeName(f.employe_id)}</td>
                  <td className="border-b border-border/60 px-3 py-2.5">{f.intitule}</td>
                  <td className="border-b border-border/60 px-3 py-2.5">{f.organisme || "—"}</td>
                  <td className="border-b border-border/60 px-3 py-2.5 text-text-muted">{fmtDate(f.date_obtention)}</td>
                  <td className="border-b border-border/60 px-3 py-2.5 text-text-muted">{fmtDate(f.date_expiration)}</td>
                  <td className="border-b border-border/60 px-3 py-2.5">
                    {statut ? <Badge label={STATUT_BADGE[statut].label} tone={STATUT_BADGE[statut].tone} /> : "—"}
                  </td>
                  <td className="border-b border-border/60 px-3 py-2.5 text-right">
                    <button onClick={() => openEdit(f)} className="mr-2 text-blue hover:underline">
                      Modifier
                    </button>
                    <button onClick={() => remove(f)} className="text-danger hover:underline">
                      Supprimer
                    </button>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-muted">
                  Aucune formation trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? "Modifier la formation" : "Nouvelle formation"} onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Collaborateur</label>
              <select
                value={form.employe_id ?? ""}
                onChange={(e) => setForm({ ...form, employe_id: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              >
                <option value="">—</option>
                {employes.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.prenom ? `${e.prenom} ` : ""}
                    {e.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Intitulé</label>
              <input
                value={form.intitule ?? ""}
                onChange={(e) => setForm({ ...form, intitule: e.target.value })}
                placeholder="ex: CACES R489, Habilitation électrique..."
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Organisme</label>
              <input
                value={form.organisme ?? ""}
                onChange={(e) => setForm({ ...form, organisme: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Obtenue le</label>
                <input
                  type="date"
                  value={form.date_obtention ?? ""}
                  onChange={(e) => setForm({ ...form, date_obtention: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Expire le</label>
                <input
                  type="date"
                  value={form.date_expiration ?? ""}
                  onChange={(e) => setForm({ ...form, date_expiration: e.target.value })}
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
