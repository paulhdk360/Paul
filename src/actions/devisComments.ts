"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addDevisComment(devisId: string, affaireId: string, message: string) {
  const trimmed = message.trim();
  if (!trimmed) return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("devis_commentaires")
    .insert({ devis_id: devisId, auteur_id: user?.id ?? null, message: trimmed })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/devis/${devisId}`);
  return data;
}
