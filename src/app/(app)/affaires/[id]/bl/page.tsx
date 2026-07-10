import { createClient } from "@/lib/supabase/server";
import { blockOperateur } from "@/lib/auth";
import { BLManager } from "@/components/BLManager";
import type { Affaire, BonLivraison, Client, ToolListItem } from "@/lib/types";

export default async function BLPage({ params }: { params: { id: string } }) {
  await blockOperateur(params.id);
  const supabase = createClient();
  const [{ data: bls }, { data: items }, { data: affaire }, { data: autresBlsRaw }] = await Promise.all([
    supabase.from("bons_livraison").select("*").eq("affaire_id", params.id).order("numero_bl"),
    supabase.from("tool_list_items").select("*").eq("affaire_id", params.id).order("item_index"),
    supabase.from("affaires").select("*").eq("id", params.id).single(),
    supabase.from("bons_livraison").select("numero_bl, affaires(reference)").neq("affaire_id", params.id).order("numero_bl"),
  ]);

  let client: Client | null = null;
  if ((affaire as Affaire)?.client_id) {
    const { data } = await supabase.from("clients").select("*").eq("id", (affaire as Affaire).client_id!).single();
    client = data as Client | null;
  }

  // Numéros de BL déjà pris par d'autres affaires — pour ne pas en réutiliser
  // un par mégarde (voir aussi le blocage côté serveur dans createBL/setToolListItemBlByNumber).
  const autresBls = (autresBlsRaw ?? []).map((b) => ({
    numero_bl: b.numero_bl as string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reference: ((b as any).affaires?.reference as string | undefined) ?? "—",
  }));

  return (
    <BLManager
      affaireId={params.id}
      affaire={affaire as Affaire}
      client={client}
      bls={(bls ?? []) as BonLivraison[]}
      items={(items ?? []) as ToolListItem[]}
      autresBls={autresBls}
    />
  );
}
