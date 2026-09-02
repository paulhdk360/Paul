"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireClubStaff } from "@/lib/auth-helpers";

export async function createStaffMember(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const clubId = String(formData.get("club_id") ?? "");
  await requireClubStaff(clubId);

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();

  if (!firstName || !lastName) {
    return { error: "Le prénom et le nom sont obligatoires." };
  }

  await sql`
    insert into staff_members (club_id, first_name, last_name, email, phone, role_title)
    values (
      ${clubId},
      ${firstName},
      ${lastName},
      ${String(formData.get("email") ?? "") || null},
      ${String(formData.get("phone") ?? "") || null},
      ${String(formData.get("role_title") ?? "") || null}
    )
  `;

  revalidatePath("/dashboard/staff");
  return { success: true };
}
