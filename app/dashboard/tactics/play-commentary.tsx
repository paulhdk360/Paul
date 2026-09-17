"use client";

import type { PlayComment } from "@/lib/tactics/play-presets";

const ACCENT_CLASS = {
  gold: "border-gold-500/30 bg-gold-500/5",
  sky: "border-sky-500/30 bg-sky-500/5",
  rose: "border-rose-500/30 bg-rose-500/5",
} as const;

export function PlayCommentary({
  name,
  concept,
  readKey,
  commentary,
  currentTime,
  accent = "gold",
}: {
  name?: string;
  concept: string;
  readKey?: string;
  commentary: PlayComment[];
  currentTime: number;
  accent?: keyof typeof ACCENT_CLASS;
}) {
  const active = [...commentary].reverse().find((c) => currentTime >= c.atSeconds);

  return (
    <div className="card space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        🎓 Pourquoi ce jeu{name ? ` — ${name}` : ""}
      </p>
      <p className="text-sm text-slate-300">{concept}</p>
      {readKey && <p className="text-sm text-sky-300">🔑 Lecture clé : {readKey}</p>}
      <div className={`min-h-[3.5rem] rounded-md border p-3 ${ACCENT_CLASS[accent]}`}>
        <p className="text-sm font-medium text-white">
          {active ? active.text : "Lance la lecture pour suivre les explications en direct."}
        </p>
      </div>
    </div>
  );
}
