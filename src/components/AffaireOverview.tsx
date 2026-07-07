"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateAffaire } from "@/actions/affaires";
import { KpiCard } from "@/components/KpiCard";
import { useToast } from "@/components/Toast";
import { AFFAIRE_STATUTS } from "@/lib/company";
import type { Affaire } from "@/lib/types";

export function AffaireOverview({
  affaire,
  counts,
}: {
  affaire: Affaire;
  counts: { devis: number; toolList: number; bl: number };
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

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

  return (
    <div>
      <div className="mb-5 grid grid-cols-3 gap-4 max-[700px]:grid-cols-1">
        <KpiCard label="Devis" value={counts.devis} />
        <KpiCard label="Équipements (Tool List)" value={counts.toolList} />
        <KpiCard label="Bons de livraison" value={counts.bl} />
      </div>
      <div className="rounded-[10px] border border-border bg-bg-card p-5">
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
    </div>
  );
}
