import { redirect, notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { STAFF_ROLES } from "@/lib/types";
import { PlayerForm } from "./player-form";
import { PlayerStats } from "./player-stats";

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

  const attendanceRows = await sql`
    select
      count(*) filter (where status = 'present')::int as present_count,
      count(*)::int as total_count
    from attendances
    where player_id = ${player.id}
  `;
  const attendanceRow = attendanceRows[0] as { present_count: number; total_count: number };

  const injuryRows = await sql`
    select count(*)::int as injury_count from attendances where player_id = ${player.id} and status = 'injured'
  `;
  const injuryCount = (injuryRows[0] as { injury_count: number }).injury_count;

  const statRows = await sql`
    select stat_key, sum(stat_value)::numeric as total from match_player_stats
    where player_id = ${player.id}
    group by stat_key
  `;
  const seasonStats: Record<string, number> = {};
  for (const row of statRows as any[]) {
    seasonStats[row.stat_key] = Number(row.total);
  }

  const matchesRows = await sql`
    select count(distinct event_id)::int as matches_count from match_player_stats where player_id = ${player.id}
  `;
  const matchesCount = (matchesRows[0] as { matches_count: number }).matches_count;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">
        {player.first_name} {player.last_name}
      </h1>
      <div className="card">
        <PlayerForm player={player} teams={teams as any[]} canEdit={canEdit} />
      </div>
      <PlayerStats
        attendance={{ presentCount: attendanceRow.present_count, totalCount: attendanceRow.total_count }}
        injuryCount={injuryCount}
        matchesCount={matchesCount}
        seasonStats={seasonStats}
      />
    </div>
  );
}
