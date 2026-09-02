import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { STAFF_ROLES } from "@/lib/types";
import { NewVideoForm } from "./new-video-form";

export default async function NewVideoPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");
  if (!STAFF_ROLES.includes(activeClub.role)) redirect("/dashboard/videos");

  const teams = await sql`
    select id, name from teams where club_id = ${activeClub.club_id} order by name
  `;
  const events = await sql`
    select id, title, start_at from calendar_events
    where club_id = ${activeClub.club_id} and type in ('match', 'training', 'tournament')
    order by start_at desc
    limit 50
  `;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Ajouter une vidéo</h1>
      <div className="card">
        <NewVideoForm clubId={activeClub.club_id} teams={teams as any[]} events={events as any[]} />
      </div>
    </div>
  );
}
