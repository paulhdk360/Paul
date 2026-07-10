import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { STAFF_ROLES } from "@/lib/types";
import { NewTeamForm } from "./new-team-form";

export default async function TeamsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const supabase = createClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, category, level, color")
    .eq("club_id", activeClub.club_id)
    .order("name");

  const canManage = STAFF_ROLES.includes(activeClub.role);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Équipes</h1>
      </div>

      <div className="card">
        <ul className="divide-y divide-slate-200">
          {teams?.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-3">
              <div>
                <Link href={`/dashboard/players?team=${t.id}`} className="font-medium hover:underline">
                  {t.name}
                </Link>
                <p className="text-sm text-slate-500">
                  {[t.category, t.level].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              {t.color && (
                <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: t.color }} />
              )}
            </li>
          ))}
          {teams?.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Aucune équipe pour le moment.</p>}
        </ul>
      </div>

      {canManage && (
        <div className="card">
          <h2 className="mb-4 text-lg font-medium">Créer une équipe</h2>
          <NewTeamForm clubId={activeClub.club_id} />
        </div>
      )}
    </div>
  );
}
