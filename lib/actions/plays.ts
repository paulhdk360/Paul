"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireClubStaff } from "@/lib/auth-helpers";
import type { RouteSegment } from "@/lib/tactics/route";

export type RouteSegmentInput = Omit<RouteSegment, "id">;

export type PlayPositionInput = {
  label: string;
  startX: number;
  startY: number;
  assignment: string;
  route: RouteSegmentInput[];
};

export type SavePlayInput = {
  clubId: string;
  teamId: string | null;
  phase: "offense" | "defense";
  formation: string;
  name: string;
  description: string;
  positions: PlayPositionInput[];
};

export async function createPlay(input: SavePlayInput): Promise<{ id: string } | { error: string }> {
  let userId: string;
  try {
    userId = await requireClubStaff(input.clubId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Accès refusé." };
  }

  if (!input.name.trim()) return { error: "Le nom du jeu est obligatoire." };
  if (input.positions.length === 0) return { error: "Aucun joueur dans ce jeu." };

  const rows = await sql`
    insert into plays (club_id, team_id, phase, formation, name, description, created_by)
    values (
      ${input.clubId}, ${input.teamId}, ${input.phase}, ${input.formation},
      ${input.name.trim()}, ${input.description.trim() || null}, ${userId}
    )
    returning id
  `;
  const play = rows[0] as { id: string } | undefined;
  if (!play) return { error: "Erreur lors de la création du jeu." };

  for (const [i, pos] of input.positions.entries()) {
    await sql`
      insert into play_positions (play_id, position_order, label, start_x, start_y, assignment, route)
      values (
        ${play.id}, ${i}, ${pos.label}, ${pos.startX}, ${pos.startY},
        ${pos.assignment.trim() || null}, ${JSON.stringify(pos.route)}::jsonb
      )
    `;
  }

  revalidatePath("/dashboard/tactics");
  return { id: play.id };
}

export async function updatePlay(playId: string, input: SavePlayInput): Promise<{ error?: string }> {
  let userId: string;
  try {
    userId = await requireClubStaff(input.clubId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Accès refusé." };
  }
  void userId;

  if (!input.name.trim()) return { error: "Le nom du jeu est obligatoire." };
  if (input.positions.length === 0) return { error: "Aucun joueur dans ce jeu." };

  await sql`
    update plays set
      team_id = ${input.teamId},
      phase = ${input.phase},
      formation = ${input.formation},
      name = ${input.name.trim()},
      description = ${input.description.trim() || null},
      updated_at = now()
    where id = ${playId} and club_id = ${input.clubId}
  `;

  await sql`delete from play_positions where play_id = ${playId}`;

  for (const [i, pos] of input.positions.entries()) {
    await sql`
      insert into play_positions (play_id, position_order, label, start_x, start_y, assignment, route)
      values (
        ${playId}, ${i}, ${pos.label}, ${pos.startX}, ${pos.startY},
        ${pos.assignment.trim() || null}, ${JSON.stringify(pos.route)}::jsonb
      )
    `;
  }

  revalidatePath(`/dashboard/tactics/${playId}`);
  revalidatePath("/dashboard/tactics");
  return {};
}

export async function deletePlay(playId: string, clubId: string) {
  await requireClubStaff(clubId);
  await sql`delete from plays where id = ${playId} and club_id = ${clubId}`;
  revalidatePath("/dashboard/tactics");
}
