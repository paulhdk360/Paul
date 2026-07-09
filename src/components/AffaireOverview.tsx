"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAffaire, updateAffaire } from "@/actions/affaires";
import { notifyUser } from "@/actions/notifications";
import { KpiCard } from "@/components/KpiCard";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { AFFAIRE_STATUTS } from "@/lib/company";
import { fmtDate, fmtEUR } from "@/lib/format";
import type { Achat, Affaire, Client, Contact, Profile } from "@/lib/types";

export function AffaireOverview({
  affaire,
  clients,
  contacts,
  achats,
  atelierProfiles,
  counts,
}: {
  affaire: Affaire;
  clients: Client[];
  contacts: Contact[];
  achats: Achat[];
  atelierProfiles: Profile[];
  counts: { devis: number; toolList: number; bl: number };
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    reference: affaire.reference,
    client_id: affaire.client_id ?? "",
    contact_id: affaire.contact_id ?? "",
    chantier: affaire.chantier ?? "",
    well_location: affaire.well_location ?? "",
  });
  const availableContacts = contacts.filter((c) => c.client_id === form.client_id);

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
          contact_id: form.contact_id || null,
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

  function transmettreAtelier() {
    startTransition(async () => {
      try {
        await Promise.all(
          atelierProfiles.map((p) =>
            notifyUser(
              p.id,
              `Tool List, BL et pointage retour à traiter — affaire ${affaire.reference}`,
              `/affaires/${affaire.id}/tool-list`,
            ),
          ),
        );
        showToast("Transmis à l'atelier.");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'envoi.");
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
      <div className="mb-5 rounded-[10px] border border-border bg-bg-card p-5">
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

      <div className="mb-5 rounded-[10px] border border-border bg-bg-card p-5">
        <div className="mb-3 font-display text-[17px] font-semibold text-navy">Transmettre à l&apos;atelier</div>
        <p className="mb-3 text-[12.5px] text-text-muted">
          Prévient l&apos;atelier que la Tool List, les BL et le pointage retour de cette affaire sont à traiter —
          ils pourront y marquer le matériel à inspecter/rectifier dès son retour, ce qui met aussi à jour le
          catalogue outils.
        </p>
        {atelierProfiles.length === 0 ? (
          <div className="text-[12.5px] text-text-muted">
            Aucun utilisateur avec le rôle Atelier / Logistique — crée-en un dans Paramètres pour activer cet envoi.
          </div>
        ) : (
          <button
            onClick={transmettreAtelier}
            disabled={isPending}
            className="rounded-lg bg-navy px-4 py-2 text-[13px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
          >
            📣 Transmettre à l&apos;atelier ({atelierProfiles.length})
          </button>
        )}
      </div>

      <div className="rounded-[10px] border border-border bg-bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-display text-[17px] font-semibold text-navy">Achats liés</div>
          <Link href="/achats" className="text-[12.5px] text-blue hover:underline">
            Gérer les achats →
          </Link>
        </div>
        {achats.length === 0 ? (
          <div className="text-[12.5px] text-text-muted">Aucun achat rattaché à cette affaire pour l&apos;instant.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {achats.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-[12.5px]">
                <div>
                  <div className="font-semibold text-navy">{a.designation}</div>
                  <div className="text-text-muted">
                    {a.fournisseur || "Fournisseur non renseigné"} · {fmtDate(a.date_achat)}
                  </div>
                </div>
                <div className="font-semibold text-navy">{a.montant ? fmtEUR(a.montant) : "—"}</div>
              </div>
            ))}
          </div>
        )}
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
