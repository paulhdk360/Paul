"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceStatus, AvailabilityStatus } from "@/lib/types";

export async function setOwnAvailability(
  eventId: string,
  playerId: string,
  status: AvailabilityStatus,
  comment: string
) {
  const supabase = createClient();

  const { error } = await supabase
    .from("availabilities")
    .upsert(
      { event_id: eventId, player_id: playerId, status, comment: comment || null, responded_at: new Date().toISOString() },
      { onConflict: "event_id,player_id" }
    );

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/calendar/${eventId}`);
}

export async function recordAttendance(eventId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const playerIds = formData.getAll("player_id") as string[];

  const rows = playerIds.map((playerId) => ({
    event_id: eventId,
    player_id: playerId,
    status: String(formData.get(`status_${playerId}`) ?? "present") as AttendanceStatus,
    notes: String(formData.get(`notes_${playerId}`) ?? "") || null,
    recorded_by: user?.id,
    recorded_at: new Date().toISOString(),
  }));

  if (rows.length === 0) return;

  const { error } = await supabase.from("attendances").upsert(rows, { onConflict: "event_id,player_id" });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/calendar/${eventId}`);
}
