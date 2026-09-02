"use client";

import { createSegment, type BreakDirection, type RouteSegment } from "@/lib/tactics/route";
import type { FieldPosition } from "./play-field";

const BREAK_LABELS: Record<BreakDirection, string> = {
  straight: "Tout droit",
  inside: "Coupe vers l'intérieur",
  outside: "Coupe vers l'extérieur",
};

export function PositionEditor({
  position,
  onChange,
  readOnly = false,
}: {
  position: FieldPosition & { assignment: string };
  onChange: (patch: Partial<FieldPosition & { assignment: string }>) => void;
  readOnly?: boolean;
}) {
  function updateSegment(id: string, patch: Partial<RouteSegment>) {
    onChange({ route: position.route.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  }

  function addSegment() {
    onChange({ route: [...position.route, createSegment()] });
  }

  function removeSegment(id: string) {
    onChange({ route: position.route.filter((s) => s.id !== id) });
  }

  return (
    <fieldset disabled={readOnly} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Joueur sélectionné</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-xs">Poste / nom</label>
          <input className="input" value={position.label} onChange={(e) => onChange({ label: e.target.value })} />
        </div>
        <div>
          <label className="label text-xs">Position de départ (x, y en yards)</label>
          <div className="flex gap-2">
            <input
              className="input"
              type="number"
              value={position.startX}
              onChange={(e) => onChange({ startX: Number(e.target.value) })}
            />
            <input
              className="input"
              type="number"
              value={position.startY}
              onChange={(e) => onChange({ startY: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="label text-xs">Consigne (surtout utile en défense : couverture, zone, blitz...)</label>
        <input
          className="input"
          value={position.assignment}
          onChange={(e) => onChange({ assignment: e.target.value })}
          placeholder="Ex : Couverture homme sur WR1"
        />
      </div>

      <div className="space-y-3">
        <p className="label text-xs">Route (segments)</p>
        {position.route.length === 0 && (
          <p className="text-xs text-slate-500">Aucun déplacement — le joueur reste sur place (ex : ligne offensive).</p>
        )}
        {position.route.map((segment, index) => (
          <div key={segment.id} className="space-y-2 rounded-md border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Segment {index + 1}</span>
              <button
                type="button"
                className="text-xs text-red-600 hover:underline"
                onClick={() => removeSegment(segment.id)}
              >
                Supprimer
              </button>
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
    </fieldset>
  );
}
