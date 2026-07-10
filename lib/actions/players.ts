"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createPlayer(_prevState: { error?: string } | undefined, formData: FormData) {
  const supabase = createClient();
  const clubId = String(formData.get("club_id") ?? "");
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();

  if (!firstName || !lastName) {
    return { error: "Le prénom et le nom sont obligatoires." };
  }

  const jerseyNumberRaw = String(formData.get("jersey_number") ?? "");

  const { error } = await supabase.from("players").insert({
    club_id: clubId,
    team_id: String(formData.get("team_id") ?? "") || null,
    first_name: firstName,
    last_name: lastName,
    birth_date: String(formData.get("birth_date") ?? "") || null,
    primary_position: String(formData.get("primary_position") ?? "") || null,
    jersey_number: jerseyNumberRaw ? Number(jerseyNumberRaw) : null,
    email: String(formData.get("email") ?? "") || null,
    phone: String(formData.get("phone") ?? "") || null,
    emergency_contact_name: String(formData.get("emergency_contact_name") ?? "") || null,
    emergency_contact_phone: String(formData.get("emergency_contact_phone") ?? "") || null,
    sport_status: "active",
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/players");
  redirect("/dashboard/players");
}

export async function updatePlayer(playerId: string, formData: FormData) {
  const supabase = createClient();

  const jerseyNumberRaw = String(formData.get("jersey_number") ?? "");

  const { error } = await supabase
    .from("players")
    .update({
      first_name: String(formData.get("first_name") ?? ""),
      last_name: String(formData.get("last_name") ?? ""),
      team_id: String(formData.get("team_id") ?? "") || null,
      birth_date: String(formData.get("birth_date") ?? "") || null,
      primary_position: String(formData.get("primary_position") ?? "") || null,
      jersey_number: jerseyNumberRaw ? Number(jerseyNumberRaw) : null,
      email: String(formData.get("email") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      emergency_contact_name: String(formData.get("emergency_contact_name") ?? "") || null,
      emergency_contact_phone: String(formData.get("emergency_contact_phone") ?? "") || null,
      sport_status: String(formData.get("sport_status") ?? "active"),
      notes: String(formData.get("notes") ?? "") || null,
    })
    .eq("id", playerId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/players/${playerId}`);
  revalidatePath("/dashboard/players");
}
