import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { ClubForm } from "./club-form";

export default async function ClubPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const supabase = createClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", activeClub.club_id)
    .single();

  const { data: members } = await supabase
    .from("club_members")
    .select("id, role, profiles(full_name, email)")
    .eq("club_id", activeClub.club_id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Informations du club</h1>

      <div className="card">
        <ClubForm club={club} canEdit={activeClub.role === "club_admin"} />
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-medium">Membres ({members?.length ?? 0})</h2>
        <ul className="divide-y divide-slate-200">
          {members?.map((m: any) => (
            <li key={m.id} className="flex items-center justify-between py-2 text-sm">
              <span>{m.profiles?.full_name ?? m.profiles?.email}</span>
              <span className="text-slate-500">{m.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
