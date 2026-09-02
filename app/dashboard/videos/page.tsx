import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { STAFF_ROLES } from "@/lib/types";

export default async function VideosPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const supabase = createClient();
  const { data: videos } = await supabase
    .from("videos")
    .select("id, title, created_at, teams(name), calendar_events(title, start_at), video_clips(count)")
    .eq("club_id", activeClub.club_id)
    .order("created_at", { ascending: false });

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
          {videos?.map((v: any) => {
            const clipCount = v.video_clips?.[0]?.count ?? 0;
            return (
              <li key={v.id} className="py-3">
                <Link href={`/dashboard/videos/${v.id}`} className="flex items-center justify-between hover:underline">
                  <div>
                    <p className="font-medium">{v.title}</p>
                    <p className="text-sm text-slate-500">
                      {v.teams?.name ? `${v.teams.name} · ` : ""}
                      {v.calendar_events?.title ?? "Aucun événement lié"}
                    </p>
                  </div>
                  <span className="text-sm text-slate-500">
                    {clipCount} play{clipCount > 1 ? "s" : ""}
                  </span>
                </Link>
              </li>
            );
          })}
          {videos?.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">Aucune vidéo pour le moment.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
