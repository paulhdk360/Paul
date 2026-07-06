export function BoreholeSvg({ fillPct }: { fillPct: number }) {
  const w = 70,
    h = 190,
    tubeX = 22,
    tubeW = 26;
  const fillH = Math.round((fillPct / 100) * h);
  const nTicks = 6;
  const ticks = Array.from({ length: nTicks + 1 }, (_, i) => {
    const y = 8 + (h - 16) * (i / nTicks);
    return <line key={i} x1={tubeX - 6} y1={y} x2={tubeX} y2={y} stroke="#84AFA6" strokeWidth={1.4} />;
  });

  return (
    <svg width={w} height={h + 14} viewBox={`0 0 ${w} ${h + 14}`} xmlns="http://www.w3.org/2000/svg">
      <rect x={tubeX} y={8} width={tubeW} height={h} rx={6} fill="none" stroke="#28504A" strokeWidth={2} />
      <rect x={tubeX} y={8 + h - fillH} width={tubeW} height={fillH} rx={6} fill="url(#gradFill)" />
      {ticks}
      <defs>
        <linearGradient id="gradFill" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#1FA98A" />
          <stop offset="100%" stopColor="#8FE0C4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function BarChartSvg({ counts, labels, maxCount }: { counts: number[]; labels: string[]; maxCount: number }) {
  const w = 420,
    h = 200,
    padB = 26,
    padT = 10,
    barGap = 8;
  const barW = (w - 20) / counts.length - barGap;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
      {counts.map((c, i) => {
        const bh = c > 0 ? Math.max(4, Math.round(((h - padB - padT) * c) / maxCount)) : 2;
        const x = 10 + i * ((w - 20) / counts.length);
        const y = h - padB - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx={4} fill={c > 0 ? "#1FA98A" : "#28504A"} />
            <text
              x={x + barW / 2}
              y={h - 8}
              fontSize={10}
              fill="#84AFA6"
              textAnchor="middle"
              fontFamily="IBM Plex Mono, monospace"
            >
              {labels[i]}
            </text>
            {c > 0 && (
              <text
                x={x + barW / 2}
                y={y - 5}
                fontSize={10.5}
                fill="#8FE0C4"
                textAnchor="middle"
                fontFamily="IBM Plex Mono, monospace"
              >
                {c}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function StatMini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-bg px-3.5 py-3">
      <div className="mb-1 text-[11px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className="font-mono text-lg font-semibold text-accent-bright">{value}</div>
    </div>
  );
}
