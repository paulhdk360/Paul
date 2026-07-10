"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createStaffMember(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const supabase = createClient();
  const clubId = String(formData.get("club_id") ?? "");
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();

  if (!firstName || !lastName) {
    return { error: "Le prénom et le nom sont obligatoires." };
  }

  const { error } = await supabase.from("staff_members").insert({
    club_id: clubId,
    first_name: firstName,
    last_name: lastName,
    email: String(formData.get("email") ?? "") || null,
    phone: String(formData.get("phone") ?? "") || null,
    role_title: String(formData.get("role_title") ?? "") || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff");
  return { success: true };
}
