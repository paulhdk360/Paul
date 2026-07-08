import { createClient } from "@/lib/supabase/server";
import { blockOperateur } from "@/lib/auth";
import { ToolListManager } from "@/components/ToolListManager";
import type { Affaire, BonLivraison, Client, ToolListItem } from "@/lib/types";

export default async function ToolListPage({ params }: { params: { id: string } }) {
  await blockOperateur(params.id);
  const supabase = createClient();
  const [{ data: items }, { data: bls }, { data: affaire }] = await Promise.all([
    supabase.from("tool_list_items").select("*").eq("affaire_id", params.id).order("item_index"),
    supabase.from("bons_livraison").select("*").eq("affaire_id", params.id).order("numero_bl"),
    supabase.from("affaires").select("*").eq("id", params.id).single(),
  ]);

  let client: Client | null = null;
  if ((affaire as Affaire)?.client_id) {
    const { data } = await supabase.from("clients").select("*").eq("id", (affaire as Affaire).client_id!).single();
    client = data as Client | null;
  }

  return (
    <ToolListManager
      affaireId={params.id}
      affaire={affaire as Affaire}
      client={client}
      items={(items ?? []) as ToolListItem[]}
      bls={(bls ?? []) as BonLivraison[]}
    />
  );
}
