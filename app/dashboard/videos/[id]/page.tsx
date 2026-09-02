import { redirect, notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { STAFF_ROLES } from "@/lib/types";
import { createPlaybackUrl } from "@/lib/r2";
import { VideoTagger } from "./video-tagger";
import { DeleteVideoButton } from "./delete-video-button";

export default async function VideoDetailPage({ params }: { params: { id: string } }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const videoRows = await sql`
    select v.*, t.name as team_name, ce.title as event_title
    from videos v
    left join teams t on t.id = v.team_id
    left join calendar_events ce on ce.id = v.event_id
    where v.id = ${params.id} and v.club_id = ${activeClub.club_id}
    limit 1
  `;
  const video = videoRows[0] as any;

  if (!video) notFound();

  const playbackUrl = await createPlaybackUrl(video.storage_key);

  const clipRows = await sql`
    select * from video_clips where video_id = ${video.id} order by start_seconds asc
  `;

  const clipPlayerRows = await sql`
    select vc.id as clip_id, p.id as player_id, p.first_name, p.last_name
    from video_clips vc
    join video_clip_players vcp on vcp.clip_id = vc.id
    join players p on p.id = vcp.player_id
    where vc.video_id = ${video.id}
  `;

  const playersByClip = new Map<string, { player_id: string; players: { first_name: string; last_name: string } }[]>();
  for (const row of clipPlayerRows as any[]) {
    const list = playersByClip.get(row.clip_id) ?? [];
    list.push({ player_id: row.player_id, players: { first_name: row.first_name, last_name: row.last_name } });
    playersByClip.set(row.clip_id, list);
  }

  const clips = (clipRows as any[]).map((c) => ({
    ...c,
    video_clip_players: playersByClip.get(c.id) ?? [],
  }));

  const players = await sql`
    select id, first_name, last_name from players
    where club_id = ${activeClub.club_id}
    order by last_name
  `;

  const canManage = STAFF_ROLES.includes(activeClub.role);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{video.title}</h1>
          <p className="text-sm text-slate-500">
            {video.team_name ? `${video.team_name} · ` : ""}
            {video.event_title ?? "Aucun événement lié"}
          </p>
        </div>
        {canManage && (
          <DeleteVideoButton videoId={video.id} clubId={activeClub.club_id} storageKey={video.storage_key} />
        )}
      </div>

      <VideoTagger
        videoId={video.id}
        videoUrl={playbackUrl}
        clips={clips as any}
        players={players as any[]}
        canManage={canManage}
      />
    </div>
  );
}
