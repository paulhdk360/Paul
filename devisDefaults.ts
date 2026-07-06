import { createClient } from "@/lib/supabase/server";
import { getLookups } from "@/lib/lookups";
import { ENTITY_CONFIG } from "@/lib/entities";
import { EntityManager, type Row } from "@/components/EntityManager";

export default async function EquipesPage() {
  const supabase = createClient();
  const [{ data: rows }, related] = await Promise.all([
    supabase.from("equipes").select("*").order("nom"),
    getLookups(),
  ]);

  return (
    <EntityManager
      entityKey="equipes"
      config={ENTITY_CONFIG.equipes}
      rows={(rows ?? []) as unknown as Row[]}
      related={related}
    />
  );
}
