"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTeam(_prevState: { error?: string } | undefined, formData: FormData) {
  const supabase = createClient();
  const clubId = String(formData.get("club_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!name) return { error: "Le nom de l'équipe est obligatoire." };

  const { error } = await supabase.from("teams").insert({
    club_id: clubId,
    name,
    category: String(formData.get("category") ?? "") || null,
    level: String(formData.get("level") ?? "") || null,
    color: String(formData.get("color") ?? "") || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/teams");
  return { success: true };
}
