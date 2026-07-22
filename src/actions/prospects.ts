"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Prospect, ProspectInteraction } from "@/lib/types";

export async function createProspect(data: Partial<Prospect>) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: row, error } = await supabase
    .from("prospects")
    .insert({ ...data, created_by: user?.id ?? null })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/prospection");
  return row as Prospect;
}

export async function updateProspect(id: string, data: Partial<Prospect>) {
  const supabase = createClient();
  const { error } = await supabase.from("prospects").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/prospection");
}

export async function deleteProspect(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("prospects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/prospection");
}

export async function addInteraction(data: Partial<ProspectInteraction>) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("prospect_interactions").insert({ ...data, created_by: user?.id ?? null });
  if (error) throw new Error(error.message);
  revalidatePath("/prospection");
}

export async function deleteInteraction(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("prospect_interactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/prospection");
}
