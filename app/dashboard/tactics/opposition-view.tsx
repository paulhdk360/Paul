"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getFormation } from "@/lib/tactics/formations";
import { computeWaypoints, createSegment, totalDuration } from "@/lib/tactics/route";
import { PLAY_PRESETS, getPlayPreset } from "@/lib/tactics/play-presets";
import { OppositionField, type OppositionPosition } from "./opposition-field";
import { PlaybackControls } from "./playback-controls";
import { PlayCommentary } from "./play-commentary";

const OFFENSE_PRESETS = PLAY_PRESETS.filter((p) => p.phase === "offense");
const DEFENSE_PRESETS = PLAY_PRESETS.filter((p) => p.phase === "defense");

function positionsFromPreset(presetId: string, team: "offense" | "defense"): OppositionPosition[] {
  const preset = getPlayPreset(presetId);
  if (!preset) return [];
  const formation = getFormation(preset.formationId);
  if (!formation) return [];

  return formation.positions.map((p, i) => ({
    id: `${team}-${i}`,
    label: p.label,
    startX: p.startX,
    startY: p.startY,
    route: (preset.positions[i]?.route ?? []).map((s) => createSegment(s)),
    team,
  }));
}

export function OppositionView() {
  const [offenseId, setOffenseId] = useState(OFFENSE_PRESETS[0]?.id ?? "");
  const [defenseId, setDefenseId] = useState(DEFENSE_PRESETS[0]?.id ?? "");

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loop, setLoop] = useState(true);

  const offensePreset = getPlayPreset(offenseId);
  const defensePreset = getPlayPreset(defenseId);

  const positions = useMemo(
    () => [...positionsFromPreset(offenseId, "offense"), ...positionsFromPreset(defenseId, "defense")],
    [offenseId, defenseId]
  );

  const duration = useMemo(() => {
    let max = 0;
    for (const p of positions) {
      const side = p.startX <= 0 ? "left" : "right";
      const waypoints = computeWaypoints({ x: p.startX, y: p.startY }, side, p.route);
      max = Math.max(max, totalDuration(waypoints));
    }
    return max;
  }, [positions]);

  const rafRef = useRef<number>();
  const lastTimestampRef = useRef<number>();

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
  }, [offenseId, defenseId]);

  useEffect(() => {
    if (!playing) {
      lastTimestampRef.current = undefined;
      return;
    }

    const tick = (timestamp: number) => {
      if (lastTimestampRef.current == null) lastTimestampRef.current = timestamp;
      const delta = ((timestamp - lastTimestampRef.current) / 1000) * playbackRate;
      lastTimestampRef.current = timestamp;

      setCurrentTime((prev) => {
        const next = prev + delta;
        if (next >= duration) {
          if (loop) return 0;
          setPlaying(false);
          return duration;
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, playbackRate, loop, duration]);

  return (
    <div className="space-y-4">
      <div className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label text-xs">⚔️ Jeu d&apos;attaque</label>
          <select className="input border-sky-500 bg-sky-500/10 text-white" value={offenseId} onChange={(e) => setOffenseId(e.target.value)}>
            {OFFENSE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {offensePreset && <p className="mt-1 text-xs text-slate-500">{offensePreset.description}</p>}
        </div>
        <div>
          <label className="label text-xs">🛡️ Jeu de défense</label>
          <select className="input border-rose-500 bg-rose-500/10 text-white" value={defenseId} onChange={(e) => setDefenseId(e.target.value)}>
            {DEFENSE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {defensePreset && <p className="mt-1 text-xs text-slate-500">{defensePreset.description}</p>}
        </div>
      </div>

      <OppositionField positions={positions} currentTime={currentTime} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {offensePreset && (
          <PlayCommentary
            name={offensePreset.name}
            concept={offensePreset.concept}
            readKey={offensePreset.readKey}
            commentary={offensePreset.commentary}
            currentTime={currentTime}
            accent="sky"
          />
        )}
        {defensePreset && (
          <PlayCommentary
            name={defensePreset.name}
            concept={defensePreset.concept}
            readKey={defensePreset.readKey}
            commentary={defensePreset.commentary}
            currentTime={currentTime}
            accent="rose"
          />
        )}
      </div>

      <PlaybackControls
        playing={playing}
        onTogglePlay={() => setPlaying((p) => !p)}
        onReset={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
        loop={loop}
        onToggleLoop={setLoop}
        playbackRate={playbackRate}
        onChangeRate={setPlaybackRate}
        currentTime={currentTime}
        duration={duration}
        onScrub={(value) => {
          setPlaying(false);
          setCurrentTime(value);
        }}
      />

      <div className="card flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-sky-500" /> Attaque
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-rose-600" /> Défense
        </span>
        <span className="text-slate-500">
          Vue indicative : les deux jeux sont superposés sur le même terrain à titre d&apos;illustration — l&apos;alignement
          réel dépend du plaquage adverse le jour du match.
        </span>
      </div>
    </div>
  );
}
