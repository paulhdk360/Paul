import { createClient } from "@/lib/supabase/server";
import { CreateTicketButton } from "@/components/CreateTicketButton";
import { ServiceTicketManager } from "@/components/ServiceTicketManager";
import type {
  Affaire,
  BonLivraison,
  Client,
  ServiceTicket,
  ServiceTicketDay,
  ServiceTicketPersonnel,
  ServiceTicketTransport,
  ToolListItem,
} from "@/lib/types";

export default async function ServiceTicketPage({ params }: { params: { id: string } }) {
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
    return <CreateTicketButton affaire={affaire as Affaire} client={client} />;
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
      variant="interne"
    />
  );
}
