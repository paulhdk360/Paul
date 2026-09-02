"use client";

export function PlaybackControls({
  playing,
  onTogglePlay,
  onReset,
  loop,
  onToggleLoop,
  playbackRate,
  onChangeRate,
  currentTime,
  duration,
  onScrub,
}: {
  playing: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  loop: boolean;
  onToggleLoop: (value: boolean) => void;
  playbackRate: number;
  onChangeRate: (value: number) => void;
  currentTime: number;
  duration: number;
  onScrub: (value: number) => void;
}) {
  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn" type="button" onClick={onTogglePlay}>
          {playing ? "Pause" : "Lecture"}
        </button>
        <button className="btn-secondary" type="button" onClick={onReset}>
          Retour au début
        </button>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={loop} onChange={(e) => onToggleLoop(e.target.checked)} />
          Boucle
        </label>
        <label className="flex items-center gap-1 text-sm">
          Vitesse
          <select
            className="input w-auto"
            value={playbackRate}
            onChange={(e) => onChangeRate(Number(e.target.value))}
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
          onChange={(e) => onScrub(Number(e.target.value))}
        />
        <p className="text-right text-xs text-slate-500">
          {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
        </p>
      </div>
    </div>
  );
}
