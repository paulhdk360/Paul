"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function listProfiles() {
  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").select("*").order("created_at");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateProfileRole(id: string, role: "admin" | "user") {
  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").update({ role }).eq("id", id).select();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("Seul un administrateur peut modifier le rôle d'un utilisateur.");
  }
  revalidatePath("/parametres");
}
