import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { EVENT_TYPE_LABELS } from "@/lib/types";

export default async function DashboardPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const supabase = createClient();

  const [{ count: playersCount }, { count: teamsCount }, { count: staffCount }, { data: nextEvents }] =
    await Promise.all([
      supabase.from("players").select("id", { count: "exact", head: true }).eq("club_id", activeClub.club_id),
      supabase.from("teams").select("id", { count: "exact", head: true }).eq("club_id", activeClub.club_id),
      supabase.from("staff_members").select("id", { count: "exact", head: true }).eq("club_id", activeClub.club_id),
      supabase
        .from("calendar_events")
        .select("id, title, type, start_at")
        .eq("club_id", activeClub.club_id)
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(5),
    ]);

  const stats = [
    { label: "Joueurs", value: playersCount ?? 0, href: "/dashboard/players" },
    { label: "Équipes", value: teamsCount ?? 0, href: "/dashboard/teams" },
    { label: "Staff", value: staffCount ?? 0, href: "/dashboard/staff" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-xl font-semibold">Tableau de bord — {activeClub.club_name}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card block hover:border-pitch">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="text-3xl font-semibold">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Prochains événements</h2>
          <Link href="/dashboard/calendar" className="text-sm text-pitch hover:underline">
            Voir tout
          </Link>
        </div>
        <ul className="divide-y divide-slate-200">
          {nextEvents?.map((e) => (
            <li key={e.id} className="py-2">
              <Link href={`/dashboard/calendar/${e.id}`} className="flex items-center justify-between text-sm hover:underline">
                <span>
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
          {nextEvents?.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">Aucun événement à venir.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
