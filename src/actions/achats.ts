"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Achat } from "@/lib/types";

export async function createAchat(data: Partial<Achat>) {
  const supabase = createClient();
  const { data: row, error } = await supabase.from("achats").insert(data).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/achats");
  if (data.affaire_id) revalidatePath(`/affaires/${data.affaire_id}`);
  return row as Achat;
}

export async function updateAchat(id: string, data: Partial<Achat>) {
  const supabase = createClient();
  const { data: current } = await supabase.from("achats").select("affaire_id").eq("id", id).maybeSingle();
  const { error } = await supabase.from("achats").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/achats");
  if (current?.affaire_id) revalidatePath(`/affaires/${current.affaire_id}`);
  if (data.affaire_id) revalidatePath(`/affaires/${data.affaire_id}`);
}

export async function deleteAchat(id: string, affaireId: string | null) {
  const supabase = createClient();
  const { error } = await supabase.from("achats").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/achats");
  if (affaireId) revalidatePath(`/affaires/${affaireId}`);
}
