import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { STAFF_ROLES } from "@/lib/types";
import { NewPlayerForm } from "./new-player-form";

export default async function NewPlayerPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");
  if (!STAFF_ROLES.includes(activeClub.role)) redirect("/dashboard/players");

  const teams = await sql`
    select id, name from teams where club_id = ${activeClub.club_id} order by name
  `;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Nouveau joueur</h1>
      <div className="card">
        <NewPlayerForm clubId={activeClub.club_id} teams={teams as any[]} />
      </div>
    </div>
  );
}
