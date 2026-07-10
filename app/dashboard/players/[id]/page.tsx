import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { STAFF_ROLES } from "@/lib/types";
import { PlayerForm } from "./player-form";

export default async function PlayerDetailPage({ params }: { params: { id: string } }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const supabase = createClient();
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", params.id)
    .eq("club_id", activeClub.club_id)
    .single();

  if (!player) notFound();

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("club_id", activeClub.club_id)
    .order("name");

  const canEdit = STAFF_ROLES.includes(activeClub.role);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">
        {player.first_name} {player.last_name}
      </h1>
      <div className="card">
        <PlayerForm player={player} teams={teams ?? []} canEdit={canEdit} />
      </div>
    </div>
  );
}
