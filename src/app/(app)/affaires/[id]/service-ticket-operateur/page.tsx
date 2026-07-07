import { createClient } from "@/lib/supabase/server";
import { ServiceTicketManager } from "@/components/ServiceTicketManager";
import type {
  BonLivraison,
  ServiceTicket,
  ServiceTicketDay,
  ServiceTicketPersonnel,
  ServiceTicketTransport,
  ToolListItem,
} from "@/lib/types";

export default async function ServiceTicketOperateurPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: ticket } = await supabase
    .from("service_tickets")
    .select("*")
    .eq("affaire_id", params.id)
    .maybeSingle();

  if (!ticket) {
    return (
      <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center text-text-muted">
        Aucun Service Ticket disponible pour le moment.
      </div>
    );
  }

  const [{ data: personnel }, { data: transport }, { data: items }, { data: days }, { data: bls }] = await Promise.all([
    supabase.from("service_ticket_personnel").select("*").eq("ticket_id", ticket.id),
    supabase.from("service_ticket_transport").select("*").eq("ticket_id", ticket.id),
    supabase.from("tool_list_items").select("*").eq("affaire_id", params.id).order("item_index"),
    supabase.from("service_ticket_days").select("*").eq("ticket_id", ticket.id),
    supabase.from("bons_livraison").select("*").eq("affaire_id", params.id),
  ]);

  return (
    <ServiceTicketManager
      affaireId={params.id}
      ticket={ticket as ServiceTicket}
      personnel={(personnel ?? []) as ServiceTicketPersonnel[]}
      transport={(transport ?? []) as ServiceTicketTransport[]}
      equipements={(items ?? []) as ToolListItem[]}
      bls={(bls ?? []) as BonLivraison[]}
      days={(days ?? []) as ServiceTicketDay[]}
      variant="operateur"
    />
  );
}
