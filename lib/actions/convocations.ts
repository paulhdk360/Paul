"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { requireClubStaff, requireUserId } from "@/lib/auth-helpers";
import type { ConvocationResponse } from "@/lib/types";

export async function createConvocation(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const clubId = String(formData.get("club_id") ?? "");
  const userId = await requireClubStaff(clubId);

  const eventId = String(formData.get("event_id") ?? "");
  const playerIds = formData.getAll("player_ids") as string[];
  const deadline = String(formData.get("response_deadline") ?? "");

  if (!eventId) return { error: "Sélectionnez un événement." };
  if (playerIds.length === 0) return { error: "Sélectionnez au moins un joueur." };

  const eventRows = await sql`select team_id from calendar_events where id = ${eventId} limit 1`;
  const event = eventRows[0] as { team_id: string | null } | undefined;

  const rows = await sql`
    insert into convocations (club_id, event_id, team_id, instructions, response_deadline, created_by)
    values (
      ${clubId},
      ${eventId},
      ${event?.team_id ?? null},
      ${String(formData.get("instructions") ?? "") || null},
      ${deadline ? new Date(deadline).toISOString() : null},
      ${userId}
    )
    returning id
  `;
  const convocation = rows[0] as { id: string } | undefined;
  if (!convocation) return { error: "Erreur lors de la création." };

  for (const playerId of playerIds) {
    await sql`
      insert into convocation_players (convocation_id, player_id, status, response)
      values (${convocation.id}, ${playerId}, 'selected', 'pending')
    `;
  }

  revalidatePath("/dashboard/convocations");
  redirect(`/dashboard/convocations/${convocation.id}`);
}

export async function respondToConvocation(
  convocationPlayerId: string,
  response: ConvocationResponse,
  comment: string
) {
  const userId = await requireUserId();

  const rows = await sql`
    select cp.id, p.user_id
    from convocation_players cp
    join players p on p.id = cp.player_id
    where cp.id = ${convocationPlayerId}
    limit 1
  `;
  const row = rows[0] as { id: string; user_id: string | null } | undefined;
  if (!row || row.user_id !== userId) {
    throw new Error("Accès refusé : cette convocation ne vous concerne pas.");
  }

  await sql`
    update convocation_players
    set response = ${response}, response_comment = ${comment || null}, responded_at = now()
    where id = ${convocationPlayerId}
  `;

  revalidatePath("/dashboard/convocations");
}
