"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
      <div className="text-[40px]">⚠️</div>
      <div className="font-display text-[19px] font-bold text-navy">Une erreur est survenue</div>
      <p className="max-w-[420px] text-[13.5px] text-text-muted">
        Cette page a rencontré un problème inattendu. Vos autres données ne sont pas affectées — réessayez, ou revenez au
        tableau de bord.
      </p>
      <div className="flex gap-2.5">
        <button
          onClick={reset}
          className="rounded-lg bg-navy px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-navy-dark"
        >
          Réessayer
        </button>
        <a
          href="/dashboard"
          className="rounded-lg border border-border px-4 py-2.5 text-[13px] font-semibold text-text-dark hover:bg-bg-sunken"
        >
          Tableau de bord
        </a>
      </div>
    </div>
  );
}
