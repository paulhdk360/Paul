"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createClub(_prevState: { error?: string } | undefined, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Le nom du club est obligatoire." };

  const { data: club, error } = await supabase
    .from("clubs")
    .insert({
      name,
      timezone: String(formData.get("timezone") ?? "Europe/Paris"),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !club) {
    return { error: "Impossible de créer le club. " + (error?.message ?? "") };
  }

  const { error: memberError } = await supabase
    .from("club_members")
    .insert({ club_id: club.id, user_id: user.id, role: "club_admin" });

  if (memberError) {
    return { error: "Club créé mais impossible de vous y rattacher. " + memberError.message };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateClub(clubId: string, formData: FormData) {
  const supabase = createClient();

  const { error } = await supabase
    .from("clubs")
    .update({
      name: String(formData.get("name") ?? ""),
      address: String(formData.get("address") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      website: String(formData.get("website") ?? "") || null,
      primary_color: String(formData.get("primary_color") ?? "") || null,
    })
    .eq("id", clubId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/club");
}
