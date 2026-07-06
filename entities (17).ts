import { createClient } from "@/lib/supabase/server";
import { getLookups } from "@/lib/lookups";
import { ENTITY_CONFIG } from "@/lib/entities";
import { EntityManager, type Row } from "@/components/EntityManager";

export default async function ForeusesPage() {
  const supabase = createClient();
  const [{ data: rows }, related] = await Promise.all([
    supabase.from("foreuses").select("*").order("nom"),
    getLookups(),
  ]);

  return (
    <EntityManager
      entityKey="foreuses"
      config={ENTITY_CONFIG.foreuses}
      rows={(rows ?? []) as unknown as Row[]}
      related={related}
    />
  );
}
