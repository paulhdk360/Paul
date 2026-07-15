"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AvancementSituation } from "@/lib/types";

export async function createSituation(affaireId: string, data: Partial<AvancementSituation>) {
  const supabase = createClient();
  const { data: row, error } = await supabase
    .from("avancement_situations")
    .insert({ ...data, affaire_id: affaireId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/avancement`);
  return row as AvancementSituation;
}

export async function updateSituation(id: string, affaireId: string, data: Partial<AvancementSituation>) {
  const supabase = createClient();
  const { error } = await supabase.from("avancement_situations").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/avancement`);
}

export async function deleteSituation(id: string, affaireId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("avancement_situations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/avancement`);
}
