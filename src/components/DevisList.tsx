"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createChantierFromDevis, deleteDevis, updateDevis } from "@/actions/devis";
import { computeDevisTotals } from "@/lib/devis";
import { DEVIS_STATUTS } from "@/lib/company";
import { fmtEUR } from "@/lib/format";
import { generateDevisPDF } from "@/lib/pdf/generateDevisPdf";
import { useToast } from "@/components/Toast";
import type { Devis } from "@/lib/supabase/types";

export function DevisList({
  devis,
  attachmentCounts,
  chantierNames,
}: {
  devis: Devis[];
  attachmentCounts: Record<string, number>;
  chantierNames: Record<string, string>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleStatutChange(d: Devis, statut: string) {
    const previousStatut = d.statut;
    startTransition(async () => {
      try {
        await updateDevis(d.id, { statut });
        if (statut === "Accepté" && previousStatut !== "Accepté" && !d.chantier_genere_id) {
          const veutCreer = confirm(
            'Ce devis vient d\'être marqué "Accepté".\n\nVoulez-vous créer automatiquement le chantier correspondant (client, adresse et montant pré-remplis), pour ensuite y affecter la foreuse et l\'équipe ?',
          );
          if (veutCreer) {
            const chantierId = await createChantierFromDevis(d.id);
            router.push(`/chantiers?open=${chantierId}`);
            return;
          }
        }
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la mise à jour du statut.");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Supprimer ce devis et ses documents joints ? Cette action est définitive.")) return;
    startTransition(async () => {
      try {
        await deleteDevis(id);
        router.refresh();
      } catch {
        showToast("Échec de la suppression du devis.");
      }
    });
  }

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide">Devis</div>
      <div className="mb-6 text-[13.5px] text-text-muted">{devis.length} devis enregistré(s)</div>
      <div className="mb-4.5 flex justify-end">
        <Link
          href="/devis/nouveau"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-[13.5px] font-semibold text-[#06201B] hover:bg-accent-bright"
        >
          + Nouveau devis
        </Link>
      </div>
      <div className="rounded-[10px] border border-border bg-bg-card p-5">
        {devis.length === 0 ? (
          <div className="p-10 text-center text-[13.5px] text-text-muted">
            Aucun devis. Cliquez sur « Nouveau devis » pour commencer.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {devis.map((d) => {
              const totals = computeDevisTotals(d);
              const nbFiles = attachmentCounts[d.id] ?? 0;
              const chantierNom = d.chantier_genere_id ? chantierNames[d.chantier_genere_id] : null;
              return (
                <div key={d.id} className="rounded-[9px] border border-border bg-bg p-3.5 px-4">
                  <div className="flex flex-wrap items-start justify-between gap-2.5">
                    <div>
                      <div className="text-[14.5px] font-semibold">
                        {d.reference} — {d.client}
                      </div>
                      <div className="mt-0.5 text-[12.5px] text-text-muted">
                        {d.objet}
                        {nbFiles ? ` · 📎 ${nbFiles} document(s)` : ""}
                        {chantierNom && d.chantier_genere_id && (
                          <>
                            {" · "}
                            <Link
                              href={`/chantiers?open=${d.chantier_genere_id}`}
                              className="text-accent-bright underline"
                            >
                              Voir le chantier lié →
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[17px] font-semibold text-accent-bright">
                        {fmtEUR(totals.ttc)} TTC
                      </div>
                      <select
                        value={d.statut}
                        disabled={isPending}
                        onChange={(e) => handleStatutChange(d, e.target.value)}
                        className="mt-1.5 rounded-full border border-border bg-bg px-2.5 py-1 text-[11.5px] font-semibold text-text-light focus:border-accent-bright focus:outline-none"
                      >
                        {DEVIS_STATUTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-2.5 flex gap-1.5">
                    <Link
                      href={`/devis/${d.id}`}
                      className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-bg-card-hover"
                    >
                      Ouvrir
                    </Link>
                    <button
                      onClick={() => generateDevisPDF(d)}
                      className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-bg-card-hover"
                    >
                      Télécharger le PDF
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="rounded-lg border border-danger/40 px-2.5 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
