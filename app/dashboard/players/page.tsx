import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { PLAYER_STATUS_LABELS, STAFF_ROLES } from "@/lib/types";

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: { team?: string };
}) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const supabase = createClient();
  let query = supabase
    .from("players")
    .select("id, first_name, last_name, jersey_number, primary_position, sport_status, teams(name)")
    .eq("club_id", activeClub.club_id)
    .order("last_name");

  if (searchParams.team) query = query.eq("team_id", searchParams.team);

  const { data: players } = await query;
  const canManage = STAFF_ROLES.includes(activeClub.role);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Joueurs</h1>
        {canManage && (
          <Link className="btn" href="/dashboard/players/new">
            Ajouter un joueur
          </Link>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-4">Nom</th>
              <th className="py-2 pr-4">N°</th>
              <th className="py-2 pr-4">Poste</th>
              <th className="py-2 pr-4">Équipe</th>
              <th className="py-2 pr-4">Statut</th>
            </tr>
          </thead>
          <tbody>
            {players?.map((p: any) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-4">
                  <Link href={`/dashboard/players/${p.id}`} className="font-medium hover:underline">
                    {p.first_name} {p.last_name}
                  </Link>
                </td>
                <td className="py-2 pr-4">{p.jersey_number ?? "—"}</td>
                <td className="py-2 pr-4">{p.primary_position ?? "—"}</td>
                <td className="py-2 pr-4">{p.teams?.name ?? "—"}</td>
                <td className="py-2 pr-4">{PLAYER_STATUS_LABELS[p.sport_status as keyof typeof PLAYER_STATUS_LABELS]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {players?.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">Aucun joueur pour le moment.</p>
        )}
      </div>
    </div>
  );
}
