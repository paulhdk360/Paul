import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/format";
import type { Affaire, ServiceTicket } from "@/lib/types";

export default async function MyTicketsPage() {
  const supabase = createClient();
  const { data: tickets } = await supabase.from("service_tickets").select("*").order("created_at", { ascending: false });
  const affaireIds = (tickets ?? []).map((t) => t.affaire_id);
  const { data: affaires } = affaireIds.length
    ? await supabase.from("affaires").select("*").in("id", affaireIds)
    : { data: [] as Affaire[] };
  const affaireById = new Map((affaires ?? []).map((a) => [a.id, a as Affaire]));

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide text-navy">Mes tickets de service</div>
      <div className="mb-6 text-[13.5px] text-text-muted">Vue client — sans prix ni informations commerciales</div>
      <div className="flex flex-col gap-2.5">
        {(tickets as ServiceTicket[] | null)?.map((t) => {
          const affaire = affaireById.get(t.affaire_id);
          return (
            <Link
              key={t.id}
              href={`/affaires/${t.affaire_id}/service-ticket-operateur`}
              className="flex items-center justify-between rounded-[9px] border border-border bg-bg-card p-4 hover:border-blue/40"
            >
              <div>
                <div className="text-[14.5px] font-semibold text-navy">{affaire?.reference ?? "Affaire"}</div>
                <div className="mt-0.5 text-[12.5px] text-text-muted">
                  {t.client_nom ?? "—"} · {t.well_location ?? "—"} · Créé le {fmtDate(t.created_at)}
                </div>
              </div>
            </Link>
          );
        })}
        {(!tickets || tickets.length === 0) && (
          <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center text-text-muted">
            Aucun ticket de service disponible pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}
