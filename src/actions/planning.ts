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
