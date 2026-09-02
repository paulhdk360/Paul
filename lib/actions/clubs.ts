"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireClubAdmin, requireUserId } from "@/lib/auth-helpers";

export async function createClub(_prevState: { error?: string } | undefined, formData: FormData) {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Le nom du club est obligatoire." };

  const timezone = String(formData.get("timezone") ?? "Europe/Paris");

  const rows = await sql`
    insert into clubs (name, timezone, created_by)
    values (${name}, ${timezone}, ${userId})
    returning id
  `;
  const club = rows[0] as { id: string } | undefined;
  if (!club) return { error: "Impossible de créer le club." };

  await sql`
    insert into club_members (club_id, user_id, role)
    values (${club.id}, ${userId}, 'club_admin')
  `;

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateClub(clubId: string, formData: FormData) {
  await requireClubAdmin(clubId);

  await sql`
    update clubs set
      name = ${String(formData.get("name") ?? "")},
      address = ${String(formData.get("address") ?? "") || null},
      phone = ${String(formData.get("phone") ?? "") || null},
      email = ${String(formData.get("email") ?? "") || null},
      website = ${String(formData.get("website") ?? "") || null},
      primary_color = ${String(formData.get("primary_color") ?? "") || null}
    where id = ${clubId}
  `;

  revalidatePath("/dashboard/club");
}
