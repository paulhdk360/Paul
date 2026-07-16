"use client";

import { useState, useTransition } from "react";
import { triggerRappelsManually, type RappelsSummary } from "@/actions/rappels";
import { useToast } from "@/components/Toast";

export function RappelsTester() {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<RappelsSummary | null>(null);

  function run() {
    setResult(null);
    startTransition(async () => {
      try {
        const summary = await triggerRappelsManually();
        setResult(summary);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec du déclenchement.");
      }
    });
  }

  return (
    <div className="mt-6 rounded-[10px] border border-border bg-bg-card p-4">
      <div className="mb-1 font-display text-[17px] font-semibold text-navy">Rappels (formations, contrôles, anniversaires)</div>
      <p className="mb-3 text-[12.5px] text-text-muted">
        Tourne normalement chaque jour à 7h (cron Vercel). Ce bouton lance exactement la même logique tout de suite —
        utile pour vérifier que ça fonctionne sans attendre le lendemain ou un vrai anniversaire.
      </p>
      <button
        onClick={run}
        disabled={isPending}
        className="rounded-lg bg-navy px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
      >
        {isPending ? "En cours…" : "Lancer les rappels maintenant"}
      </button>
      {result && (
        <div className="mt-3 rounded-lg bg-bg-sunken px-3 py-2.5 text-[12.5px] text-text-dark">
          {result.formations} formation(s) à échéance, {result.materiels} contrôle(s) matériel à échéance,{" "}
          {result.anniversaires} anniversaire(s) aujourd&apos;hui — {result.notified} notification(s) envoyée(s) au
          total.
          {result.notified === 0 && (
            <div className="mt-1.5 text-text-muted">
              Rien à notifier aujourd&apos;hui : normal si aucune échéance n&apos;est proche et si aucun employé actif
              n&apos;a sa date de naissance renseignée sur la date du jour.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
