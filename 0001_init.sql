import { createClient } from "@/lib/supabase/server";
import { getLookups, getAttachmentsMap } from "@/lib/lookups";
import { ENTITY_CONFIG } from "@/lib/entities";
import { EntityManager, type Row } from "@/components/EntityManager";

export default async function MaintenancesPage() {
  const supabase = createClient();
  const [{ data: rows }, related] = await Promise.all([
    supabase.from("maintenances").select("*").order("date", { ascending: false }),
    getLookups(),
  ]);
  const attachmentsByRow = await getAttachmentsMap("maintenances", (rows ?? []).map((r) => r.id));

  return (
    <EntityManager
      entityKey="maintenances"
      config={ENTITY_CONFIG.maintenances}
      rows={(rows ?? []) as unknown as Row[]}
      related={related}
      attachmentsByRow={attachmentsByRow as any}
    />
  );
}
