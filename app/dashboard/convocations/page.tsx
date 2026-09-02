import { redirect } from "next/navigation";
import Link from "next/link";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { STAFF_ROLES } from "@/lib/types";

export default async function ConvocationsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const convocations = await sql`
    select
      c.id,
      c.instructions,
      c.response_deadline,
      ce.title as event_title,
      ce.start_at as event_start_at,
      count(cp.id)::int as total,
      count(cp.id) filter (where cp.response = 'accepted')::int as accepted
    from convocations c
    join calendar_events ce on ce.id = c.event_id
    left join convocation_players cp on cp.convocation_id = c.id
    where c.club_id = ${activeClub.club_id}
    group by c.id, ce.title, ce.start_at
    order by ce.start_at desc
  `;

  const canManage = STAFF_ROLES.includes(activeClub.role);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Convocations</h1>
        {canManage && (
          <Link className="btn" href="/dashboard/convocations/new">
            Nouvelle convocation
          </Link>
        )}
      </div>

      <div className="card">
        <ul className="divide-y divide-slate-200">
          {(convocations as any[]).map((c) => (
            <li key={c.id} className="py-3">
              <Link href={`/dashboard/convocations/${c.id}`} className="flex items-center justify-between hover:underline">
                <div>
                  <p className="font-medium">{c.event_title}</p>
                  <p className="text-sm text-slate-500">
                    {c.event_start_at &&
                      new Date(c.event_start_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <span className="text-sm text-slate-500">
                  {c.accepted}/{c.total} confirmés
                </span>
              </Link>
            </li>
          ))}
          {convocations.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">Aucune convocation pour le moment.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
