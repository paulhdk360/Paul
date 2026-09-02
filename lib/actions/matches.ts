"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireClubStaff } from "@/lib/auth-helpers";
import { STAT_FIELDS } from "@/lib/stats";

async function requireStaffForEvent(eventId: string) {
  const rows = await sql`select club_id from calendar_events where id = ${eventId} limit 1`;
  const event = rows[0] as { club_id: string } | undefined;
  if (!event) throw new Error("Événement introuvable.");
  await requireClubStaff(event.club_id);
}

export async function saveMatchInfo(eventId: string, formData: FormData) {
  await requireStaffForEvent(eventId);

  const teamScoreRaw = String(formData.get("team_score") ?? "");
  const opponentScoreRaw = String(formData.get("opponent_score") ?? "");

  await sql`
    insert into matches (event_id, opponent_name, is_home, team_score, opponent_score, notes)
    values (
      ${eventId},
      ${String(formData.get("opponent_name") ?? "") || null},
      ${formData.get("is_home") === "on"},
      ${teamScoreRaw ? Number(teamScoreRaw) : null},
      ${opponentScoreRaw ? Number(opponentScoreRaw) : null},
      ${String(formData.get("notes") ?? "") || null}
    )
    on conflict (event_id) do update set
      opponent_name = excluded.opponent_name,
      is_home = excluded.is_home,
      team_score = excluded.team_score,
      opponent_score = excluded.opponent_score,
      notes = excluded.notes
  `;

  revalidatePath(`/dashboard/calendar/${eventId}`);
}

export async function saveMatchStats(eventId: string, formData: FormData) {
  await requireStaffForEvent(eventId);

  const playerIds = formData.getAll("player_id") as string[];

  for (const playerId of playerIds) {
    for (const field of STAT_FIELDS) {
      const raw = String(formData.get(`${field.key}_${playerId}`) ?? "");
      const value = raw ? Number(raw) : 0;

      if (value) {
        await sql`
          insert into match_player_stats (event_id, player_id, stat_key, stat_value)
          values (${eventId}, ${playerId}, ${field.key}, ${value})
          on conflict (event_id, player_id, stat_key) do update set stat_value = excluded.stat_value
        `;
      } else {
        await sql`
          delete from match_player_stats
          where event_id = ${eventId} and player_id = ${playerId} and stat_key = ${field.key}
        `;
      }
    }
  }

  revalidatePath(`/dashboard/calendar/${eventId}`);
}
