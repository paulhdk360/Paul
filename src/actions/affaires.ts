"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Affaire } from "@/lib/types";

export async function createAffaire(data: Partial<Affaire>) {
  const supabase = createClient();
  const { data: row, error } = await supabase.from("affaires").insert(data).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/affaires");
  return row as Affaire;
}

export async function updateAffaire(id: string, data: Partial<Affaire>) {
  const supabase = createClient();
  const { error } = await supabase.from("affaires").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/affaires");
  revalidatePath(`/affaires/${id}`);
  revalidatePath(`/affaires/${id}/tool-list`);
}

export async function deleteAffaire(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("affaires").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/affaires");
}
