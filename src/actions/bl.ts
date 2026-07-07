"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BonLivraison } from "@/lib/types";

export async function createBL(affaireId: string, data: Partial<BonLivraison>) {
  const supabase = createClient();
  const { data: row, error } = await supabase
    .from("bons_livraison")
    .insert({ ...data, affaire_id: affaireId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/bl`);
  return row as BonLivraison;
}

export async function updateBL(id: string, affaireId: string, data: Partial<BonLivraison>) {
  const supabase = createClient();
  const { error } = await supabase.from("bons_livraison").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/bl`);
}

export async function deleteBL(id: string, affaireId: string) {
  const supabase = createClient();
  // Unassign tool list items pointing at this BL before removing it.
  await supabase.from("tool_list_items").update({ bl_id: null }).eq("bl_id", id);
  const { error } = await supabase.from("bons_livraison").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/bl`);
  revalidatePath(`/affaires/${affaireId}/tool-list`);
}
