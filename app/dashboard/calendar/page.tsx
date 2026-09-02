import { redirect } from "next/navigation";
import Link from "next/link";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { EVENT_TYPE_LABELS, STAFF_ROLES } from "@/lib/types";

export default async function CalendarPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const events = await sql`
    select e.id, e.title, e.type, e.start_at, e.location, t.name as team_name
    from calendar_events e
    left join teams t on t.id = e.team_id
    where e.club_id = ${activeClub.club_id}
    order by e.start_at asc
  `;

  const canManage = STAFF_ROLES.includes(activeClub.role);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Calendrier</h1>
        {canManage && (
          <Link className="btn" href="/dashboard/calendar/new">
            Créer un événement
          </Link>
        )}
      </div>

      <div className="card">
        <ul className="divide-y divide-slate-200">
          {(events as any[]).map((e) => (
            <li key={e.id} className="py-3">
              <Link href={`/dashboard/calendar/${e.id}`} className="flex items-center justify-between hover:underline">
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-sm text-slate-500">
                    {EVENT_TYPE_LABELS[e.type as keyof typeof EVENT_TYPE_LABELS]}
                    {e.team_name ? ` · ${e.team_name}` : ""}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                </div>
                <span className="text-sm text-slate-500">
                  {new Date(e.start_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </Link>
            </li>
          ))}
          {events.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">Aucun événement pour le moment.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
