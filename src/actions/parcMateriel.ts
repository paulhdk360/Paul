"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ParcMateriel } from "@/lib/types";

export async function createMateriel(data: Partial<ParcMateriel>) {
  const supabase = createClient();
  const { data: row, error } = await supabase.from("parc_materiel").insert(data).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/parc-materiel");
  return row as ParcMateriel;
}

// A changed control date means the previous reminder no longer applies —
// reset rappel_envoye so the cron job can fire again for the new deadline.
export async function updateMateriel(id: string, data: Partial<ParcMateriel>) {
  const supabase = createClient();
  const payload = data.date_prochain_controle !== undefined ? { ...data, rappel_envoye: false } : data;
  const { error } = await supabase.from("parc_materiel").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/parc-materiel");
}

export async function deleteMateriel(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("parc_materiel").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/parc-materiel");
}
