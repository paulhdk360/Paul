"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { requireClubStaff } from "@/lib/auth-helpers";
import type { EventType } from "@/lib/types";

export async function createEvent(_prevState: { error?: string } | undefined, formData: FormData) {
  const clubId = String(formData.get("club_id") ?? "");
  const userId = await requireClubStaff(clubId);

  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "training") as EventType;
  const startAt = String(formData.get("start_at") ?? "");
  const endAt = String(formData.get("end_at") ?? "");
  const meetingAt = String(formData.get("meeting_at") ?? "");

  if (!title || !startAt) {
    return { error: "Le titre et la date de début sont obligatoires." };
  }

  const rows = await sql`
    insert into calendar_events (
      club_id, team_id, type, title, description, location, address, start_at, end_at, meeting_at, created_by
    ) values (
      ${clubId},
      ${String(formData.get("team_id") ?? "") || null},
      ${type},
      ${title},
      ${String(formData.get("description") ?? "") || null},
      ${String(formData.get("location") ?? "") || null},
      ${String(formData.get("address") ?? "") || null},
      ${new Date(startAt).toISOString()},
      ${endAt ? new Date(endAt).toISOString() : null},
      ${meetingAt ? new Date(meetingAt).toISOString() : null},
      ${userId}
    )
    returning id
  `;
  const event = rows[0] as { id: string } | undefined;
  if (!event) return { error: "Erreur lors de la création." };

  if (type === "training") {
    await sql`
      insert into trainings (event_id, objective)
      values (${event.id}, ${String(formData.get("objective") ?? "") || null})
    `;
  }

  revalidatePath("/dashboard/calendar");
  redirect(`/dashboard/calendar/${event.id}`);
}
