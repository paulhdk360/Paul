import { createClient } from "@/lib/supabase/server";
import { DevisList } from "@/components/DevisList";
import type { Devis, DevisLigne } from "@/lib/types";

export default async function DevisListPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: devis }, { data: lignes }] = await Promise.all([
    supabase.from("devis").select("*").eq("affaire_id", params.id).order("created_at", { ascending: false }),
    supabase.from("devis_lignes").select("*"),
  ]);

  return (
    <DevisList
      affaireId={params.id}
      devis={(devis ?? []) as Devis[]}
      lignes={(lignes ?? []) as DevisLigne[]}
    />
  );
}
