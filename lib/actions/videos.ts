"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireClubStaff } from "@/lib/auth-helpers";
import { createUploadUrl, deleteObject } from "@/lib/r2";

export async function getVideoUploadUrl(
  clubId: string,
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; key: string } | { error: string }> {
  try {
    await requireClubStaff(clubId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Accès refusé." };
  }

  const key = `${clubId}/${randomUUID()}-${filename}`;
  const uploadUrl = await createUploadUrl(key, contentType);
  return { uploadUrl, key };
}

export async function createVideoRecord(input: {
  clubId: string;
  teamId: string | null;
  eventId: string | null;
  title: string;
  storageKey: string;
}): Promise<{ id: string } | { error: string }> {
  const userId = await requireClubStaff(input.clubId);

  const rows = await sql`
    insert into videos (club_id, team_id, event_id, title, storage_key, uploaded_by)
    values (${input.clubId}, ${input.teamId}, ${input.eventId}, ${input.title}, ${input.storageKey}, ${userId})
    returning id
  `;
  const video = rows[0] as { id: string } | undefined;
  if (!video) return { error: "Erreur lors de la création de la vidéo." };

  revalidatePath("/dashboard/videos");
  return { id: video.id };
}

export async function deleteVideo(videoId: string, clubId: string, storageKey: string) {
  await requireClubStaff(clubId);

  await deleteObject(storageKey);
  await sql`delete from videos where id = ${videoId}`;

  revalidatePath("/dashboard/videos");
}

export async function createClip(videoId: string, formData: FormData) {
  const videoRows = await sql`select club_id from videos where id = ${videoId} limit 1`;
  const video = videoRows[0] as { club_id: string } | undefined;
  if (!video) throw new Error("Vidéo introuvable.");

  const userId = await requireClubStaff(video.club_id);

  const startSeconds = Number(formData.get("start_seconds"));
  const endSecondsRaw = String(formData.get("end_seconds") ?? "");
  const downRaw = String(formData.get("down") ?? "");
  const distanceRaw = String(formData.get("distance") ?? "");
  const playerIds = formData.getAll("player_ids") as string[];

  const rows = await sql`
    insert into video_clips (video_id, start_seconds, end_seconds, play_type, result, down, distance, notes, created_by)
    values (
      ${videoId},
      ${startSeconds},
      ${endSecondsRaw ? Number(endSecondsRaw) : null},
      ${String(formData.get("play_type") ?? "") || null},
      ${String(formData.get("result") ?? "") || null},
      ${downRaw ? Number(downRaw) : null},
      ${distanceRaw ? Number(distanceRaw) : null},
      ${String(formData.get("notes") ?? "") || null},
      ${userId}
    )
    returning id
  `;
  const clip = rows[0] as { id: string } | undefined;
  if (!clip) throw new Error("Erreur lors de l'ajout du play.");

  for (const playerId of playerIds) {
    await sql`insert into video_clip_players (clip_id, player_id) values (${clip.id}, ${playerId})`;
  }

  revalidatePath(`/dashboard/videos/${videoId}`);
}

export async function deleteClip(clipId: string, videoId: string) {
  const videoRows = await sql`select club_id from videos where id = ${videoId} limit 1`;
  const video = videoRows[0] as { club_id: string } | undefined;
  if (!video) throw new Error("Vidéo introuvable.");
  await requireClubStaff(video.club_id);

  await sql`delete from video_clips where id = ${clipId}`;

  revalidatePath(`/dashboard/videos/${videoId}`);
}
