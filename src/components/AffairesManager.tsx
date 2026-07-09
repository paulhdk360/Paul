"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { createAffaire } from "@/actions/affaires";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { TYPES_TRANSACTION } from "@/lib/company";
import { fmtDate } from "@/lib/format";
import type { Affaire, Client, Contact } from "@/lib/types";

export function AffairesManager({
  affaires,
  clients,
  contacts,
}: {
  affaires: Affaire[];
  clients: Client[];
  contacts: Contact[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ reference: "", client_id: "", contact_id: "", chantier: "", well_location: "", type_transaction: "Location" });

  const clientName = (id: string | null) => clients.find((c) => c.id === id)?.raison_sociale ?? "—";
  const availableContacts = contacts.filter((c) => c.client_id === form.client_id);

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
          contact_id: form.contact_id || null,
          chantier: form.chantier || null,
          well_location: form.well_location || null,
          type_transaction: form.type_transaction as Affaire["type_transaction"],
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
            <div className="flex items-center gap-1.5">
              {a.type_transaction && <Badge label={a.type_transaction} tone={a.type_transaction === "Vente" ? "blue" : "neutral"} />}
              <Badge label={a.statut} />
            </div>
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
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Location ou vente ?</label>
              <div className="flex gap-1.5">
                {TYPES_TRANSACTION.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type_transaction: t })}
                    className={`flex-1 rounded-lg border px-3 py-2 text-[13.5px] font-semibold ${
                      form.type_transaction === t ? "border-navy bg-navy text-white" : "border-border text-text-muted hover:bg-bg-sunken"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-text-muted">Détermine la trame du devis utilisée pour cette affaire.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Client</label>
              <select
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value, contact_id: "" })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              >
                <option value="">—</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.raison_sociale}
                  </option>
                ))}
              </select>
            </div>
            {form.client_id && (
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Interlocuteur</label>
                <select
                  value={form.contact_id}
                  onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
                >
                  <option value="">—</option>
                  {availableContacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.prenom ? `${c.prenom} ` : ""}
                      {c.nom}
                      {c.fonction ? ` (${c.fonction})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
