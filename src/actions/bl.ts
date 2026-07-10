"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BonLivraison } from "@/lib/types";

export async function createBL(affaireId: string, data: Partial<BonLivraison>) {
  const supabase = createClient();

  // BL numbers are only unique per affaire at the DB level (unique
  // (affaire_id, numero_bl)) — nothing stopped the same number being reused
  // on a different affaire by mistake. Block it here with a clear pointer
  // to whichever affaire already has it, instead of silently allowing two
  // unrelated jobs to share a BL number.
  if (data.numero_bl) {
    const { data: conflict } = await supabase
      .from("bons_livraison")
      .select("affaire_id, affaires(reference)")
      .eq("numero_bl", data.numero_bl)
      .neq("affaire_id", affaireId)
      .limit(1)
      .maybeSingle();
    if (conflict) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ref = (conflict as any).affaires?.reference ?? "une autre affaire";
      throw new Error(`Le N° de BL « ${data.numero_bl} » est déjà utilisé sur l'affaire ${ref} — choisis un autre numéro.`);
    }
  }

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
