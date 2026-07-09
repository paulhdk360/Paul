import { createClient } from "@/lib/supabase/server";
import { blockOperateur } from "@/lib/auth";
import { RentabiliteManager } from "@/components/RentabiliteManager";
import type { Achat, Affaire, Devis, DevisLigne, ServiceTicketTransport } from "@/lib/types";

export default async function RentabilitePage({ params }: { params: { id: string } }) {
  await blockOperateur(params.id);
  const supabase = createClient();

  const { data: affaire } = await supabase.from("affaires").select("*").eq("id", params.id).single();

  const { data: devis } = await supabase.from("devis").select("*").eq("affaire_id", params.id);
  const devisIds = (devis ?? []).map((d) => d.id);
  const { data: lignes } = devisIds.length
    ? await supabase.from("devis_lignes").select("*").in("devis_id", devisIds)
    : { data: [] };

  const { data: ticket } = await supabase.from("service_tickets").select("id").eq("affaire_id", params.id).maybeSingle();
  const { data: transport } = ticket
    ? await supabase.from("service_ticket_transport").select("*").eq("ticket_id", ticket.id)
    : { data: [] };

  const { data: achats } = await supabase.from("achats").select("*").eq("affaire_id", params.id).order("date_achat", { ascending: false });

  return (
    <RentabiliteManager
      affaire={affaire as Affaire}
      devis={(devis ?? []) as Devis[]}
      lignes={(lignes ?? []) as DevisLigne[]}
      transport={(transport ?? []) as ServiceTicketTransport[]}
      achats={(achats ?? []) as Achat[]}
    />
  );
}
