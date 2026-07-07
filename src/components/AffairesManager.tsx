"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { createAffaire } from "@/actions/affaires";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { fmtDate } from "@/lib/format";
import type { Affaire, Client } from "@/lib/types";

export function AffairesManager({ affaires, clients }: { affaires: Affaire[]; clients: Client[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ reference: "", client_id: "", chantier: "", well_location: "" });

  const clientName = (id: string | null) => clients.find((c) => c.id === id)?.nom ?? "—";

  function submit() {
    if (!form.reference) {
      showToast("La référence de l'affaire est requise.");
      return;
    }
    startTransition(async () => {
      try {
        const row = await createAffaire({
          reference: form.reference,
          client_id: form.client_id || null,
          chantier: form.chantier || null,
          well_location: form.well_location || null,
        });
        setOpen(false);
        router.push(`/affaires/${row.id}`);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la création.");
      }
    });
  }

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide text-navy">Affaires</div>
      <div className="mb-6 text-[13.5px] text-text-muted">{affaires.length} affaire(s) enregistrée(s)</div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-dark"
        >
          + Nouvelle affaire
        </button>
      </div>
      <div className="flex flex-col gap-2.5">
        {affaires.map((a) => (
          <Link
            key={a.id}
            href={`/affaires/${a.id}`}
            className="flex flex-wrap items-center justify-between gap-2.5 rounded-[9px] border border-border bg-bg-card p-4 hover:border-blue/40"
          >
            <div>
              <div className="text-[14.5px] font-semibold text-navy">
                {a.reference} — {clientName(a.client_id)}
              </div>
              <div className="mt-0.5 text-[12.5px] text-text-muted">
                {a.chantier || "Chantier non renseigné"}
                {a.well_location ? ` · ${a.well_location}` : ""} · Créée le {fmtDate(a.created_at)}
              </div>
            </div>
            <Badge label={a.statut} />
          </Link>
        ))}
        {affaires.length === 0 && (
          <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center text-text-muted">
            Aucune affaire. Cliquez sur « Nouvelle affaire » pour commencer.
          </div>
        )}
      </div>

      {open && (
        <Modal title="Nouvelle affaire" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Référence</label>
              <input
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="ex: 25-20-FR"
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
                onClick={submit}
                disabled={isPending}
                className="rounded-lg bg-navy px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
              >
                Créer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
