import { redirect } from "next/navigation";
import Link from "next/link";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "@/lib/types";

export default async function DashboardPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const clubId = activeClub.club_id;

  const [playersCountRows, teamsCountRows, staffCountRows, nextEvents] = await Promise.all([
    sql`select count(*)::int as count from players where club_id = ${clubId}`,
    sql`select count(*)::int as count from teams where club_id = ${clubId}`,
    sql`select count(*)::int as count from staff_members where club_id = ${clubId}`,
    sql`
      select id, title, type, start_at from calendar_events
      where club_id = ${clubId} and start_at >= now()
      order by start_at asc
      limit 5
    `,
  ]);

  const stats = [
    {
      label: "Joueurs",
      value: (playersCountRows[0] as { count: number }).count,
      href: "/dashboard/players",
      icon: "🏈",
      accent: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Équipes",
      value: (teamsCountRows[0] as { count: number }).count,
      href: "/dashboard/teams",
      icon: "👥",
      accent: "from-sky-500 to-sky-600",
    },
    {
      label: "Staff",
      value: (staffCountRows[0] as { count: number }).count,
      href: "/dashboard/staff",
      icon: "🧢",
      accent: "from-amber-500 to-amber-600",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-xl font-semibold">Tableau de bord — {activeClub.club_name}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card block transition hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${s.accent} text-lg`}>
                {s.icon}
              </span>
              <div>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="text-3xl font-semibold">{s.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Prochains événements</h2>
          <Link href="/dashboard/calendar" className="text-sm font-medium text-pitch-700 hover:underline">
            Voir tout
          </Link>
        </div>
        <ul className="divide-y divide-slate-200">
          {(nextEvents as any[]).map((e) => (
            <li key={e.id} className="py-2">
              <Link href={`/dashboard/calendar/${e.id}`} className="flex items-center justify-between text-sm hover:underline">
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${EVENT_TYPE_COLORS[e.type as keyof typeof EVENT_TYPE_COLORS]}`} />
                  {e.title}{" "}
                  <span className="text-slate-500">
                    ({EVENT_TYPE_LABELS[e.type as keyof typeof EVENT_TYPE_LABELS]})
                  </span>
                </span>
                <span className="text-slate-500">
                  {new Date(e.start_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </Link>
            </li>
          ))}
          {(nextEvents as any[]).length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">Aucun événement à venir.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
