import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { blockOperateur } from "@/lib/auth";
import { DevisEditor } from "@/components/DevisEditor";
import type { Affaire, Client, Contact, Devis, DevisLigne } from "@/lib/types";

export default async function DevisEditorPage({ params }: { params: { id: string; devisId: string } }) {
  await blockOperateur(params.id);
  const supabase = createClient();
  const [{ data: devis }, { data: lignes }, { data: affaire }] = await Promise.all([
    supabase.from("devis").select("*").eq("id", params.devisId).single(),
    supabase.from("devis_lignes").select("*").eq("devis_id", params.devisId).order("ordre"),
    supabase.from("affaires").select("*").eq("id", params.id).single(),
  ]);
  if (!devis || !affaire) notFound();

  let client: Client | null = null;
  let contacts: Contact[] = [];
  if ((affaire as Affaire).client_id) {
    const [{ data: clientData }, { data: contactsData }] = await Promise.all([
      supabase.from("clients").select("*").eq("id", (affaire as Affaire).client_id!).single(),
      supabase.from("contacts").select("*").eq("client_id", (affaire as Affaire).client_id!).order("nom"),
    ]);
    client = clientData as Client | null;
    contacts = (contactsData ?? []) as Contact[];
  }

  return (
    <DevisEditor
      affaire={affaire as Affaire}
      client={client}
      contacts={contacts}
      devis={devis as Devis}
      initialLignes={(lignes ?? []) as DevisLigne[]}
    />
  );
}
