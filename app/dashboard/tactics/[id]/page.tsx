import { redirect, notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { STAFF_ROLES } from "@/lib/types";
import { PlayEditor } from "../play-editor";

export default async function PlayDetailPage({ params }: { params: { id: string } }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const playRows = await sql`
    select * from plays where id = ${params.id} and club_id = ${activeClub.club_id} limit 1
  `;
  const play = playRows[0] as any;
  if (!play) notFound();

  const positionRows = await sql`
    select * from play_positions where play_id = ${play.id} order by position_order asc
  `;

  const teams = await sql`
    select id, name from teams where club_id = ${activeClub.club_id} order by name
  `;

  const canEdit = STAFF_ROLES.includes(activeClub.role);

  const existingPlay = {
    id: play.id,
    clubId: play.club_id,
    teamId: play.team_id,
    phase: play.phase,
    formation: play.formation,
    name: play.name,
    description: play.description ?? "",
    positions: (positionRows as any[]).map((p) => ({
      id: p.id,
      label: p.label,
      startX: Number(p.start_x),
      startY: Number(p.start_y),
      assignment: p.assignment ?? "",
      route: (p.route as any[]).map((segment) => ({ id: randomUUID(), ...segment })),
    })),
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-xl font-semibold">{play.name}</h1>
      <PlayEditor clubId={activeClub.club_id} teams={teams as any[]} existingPlay={existingPlay} canEdit={canEdit} />
    </div>
  );
}
