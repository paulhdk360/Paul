import { createClient } from "@/lib/supabase/server";
import { blockAtelierGlobal, blockOperateurGlobal } from "@/lib/auth";
import { firstOfCurrentMonth } from "@/lib/calendar";
import { PlanningMaterielManager } from "@/components/PlanningMaterielManager";
import type { Affaire, CatalogueOutil, Client, Devis, DevisLigne } from "@/lib/types";

export default async function PlanningMaterielPage({ searchParams }: { searchParams: { month?: string } }) {
  await blockOperateurGlobal();
  await blockAtelierGlobal();
  const month = searchParams.month ?? firstOfCurrentMonth().slice(0, 7);

  const supabase = createClient();
  const { data: devis } = await supabase
    .from("devis")
    .select("*")
    .not("periode_prevue_debut", "is", null)
    .order("periode_prevue_debut");

  const devisIds = (devis ?? []).map((d) => d.id);
  const [{ data: lignes }, { data: affaires }, { data: clients }, { data: outils }] = await Promise.all([
    devisIds.length ? supabase.from("devis_lignes").select("*").in("devis_id", devisIds) : Promise.resolve({ data: [] }),
    supabase.from("affaires").select("*"),
    supabase.from("clients").select("*"),
    supabase.from("catalogue_outils").select("id, designation, numero_article"),
  ]);

  return (
    <PlanningMaterielManager
      month={month}
      devis={(devis ?? []) as Devis[]}
      lignes={(lignes ?? []) as DevisLigne[]}
      affaires={(affaires ?? []) as Affaire[]}
      clients={(clients ?? []) as Client[]}
      outils={(outils ?? []) as Pick<CatalogueOutil, "id" | "designation" | "numero_article">[]}
    />
  );
}
