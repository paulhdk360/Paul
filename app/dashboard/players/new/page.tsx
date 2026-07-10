import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = createClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("club_id", activeClub.club_id)
    .order("name");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Nouveau joueur</h1>
      <div className="card">
        <NewPlayerForm clubId={activeClub.club_id} teams={teams ?? []} />
      </div>
    </div>
  );
}
