import { createClient } from "@/lib/supabase/server";
import { getLookups } from "@/lib/lookups";
import { ENTITY_CONFIG } from "@/lib/entities";
import { EntityManager, type Row } from "@/components/EntityManager";

export default async function FacturesPage() {
  const supabase = createClient();
  const [{ data: rows }, related] = await Promise.all([
    supabase.from("factures").select("*").order("date_emission", { ascending: false }),
    getLookups(),
  ]);

  return (
    <EntityManager
      entityKey="factures"
      config={ENTITY_CONFIG.factures}
      rows={(rows ?? []) as unknown as Row[]}
      related={related}
    />
  );
}
