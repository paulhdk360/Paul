"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Employe } from "@/lib/types";

export async function createEmploye(data: Partial<Employe>) {
  const supabase = createClient();
  const { error } = await supabase.from("employes").insert(data);
  if (error) throw new Error(error.message);
  revalidatePath("/rh");
}

export async function updateEmploye(id: string, data: Partial<Employe>) {
  const supabase = createClient();
  const { error } = await supabase.from("employes").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/rh");
  revalidatePath("/rh/planning");
}

export async function deleteEmploye(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("employes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/rh");
  revalidatePath("/rh/planning");
}
