import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { STAT_FIELDS } from "@/lib/stats";

type PlayerRow = { id: string; first_name: string; last_name: string };

const LEADERBOARD_KEYS = [
  { key: "passing_yards", label: "Yards passés", icon: "🎯" },
  { key: "rushing_yards", label: "Yards courus", icon: "🏃" },
  { key: "receiving_yards", label: "Yards reçus", icon: "🙌" },
  { key: "tackles", label: "Tacles", icon: "💥" },
  { key: "sacks", label: "Sacks", icon: "🧱" },
  { key: "interceptions", label: "Interceptions", icon: "🛡️" },
];

export default async function StatsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const statRows = await sql`
    select p.id as player_id, p.first_name, p.last_name, mps.stat_key, sum(mps.stat_value)::numeric as total
    from match_player_stats mps
    join players p on p.id = mps.player_id
    where p.club_id = ${activeClub.club_id}
    group by p.id, p.first_name, p.last_name, mps.stat_key
  `;

  const statsByPlayer = new Map<string, { player: PlayerRow; stats: Record<string, number> }>();
  for (const row of statRows as any[]) {
    const entry: { player: PlayerRow; stats: Record<string, number> } = statsByPlayer.get(row.player_id) ?? {
      player: { id: row.player_id, first_name: row.first_name, last_name: row.last_name },
      stats: {},
    };
    entry.stats[row.stat_key] = Number(row.total);
    statsByPlayer.set(row.player_id, entry);
  }
  const allPlayers = Array.from(statsByPlayer.values());

  const attendanceRows = await sql`
    select
      p.id as player_id, p.first_name, p.last_name,
      count(*) filter (where a.status = 'present')::int as present_count,
      count(*)::int as total_count
    from players p
    join attendances a on a.player_id = p.id
    where p.club_id = ${activeClub.club_id}
    group by p.id, p.first_name, p.last_name
    having count(*) >= 3
    order by (count(*) filter (where a.status = 'present'))::float / count(*) desc
    limit 5
  `;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">📊 Statistiques</h1>
        <p className="text-sm text-slate-500">Classements et totaux saison du club.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LEADERBOARD_KEYS.map((cat) => {
          const top = allPlayers
            .filter((p) => (p.stats[cat.key] ?? 0) > 0)
            .sort((a, b) => (b.stats[cat.key] ?? 0) - (a.stats[cat.key] ?? 0))
            .slice(0, 5);

          return (
            <div key={cat.key} className="card">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                {cat.icon} {cat.label}
              </h2>
              {top.length === 0 ? (
                <p className="text-xs text-slate-400">Aucune donnée</p>
              ) : (
                <ol className="space-y-1.5">
                  {top.map((p, i) => (
                    <li key={p.player.id} className="flex items-center justify-between text-sm">
                      <span>
                        <span className="mr-1.5 text-xs text-slate-400">{i + 1}.</span>
                        {p.player.first_name} {p.player.last_name}
                      </span>
                      <span className="font-semibold text-pitch-700">{p.stats[cat.key]}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          );
        })}

        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">✅ Meilleure présence</h2>
          {(attendanceRows as any[]).length === 0 ? (
            <p className="text-xs text-slate-400">Aucune donnée</p>
          ) : (
            <ol className="space-y-1.5">
              {(attendanceRows as any[]).map((p, i) => (
                <li key={p.player_id} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="mr-1.5 text-xs text-slate-400">{i + 1}.</span>
                    {p.first_name} {p.last_name}
                  </span>
                  <span className="font-semibold text-pitch-700">
                    {Math.round((p.present_count / p.total_count) * 100)}%
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-4 text-lg font-medium">Feuille de statistiques complète</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="sticky left-0 bg-white py-2 pr-4">Joueur</th>
              {STAT_FIELDS.map((f) => (
                <th key={f.key} className="py-2 pr-2 text-xs">
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allPlayers
              .sort((a, b) => a.player.last_name.localeCompare(b.player.last_name))
              .map((p) => (
                <tr key={p.player.id} className="border-b border-slate-100 last:border-0">
                  <td className="sticky left-0 bg-white py-2 pr-4 font-medium">
                    {p.player.first_name} {p.player.last_name}
                  </td>
                  {STAT_FIELDS.map((f) => (
                    <td key={f.key} className="py-2 pr-2">
                      {p.stats[f.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
        {allPlayers.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">
            Aucune statistique enregistrée pour l'instant — remplis les feuilles de match pour voir apparaître les
            données ici.
          </p>
        )}
      </div>
    </div>
  );
}
