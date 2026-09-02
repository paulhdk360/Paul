import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = createClient();
  const [{ data: teams }, { data: events }] = await Promise.all([
    supabase.from("teams").select("id, name").eq("club_id", activeClub.club_id).order("name"),
    supabase
      .from("calendar_events")
      .select("id, title, start_at")
      .eq("club_id", activeClub.club_id)
      .in("type", ["match", "training", "tournament"])
      .order("start_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Ajouter une vidéo</h1>
      <div className="card">
        <NewVideoForm clubId={activeClub.club_id} teams={teams ?? []} events={events ?? []} />
      </div>
    </div>
  );
}
