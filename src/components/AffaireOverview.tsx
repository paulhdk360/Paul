"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAffaire, updateAffaire } from "@/actions/affaires";
import { KpiCard } from "@/components/KpiCard";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { AFFAIRE_STATUTS } from "@/lib/company";
import type { Affaire, Client } from "@/lib/types";

export function AffaireOverview({
  affaire,
  clients,
  counts,
}: {
  affaire: Affaire;
  clients: Client[];
  counts: { devis: number; toolList: number; bl: number };
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    reference: affaire.reference,
    client_id: affaire.client_id ?? "",
    chantier: affaire.chantier ?? "",
    well_location: affaire.well_location ?? "",
  });

  function changeStatut(statut: string) {
    startTransition(async () => {
      try {
        await updateAffaire(affaire.id, { statut: statut as Affaire["statut"] });
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la mise à jour.");
      }
    });
  }

  function saveEdit() {
    if (!form.reference) {
      showToast("La référence est requise.");
      return;
    }
    startTransition(async () => {
      try {
        await updateAffaire(affaire.id, {
          reference: form.reference,
          client_id: form.client_id || null,
          chantier: form.chantier || null,
          well_location: form.well_location || null,
        });
        setOpen(false);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function remove() {
    if (!confirm(`Supprimer l'affaire ${affaire.reference} et tous ses documents (devis, Tool List, BL, tickets) ? Cette action est définitive.`))
      return;
    startTransition(async () => {
      try {
        await deleteAffaire(affaire.id);
        router.push("/affaires");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  return (
    <div>
      <div className="mb-5 flex justify-end gap-2">
        <button onClick={() => setOpen(true)} className="rounded-lg border border-border px-4 py-2 text-[12.5px] font-semibold hover:bg-bg-sunken">
          Modifier l&apos;affaire
        </button>
        <button
          onClick={remove}
          disabled={isPending}
          className="rounded-lg border border-danger/40 px-4 py-2 text-[12.5px] font-semibold text-danger hover:bg-danger/10 disabled:opacity-60"
        >
          Supprimer l&apos;affaire
        </button>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-4 max-[700px]:grid-cols-1">
        <KpiCard label="Devis" value={counts.devis} />
        <KpiCard label="Équipements (Tool List)" value={counts.toolList} />
        <KpiCard label="Bons de livraison" value={counts.bl} />
      </div>
      <div className="rounded-[10px] border border-border bg-bg-card p-5">
        <div className="mb-3 font-display text-[17px] font-semibold text-navy">Statut de l&apos;affaire</div>
        <select
          value={affaire.statut}
          disabled={isPending}
          onChange={(e) => changeStatut(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
        >
          {AFFAIRE_STATUTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {open && (
        <Modal title="Modifier l'affaire" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Référence</label>
              <input
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Client</label>
              <select
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              >
                <option value="">—</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Chantier</label>
              <input
                value={form.chantier}
                onChange={(e) => setForm({ ...form, chantier: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Well / Location</label>
              <input
                value={form.well_location}
                onChange={(e) => setForm({ ...form, well_location: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg border border-border px-4 py-2 text-[13.5px] font-semibold hover:bg-bg-sunken">
                Annuler
              </button>
              <button
                onClick={saveEdit}
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
