"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function setActiveClub(formData: FormData) {
  const clubId = String(formData.get("club_id") ?? "");
  if (clubId) {
    cookies().set("ftm_club_id", clubId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  redirect("/dashboard");
}
