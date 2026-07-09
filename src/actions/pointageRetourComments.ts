"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addPointageRetourComment(affaireId: string, message: string) {
  const trimmed = message.trim();
  if (!trimmed) return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("pointage_retour_commentaires")
    .insert({ affaire_id: affaireId, auteur_id: user?.id ?? null, message: trimmed })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/pointage-retour`);
  return data;
}
