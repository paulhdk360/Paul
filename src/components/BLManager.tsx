"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBL, deleteBL, updateBL } from "@/actions/bl";
import { updateToolListItem } from "@/actions/toolList";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { generateBlPdf } from "@/lib/pdf/blPdf";
import type { Affaire, BonLivraison, Client, ToolListItem } from "@/lib/types";

export function BLManager({
  affaireId,
  affaire,
  client,
  bls,
  items,
}: {
  affaireId: string;
  affaire: Affaire;
  client: Client | null;
  bls: BonLivraison[];
  items: ToolListItem[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ numero_bl: "", date: "", transporteur: "", po_transport: "", lieu_livraison: "" });

  function submit() {
    if (!form.numero_bl) {
      showToast("Le numéro de BL est requis.");
      return;
    }
    startTransition(async () => {
      try {
        await createBL(affaireId, { ...form, date: form.date || null });
        setOpen(false);
        setForm({ numero_bl: "", date: "", transporteur: "", po_transport: "", lieu_livraison: "" });
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la création.");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Supprimer ce bon de livraison ? Les équipements associés seront libérés.")) return;
    startTransition(async () => {
      try {
        await deleteBL(id, affaireId);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  function patchField(id: string, data: Partial<BonLivraison>) {
    startTransition(async () => {
      try {
        await updateBL(id, affaireId, data);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function patchItem(id: string, data: Partial<ToolListItem>) {
    startTransition(async () => {
      try {
        await updateToolListItem(id, affaireId, data);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13.5px] text-text-muted">{bls.length} bon(s) de livraison</div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-navy px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-navy-dark"
        >
          + Nouveau BL
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {bls.map((bl) => {
          const blItems = items.filter((i) => i.bl_id === bl.id);
          const isOpen = expanded === bl.id;
          return (
            <div key={bl.id} className="rounded-[9px] border border-border bg-bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div>
                  <div className="text-[14.5px] font-semibold text-navy">BL {bl.numero_bl}</div>
                  <div className="mt-0.5 text-[12.5px] text-text-muted">
                    {blItems.length} équipement(s) · {bl.transporteur || "Transporteur non renseigné"}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setExpanded(isOpen ? null : bl.id)}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-bg-sunken"
                  >
                    {isOpen ? "Fermer" : "Détail"}
                  </button>
                  <button
                    onClick={() => {
                      try {
                        generateBlPdf(bl, blItems, affaire, client);
                      } catch (e) {
                        showToast(e instanceof Error ? e.message : "Échec de la génération du PDF.");
                      }
                    }}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-bg-sunken"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => remove(bl.id)}
                    className="rounded-lg border border-danger/40 px-2.5 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
              {isOpen && (
                <div className="mt-3.5 border-t border-border pt-3.5">
                  <div className="mb-3 grid grid-cols-3 gap-3 max-[700px]:grid-cols-1">
                    <MiniField label="Transporteur" defaultValue={bl.transporteur ?? ""} onBlurSave={(v) => patchField(bl.id, { transporteur: v })} />
                    <MiniField label="PO Transport" defaultValue={bl.po_transport ?? ""} onBlurSave={(v) => patchField(bl.id, { po_transport: v })} />
                    <MiniField label="Lieu de livraison" defaultValue={bl.lieu_livraison ?? ""} onBlurSave={(v) => patchField(bl.id, { lieu_livraison: v })} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-[12.5px]">
                      <thead>
                        <tr className="bg-bg-sunken">
                          {["#", "N° série", "Désignation", "Propriétaire", "Poids (kg)", "Dimensions", "Colisage"].map((h) => (
                            <th key={h} className="border-b border-border px-2.5 py-2 text-left text-[10.5px] font-semibold uppercase text-text-muted">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {blItems.map((item) => (
                          <tr key={item.id}>
                            <td className="border-b border-border/60 px-2.5 py-1.5">{item.item_index}</td>
                            <td className="border-b border-border/60 px-2.5 py-1.5">{item.numero_serie || "—"}</td>
                            <td className="border-b border-border/60 px-2.5 py-1.5">{item.designation}</td>
                            <td className="border-b border-border/60 px-2.5 py-1.5">{item.proprietaire || "—"}</td>
                            <td className="border-b border-border/60 px-2.5 py-1.5">
                              <input
                                type="number"
                                step="0.01"
                                defaultValue={item.poids_kg ?? ""}
                                onBlur={(e) => patchItem(item.id, { poids_kg: e.target.value ? Number(e.target.value) : null })}
                                className="w-[80px] rounded border border-border px-1.5 py-1 text-[12px]"
                              />
                            </td>
                            <td className="border-b border-border/60 px-2.5 py-1.5">
                              <input
                                defaultValue={item.dimensions ?? ""}
                                placeholder="L x l x H mm"
                                onBlur={(e) => patchItem(item.id, { dimensions: e.target.value })}
                                className="w-[130px] rounded border border-border px-1.5 py-1 text-[12px]"
                              />
                            </td>
                            <td className="border-b border-border/60 px-2.5 py-1.5">
                              <input
                                defaultValue={item.colisage ?? ""}
                                placeholder="ex: Caisse bois"
                                onBlur={(e) => patchItem(item.id, { colisage: e.target.value })}
                                className="w-[110px] rounded border border-border px-1.5 py-1 text-[12px]"
                              />
                            </td>
                          </tr>
                        ))}
                        {blItems.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-4 text-center text-text-muted">
                              Aucun équipement affecté. Assignez ce BL depuis la Tool List.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {blItems.length > 0 && (
                        <tfoot>
                          <tr className="bg-bg-sunken/60">
                            <td colSpan={4} className="px-2.5 py-1.5 text-right font-semibold text-text-muted">
                              Poids total
                            </td>
                            <td className="px-2.5 py-1.5 font-mono font-semibold text-navy">
                              {blItems.reduce((sum, i) => sum + (i.poids_kg || 0), 0)} kg
                            </td>
                            <td colSpan={2} />
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {bls.length === 0 && (
          <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center text-text-muted">
            Aucun bon de livraison. Cliquez sur « Nouveau BL » pour commencer.
          </div>
        )}
      </div>

      {open && (
        <Modal title="Nouveau bon de livraison" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3.5">
            <MiniField label="N° de BL" defaultValue={form.numero_bl} onBlurSave={(v) => setForm({ ...form, numero_bl: v })} />
            <MiniField label="Transporteur" defaultValue={form.transporteur} onBlurSave={(v) => setForm({ ...form, transporteur: v })} />
            <MiniField label="PO Transport" defaultValue={form.po_transport} onBlurSave={(v) => setForm({ ...form, po_transport: v })} />
            <MiniField label="Lieu de livraison" defaultValue={form.lieu_livraison} onBlurSave={(v) => setForm({ ...form, lieu_livraison: v })} />
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

function MiniField({
  label,
  defaultValue,
  onBlurSave,
}: {
  label: string;
  defaultValue: string;
  onBlurSave: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">{label}</label>
      <input
        defaultValue={defaultValue}
        onBlur={(e) => onBlurSave(e.target.value)}
        className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
      />
    </div>
  );
}
