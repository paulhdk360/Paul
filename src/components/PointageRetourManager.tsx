"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { pointageRetour, type RetourDecision } from "@/actions/toolList";
import { Badge } from "@/components/Badge";
import { useToast } from "@/components/Toast";
import type { BonLivraison, CatalogueOutil, ToolListItem } from "@/lib/types";

const DECISIONS: { key: RetourDecision; label: string }[] = [
  { key: "rectifier", label: "À rectifier" },
  { key: "inspecter", label: "À inspecter" },
  { key: "stock", label: "Retour au stock" },
];

export function PointageRetourManager({
  affaireId,
  items,
  bls,
  outils,
}: {
  affaireId: string;
  items: ToolListItem[];
  bls: BonLivraison[];
  outils: CatalogueOutil[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const outilById = new Map(outils.map((o) => [o.id, o]));
  // Only items that have actually shipped (tied to a BL) are relevant here
  // — nothing to check back in for equipment still sitting in the Tool List.
  const shipped = items.filter((i) => i.bl_id);
  const byBl = new Map<string, ToolListItem[]>();
  for (const item of shipped) {
    const arr = byBl.get(item.bl_id!) ?? [];
    arr.push(item);
    byBl.set(item.bl_id!, arr);
  }

  function decide(itemId: string, decision: RetourDecision) {
    startTransition(async () => {
      try {
        await pointageRetour(itemId, affaireId, decision);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  return (
    <div>
      <div className="mb-5 font-display text-[30px] font-bold tracking-wide text-navy">Pointage retour</div>
      <p className="mb-6 text-[13.5px] text-text-muted">
        Par bon de livraison, indiquez ce qu&apos;il faut faire de chaque outil à son retour : à rectifier, à
        inspecter, ou remise directe au stock. Le statut catalogue de l&apos;outil se met à jour automatiquement.
      </p>

      {bls.length === 0 && <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center text-text-muted">Aucun bon de livraison pour cette affaire.</div>}

      {bls.map((bl) => {
        const blItems = byBl.get(bl.id) ?? [];
        if (blItems.length === 0) return null;
        return (
          <div key={bl.id} className="mb-6">
            <div className="mb-2.5 font-display text-[17px] font-semibold text-navy">BL {bl.numero_bl}</div>
            <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
              <table className="w-full min-w-[820px] text-[12.5px]">
                <thead>
                  <tr className="bg-bg-sunken">
                    {["Désignation", "N° série", "Statut Tool List", "Statut catalogue", "Décision retour"].map((h) => (
                      <th key={h} className="border-b border-border px-2.5 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blItems.map((item) => {
                    const outil = item.outil_id ? outilById.get(item.outil_id) : undefined;
                    return (
                      <tr key={item.id} className="align-top hover:bg-bg-sunken/50">
                        <td className="border-b border-border/60 px-2.5 py-2">{item.designation.split("\n")[0]}</td>
                        <td className="border-b border-border/60 px-2.5 py-2 font-mono text-[11.5px] text-text-muted">{item.numero_serie ?? "—"}</td>
                        <td className="border-b border-border/60 px-2.5 py-2">
                          <Badge label={item.statut} />
                        </td>
                        <td className="border-b border-border/60 px-2.5 py-2">{outil ? <Badge label={outil.statut} /> : "—"}</td>
                        <td className="border-b border-border/60 px-2.5 py-2">
                          <div className="flex flex-wrap gap-1.5">
                            {DECISIONS.map((d) => (
                              <button
                                key={d.key}
                                disabled={isPending || !item.outil_id}
                                onClick={() => decide(item.id, d.key)}
                                title={!item.outil_id ? "Cet item n'est pas lié à une référence catalogue." : undefined}
                                className="rounded-full border border-border px-2.5 py-1 text-[11.5px] font-semibold text-text-muted hover:bg-bg-sunken disabled:opacity-50"
                              >
                                {d.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {bls.length > 0 && shipped.length === 0 && (
        <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center text-text-muted">
          Aucun équipement n&apos;est encore associé à un bon de livraison.
        </div>
      )}
    </div>
  );
}
