import { createClient } from "@/lib/supabase/server";
import { blockOperateurGlobal } from "@/lib/auth";
import { ParcMaterielManager } from "@/components/ParcMaterielManager";
import type { Affaire, ParcMateriel } from "@/lib/types";

// Deliberately not blocked for atelier — service vehicles, forklifts and
// workshop machines are their equipment, unlike the rest of the
// admin/commercial surface they're locked out of.
export default async function ParcMaterielPage() {
  await blockOperateurGlobal();
  const supabase = createClient();
  const [{ data: materiels }, { data: affaires }] = await Promise.all([
    supabase.from("parc_materiel").select("*").order("designation"),
    supabase.from("affaires").select("id, reference").order("reference"),
  ]);
  return (
    <ParcMaterielManager
      materiels={(materiels ?? []) as ParcMateriel[]}
      affaires={(affaires ?? []) as Pick<Affaire, "id" | "reference">[]}
    />
  );
}
