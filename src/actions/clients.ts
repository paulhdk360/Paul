"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";

export async function createClientRecord(data: Partial<Client>) {
  const supabase = createClient();
  const { data: row, error } = await supabase.from("clients").insert(data).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/clients");
  return row as Client;
}

export async function updateClientRecord(id: string, data: Partial<Client>) {
  const supabase = createClient();
  const { error } = await supabase.from("clients").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/clients");
}

export async function deleteClientRecord(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/clients");
}
