"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ensureTicket } from "@/actions/serviceTicket";
import { useToast } from "@/components/Toast";
import type { Affaire, Client } from "@/lib/types";

export function CreateTicketButton({ affaire, client }: { affaire: Affaire; client: Client | null }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  function create() {
    startTransition(async () => {
      try {
        await ensureTicket(affaire.id, {
          client_nom: client?.nom ?? null,
          well_location: affaire.well_location ?? affaire.chantier ?? null,
        });
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la création du ticket.");
      }
    });
  }

  return (
    <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center">
      <p className="mb-4 text-text-muted">Aucun Service Ticket pour cette affaire.</p>
      <button
        onClick={create}
        disabled={isPending}
        className="rounded-lg bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
      >
        Créer le Service Ticket
      </button>
    </div>
  );
}
