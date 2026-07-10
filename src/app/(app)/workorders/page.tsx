import { createClient } from "@/lib/supabase/server";
import { blockOperateurGlobal, requireUser } from "@/lib/auth";
import { WorkordersManager } from "@/components/WorkordersManager";
import type { Affaire, CatalogueOutil, Profile, ToolListItem, Workorder } from "@/lib/types";

export default async function WorkordersPage() {
  await blockOperateurGlobal();
  const { profile } = await requireUser();
  const supabase = createClient();

  const [{ data: workorders }, { data: affaires }, { data: outils }, { data: items }, { data: profiles }] = await Promise.all([
    supabase.from("workorders").select("*").order("created_at", { ascending: false }),
    supabase.from("affaires").select("id, reference"),
    supabase.from("catalogue_outils").select("id, designation, numero_article"),
    supabase.from("tool_list_items").select("id, designation, numero_serie"),
    supabase.from("profiles").select("*"),
  ]);

  return (
    <WorkordersManager
      workorders={(workorders ?? []) as Workorder[]}
      affaires={(affaires ?? []) as Pick<Affaire, "id" | "reference">[]}
      outils={(outils ?? []) as Pick<CatalogueOutil, "id" | "designation" | "numero_article">[]}
      items={(items ?? []) as Pick<ToolListItem, "id" | "designation" | "numero_serie">[]}
      profiles={(profiles ?? []) as Profile[]}
      currentRole={profile.role}
    />
  );
}
