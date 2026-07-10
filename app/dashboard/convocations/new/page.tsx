import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = createClient();
  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, title, start_at, team_id")
    .eq("club_id", activeClub.club_id)
    .order("start_at", { ascending: true });

  const { data: players } = await supabase
    .from("players")
    .select("id, first_name, last_name, team_id")
    .eq("club_id", activeClub.club_id)
    .order("last_name");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Nouvelle convocation</h1>
      <div className="card">
        <NewConvocationForm clubId={activeClub.club_id} events={events ?? []} players={players ?? []} />
      </div>
    </div>
  );
}
