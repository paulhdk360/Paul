import { createClient } from "@/lib/supabase/server";
import { getLookups, getAttachmentsMap } from "@/lib/lookups";
import { ENTITY_CONFIG } from "@/lib/entities";
import { EntityManager, type Row } from "@/components/EntityManager";

export default async function ChantiersPage({
  searchParams,
}: {
  searchParams: { open?: string };
}) {
  const supabase = createClient();
  const [{ data: rows }, related] = await Promise.all([
    supabase.from("chantiers").select("*").order("nom"),
    getLookups(),
  ]);
  const attachmentsByRow = await getAttachmentsMap("chantiers", (rows ?? []).map((r) => r.id));

  return (
    <EntityManager
      entityKey="chantiers"
      config={ENTITY_CONFIG.chantiers}
      rows={(rows ?? []) as unknown as Row[]}
      related={related}
      attachmentsByRow={attachmentsByRow as any}
      initialOpenId={searchParams.open}
    />
  );
}
