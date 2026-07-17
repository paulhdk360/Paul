"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Fragment, useState, useTransition } from "react";
import { createPurchaseOrder, updatePurchaseOrder } from "@/actions/purchaseOrders";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { PURCHASE_ORDER_STATUTS } from "@/lib/company";
import { fmtDate, fmtEUR } from "@/lib/format";
import type { Affaire, Client, PurchaseOrder, ToolListItem } from "@/lib/types";

const STATUT_TONE: Record<string, "neutral" | "blue" | "navy" | "success" | "warning" | "danger"> = {
  Ouvert: "warning",
  "Facture reçue": "blue",
  Clôturé: "success",
};

export function PurchaseOrdersManager({
  purchaseOrders,
  affaires,
  clients,
  items,
}: {
  purchaseOrders: PurchaseOrder[];
  affaires: Pick<Affaire, "id" | "reference" | "client_id">[];
  clients: Pick<Client, "id" | "raison_sociale">[];
  items: ToolListItem[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statutFilter, setStatutFilter] = useState<PurchaseOrder["statut"] | "Tous">("Tous");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ affaire_id: "", designation: "", fournisseur: "", notes: "" });

  const affaireById = new Map(affaires.map((a) => [a.id, a]));
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const itemsByPo = new Map<string, ToolListItem[]>();
  for (const item of items) {
    if (!item.purchase_order_id) continue;
    const arr = itemsByPo.get(item.purchase_order_id) ?? [];
    arr.push(item);
    itemsByPo.set(item.purchase_order_id, arr);
  }

  const filtered = statutFilter === "Tous" ? purchaseOrders : purchaseOrders.filter((po) => po.statut === statutFilter);

  function save(id: string, data: Partial<PurchaseOrder>) {
    startTransition(async () => {
      try {
        await updatePurchaseOrder(id, data);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function submitCreate() {
    if (!createForm.affaire_id) {
      showToast("L'affaire est requise.");
      return;
    }
    if (!createForm.designation.trim()) {
      showToast("La désignation est requise.");
      return;
    }
    startTransition(async () => {
      try {
        await createPurchaseOrder(createForm);
        setCreateOpen(false);
        setCreateForm({ affaire_id: "", designation: "", fournisseur: "", notes: "" });
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la création.");
      }
    });
  }

  async function downloadPdf(po: PurchaseOrder) {
    const affaire = affaireById.get(po.affaire_id);
    if (!affaire) return;
    const client = affaire.client_id ? clientById.get(affaire.client_id) ?? null : null;
    const { generatePurchaseOrderPdf } = await import("@/lib/pdf/purchaseOrderPdf");
    generatePurchaseOrderPdf(po, affaire as Affaire, client as Client | null, itemsByPo.get(po.id) ?? []);
  }

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="font-display text-[30px] font-bold tracking-wide text-navy">Bons de commande</div>
        <button
          onClick={() => setCreateOpen(true)}
          className="whitespace-nowrap rounded-lg bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-dark"
        >
          + Nouveau PO
        </button>
      </div>
      <p className="mb-6 text-[13.5px] text-text-muted">
        Chaque PO regroupe ce qu&apos;un tiers va facturer à Enedril pour une affaire : inspection d&apos;outils
        (créé automatiquement dès qu&apos;un outil est marqué « À inspecter » au pointage retour), mais aussi hôtel,
        transport ou toute autre réservation liée à un chantier — à créer à la main via « + Nouveau PO ». Renseigne
        le fournisseur et télécharge le PDF à leur envoyer ; quand leur facture arrive, marque le PO « Facture
        reçue » avec le montant pour le rapprochement.
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          onClick={() => setStatutFilter("Tous")}
          className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
            statutFilter === "Tous" ? "border-navy bg-navy text-white" : "border-border text-text-muted hover:bg-bg-sunken"
          }`}
        >
          Tous ({purchaseOrders.length})
        </button>
        {PURCHASE_ORDER_STATUTS.map((s) => {
          const count = purchaseOrders.filter((po) => po.statut === s).length;
          if (count === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setStatutFilter(s)}
              className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
                statutFilter === s ? "border-navy bg-navy text-white" : "border-border text-text-muted hover:bg-bg-sunken"
              }`}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
        <table className="w-full min-w-[960px] text-[13.5px]">
          <thead>
            <tr className="bg-bg-sunken">
              {["PO N°", "Affaire", "Désignation", "Fournisseur", "Statut", "Outils", "Montant facture", "Créé le", ""].map((h) => (
                <th key={h} className="border-b border-border px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((po) => {
              const affaire = affaireById.get(po.affaire_id);
              const poItems = itemsByPo.get(po.id) ?? [];
              const isOpen = expanded === po.id;
              return (
                <Fragment key={po.id}>
                  <tr className="hover:bg-bg-sunken/50">
                    <td className="border-b border-border/60 px-3 py-2.5 font-mono font-semibold text-navy">
                      <button onClick={() => setExpanded(isOpen ? null : po.id)} className="hover:underline">
                        {po.numero}
                      </button>
                    </td>
                    <td className="border-b border-border/60 px-3 py-2.5">
                      {affaire ? (
                        <Link href={`/affaires/${affaire.id}/pointage-retour`} className="text-blue hover:underline">
                          {affaire.reference}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="border-b border-border/60 px-3 py-2.5 text-text-dark">{po.designation || "—"}</td>
                    <td className="border-b border-border/60 px-3 py-2.5">
                      <input
                        defaultValue={po.fournisseur ?? ""}
                        onBlur={(e) => e.target.value !== (po.fournisseur ?? "") && save(po.id, { fournisseur: e.target.value || null })}
                        placeholder="Société d'inspection…"
                        disabled={isPending}
                        className="w-[160px] rounded border border-border px-1.5 py-1 text-[12.5px]"
                      />
                    </td>
                    <td className="border-b border-border/60 px-3 py-2.5">
                      <select
                        value={po.statut}
                        disabled={isPending}
                        onChange={(e) => save(po.id, { statut: e.target.value })}
                        className="rounded border border-border px-1.5 py-1 text-[12.5px]"
                      >
                        {PURCHASE_ORDER_STATUTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <span className="ml-1.5 align-middle">
                        <Badge label={po.statut} tone={STATUT_TONE[po.statut]} />
                      </span>
                    </td>
                    <td className="border-b border-border/60 px-3 py-2.5 text-center">{poItems.length}</td>
                    <td className="border-b border-border/60 px-3 py-2.5">
                      <input
                        type="number"
                        defaultValue={po.montant_facture?.toString() ?? ""}
                        onBlur={(e) => {
                          const val = e.target.value ? Number(e.target.value) : null;
                          if (val !== po.montant_facture) save(po.id, { montant_facture: val });
                        }}
                        placeholder="—"
                        disabled={isPending}
                        className="w-[100px] rounded border border-border px-1.5 py-1 text-[12.5px]"
                      />
                    </td>
                    <td className="border-b border-border/60 px-3 py-2.5 text-text-muted">{fmtDate(po.created_at)}</td>
                    <td className="border-b border-border/60 px-3 py-2.5 text-right">
                      <button onClick={() => downloadPdf(po)} className="text-blue hover:underline">
                        PDF
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={9} className="border-b border-border/60 bg-bg-sunken/40 px-4 py-3">
                        {poItems.length === 0 ? (
                          <div className="text-[12.5px] text-text-muted">Aucun outil sur ce PO.</div>
                        ) : (
                          <table className="w-full max-w-[640px] text-[12px]">
                            <thead>
                              <tr>
                                {["Ref", "Désignation", "N° série"].map((h) => (
                                  <th key={h} className="pb-1.5 text-left font-semibold uppercase tracking-wide text-text-muted">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {poItems.map((item) => (
                                <tr key={item.id}>
                                  <td className="py-0.5">{item.item_index}</td>
                                  <td className="py-0.5">{item.designation.split("\n")[0]}</td>
                                  <td className="py-0.5 font-mono text-text-muted">{item.numero_serie ?? "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        <div className="mt-2.5">
                          <label className="mb-1 block text-[11.5px] font-semibold text-text-muted">Notes</label>
                          <textarea
                            defaultValue={po.notes ?? ""}
                            onBlur={(e) => e.target.value !== (po.notes ?? "") && save(po.id, { notes: e.target.value })}
                            rows={2}
                            placeholder="Référence facture, remarques…"
                            className="w-full max-w-[640px] rounded border border-border px-2 py-1.5 text-[12.5px]"
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-text-muted">
                  Aucun bon de commande.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <Modal title="Nouveau bon de commande" onClose={() => setCreateOpen(false)}>
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Affaire</label>
              <select
                value={createForm.affaire_id}
                onChange={(e) => setCreateForm({ ...createForm, affaire_id: e.target.value })}
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
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Désignation</label>
              <input
                value={createForm.designation}
                onChange={(e) => setCreateForm({ ...createForm, designation: e.target.value })}
                placeholder="ex. Hôtel équipe chantier, Transport matériel…"
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Fournisseur</label>
              <input
                value={createForm.fournisseur}
                onChange={(e) => setCreateForm({ ...createForm, fournisseur: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Notes</label>
              <textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={() => setCreateOpen(false)} className="rounded-lg border border-border px-4 py-2 text-[13.5px] font-semibold hover:bg-bg-sunken">
                Annuler
              </button>
              <button
                onClick={submitCreate}
                disabled={isPending}
                className="rounded-lg bg-navy px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
              >
                Créer le PO
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
