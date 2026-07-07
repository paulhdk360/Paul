import { createClient } from "@/lib/supabase/server";
import { CatalogueManager } from "@/components/CatalogueManager";
import type { CatalogueOutil } from "@/lib/types";

export default async function CataloguePage() {
  const supabase = createClient();
  const { data } = await supabase.from("catalogue_outils").select("*").order("designation");
  return <CatalogueManager outils={(data ?? []) as CatalogueOutil[]} />;
}
