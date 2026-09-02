import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { STAFF_ROLES } from "@/lib/types";
import { VideoTagger } from "./video-tagger";
import { DeleteVideoButton } from "./delete-video-button";

export default async function VideoDetailPage({ params }: { params: { id: string } }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const supabase = createClient();
  const { data: video } = await supabase
    .from("videos")
    .select("*, teams(name), calendar_events(title, start_at)")
    .eq("id", params.id)
    .eq("club_id", activeClub.club_id)
    .single();

  if (!video) notFound();

  const { data: signedUrlData } = await supabase.storage
    .from("videos")
    .createSignedUrl(video.storage_path, 60 * 60);

  const { data: clips } = await supabase
    .from("video_clips")
    .select("*, video_clip_players(player_id, players(first_name, last_name))")
    .eq("video_id", video.id)
    .order("start_seconds", { ascending: true });

  const { data: players } = await supabase
    .from("players")
    .select("id, first_name, last_name")
    .eq("club_id", activeClub.club_id)
    .order("last_name");

  const canManage = STAFF_ROLES.includes(activeClub.role);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{video.title}</h1>
          <p className="text-sm text-slate-500">
            {video.teams?.name ? `${video.teams.name} · ` : ""}
            {video.calendar_events?.title ?? "Aucun événement lié"}
          </p>
        </div>
        {canManage && <DeleteVideoButton videoId={video.id} storagePath={video.storage_path} />}
      </div>

      {signedUrlData?.signedUrl ? (
        <VideoTagger
          videoId={video.id}
          videoUrl={signedUrlData.signedUrl}
          clips={(clips as any) ?? []}
          players={players ?? []}
          canManage={canManage}
        />
      ) : (
        <p className="card text-sm text-red-600">Impossible de charger la vidéo.</p>
      )}
    </div>
  );
}
