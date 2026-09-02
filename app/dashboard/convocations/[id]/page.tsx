import { redirect, notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { CONVOCATION_RESPONSE_LABELS } from "@/lib/types";
import { RespondButtons } from "./respond-buttons";

export default async function ConvocationDetailPage({ params }: { params: { id: string } }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const convocationRows = await sql`
    select c.*, ce.title as event_title, ce.start_at as event_start_at, ce.location as event_location
    from convocations c
    join calendar_events ce on ce.id = c.event_id
    where c.id = ${params.id} and c.club_id = ${activeClub.club_id}
    limit 1
  `;
  const convocation = convocationRows[0] as any;

  if (!convocation) notFound();

  const rows = await sql`
    select cp.id, cp.response, p.first_name, p.last_name, p.user_id
    from convocation_players cp
    join players p on p.id = cp.player_id
    where cp.convocation_id = ${convocation.id}
  `;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{convocation.event_title}</h1>
        <p className="text-sm text-slate-500">
          {convocation.event_start_at &&
            new Date(convocation.event_start_at).toLocaleString("fr-FR", {
              dateStyle: "full",
              timeStyle: "short",
            })}
          {convocation.event_location ? ` · ${convocation.event_location}` : ""}
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
          {(rows as any[]).map((r) => (
            <li key={r.id} className="flex items-center justify-between py-3">
              <span className="text-sm font-medium">
                {r.first_name} {r.last_name}
              </span>
              {r.user_id === current.user.id ? (
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
