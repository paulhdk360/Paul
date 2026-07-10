"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createEmploye, deleteEmploye, updateEmploye } from "@/actions/employes";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { CATEGORIE_PERSONNEL_LABELS, CATEGORIES_PERSONNEL } from "@/lib/company";
import type { CategoriePersonnel, Employe } from "@/lib/types";

const CATEGORIE_TONE: Record<CategoriePersonnel, "blue" | "warning" | "success"> = {
  bureaux: "blue",
  atelier: "warning",
  chantier: "success",
};

const EMPTY: Partial<Employe> = {
  nom: "",
  prenom: "",
  categorie: "chantier",
  fonction: "",
  email: "",
  telephone: "",
  adresse: "",
  date_naissance: "",
  actif: true,
};

export function EmployesManager({ employes }: { employes: Employe[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Employe | null>(null);
  const [form, setForm] = useState<Partial<Employe>>(EMPTY);
  const [open, setOpen] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(e: Employe) {
    setEditing(e);
    setForm(e);
    setOpen(true);
  }

  function submit() {
    if (!form.nom) {
      showToast("Le nom est requis.");
      return;
    }
    startTransition(async () => {
      try {
        if (editing) {
          await updateEmploye(editing.id, form);
        } else {
          await createEmploye(form);
        }
        setOpen(false);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Supprimer ce collaborateur et son planning ?")) return;
    startTransition(async () => {
      try {
        await deleteEmploye(id);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[13.5px] text-text-muted">{employes.length} collaborateur(s)</div>
        <div className="flex gap-2">
          <Link href="/rh/planning" className="rounded-lg border border-border px-4 py-2 text-[12.5px] font-semibold hover:bg-bg-sunken">
            Voir le planning
          </Link>
          <Link href="/rh/organigramme" className="rounded-lg border border-border px-4 py-2 text-[12.5px] font-semibold hover:bg-bg-sunken">
            Voir l&apos;organigramme
          </Link>
          <Link href="/rh/formations" className="rounded-lg border border-border px-4 py-2 text-[12.5px] font-semibold hover:bg-bg-sunken">
            Voir les formations
          </Link>
          <button onClick={openCreate} className="rounded-lg bg-navy px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-navy-dark">
            + Collaborateur
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
        <table className="w-full min-w-[760px] text-[12.5px]">
          <thead>
            <tr className="bg-bg-sunken">
              {["Nom", "Catégorie", "Fonction", "Email", "Téléphone", "Actif", ""].map((h) => (
                <th key={h} className="border-b border-border px-2.5 py-2 text-left text-[10.5px] font-semibold uppercase text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employes.map((e) => (
              <tr key={e.id} className="hover:bg-bg-sunken/50">
                <td className="border-b border-border/60 px-2.5 py-2 font-medium">
                  <Link href={`/rh/${e.id}`} className="text-blue hover:underline">
                    {e.prenom ? `${e.prenom} ` : ""}
                    {e.nom}
                  </Link>
                </td>
                <td className="border-b border-border/60 px-2.5 py-2">
                  <Badge label={CATEGORIE_PERSONNEL_LABELS[e.categorie]} tone={CATEGORIE_TONE[e.categorie]} />
                </td>
                <td className="border-b border-border/60 px-2.5 py-2">{e.fonction || "—"}</td>
                <td className="border-b border-border/60 px-2.5 py-2">{e.email || "—"}</td>
                <td className="border-b border-border/60 px-2.5 py-2">{e.telephone || "—"}</td>
                <td className="border-b border-border/60 px-2.5 py-2">{e.actif ? "Oui" : "Non"}</td>
                <td className="border-b border-border/60 px-2.5 py-2 text-right">
                  <button onClick={() => openEdit(e)} className="mr-2 text-blue hover:underline">
                    Modifier
                  </button>
                  <button onClick={() => remove(e.id)} className="text-danger hover:underline">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {employes.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-muted">
                  Aucun collaborateur. Cliquez sur « + Collaborateur » pour commencer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? "Modifier le collaborateur" : "Nouveau collaborateur"} onClose={() => setOpen(false)}>
          <div className="grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1">
            <Field label="Nom" value={form.nom ?? ""} onChange={(v) => setForm({ ...form, nom: v })} />
            <Field label="Prénom" value={form.prenom ?? ""} onChange={(v) => setForm({ ...form, prenom: v })} />
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Catégorie</label>
              <select
                value={form.categorie ?? "chantier"}
                onChange={(e) => setForm({ ...form, categorie: e.target.value as CategoriePersonnel })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              >
                {CATEGORIES_PERSONNEL.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORIE_PERSONNEL_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Fonction" value={form.fonction ?? ""} onChange={(v) => setForm({ ...form, fonction: v })} />
            <Field label="Email" value={form.email ?? ""} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Téléphone" value={form.telephone ?? ""} onChange={(v) => setForm({ ...form, telephone: v })} />
            <Field
              label="Date de naissance"
              type="date"
              value={form.date_naissance ?? ""}
              onChange={(v) => setForm({ ...form, date_naissance: v })}
            />
            <div className="col-span-2">
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Adresse</label>
              <textarea
                value={form.adresse ?? ""}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="actif"
                checked={form.actif ?? true}
                onChange={(e) => setForm({ ...form, actif: e.target.checked })}
              />
              <label htmlFor="actif" className="text-[13px] font-medium text-text-muted">
                Actif
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
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
        </Modal>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
      />
    </div>
  );
}
