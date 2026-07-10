"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setPlanningEntry(employeId: string, date: string, statut: string | null, affaireId: string | null) {
  const supabase = createClient();
  if (!statut) {
    const { error } = await supabase.from("planning_entries").delete().eq("employe_id", employeId).eq("date", date);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("planning_entries")
      .upsert({ employe_id: employeId, date, statut, affaire_id: affaireId }, { onConflict: "employe_id,date" });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/rh/planning");
}

// Bulk-apply (or clear) one statut — and, for chantier, optionally one
// affaire — across a set of collaborators x dates in a single round trip —
// used by the planning grid's multi-date range tool.
export async function setPlanningEntriesBulk(employeIds: string[], dates: string[], statut: string | null, affaireId: string | null = null) {
  if (employeIds.length === 0 || dates.length === 0) return;
  const supabase = createClient();
  if (!statut) {
    const { error } = await supabase.from("planning_entries").delete().in("employe_id", employeIds).in("date", dates);
    if (error) throw new Error(error.message);
  } else {
    const rows = employeIds.flatMap((employeId) => dates.map((date) => ({ employe_id: employeId, date, statut, affaire_id: affaireId })));
    const { error } = await supabase.from("planning_entries").upsert(rows, { onConflict: "employe_id,date" });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/rh/planning");
}
