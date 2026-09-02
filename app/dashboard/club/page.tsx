import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { ClubForm } from "./club-form";

export default async function ClubPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const clubRows = await sql`select * from clubs where id = ${activeClub.club_id} limit 1`;
  const club = clubRows[0] as any;

  const members = await sql`
    select cm.id, cm.role, u.full_name, u.email
    from club_members cm
    join users u on u.id = cm.user_id
    where cm.club_id = ${activeClub.club_id}
  `;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Informations du club</h1>

      <div className="card">
        <ClubForm club={club} canEdit={activeClub.role === "club_admin"} />
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-medium">Membres ({members.length})</h2>
        <ul className="divide-y divide-slate-200">
          {(members as any[]).map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2 text-sm">
              <span>{m.full_name ?? m.email}</span>
              <span className="text-slate-500">{m.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
