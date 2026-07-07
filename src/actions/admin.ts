"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export async function updateProfileRole(id: string, role: Role) {
  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").update({ role }).eq("id", id).select();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("Seul un administrateur peut modifier le rôle d'un utilisateur.");
  }
  revalidatePath("/parametres");
}
