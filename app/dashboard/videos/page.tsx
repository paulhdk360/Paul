import { redirect } from "next/navigation";
import Link from "next/link";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { STAFF_ROLES } from "@/lib/types";

export default async function VideosPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const videos = await sql`
    select
      v.id, v.title, v.created_at,
      t.name as team_name,
      ce.title as event_title,
      count(vc.id)::int as clip_count
    from videos v
    left join teams t on t.id = v.team_id
    left join calendar_events ce on ce.id = v.event_id
    left join video_clips vc on vc.video_id = v.id
    where v.club_id = ${activeClub.club_id}
    group by v.id, t.name, ce.title
    order by v.created_at desc
  `;

  const canManage = STAFF_ROLES.includes(activeClub.role);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Vidéos</h1>
        {canManage && (
          <Link className="btn" href="/dashboard/videos/new">
            Ajouter une vidéo
          </Link>
        )}
      </div>

      <div className="card">
        <ul className="divide-y divide-slate-200">
          {(videos as any[]).map((v) => (
            <li key={v.id} className="py-3">
              <Link href={`/dashboard/videos/${v.id}`} className="flex items-center justify-between hover:underline">
                <div>
                  <p className="font-medium">{v.title}</p>
                  <p className="text-sm text-slate-500">
                    {v.team_name ? `${v.team_name} · ` : ""}
                    {v.event_title ?? "Aucun événement lié"}
                  </p>
                </div>
                <span className="text-sm text-slate-500">
                  {v.clip_count} play{v.clip_count > 1 ? "s" : ""}
                </span>
              </Link>
            </li>
          ))}
          {videos.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">Aucune vidéo pour le moment.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
