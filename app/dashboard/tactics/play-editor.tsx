"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FORMATIONS, getFormation } from "@/lib/tactics/formations";
import { computeWaypoints, totalDuration, type RouteSegment } from "@/lib/tactics/route";
import { createPlay, updatePlay, type SavePlayInput } from "@/lib/actions/plays";
import { PlayField, type FieldPosition } from "./play-field";
import { PositionEditor } from "./position-editor";
import { PlaybackControls } from "./playback-controls";

type EditablePosition = FieldPosition & { assignment: string };

type ExistingPlay = {
  id: string;
  clubId: string;
  teamId: string | null;
  phase: "offense" | "defense";
  formation: string;
  name: string;
  description: string;
  positions: EditablePosition[];
};

function positionsFromFormation(formationId: string): EditablePosition[] {
  const formation = getFormation(formationId);
  if (!formation) return [];
  return formation.positions.map((p) => ({
    id: crypto.randomUUID(),
    label: p.label,
    startX: p.startX,
    startY: p.startY,
    assignment: "",
    route: [],
  }));
}

export function PlayEditor({
  clubId,
  teams,
  existingPlay,
  canEdit = true,
}: {
  clubId: string;
  teams: { id: string; name: string }[];
  existingPlay?: ExistingPlay;
  canEdit?: boolean;
}) {
  const router = useRouter();

  const [phase, setPhase] = useState<"offense" | "defense">(existingPlay?.phase ?? "offense");
  const [formationId, setFormationId] = useState(existingPlay?.formation ?? FORMATIONS.find((f) => f.phase === "offense")!.id);
  const [positions, setPositions] = useState<EditablePosition[]>(
    existingPlay?.positions ?? positionsFromFormation(formationId)
  );
  const [selectedId, setSelectedId] = useState<string | null>(positions[0]?.id ?? null);

  const [name, setName] = useState(existingPlay?.name ?? "");
  const [description, setDescription] = useState(existingPlay?.description ?? "");
  const [teamId, setTeamId] = useState(existingPlay?.teamId ?? "");

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loop, setLoop] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formationsForPhase = useMemo(() => FORMATIONS.filter((f) => f.phase === phase), [phase]);

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

  function handleFormationChange(newFormationId: string) {
    setFormationId(newFormationId);
    const fresh = positionsFromFormation(newFormationId);
    setPositions(fresh);
    setSelectedId(fresh[0]?.id ?? null);
    setPlaying(false);
    setCurrentTime(0);
  }

  function handlePhaseChange(newPhase: "offense" | "defense") {
    setPhase(newPhase);
    const firstFormation = FORMATIONS.find((f) => f.phase === newPhase)!;
    handleFormationChange(firstFormation.id);
  }

  function updatePosition(id: string, patch: Partial<EditablePosition>) {
    setPositions((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  const selectedPosition = positions.find((p) => p.id === selectedId) ?? null;

  async function handleSave() {
    if (!name.trim()) {
      setError("Le nom du jeu est obligatoire.");
      return;
    }
    setError(null);
    setSaving(true);

    const input: SavePlayInput = {
      clubId,
      teamId: teamId || null,
      phase,
      formation: formationId,
      name,
      description,
      positions: positions.map((p) => ({
        label: p.label,
        startX: p.startX,
        startY: p.startY,
        assignment: p.assignment,
        route: p.route.map(({ id: _id, ...rest }: RouteSegment) => rest),
      })),
    };

    try {
      if (existingPlay) {
        const result = await updatePlay(existingPlay.id, input);
        if (result.error) {
          setError(result.error);
          return;
        }
        router.refresh();
      } else {
        const result = await createPlay(input);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        router.push(`/dashboard/tactics/${result.id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <fieldset disabled={!canEdit} className="card space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Nom du jeu</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Slant droit" />
          </div>
          <div>
            <label className="label">Équipe (optionnel)</label>
            <select className="input" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              <option value="">Tout le club</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {(["offense", "defense"] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={phase === p ? "btn" : "btn-secondary"}
                onClick={() => handlePhaseChange(p)}
              >
                {p === "offense" ? "Attaque" : "Défense"}
              </button>
            ))}
          </div>
          <div>
            <label className="label text-xs">Formation</label>
            <select className="input" value={formationId} onChange={(e) => handleFormationChange(e.target.value)}>
              {formationsForPhase.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500">Changer de formation réinitialise les routes des 11 joueurs.</p>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <PlayField positions={positions} currentTime={currentTime} selectedId={selectedId} onSelect={setSelectedId} />

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

          <div className="card">
            <h2 className="mb-3 text-sm font-medium text-slate-600">Les 11 joueurs — clique pour éditer</h2>
            <div className="flex flex-wrap gap-2">
              {positions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={p.id === selectedId ? "btn text-xs" : "btn-secondary text-xs"}
                  onClick={() => setSelectedId(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {selectedPosition && (
            <PositionEditor
              position={selectedPosition}
              onChange={(patch) => updatePosition(selectedPosition.id, patch)}
              readOnly={!canEdit}
            />
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {canEdit && (
            <button className="btn w-full" type="button" disabled={saving} onClick={handleSave}>
              {saving ? "Enregistrement..." : existingPlay ? "Enregistrer les modifications" : "Créer le jeu"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
