import { redirect, notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { STAFF_ROLES } from "@/lib/types";
import { PlayerForm } from "./player-form";

export default async function PlayerDetailPage({ params }: { params: { id: string } }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const playerRows = await sql`
    select * from players where id = ${params.id} and club_id = ${activeClub.club_id} limit 1
  `;
  const player = playerRows[0] as any;

  if (!player) notFound();

  const teams = await sql`
    select id, name from teams where club_id = ${activeClub.club_id} order by name
  `;

  const canEdit = STAFF_ROLES.includes(activeClub.role);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">
        {player.first_name} {player.last_name}
      </h1>
      <div className="card">
        <PlayerForm player={player} teams={teams as any[]} canEdit={canEdit} />
      </div>
    </div>
  );
}
