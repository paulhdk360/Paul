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

  // Strip commercial fields in JS (rather than at the query level) so this
  // page never ships prix_*/tarif_* to the browser regardless of which
  // columns happen to exist yet — a stricter column list would break this
  // page outright if a migration hasn't run.
  const strippedPersonnel = (personnel ?? []).map(({ tarif_mob, tarif_demob, tarif_jour, ...rest }) => rest);
  const strippedTransport = (transport ?? []).map(({ prix_unitaire, ...rest }) => rest);
  const strippedItems = (items ?? []).map(
    ({ prix_stand_by, prix_operation, prix_uc, prix_lih, prix_inspection, prix_restocking, ...rest }) => rest,
  );

  return (
    <ServiceTicketManager
      affaireId={params.id}
      ticket={ticket as ServiceTicket}
      personnel={strippedPersonnel as ServiceTicketPersonnel[]}
      transport={strippedTransport as ServiceTicketTransport[]}
      equipements={strippedItems as ToolListItem[]}
      bls={(bls ?? []) as BonLivraison[]}
      days={(days ?? []) as ServiceTicketDay[]}
      variant="operateur"
    />
  );
}
