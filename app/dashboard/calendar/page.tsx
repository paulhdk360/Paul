import { redirect } from "next/navigation";
import Link from "next/link";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, STAFF_ROLES } from "@/lib/types";
import { MONTH_NAMES } from "@/lib/calendar-utils";
import { MonthView } from "./month-view";
import { YearView } from "./year-view";

type View = "list" | "month" | "year";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { view?: string; year?: string; month?: string };
}) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const now = new Date();
  const view: View = (["list", "month", "year"] as View[]).includes(searchParams.view as View)
    ? (searchParams.view as View)
    : "month";
  const year = Number(searchParams.year) || now.getFullYear();
  const monthParam = Number(searchParams.month) || now.getMonth() + 1;
  const month = monthParam - 1;

  const canManage = STAFF_ROLES.includes(activeClub.role);

  let events: any[] = [];

  if (view === "list") {
    events = await sql`
      select e.id, e.title, e.type, e.start_at, e.location, t.name as team_name
      from calendar_events e
      left join teams t on t.id = e.team_id
      where e.club_id = ${activeClub.club_id}
      order by e.start_at asc
    `;
  } else if (view === "month") {
    const monthStart = new Date(year, month, 1).toISOString();
    const monthEnd = new Date(year, month + 1, 1).toISOString();
    events = await sql`
      select id, title, type, start_at from calendar_events
      where club_id = ${activeClub.club_id} and start_at >= ${monthStart} and start_at < ${monthEnd}
    `;
  } else {
    const yearStart = new Date(year, 0, 1).toISOString();
    const yearEnd = new Date(year + 1, 0, 1).toISOString();
    events = await sql`
      select id, title, type, start_at from calendar_events
      where club_id = ${activeClub.club_id} and start_at >= ${yearStart} and start_at < ${yearEnd}
    `;
  }

  const prevMonthDate = new Date(year, month - 1, 1);
  const nextMonthDate = new Date(year, month + 1, 1);

  function viewLink(v: View) {
    if (v === "month") return `/dashboard/calendar?view=month&year=${year}&month=${monthParam}`;
    if (v === "year") return `/dashboard/calendar?view=year&year=${year}`;
    return `/dashboard/calendar?view=list`;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Calendrier</h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {(["month", "year", "list"] as View[]).map((v) => (
              <Link
                key={v}
                href={viewLink(v)}
                className={
                  view === v
                    ? "rounded-md bg-pitch-600 px-3 py-1 text-sm font-medium text-white"
                    : "rounded-md px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
                }
              >
                {v === "month" ? "Mois" : v === "year" ? "Année" : "Liste"}
              </Link>
            ))}
          </div>
          {canManage && (
            <Link className="btn" href="/dashboard/calendar/new">
              Créer un événement
            </Link>
          )}
        </div>
      </div>

      {view === "month" && (
        <>
          <div className="flex items-center justify-between">
            <Link
              href={`/dashboard/calendar?view=month&year=${prevMonthDate.getFullYear()}&month=${prevMonthDate.getMonth() + 1}`}
              className="btn-secondary"
            >
              ← {MONTH_NAMES[prevMonthDate.getMonth()]}
            </Link>
            <p className="text-lg font-semibold">
              {MONTH_NAMES[month]} {year}
            </p>
            <Link
              href={`/dashboard/calendar?view=month&year=${nextMonthDate.getFullYear()}&month=${nextMonthDate.getMonth() + 1}`}
              className="btn-secondary"
            >
              {MONTH_NAMES[nextMonthDate.getMonth()]} →
            </Link>
          </div>
          <MonthView year={year} month={month} events={events} />
        </>
      )}

      {view === "year" && (
        <>
          <div className="flex items-center justify-between">
            <Link href={`/dashboard/calendar?view=year&year=${year - 1}`} className="btn-secondary">
              ← {year - 1}
            </Link>
            <p className="text-lg font-semibold">{year}</p>
            <Link href={`/dashboard/calendar?view=year&year=${year + 1}`} className="btn-secondary">
              {year + 1} →
            </Link>
          </div>
          <YearView year={year} events={events} />
        </>
      )}

      {view === "list" && (
        <div className="card">
          <ul className="divide-y divide-slate-200">
            {events.map((e: any) => (
              <li key={e.id} className="py-3">
                <Link href={`/dashboard/calendar/${e.id}`} className="flex items-center justify-between hover:underline">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${EVENT_TYPE_COLORS[e.type as keyof typeof EVENT_TYPE_COLORS]}`} />
                    <div>
                      <p className="font-medium">{e.title}</p>
                      <p className="text-sm text-slate-500">
                        {EVENT_TYPE_LABELS[e.type as keyof typeof EVENT_TYPE_LABELS]}
                        {e.team_name ? ` · ${e.team_name}` : ""}
                        {e.location ? ` · ${e.location}` : ""}
                      </p>
                    </div>
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
      )}
    </div>
  );
}
