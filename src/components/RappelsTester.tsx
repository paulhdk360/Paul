"use client";

import { useState, useTransition } from "react";
import { triggerAnniversairesManually, triggerRappelsManually, type AnniversairesSummary, type RappelsSummary } from "@/actions/rappels";
import { useToast } from "@/components/Toast";

export function RappelsTester() {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isPendingAnniv, startTransitionAnniv] = useTransition();
  const [result, setResult] = useState<RappelsSummary | null>(null);
  const [annivResult, setAnnivResult] = useState<AnniversairesSummary | null>(null);

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

  function runAnniv() {
    setAnnivResult(null);
    startTransitionAnniv(async () => {
      try {
        const summary = await triggerAnniversairesManually();
        setAnnivResult(summary);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec du déclenchement.");
      }
    });
  }

  return (
    <div className="mt-6 rounded-[10px] border border-border bg-bg-card p-4">
      <div className="mb-1 font-display text-[17px] font-semibold text-navy">Rappels (formations, contrôles, anniversaires)</div>
      <p className="mb-3 text-[12.5px] text-text-muted">
        Tourne normalement chaque jour à 7h (cron Vercel). Le premier bouton lance tout (formations, contrôles matériel
        et anniversaires) ; le second ne touche qu&apos;aux anniversaires, sans rien flaguer côté formations/parc
        matériel.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={run}
          disabled={isPending}
          className="rounded-lg bg-navy px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
        >
          {isPending ? "En cours…" : "Lancer les rappels maintenant"}
        </button>
        <button
          onClick={runAnniv}
          disabled={isPendingAnniv}
          className="rounded-lg border border-border px-4 py-2 text-[12.5px] font-semibold hover:bg-bg-sunken disabled:opacity-60"
        >
          {isPendingAnniv ? "En cours…" : "🎂 Juste les anniversaires"}
        </button>
      </div>

      {result?.error && (
        <div className="mt-3 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2.5 text-[12.5px] text-danger">{result.error}</div>
      )}
      {result && !result.error && (
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

      {annivResult?.error && (
        <div className="mt-3 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2.5 text-[12.5px] text-danger">{annivResult.error}</div>
      )}
      {annivResult && !annivResult.error && (
        <div className="mt-3 rounded-lg bg-bg-sunken px-3 py-2.5 text-[12.5px] text-text-dark">
          {annivResult.anniversaires} anniversaire(s) aujourd&apos;hui — {annivResult.notified} notification(s)
          envoyée(s).
          {annivResult.notified === 0 && (
            <div className="mt-1.5 text-text-muted">Aucun employé actif n&apos;a sa date de naissance sur la date du jour.</div>
          )}
        </div>
      )}
    </div>
  );
}
