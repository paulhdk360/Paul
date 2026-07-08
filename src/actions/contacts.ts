"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Contact } from "@/lib/types";

export async function createContact(clientId: string, data: Partial<Contact>) {
  const supabase = createClient();
  const { error } = await supabase.from("contacts").insert({ ...data, client_id: clientId });
  if (error) throw new Error(error.message);
  revalidatePath("/clients");
}

export async function updateContact(id: string, data: Partial<Contact>) {
  const supabase = createClient();
  const { error } = await supabase.from("contacts").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/clients");
}

export async function deleteContact(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/clients");
}
