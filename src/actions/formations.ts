"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Formation } from "@/lib/types";

export async function createFormation(data: Partial<Formation>) {
  const supabase = createClient();
  const { data: row, error } = await supabase.from("formations").insert(data).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/rh/formations");
  return row as Formation;
}

// A changed expiration date means the previous reminder no longer applies —
// reset rappel_envoye so the cron job can fire again for the new deadline.
export async function updateFormation(id: string, data: Partial<Formation>) {
  const supabase = createClient();
  const payload = data.date_expiration !== undefined ? { ...data, rappel_envoye: false } : data;
  const { error } = await supabase.from("formations").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/rh/formations");
}

export async function deleteFormation(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("formations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/rh/formations");
}
