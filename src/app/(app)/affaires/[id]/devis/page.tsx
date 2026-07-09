import { createClient } from "@/lib/supabase/server";
import { blockAtelier, blockOperateur } from "@/lib/auth";
import { DevisList } from "@/components/DevisList";
import type { Devis } from "@/lib/types";

export default async function DevisListPage({ params }: { params: { id: string } }) {
  await blockOperateur(params.id);
  await blockAtelier(params.id);
  const supabase = createClient();
  const { data: devis } = await supabase
    .from("devis")
    .select("*")
    .eq("affaire_id", params.id)
    .order("created_at", { ascending: false });

  return <DevisList affaireId={params.id} devis={(devis ?? []) as Devis[]} />;
}
