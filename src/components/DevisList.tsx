"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createDevis, deleteDevis } from "@/actions/devis";
import { Badge } from "@/components/Badge";
import { useToast } from "@/components/Toast";
import { fmtDate } from "@/lib/format";
import type { Devis } from "@/lib/types";

export function DevisList({ affaireId, devis }: { affaireId: string; devis: Devis[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  function creerDevis() {
    startTransition(async () => {
      try {
        const nextVersion = `V${devis.length}`;
        const row = await createDevis(affaireId, {
          reference: `DEV-${new Date().getFullYear()}-${String(devis.length + 1).padStart(3, "0")}`,
          version: nextVersion,
          validite_jours: 30,
        });
        router.push(`/affaires/${affaireId}/devis/${row.id}`);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la création du devis.");
      }
    });
  }

  function supprimer(id: string) {
    if (!confirm("Supprimer ce devis et ses lignes ?")) return;
    startTransition(async () => {
      try {
        await deleteDevis(id, affaireId);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={creerDevis}
          disabled={isPending}
          className="rounded-lg bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
        >
          + Nouveau devis
        </button>
      </div>
      <div className="flex flex-col gap-2.5">
        {devis.map((d) => {
          return (
            <div key={d.id} className="rounded-[9px] border border-border bg-bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2.5">
                <div>
                  <div className="text-[14.5px] font-semibold text-navy">
                    {d.reference} — {d.version}
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-text-muted">Créé le {fmtDate(d.created_at)}</div>
                </div>
                <div className="text-right">
                  <Badge label={d.statut} />
                </div>
              </div>
              <div className="mt-2.5 flex gap-1.5">
                <Link
                  href={`/affaires/${affaireId}/devis/${d.id}`}
                  className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-bg-sunken"
                >
                  Ouvrir
                </Link>
                <button
                  onClick={() => supprimer(d.id)}
                  className="rounded-lg border border-danger/40 px-2.5 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10"
                >
                  Supprimer
                </button>
              </div>
            </div>
          );
        })}
        {devis.length === 0 && (
          <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center text-text-muted">
            Aucun devis. Cliquez sur « Nouveau devis » pour commencer.
          </div>
        )}
      </div>
    </div>
  );
}
