"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  computeWaypoints,
  createSegment,
  positionAtTime,
  totalDuration,
  type BreakDirection,
  type RouteSegment,
} from "@/lib/tactics/route";
import { FieldSvg } from "./field-svg";

const BREAK_LABELS: Record<BreakDirection, string> = {
  straight: "Tout droit",
  inside: "Coupe vers l'intérieur",
  outside: "Coupe vers l'extérieur",
};

const DEFAULT_SEGMENTS: RouteSegment[] = [
  { id: "seg-1", distanceYards: 5, break: "straight", breakAngleDeg: 45, speedYardsPerSecond: 7 },
  { id: "seg-2", distanceYards: 10, break: "inside", breakAngleDeg: 45, speedYardsPerSecond: 7 },
];

export function RouteAnimator() {
  const [startX, setStartX] = useState(-18);
  const [segments, setSegments] = useState<RouteSegment[]>(DEFAULT_SEGMENTS);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loop, setLoop] = useState(true);

  const side = startX <= 0 ? "left" : "right";
  const waypoints = useMemo(
    () => computeWaypoints({ x: startX, y: 0 }, side, segments),
    [startX, side, segments]
  );
  const duration = totalDuration(waypoints);

  const rafRef = useRef<number>();
  const lastTimestampRef = useRef<number>();

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

  const playerPosition = positionAtTime(waypoints, currentTime);

  function updateSegment(id: string, patch: Partial<RouteSegment>) {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function addSegment() {
    setSegments((prev) => [...prev, createSegment()]);
  }

  function removeSegment(id: string) {
    setSegments((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <FieldSvg waypoints={waypoints} playerPosition={playerPosition} />

        <div className="card space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn" type="button" onClick={() => setPlaying((p) => !p)}>
              {playing ? "Pause" : "Lecture"}
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                setPlaying(false);
                setCurrentTime(0);
              }}
            >
              Retour au début
            </button>
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
              Boucle
            </label>
            <label className="flex items-center gap-1 text-sm">
              Vitesse
              <select
                className="input w-auto"
                value={playbackRate}
                onChange={(e) => setPlaybackRate(Number(e.target.value))}
              >
                <option value={0.25}>x0.25</option>
                <option value={0.5}>x0.5</option>
                <option value={1}>x1</option>
                <option value={2}>x2</option>
              </select>
            </label>
          </div>

          <div>
            <input
              className="w-full"
              type="range"
              min={0}
              max={duration}
              step={0.01}
              value={Math.min(currentTime, duration)}
              onChange={(e) => {
                setPlaying(false);
                setCurrentTime(Number(e.target.value));
              }}
            />
            <p className="text-right text-xs text-slate-500">
              {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
            </p>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label" htmlFor="startX">
            Position latérale de départ (yards, négatif = côté gauche)
          </label>
          <input
            className="input"
            id="startX"
            type="number"
            value={startX}
            onChange={(e) => setStartX(Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-slate-500">
            Côté détecté : {side === "left" ? "gauche" : "droite"} — &quot;intérieur&quot; tournera donc vers le
            centre du terrain.
          </p>
        </div>

        <div className="space-y-3">
          <p className="label">Segments de la route</p>
          {segments.map((segment, index) => (
            <div key={segment.id} className="space-y-2 rounded-md border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Segment {index + 1}</span>
                {segments.length > 1 && (
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => removeSegment(segment.id)}
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label text-xs">Distance (yards)</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={segment.distanceYards}
                    onChange={(e) => updateSegment(segment.id, { distanceYards: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="label text-xs">Vitesse (yd/s)</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={segment.speedYardsPerSecond}
                    onChange={(e) => updateSegment(segment.id, { speedYardsPerSecond: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label text-xs">Direction</label>
                  <select
                    className="input"
                    value={segment.break}
                    onChange={(e) => updateSegment(segment.id, { break: e.target.value as BreakDirection })}
                  >
                    {Object.entries(BREAK_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Angle (degrés)</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={180}
                    disabled={segment.break === "straight"}
                    value={segment.breakAngleDeg}
                    onChange={(e) => updateSegment(segment.id, { breakAngleDeg: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          ))}

          <button className="btn-secondary" type="button" onClick={addSegment}>
            Ajouter un segment
          </button>
        </div>
      </div>
    </div>
  );
}
