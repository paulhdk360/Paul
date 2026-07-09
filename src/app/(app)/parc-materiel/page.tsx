import { createClient } from "@/lib/supabase/server";
import { blockOperateurGlobal } from "@/lib/auth";
import { ParcMaterielManager } from "@/components/ParcMaterielManager";
import type { ParcMateriel } from "@/lib/types";

// Deliberately not blocked for atelier — service vehicles, forklifts and
// workshop machines are their equipment, unlike the rest of the
// admin/commercial surface they're locked out of.
export default async function ParcMaterielPage() {
  await blockOperateurGlobal();
  const supabase = createClient();
  const { data: materiels } = await supabase.from("parc_materiel").select("*").order("designation");
  return <ParcMaterielManager materiels={(materiels ?? []) as ParcMateriel[]} />;
}
