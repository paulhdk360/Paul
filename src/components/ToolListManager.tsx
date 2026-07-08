"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createToolListItem, deleteToolListItem, setToolListItemBlByNumber, updateToolListItem } from "@/actions/toolList";
import { Badge } from "@/components/Badge";
import { DiametreWarning } from "@/components/DiametreWarning";
import { OutilPicker } from "@/components/OutilPicker";
import { useToast } from "@/components/Toast";
import { TOOL_STATUTS } from "@/lib/company";
import { generateToolListPdf } from "@/lib/pdf/toolListPdf";
import type { Affaire, BonLivraison, CatalogueOutil, Client, ToolListItem, ToolStatut } from "@/lib/types";

export function ToolListManager({
  affaireId,
  affaire,
  client,
  items,
  bls,
  outils,
}: {
  affaireId: string;
  affaire: Affaire;
  client: Client | null;
  items: ToolListItem[];
  bls: BonLivraison[];
  outils: CatalogueOutil[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  function patch(id: string, data: Partial<ToolListItem>) {
    startTransition(async () => {
      try {
        await updateToolListItem(id, affaireId, data);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function patchBl(id: string, numeroBl: string) {
    startTransition(async () => {
      try {
        await setToolListItemBlByNumber(id, affaireId, numeroBl);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'association du BL.");
      }
    });
  }

  function addManual() {
    startTransition(async () => {
      try {
        await createToolListItem(affaireId, { designation: "Nouvel équipement", statut: "En stock" });
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'ajout.");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Retirer cet équipement de la Tool List ?")) return;
    startTransition(async () => {
      try {
        await deleteToolListItem(id, affaireId);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13.5px] text-text-muted">{items.length} équipement(s)</div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              try {
                generateToolListPdf(items, bls, affaire, client);
              } catch (e) {
                showToast(e instanceof Error ? e.message : "Échec de la génération du PDF.");
              }
            }}
            className="rounded-lg border border-border px-4 py-2 text-[12.5px] font-semibold hover:bg-bg-sunken"
          >
            Télécharger le PDF
          </button>
          <button
            onClick={addManual}
            disabled={isPending}
            className="rounded-lg bg-navy px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
          >
            + Ajouter un équipement
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
        <table className="w-full min-w-[1420px] text-[12.5px]">
          <thead>
            <tr className="bg-bg-sunken">
              {[
                "#",
                "Désignation",
                "Réf. article",
                "Outil catalogue",
                "N° de série",
                "Propriétaire",
                "Poids (kg)",
                "Dimensions",
                "Colisage",
                "Observations",
                "N° BL",
                "Statut",
                "",
              ].map((h) => (
                <th key={h} className="border-b border-border px-2.5 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="align-top hover:bg-bg-sunken/50">
                <td className="border-b border-border/60 px-2.5 py-2 text-text-muted">{item.item_index}</td>
                <td className="border-b border-border/60 px-2.5 py-2">
                  <textarea
                    defaultValue={item.designation}
                    onBlur={(e) => patch(item.id, { designation: e.target.value })}
                    rows={2}
                    className="w-[220px] rounded border border-border px-1.5 py-1 text-[12px]"
                  />
                </td>
                <td className="border-b border-border/60 px-2.5 py-2">
                  <input
                    defaultValue={item.reference_article ?? ""}
                    onBlur={(e) => patch(item.id, { reference_article: e.target.value })}
                    className="w-[100px] rounded border border-border px-1.5 py-1 text-[12px]"
                  />
                </td>
                <td className="border-b border-border/60 px-2.5 py-2">
                  <OutilPicker outils={outils} value={item.outil_id} onSelect={(id) => patch(item.id, { outil_id: id })} />
                  {item.outil_id && (
                    <input
                      defaultValue={item.diametre_souhaite ?? ""}
                      onBlur={(e) => patch(item.id, { diametre_souhaite: e.target.value })}
                      placeholder="Diamètre souhaité"
                      className="mt-1 w-[130px] rounded border border-border px-1.5 py-1 text-[11px]"
                    />
                  )}
                  <DiametreWarning outilId={item.outil_id} diametreSouhaite={item.diametre_souhaite} outils={outils} />
                </td>
                <td className="border-b border-border/60 px-2.5 py-2">
                  <input
                    defaultValue={item.numero_serie ?? ""}
                    onBlur={(e) => patch(item.id, { numero_serie: e.target.value })}
                    className="w-[120px] rounded border border-border px-1.5 py-1 text-[12px]"
                  />
                </td>
                <td className="border-b border-border/60 px-2.5 py-2">
                  <input
                    defaultValue={item.proprietaire ?? ""}
                    onBlur={(e) => patch(item.id, { proprietaire: e.target.value })}
                    className="w-[100px] rounded border border-border px-1.5 py-1 text-[12px]"
                  />
                </td>
                <td className="border-b border-border/60 px-2.5 py-2">
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={item.poids_kg ?? ""}
                    onBlur={(e) => patch(item.id, { poids_kg: e.target.value ? Number(e.target.value) : null })}
                    className="w-[80px] rounded border border-border px-1.5 py-1 text-[12px]"
                  />
                </td>
                <td className="border-b border-border/60 px-2.5 py-2">
                  <input
                    defaultValue={item.dimensions ?? ""}
                    placeholder="L x l x H mm"
                    onBlur={(e) => patch(item.id, { dimensions: e.target.value })}
                    className="w-[110px] rounded border border-border px-1.5 py-1 text-[12px]"
                  />
                </td>
                <td className="border-b border-border/60 px-2.5 py-2">
                  <input
                    defaultValue={item.colisage ?? ""}
                    placeholder="ex: Caisse bois"
                    onBlur={(e) => patch(item.id, { colisage: e.target.value })}
                    className="w-[110px] rounded border border-border px-1.5 py-1 text-[12px]"
                  />
                </td>
                <td className="border-b border-border/60 px-2.5 py-2">
                  <input
                    defaultValue={item.observations ?? ""}
                    onBlur={(e) => patch(item.id, { observations: e.target.value })}
                    className="w-[160px] rounded border border-border px-1.5 py-1 text-[12px]"
                  />
                </td>
                <td className="border-b border-border/60 px-2.5 py-2">
                  <input
                    defaultValue={bls.find((bl) => bl.id === item.bl_id)?.numero_bl ?? ""}
                    onBlur={(e) => patchBl(item.id, e.target.value)}
                    placeholder="ex: 2026-055"
                    className="w-[90px] rounded border border-border px-1.5 py-1 text-[12px]"
                  />
                </td>
                <td className="border-b border-border/60 px-2.5 py-2">
                  <select
                    value={item.statut}
                    onChange={(e) => patch(item.id, { statut: e.target.value as ToolStatut })}
                    className="rounded border border-border px-1.5 py-1 text-[12px]"
                  >
                    {TOOL_STATUTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1">
                    <Badge label={item.statut} />
                  </div>
                </td>
                <td className="border-b border-border/60 px-2.5 py-2">
                  <button onClick={() => remove(item.id)} className="text-danger hover:underline">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={13} className="p-8 text-center text-text-muted">
                  Tool List vide. Générez-la depuis un devis ou ajoutez un équipement manuellement.
                </td>
              </tr>
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr className="bg-bg-sunken/60">
                <td colSpan={6} className="px-2.5 py-1.5 text-right font-semibold text-text-muted">
                  Poids total
                </td>
                <td className="px-2.5 py-1.5 font-mono font-semibold text-navy">
                  {items.reduce((sum, i) => sum + (i.poids_kg || 0), 0)} kg
                </td>
                <td colSpan={6} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="mt-2 text-[11.5px] text-text-muted">
        « Outil catalogue » lie la ligne à sa vraie référence catalogue (indépendamment de la désignation, qui
        reste libre) : la référence est alors automatiquement réservée pour cette affaire, avec historique sur la
        fiche catalogue. Renseignez le « Diamètre souhaité » si le client demande un diamètre différent de celui du
        catalogue — la référence catalogue passe alors automatiquement en « À rectifier » (usinage pour réduire) ou
        « À recharger » (rechargement pour augmenter) au lieu de simplement « Réservé ». Le statut catalogue suit
        aussi automatiquement le statut de la ligne (Sur site, Retour...) et se confirme dès qu&apos;un n° de série
        est renseigné.
      </p>
    </div>
  );
}
