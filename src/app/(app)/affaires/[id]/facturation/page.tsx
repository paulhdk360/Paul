import { createClient } from "@/lib/supabase/server";
import { blockOperateur } from "@/lib/auth";
import { RecapFacturationManager } from "@/components/RecapFacturationManager";
import type { Affaire, Client, ServiceTicket, ServiceTicketDay, ServiceTicketPersonnel, ServiceTicketTransport, ToolListItem } from "@/lib/types";

export default async function FacturationPage({ params }: { params: { id: string } }) {
  await blockOperateur(params.id);
  const supabase = createClient();
  const { data: affaire } = await supabase.from("affaires").select("*").eq("id", params.id).single();
  let client: Client | null = null;
  if ((affaire as Affaire)?.client_id) {
    const { data } = await supabase.from("clients").select("*").eq("id", (affaire as Affaire).client_id!).single();
    client = data as Client | null;
  }

  const { data: ticket } = await supabase
    .from("service_tickets")
    .select("*")
    .eq("affaire_id", params.id)
    .maybeSingle();

  if (!ticket) {
    return (
      <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center text-text-muted">
        Aucun Service Ticket pour cette affaire — le récap facturation se génère à partir de son pointage.
      </div>
    );
  }

  const [{ data: personnel }, { data: transport }, { data: items }, { data: days }] = await Promise.all([
    supabase.from("service_ticket_personnel").select("*").eq("ticket_id", ticket.id),
    supabase.from("service_ticket_transport").select("*").eq("ticket_id", ticket.id),
    supabase.from("tool_list_items").select("*").eq("affaire_id", params.id).order("item_index"),
    supabase.from("service_ticket_days").select("*").eq("ticket_id", ticket.id),
  ]);

  return (
    <RecapFacturationManager
      affaire={affaire as Affaire}
      client={client}
      ticket={ticket as ServiceTicket}
      personnel={(personnel ?? []) as ServiceTicketPersonnel[]}
      transport={(transport ?? []) as ServiceTicketTransport[]}
      equipements={(items ?? []) as ToolListItem[]}
      days={(days ?? []) as ServiceTicketDay[]}
    />
  );
}
