"use client";

import type { FormationPreset } from "@/lib/tactics/formations";

const X_MIN = -25;
const X_MAX = 25;
const Y_MIN = -12;
const Y_MAX = 16;
const WIDTH = 200;
const HEIGHT = ((Y_MAX - Y_MIN) / (X_MAX - X_MIN)) * WIDTH;

function screenX(x: number) {
  return ((x - X_MIN) / (X_MAX - X_MIN)) * WIDTH;
}
function screenY(y: number) {
  return ((Y_MAX - y) / (Y_MAX - Y_MIN)) * HEIGHT;
}

function MiniFieldPreview({ formation }: { formation: FormationPreset }) {
  const dotColor = formation.phase === "offense" ? "#4bb163" : "#ef4444";

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full rounded bg-emerald-900/60">
      <line x1={0} y1={screenY(0)} x2={WIDTH} y2={screenY(0)} stroke="#fbbf24" strokeWidth={1} opacity={0.6} />
      {formation.positions.map((p, i) => (
        <circle key={i} cx={screenX(p.startX)} cy={screenY(p.startY)} r={4.5} fill={dotColor} stroke="#0b0f14" strokeWidth={1} />
      ))}
    </svg>
  );
}

export function FormationCard({
  formation,
  selected,
  onSelect,
}: {
  formation: FormationPreset;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-lg border p-2 text-left transition ${
        selected
          ? "border-gold-500 bg-gold-500/10 shadow-lg shadow-gold-900/30"
          : "border-ink-500 bg-ink-800 hover:border-ink-400"
      }`}
    >
      <MiniFieldPreview formation={formation} />
      <p className={`mt-2 truncate text-sm font-semibold ${selected ? "text-gold-400" : "text-slate-200"}`}>
        {formation.name}
      </p>
    </button>
  );
}
