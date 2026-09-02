"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { requireClubStaff } from "@/lib/auth-helpers";

export async function createPlayer(_prevState: { error?: string } | undefined, formData: FormData) {
  const clubId = String(formData.get("club_id") ?? "");
  await requireClubStaff(clubId);

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();

  if (!firstName || !lastName) {
    return { error: "Le prénom et le nom sont obligatoires." };
  }

  const jerseyNumberRaw = String(formData.get("jersey_number") ?? "");

  await sql`
    insert into players (
      club_id, team_id, first_name, last_name, birth_date, primary_position,
      jersey_number, email, phone, emergency_contact_name, emergency_contact_phone, sport_status
    ) values (
      ${clubId},
      ${String(formData.get("team_id") ?? "") || null},
      ${firstName},
      ${lastName},
      ${String(formData.get("birth_date") ?? "") || null},
      ${String(formData.get("primary_position") ?? "") || null},
      ${jerseyNumberRaw ? Number(jerseyNumberRaw) : null},
      ${String(formData.get("email") ?? "") || null},
      ${String(formData.get("phone") ?? "") || null},
      ${String(formData.get("emergency_contact_name") ?? "") || null},
      ${String(formData.get("emergency_contact_phone") ?? "") || null},
      'active'
    )
  `;

  revalidatePath("/dashboard/players");
  redirect("/dashboard/players");
}

export async function updatePlayer(playerId: string, formData: FormData) {
  const clubId = String(formData.get("club_id") ?? "");
  await requireClubStaff(clubId);

  const jerseyNumberRaw = String(formData.get("jersey_number") ?? "");

  await sql`
    update players set
      first_name = ${String(formData.get("first_name") ?? "")},
      last_name = ${String(formData.get("last_name") ?? "")},
      team_id = ${String(formData.get("team_id") ?? "") || null},
      birth_date = ${String(formData.get("birth_date") ?? "") || null},
      primary_position = ${String(formData.get("primary_position") ?? "") || null},
      jersey_number = ${jerseyNumberRaw ? Number(jerseyNumberRaw) : null},
      email = ${String(formData.get("email") ?? "") || null},
      phone = ${String(formData.get("phone") ?? "") || null},
      emergency_contact_name = ${String(formData.get("emergency_contact_name") ?? "") || null},
      emergency_contact_phone = ${String(formData.get("emergency_contact_phone") ?? "") || null},
      sport_status = ${String(formData.get("sport_status") ?? "active")},
      notes = ${String(formData.get("notes") ?? "") || null}
    where id = ${playerId} and club_id = ${clubId}
  `;

  revalidatePath(`/dashboard/players/${playerId}`);
  revalidatePath("/dashboard/players");
}
