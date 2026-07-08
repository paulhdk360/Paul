import { createClient } from "@/lib/supabase/server";
import { blockOperateur } from "@/lib/auth";
import { BLManager } from "@/components/BLManager";
import type { Affaire, BonLivraison, Client, ToolListItem } from "@/lib/types";

export default async function BLPage({ params }: { params: { id: string } }) {
  await blockOperateur(params.id);
  const supabase = createClient();
  const [{ data: bls }, { data: items }, { data: affaire }] = await Promise.all([
    supabase.from("bons_livraison").select("*").eq("affaire_id", params.id).order("numero_bl"),
    supabase.from("tool_list_items").select("*").eq("affaire_id", params.id).order("item_index"),
    supabase.from("affaires").select("*").eq("id", params.id).single(),
  ]);

  let client: Client | null = null;
  if ((affaire as Affaire)?.client_id) {
    const { data } = await supabase.from("clients").select("*").eq("id", (affaire as Affaire).client_id!).single();
    client = data as Client | null;
  }

  return (
    <BLManager
      affaireId={params.id}
      affaire={affaire as Affaire}
      client={client}
      bls={(bls ?? []) as BonLivraison[]}
      items={(items ?? []) as ToolListItem[]}
    />
  );
}
