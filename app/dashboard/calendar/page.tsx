import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { EVENT_TYPE_LABELS, STAFF_ROLES } from "@/lib/types";

export default async function CalendarPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const supabase = createClient();
  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, title, type, start_at, location, teams(name)")
    .eq("club_id", activeClub.club_id)
    .order("start_at", { ascending: true });

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
          {events?.map((e: any) => (
            <li key={e.id} className="py-3">
              <Link href={`/dashboard/calendar/${e.id}`} className="flex items-center justify-between hover:underline">
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-sm text-slate-500">
                    {EVENT_TYPE_LABELS[e.type as keyof typeof EVENT_TYPE_LABELS]}
                    {e.teams?.name ? ` · ${e.teams.name}` : ""}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                </div>
                <span className="text-sm text-slate-500">
                  {new Date(e.start_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </Link>
            </li>
          ))}
          {events?.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">Aucun événement pour le moment.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
