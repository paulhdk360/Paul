"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CatalogueOutil } from "@/lib/types";

export async function createOutil(data: Partial<CatalogueOutil>) {
  const supabase = createClient();
  const { data: row, error } = await supabase.from("catalogue_outils").insert(data).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/catalogue");
  return row as CatalogueOutil;
}

export async function updateOutil(id: string, data: Partial<CatalogueOutil>) {
  const supabase = createClient();
  const { error } = await supabase.from("catalogue_outils").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/catalogue");
}

export async function deleteOutil(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("catalogue_outils").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/catalogue");
}
