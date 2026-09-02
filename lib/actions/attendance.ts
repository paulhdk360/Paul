"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireClubStaff, requireOwnPlayer } from "@/lib/auth-helpers";
import type { AttendanceStatus, AvailabilityStatus } from "@/lib/types";

export async function setOwnAvailability(
  eventId: string,
  playerId: string,
  status: AvailabilityStatus,
  comment: string
) {
  await requireOwnPlayer(playerId);

  await sql`
    insert into availabilities (event_id, player_id, status, comment, responded_at)
    values (${eventId}, ${playerId}, ${status}, ${comment || null}, now())
    on conflict (event_id, player_id)
    do update set status = excluded.status, comment = excluded.comment, responded_at = now()
  `;

  revalidatePath(`/dashboard/calendar/${eventId}`);
}

export async function recordAttendance(eventId: string, formData: FormData) {
  const eventRows = await sql`select club_id from calendar_events where id = ${eventId} limit 1`;
  const event = eventRows[0] as { club_id: string } | undefined;
  if (!event) throw new Error("Événement introuvable.");

  const userId = await requireClubStaff(event.club_id);

  const playerIds = formData.getAll("player_id") as string[];

  for (const playerId of playerIds) {
    const status = String(formData.get(`status_${playerId}`) ?? "present") as AttendanceStatus;
    const notes = String(formData.get(`notes_${playerId}`) ?? "") || null;

    await sql`
      insert into attendances (event_id, player_id, status, notes, recorded_by, recorded_at)
      values (${eventId}, ${playerId}, ${status}, ${notes}, ${userId}, now())
      on conflict (event_id, player_id)
      do update set status = excluded.status, notes = excluded.notes, recorded_by = excluded.recorded_by, recorded_at = now()
    `;
  }

  revalidatePath(`/dashboard/calendar/${eventId}`);
}
