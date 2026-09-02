"use client";

import { useRef, useState, useTransition } from "react";
import { createClip, deleteClip } from "@/lib/actions/videos";
import { PLAY_TYPE_OPTIONS } from "@/lib/types";

type Clip = {
  id: string;
  start_seconds: number;
  end_seconds: number | null;
  play_type: string | null;
  result: string | null;
  down: number | null;
  distance: number | null;
  notes: string | null;
  video_clip_players: { player_id: string; players: { first_name: string; last_name: string } | null }[];
};

type Player = { id: string; first_name: string; last_name: string };

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoTagger({
  videoId,
  videoUrl,
  clips,
  players,
  canManage,
}: {
  videoId: string;
  videoUrl: string;
  clips: Clip[];
  players: Player[];
  canManage: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [markStart, setMarkStart] = useState<number | null>(null);
  const [markEnd, setMarkEnd] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  function seekTo(seconds: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full rounded-md border border-slate-300 bg-black"
        />

        {canManage && (
          <div className="card space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setMarkStart(videoRef.current?.currentTime ?? 0)}
              >
                Marquer le début
              </button>
              <span className="text-sm text-slate-500">{markStart != null ? formatTime(markStart) : "—"}</span>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setMarkEnd(videoRef.current?.currentTime ?? 0)}
              >
                Marquer la fin
              </button>
              <span className="text-sm text-slate-500">{markEnd != null ? formatTime(markEnd) : "—"}</span>
            </div>

            <form
              action={async (formData) => {
                setSaving(true);
                try {
                  await createClip(videoId, formData);
                  setMarkStart(null);
                  setMarkEnd(null);
                } finally {
                  setSaving(false);
                }
              }}
              className="space-y-3"
            >
              <input type="hidden" name="start_seconds" value={markStart ?? 0} readOnly />
              <input type="hidden" name="end_seconds" value={markEnd ?? ""} readOnly />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs" htmlFor="play_type">
                    Type de jeu
                  </label>
                  <input className="input" id="play_type" name="play_type" list="play-types" placeholder="Ex : Passe" />
                  <datalist id="play-types">
                    {PLAY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="label text-xs" htmlFor="result">
                    Résultat
                  </label>
                  <input className="input" id="result" name="result" placeholder="Ex : Gain de 8 yards" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs" htmlFor="down">
                    Down
                  </label>
                  <input className="input" id="down" name="down" type="number" min={1} max={4} />
                </div>
                <div>
                  <label className="label text-xs" htmlFor="distance">
                    Distance (yards)
                  </label>
                  <input className="input" id="distance" name="distance" type="number" min={0} />
                </div>
              </div>

              <div>
                <label className="label text-xs" htmlFor="notes">
                  Notes
                </label>
                <textarea className="input" id="notes" name="notes" rows={2} />
              </div>

              <div>
                <p className="label text-xs">Joueurs impliqués</p>
                <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                  {players.map((p) => (
                    <label key={p.id} className="flex items-center gap-1 text-xs">
                      <input type="checkbox" name="player_ids" value={p.id} />
                      {p.first_name} {p.last_name}
                    </label>
                  ))}
                </div>
              </div>

              <button className="btn" type="submit" disabled={saving || markStart == null}>
                {saving ? "Enregistrement..." : "Enregistrer le play"}
              </button>
              {markStart == null && (
                <p className="text-xs text-slate-500">Marquez au moins un début pour pouvoir enregistrer.</p>
              )}
            </form>
          </div>
        )}
      </div>

      <div className="card space-y-2">
        <h2 className="text-lg font-medium">Plays ({clips.length})</h2>
        <ul className="divide-y divide-slate-200">
          {clips.map((clip) => (
            <li key={clip.id} className="py-2">
              <button type="button" onClick={() => seekTo(clip.start_seconds)} className="text-left hover:underline">
                <p className="text-sm font-medium">
                  {formatTime(clip.start_seconds)}
                  {clip.end_seconds != null ? ` – ${formatTime(clip.end_seconds)}` : ""}
                  {clip.play_type ? ` · ${clip.play_type}` : ""}
                </p>
                <p className="text-xs text-slate-500">
                  {[clip.result, clip.down ? `${clip.down}e down` : null, clip.distance ? `${clip.distance} yd` : null]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
                {clip.video_clip_players.length > 0 && (
                  <p className="text-xs text-slate-500">
                    {clip.video_clip_players
                      .map((cp) => (cp.players ? `${cp.players.first_name} ${cp.players.last_name}` : null))
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </button>
              {canManage && (
                <button
                  type="button"
                  className="mt-1 text-xs text-red-600 hover:underline"
                  disabled={isDeleting}
                  onClick={() => startDeleteTransition(() => deleteClip(clip.id, videoId))}
                >
                  Supprimer
                </button>
              )}
            </li>
          ))}
          {clips.length === 0 && <p className="py-4 text-center text-sm text-slate-500">Aucun play tagué.</p>}
        </ul>
      </div>
    </div>
  );
}
