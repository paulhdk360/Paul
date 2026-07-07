import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DevisEditor } from "@/components/DevisEditor";
import type { Affaire, Client, Devis, DevisLigne } from "@/lib/types";

export default async function DevisEditorPage({ params }: { params: { id: string; devisId: string } }) {
  const supabase = createClient();
  const [{ data: devis }, { data: lignes }, { data: affaire }] = await Promise.all([
    supabase.from("devis").select("*").eq("id", params.devisId).single(),
    supabase.from("devis_lignes").select("*").eq("devis_id", params.devisId).order("ordre"),
    supabase.from("affaires").select("*").eq("id", params.id).single(),
  ]);
  if (!devis || !affaire) notFound();

  let client: Client | null = null;
  if ((affaire as Affaire).client_id) {
    const { data } = await supabase.from("clients").select("*").eq("id", (affaire as Affaire).client_id!).single();
    client = data as Client | null;
  }

  return (
    <DevisEditor
      affaire={affaire as Affaire}
      client={client}
      devis={devis as Devis}
      initialLignes={(lignes ?? []) as DevisLigne[]}
    />
  );
}
