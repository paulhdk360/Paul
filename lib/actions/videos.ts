"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createVideoRecord(input: {
  clubId: string;
  teamId: string | null;
  eventId: string | null;
  title: string;
  storagePath: string;
}): Promise<{ id: string } | { error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("videos")
    .insert({
      club_id: input.clubId,
      team_id: input.teamId,
      event_id: input.eventId,
      title: input.title,
      storage_path: input.storagePath,
      uploaded_by: user?.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Erreur lors de la création de la vidéo." };
  }

  revalidatePath("/dashboard/videos");
  return { id: data.id };
}

export async function deleteVideo(videoId: string, storagePath: string) {
  const supabase = createClient();

  await supabase.storage.from("videos").remove([storagePath]);

  const { error } = await supabase.from("videos").delete().eq("id", videoId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/videos");
}

export async function createClip(videoId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const startSeconds = Number(formData.get("start_seconds"));
  const endSecondsRaw = String(formData.get("end_seconds") ?? "");
  const downRaw = String(formData.get("down") ?? "");
  const distanceRaw = String(formData.get("distance") ?? "");
  const playerIds = formData.getAll("player_ids") as string[];

  const { data: clip, error } = await supabase
    .from("video_clips")
    .insert({
      video_id: videoId,
      start_seconds: startSeconds,
      end_seconds: endSecondsRaw ? Number(endSecondsRaw) : null,
      play_type: String(formData.get("play_type") ?? "") || null,
      result: String(formData.get("result") ?? "") || null,
      down: downRaw ? Number(downRaw) : null,
      distance: distanceRaw ? Number(distanceRaw) : null,
      notes: String(formData.get("notes") ?? "") || null,
      created_by: user?.id,
    })
    .select("id")
    .single();

  if (error || !clip) throw new Error(error?.message ?? "Erreur lors de l'ajout du play.");

  if (playerIds.length > 0) {
    const rows = playerIds.map((playerId) => ({ clip_id: clip.id, player_id: playerId }));
    const { error: playersError } = await supabase.from("video_clip_players").insert(rows);
    if (playersError) throw new Error(playersError.message);
  }

  revalidatePath(`/dashboard/videos/${videoId}`);
}

export async function deleteClip(clipId: string, videoId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("video_clips").delete().eq("id", clipId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/videos/${videoId}`);
}
