import { createClient } from "@/lib/supabase/server";
import { blockAtelier, blockOperateur } from "@/lib/auth";
import { RentabiliteManager } from "@/components/RentabiliteManager";
import type {
  Achat,
  Affaire,
  Devis,
  DevisLigne,
  ServiceTicket,
  ServiceTicketDay,
  ServiceTicketPersonnel,
  ServiceTicketTransport,
  ToolListItem,
} from "@/lib/types";

export default async function RentabilitePage({ params }: { params: { id: string } }) {
  await blockOperateur(params.id);
  await blockAtelier(params.id);
  const supabase = createClient();

  const { data: affaire } = await supabase.from("affaires").select("*").eq("id", params.id).single();

  const { data: devis } = await supabase.from("devis").select("*").eq("affaire_id", params.id);
  const devisIds = (devis ?? []).map((d) => d.id);
  const { data: lignes } = devisIds.length
    ? await supabase.from("devis_lignes").select("*").in("devis_id", devisIds)
    : { data: [] };

  const { data: ticket } = await supabase.from("service_tickets").select("*").eq("affaire_id", params.id).maybeSingle();

  const [{ data: personnel }, { data: transport }, { data: days }] = ticket
    ? await Promise.all([
        supabase.from("service_ticket_personnel").select("*").eq("ticket_id", ticket.id),
        supabase.from("service_ticket_transport").select("*").eq("ticket_id", ticket.id),
        supabase.from("service_ticket_days").select("*").eq("ticket_id", ticket.id),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const { data: equipements } = await supabase.from("tool_list_items").select("*").eq("affaire_id", params.id).order("item_index");
  const { data: achats } = await supabase.from("achats").select("*").eq("affaire_id", params.id).order("date_achat", { ascending: false });

  return (
    <RentabiliteManager
      affaire={affaire as Affaire}
      devis={(devis ?? []) as Devis[]}
      lignes={(lignes ?? []) as DevisLigne[]}
      ticket={(ticket as ServiceTicket | null) ?? null}
      personnel={(personnel ?? []) as ServiceTicketPersonnel[]}
      transport={(transport ?? []) as ServiceTicketTransport[]}
      equipements={(equipements ?? []) as ToolListItem[]}
      days={(days ?? []) as ServiceTicketDay[]}
      achats={(achats ?? []) as Achat[]}
    />
  );
}
