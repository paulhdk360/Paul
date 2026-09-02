"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireClubStaff } from "@/lib/auth-helpers";

export async function createTeam(_prevState: { error?: string } | undefined, formData: FormData) {
  const clubId = String(formData.get("club_id") ?? "");
  await requireClubStaff(clubId);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Le nom de l'équipe est obligatoire." };

  await sql`
    insert into teams (club_id, name, category, level, color)
    values (
      ${clubId},
      ${name},
      ${String(formData.get("category") ?? "") || null},
      ${String(formData.get("level") ?? "") || null},
      ${String(formData.get("color") ?? "") || null}
    )
  `;

  revalidatePath("/dashboard/teams");
  return { success: true };
}
