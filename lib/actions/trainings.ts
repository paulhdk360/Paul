"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireClubStaff } from "@/lib/auth-helpers";

async function requireStaffForEvent(eventId: string) {
  const rows = await sql`select club_id from calendar_events where id = ${eventId} limit 1`;
  const event = rows[0] as { club_id: string } | undefined;
  if (!event) throw new Error("Événement introuvable.");
  await requireClubStaff(event.club_id);
  return event.club_id;
}

export async function updateTrainingInfo(eventId: string, formData: FormData) {
  await requireStaffForEvent(eventId);

  await sql`
    update trainings set
      objective = ${String(formData.get("objective") ?? "") || null},
      weather = ${String(formData.get("weather") ?? "") || null},
      notes = ${String(formData.get("notes") ?? "") || null}
    where event_id = ${eventId}
  `;

  revalidatePath(`/dashboard/calendar/${eventId}`);
}

export async function addDrill(eventId: string, formData: FormData) {
  await requireStaffForEvent(eventId);

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Le titre de l'exercice est obligatoire.");

  const durationRaw = String(formData.get("duration_minutes") ?? "");
  const responsibleStaffId = String(formData.get("responsible_staff_id") ?? "") || null;

  const countRows = await sql`
    select coalesce(max(position), -1) + 1 as next_position from training_drills where training_event_id = ${eventId}
  `;
  const nextPosition = (countRows[0] as { next_position: number }).next_position;

  await sql`
    insert into training_drills (
      training_event_id, position, title, objective, duration_minutes, group_name,
      responsible_staff_id, description, equipment, category
    ) values (
      ${eventId}, ${nextPosition}, ${title},
      ${String(formData.get("objective") ?? "") || null},
      ${durationRaw ? Number(durationRaw) : null},
      ${String(formData.get("group_name") ?? "") || null},
      ${responsibleStaffId},
      ${String(formData.get("description") ?? "") || null},
      ${String(formData.get("equipment") ?? "") || null},
      ${String(formData.get("category") ?? "team")}
    )
  `;

  revalidatePath(`/dashboard/calendar/${eventId}`);
}

export async function deleteDrill(drillId: string, eventId: string) {
  await requireStaffForEvent(eventId);
  await sql`delete from training_drills where id = ${drillId}`;
  revalidatePath(`/dashboard/calendar/${eventId}`);
}
