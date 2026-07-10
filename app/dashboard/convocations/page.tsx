import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { STAFF_ROLES } from "@/lib/types";

export default async function ConvocationsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const supabase = createClient();
  const { data: convocations } = await supabase
    .from("convocations")
    .select("id, instructions, response_deadline, calendar_events(title, start_at), convocation_players(response)")
    .eq("club_id", activeClub.club_id)
    .order("created_at", { ascending: false });

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
          {convocations?.map((c: any) => {
            const total = c.convocation_players?.length ?? 0;
            const accepted = c.convocation_players?.filter((r: any) => r.response === "accepted").length ?? 0;
            return (
              <li key={c.id} className="py-3">
                <Link href={`/dashboard/convocations/${c.id}`} className="flex items-center justify-between hover:underline">
                  <div>
                    <p className="font-medium">{c.calendar_events?.title}</p>
                    <p className="text-sm text-slate-500">
                      {c.calendar_events?.start_at &&
                        new Date(c.calendar_events.start_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <span className="text-sm text-slate-500">
                    {accepted}/{total} confirmés
                  </span>
                </Link>
              </li>
            );
          })}
          {convocations?.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">Aucune convocation pour le moment.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
