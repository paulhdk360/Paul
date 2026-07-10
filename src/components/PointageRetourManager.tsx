"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateAffaire } from "@/actions/affaires";
import { notifyUser } from "@/actions/notifications";
import { addPointageRetourComment } from "@/actions/pointageRetourComments";
import { confirmerRetourBase, pointageRetour, updateToolListItem } from "@/actions/toolList";
import { Badge } from "@/components/Badge";
import { OutilPicker } from "@/components/OutilPicker";
import { useToast } from "@/components/Toast";
import type { RetourDecision } from "@/lib/company";
import { fmtDate } from "@/lib/format";
import type { Affaire, BonLivraison, CatalogueOutil, PointageRetourCommentaire, Profile, ToolListItem } from "@/lib/types";

const DECISIONS: { key: RetourDecision; label: string }[] = [
  { key: "inspecter", label: "À inspecter" },
  { key: "rectifier", label: "À rectifier" },
  { key: "recharger", label: "À recharger" },
  { key: "repeindre", label: "À repeindre" },
  { key: "stock", label: "Retour au stock" },
];

const EQUIPE_ROLES = ["admin", "commercial", "administratif_logistique"];

export function PointageRetourManager({
  affaireId,
  affaire,
  items,
  bls,
  outils,
  profiles,
  initialCommentaires,
}: {
  affaireId: string;
  affaire: Affaire;
  items: ToolListItem[];
  bls: BonLivraison[];
  outils: CatalogueOutil[];
  profiles: Profile[];
  initialCommentaires: PointageRetourCommentaire[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [commentaires, setCommentaires] = useState(initialCommentaires);
  const [commentText, setCommentText] = useState("");

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const equipeProfiles = profiles.filter((p) => EQUIPE_ROLES.includes(p.role));
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
        showToast("Décision enregistrée.");
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
              notifyUser(p.id, `Pointage retour terminé — affaire ${affaire.reference}`, `/affaires/${affaireId}/pointage-retour`),
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

  function sendComment() {
    const text = commentText.trim();
    if (!text) return;
    setCommentText("");
    startTransition(async () => {
      try {
        const row = await addPointageRetourComment(affaireId, text);
        if (row) setCommentaires((prev) => [...prev, row as PointageRetourCommentaire]);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'envoi du commentaire.");
      }
    });
  }

  return (
    <div>
      <div className="mb-5 font-display text-[30px] font-bold tracking-wide text-navy">Pointage retour</div>
      <p className="mb-6 text-[13.5px] text-text-muted">
        Par bon de livraison, cochez d&apos;abord si l&apos;outil est bien arrivé à la base, puis indiquez ce qu&apos;il
        faut en faire : à inspecter, à rectifier, à recharger, à repeindre, ou remise directe au stock. Si l&apos;outil
        est lié à une référence catalogue (colonne « Outil catalogue »), son statut s&apos;y met à jour automatiquement
        — sinon la décision reste enregistrée sur cette ligne. Une fois que <b>toutes</b> les lignes d&apos;un BL sont
        pointées (bien arrivé + décision), les{" "}
        <Link href="/workorders" className="text-blue hover:underline">
          workorders
        </Link>{" "}
        de ce BL sont générés d&apos;un coup pour que l&apos;atelier y trace la réparation (heures, carbures, matériel
        de soudure…).
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
          ✅ Pointage retour terminé — prévenir Admin / Commercial / Logistique
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
                            {DECISIONS.map((d) => {
                              const active = item.retour_decision === d.key;
                              return (
                                <button
                                  key={d.key}
                                  disabled={isPending || !item.retour_confirme}
                                  onClick={() => decide(item.id, d.key)}
                                  title={!item.retour_confirme ? "Cochez d'abord « Bien arrivé ? »." : undefined}
                                  className={`rounded-full border px-2.5 py-1 text-[11.5px] font-semibold disabled:opacity-50 ${
                                    active ? "border-navy bg-navy text-white" : "border-border text-text-muted hover:bg-bg-sunken"
                                  }`}
                                >
                                  {d.label}
                                </button>
                              );
                            })}
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

      <div className="mt-6">
        <div className="mb-2.5 font-display text-[17px] font-semibold text-navy">Commentaires</div>
        <div className="mb-3 flex flex-col gap-2.5 rounded-[10px] border border-border bg-bg-card p-3.5">
          {commentaires.map((c) => {
            const auteur = c.auteur_id ? profileById.get(c.auteur_id) : undefined;
            return (
              <div key={c.id} className="rounded-lg bg-bg-sunken px-3 py-2 text-[12.5px]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-navy">{auteur?.full_name ?? auteur?.email ?? "—"}</span>
                  <span className="text-[11px] text-text-muted">{fmtDate(c.created_at)}</span>
                </div>
                <div className="mt-0.5 whitespace-pre-line text-text-dark">{c.message}</div>
              </div>
            );
          })}
          {commentaires.length === 0 && <div className="p-3 text-center text-[12.5px] text-text-muted">Aucun commentaire.</div>}
        </div>
        <div className="flex gap-2">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Écrire un commentaire…"
            rows={2}
            className="w-full rounded-lg border border-border px-3 py-2 text-[13px] focus:border-blue focus:outline-none"
          />
          <button
            onClick={sendComment}
            disabled={isPending || !commentText.trim()}
            className="self-end rounded-lg bg-navy px-4 py-2 text-[13px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
