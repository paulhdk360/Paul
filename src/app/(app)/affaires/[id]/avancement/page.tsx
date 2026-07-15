import { createClient } from "@/lib/supabase/server";
import { blockAtelier, blockOperateur } from "@/lib/auth";
import { AvancementManager } from "@/components/AvancementManager";
import type { Affaire, AvancementSituation, Client } from "@/lib/types";

export default async function AvancementPage({ params }: { params: { id: string } }) {
  await blockOperateur(params.id);
  await blockAtelier(params.id);
  const supabase = createClient();

  const { data: affaire } = await supabase.from("affaires").select("*").eq("id", params.id).single();
  let client: Client | null = null;
  if ((affaire as Affaire)?.client_id) {
    const { data } = await supabase.from("clients").select("*").eq("id", (affaire as Affaire).client_id!).single();
    client = data as Client | null;
  }

  const { data: situations } = await supabase.from("avancement_situations").select("*").eq("affaire_id", params.id).order("date");

  return <AvancementManager affaire={affaire as Affaire} client={client} situations={(situations ?? []) as AvancementSituation[]} />;
}
