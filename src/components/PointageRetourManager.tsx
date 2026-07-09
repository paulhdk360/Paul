"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateAffaire } from "@/actions/affaires";
import { notifyUser } from "@/actions/notifications";
import { confirmerRetourBase, pointageRetour, updateToolListItem, type RetourDecision } from "@/actions/toolList";
import { Badge } from "@/components/Badge";
import { OutilPicker } from "@/components/OutilPicker";
import { useToast } from "@/components/Toast";
import type { Affaire, BonLivraison, CatalogueOutil, Profile, ToolListItem } from "@/lib/types";

const DECISIONS: { key: RetourDecision; label: string }[] = [
  { key: "inspecter", label: "À inspecter" },
  { key: "rectifier", label: "À rectifier" },
  { key: "repeindre", label: "À repeindre" },
  { key: "stock", label: "Retour au stock" },
];

export function PointageRetourManager({
  affaireId,
  affaire,
  items,
  bls,
  outils,
  equipeProfiles,
}: {
  affaireId: string;
  affaire: Affaire;
  items: ToolListItem[];
  bls: BonLivraison[];
  outils: CatalogueOutil[];
  equipeProfiles: Profile[];
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

  function toggleArrivee(itemId: string, confirme: boolean) {
    startTransition(async () => {
      try {
        await confirmerRetourBase(itemId, affaireId, confirme);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function saveComment(itemId: string, observations: string) {
    startTransition(async () => {
      try {
        await updateToolListItem(itemId, affaireId, { observations });
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement du commentaire.");
      }
    });
  }

  function linkOutil(itemId: string, outilId: string | null) {
    startTransition(async () => {
      try {
        await updateToolListItem(itemId, affaireId, { outil_id: outilId });
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la liaison au catalogue.");
      }
    });
  }

  function toggleValidation(valide: boolean) {
    startTransition(async () => {
      try {
        await updateAffaire(affaireId, { atelier_valide: valide });
        if (valide) {
          await Promise.all(
            equipeProfiles.map((p) =>
              notifyUser(
                p.id,
                `Atelier — tâches terminées sur l'affaire ${affaire.reference}`,
                `/affaires/${affaireId}/pointage-retour`,
              ),
            ),
          );
          showToast("Équipe prévenue.");
        }
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
        Par bon de livraison, cochez d&apos;abord si l&apos;outil est bien arrivé à la base, puis indiquez ce qu&apos;il
        faut en faire : à inspecter, à rectifier, à repeindre, ou remise directe au stock. Le statut catalogue de
        l&apos;outil se met à jour automatiquement — si un outil n&apos;est pas encore lié à une référence catalogue,
        liez-le via la colonne « Outil catalogue » pour débloquer les décisions.
      </p>

      <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-border bg-bg-card p-3.5">
        <input
          type="checkbox"
          id="atelier-valide"
          checked={affaire.atelier_valide}
          disabled={isPending}
          onChange={(e) => toggleValidation(e.target.checked)}
        />
        <label htmlFor="atelier-valide" className="text-[13px] font-semibold text-text-dark">
          ✅ Tâches atelier terminées sur cette affaire — prévenir Admin / Commercial / Logistique
        </label>
      </div>

      {bls.length === 0 && <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center text-text-muted">Aucun bon de livraison pour cette affaire.</div>}

      {bls.map((bl) => {
        const blItems = byBl.get(bl.id) ?? [];
        if (blItems.length === 0) return null;
        return (
          <div key={bl.id} className="mb-6">
            <div className="mb-2.5 font-display text-[17px] font-semibold text-navy">BL {bl.numero_bl}</div>
            <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
              <table className="w-full min-w-[1080px] text-[12.5px]">
                <thead>
                  <tr className="bg-bg-sunken">
                    {["Désignation", "N° série", "Outil catalogue", "Statut Tool List", "Statut catalogue", "Bien arrivé ?", "Décision retour", "Commentaire"].map((h) => (
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
                          <OutilPicker outils={outils} value={item.outil_id} onSelect={(id) => linkOutil(item.id, id)} />
                        </td>
                        <td className="border-b border-border/60 px-2.5 py-2">
                          <Badge label={item.statut} />
                        </td>
                        <td className="border-b border-border/60 px-2.5 py-2">{outil ? <Badge label={outil.statut} /> : "—"}</td>
                        <td className="border-b border-border/60 px-2.5 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={item.retour_confirme}
                            disabled={isPending}
                            onChange={(e) => toggleArrivee(item.id, e.target.checked)}
                          />
                        </td>
                        <td className="border-b border-border/60 px-2.5 py-2">
                          <div className="flex flex-wrap gap-1.5">
                            {DECISIONS.map((d) => (
                              <button
                                key={d.key}
                                disabled={isPending || !item.outil_id || !item.retour_confirme}
                                onClick={() => decide(item.id, d.key)}
                                title={
                                  !item.outil_id
                                    ? "Liez d'abord une référence catalogue (colonne « Outil catalogue »)."
                                    : !item.retour_confirme
                                      ? "Cochez d'abord « Bien arrivé ? »."
                                      : undefined
                                }
                                className="rounded-full border border-border px-2.5 py-1 text-[11.5px] font-semibold text-text-muted hover:bg-bg-sunken disabled:opacity-50"
                              >
                                {d.label}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="border-b border-border/60 px-2.5 py-2">
                          <textarea
                            defaultValue={item.observations ?? ""}
                            onBlur={(e) => saveComment(item.id, e.target.value)}
                            placeholder="État constaté, remarques…"
                            rows={2}
                            className="w-[220px] rounded border border-border px-1.5 py-1 text-[12px]"
                          />
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
