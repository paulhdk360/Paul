import { createClient } from "@/lib/supabase/server";
import { getLookups, getAttachmentsMap } from "@/lib/lookups";
import { ENTITY_CONFIG } from "@/lib/entities";
import { EntityManager, type Row } from "@/components/EntityManager";

export default async function AchatsPage() {
  const supabase = createClient();
  const [{ data: rows }, related] = await Promise.all([
    supabase.from("achats").select("*").order("date", { ascending: false }),
    getLookups(),
  ]);
  const attachmentsByRow = await getAttachmentsMap("achats", (rows ?? []).map((r) => r.id));

  return (
    <EntityManager
      entityKey="achats"
      config={ENTITY_CONFIG.achats}
      rows={(rows ?? []) as unknown as Row[]}
      related={related}
      attachmentsByRow={attachmentsByRow as any}
    />
  );
}
