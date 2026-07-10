import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { CONVOCATION_RESPONSE_LABELS } from "@/lib/types";
import { RespondButtons } from "./respond-buttons";

export default async function ConvocationDetailPage({ params }: { params: { id: string } }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const supabase = createClient();
  const { data: convocation } = await supabase
    .from("convocations")
    .select("*, calendar_events(title, start_at, location)")
    .eq("id", params.id)
    .eq("club_id", activeClub.club_id)
    .single();

  if (!convocation) notFound();

  const { data: rows } = await supabase
    .from("convocation_players")
    .select("id, status, response, response_comment, players(id, first_name, last_name, user_id)")
    .eq("convocation_id", convocation.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{convocation.calendar_events?.title}</h1>
        <p className="text-sm text-slate-500">
          {convocation.calendar_events?.start_at &&
            new Date(convocation.calendar_events.start_at).toLocaleString("fr-FR", {
              dateStyle: "full",
              timeStyle: "short",
            })}
          {convocation.calendar_events?.location ? ` · ${convocation.calendar_events.location}` : ""}
        </p>
      </div>

      {convocation.instructions && (
        <div className="card">
          <p className="text-sm">{convocation.instructions}</p>
        </div>
      )}

      <div className="card">
        <h2 className="mb-4 text-lg font-medium">Joueurs convoqués</h2>
        <ul className="divide-y divide-slate-200">
          {rows?.map((r: any) => (
            <li key={r.id} className="flex items-center justify-between py-3">
              <span className="text-sm font-medium">
                {r.players?.first_name} {r.players?.last_name}
              </span>
              {r.players?.user_id === current.user.id ? (
                <RespondButtons convocationPlayerId={r.id} current={r.response} />
              ) : (
                <span className="text-sm text-slate-500">
                  {CONVOCATION_RESPONSE_LABELS[r.response as keyof typeof CONVOCATION_RESPONSE_LABELS]}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
