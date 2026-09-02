import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { STAFF_ROLES } from "@/lib/types";
import { NewConvocationForm } from "./new-convocation-form";

export default async function NewConvocationPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");
  if (!STAFF_ROLES.includes(activeClub.role)) redirect("/dashboard/convocations");

  const events = await sql`
    select id, title, start_at, team_id from calendar_events
    where club_id = ${activeClub.club_id}
    order by start_at asc
  `;

  const players = await sql`
    select id, first_name, last_name, team_id from players
    where club_id = ${activeClub.club_id}
    order by last_name
  `;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Nouvelle convocation</h1>
      <div className="card">
        <NewConvocationForm clubId={activeClub.club_id} events={events as any[]} players={players as any[]} />
      </div>
    </div>
  );
}
