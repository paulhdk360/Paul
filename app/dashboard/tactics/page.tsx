import { redirect } from "next/navigation";
import Link from "next/link";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { STAFF_ROLES } from "@/lib/types";

export default async function TacticsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const plays = await sql`
    select p.id, p.name, p.phase, p.formation, p.description, t.name as team_name
    from plays p
    left join teams t on t.id = p.team_id
    where p.club_id = ${activeClub.club_id}
    order by p.updated_at desc
  `;

  const canManage = STAFF_ROLES.includes(activeClub.role);

  const offense = (plays as any[]).filter((p) => p.phase === "offense");
  const defense = (plays as any[]).filter((p) => p.phase === "defense");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tactiques</h1>
          <p className="text-sm text-slate-500">Bibliothèque de jeux — formations et routes des 11 joueurs.</p>
        </div>
        {canManage && (
          <Link className="btn" href="/dashboard/tactics/new">
            Créer un jeu
          </Link>
        )}
      </div>

      {[
        { title: "Attaque", items: offense },
        { title: "Défense", items: defense },
      ].map((group) => (
        <div key={group.title} className="card">
          <h2 className="mb-4 text-lg font-medium">{group.title}</h2>
          <ul className="divide-y divide-slate-200">
            {group.items.map((p) => (
              <li key={p.id} className="py-3">
                <Link href={`/dashboard/tactics/${p.id}`} className="flex items-center justify-between hover:underline">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-slate-500">
                      {p.formation}
                      {p.team_name ? ` · ${p.team_name}` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
            {group.items.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">Aucun jeu {group.title.toLowerCase()} pour le moment.</p>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
