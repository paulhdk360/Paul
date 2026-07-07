import { createClient } from "@/lib/supabase/server";

export async function getLookups() {
  const supabase = createClient();
  const [foreuses, equipes, chantiers] = await Promise.all([
    supabase.from("foreuses").select("id, nom").order("nom"),
    supabase.from("equipes").select("id, nom").order("nom"),
    supabase.from("chantiers").select("id, nom").order("nom"),
  ]);
  return {
    foreuses: foreuses.data ?? [],
    equipes: equipes.data ?? [],
    chantiers: chantiers.data ?? [],
  };
}

export async function getAttachmentsMap(linkType: string, linkIds: string[]) {
  if (!linkIds.length) return {};
  const supabase = createClient();
  const { data } = await supabase
    .from("attachments")
    .select("*")
    .eq("link_type", linkType)
    .in("link_id", linkIds);
  const map: Record<string, NonNullable<typeof data>> = {};
  (data ?? []).forEach((f) => {
    map[f.link_id] = map[f.link_id] ? [...map[f.link_id], f] : [f];
  });
  return map;
}
