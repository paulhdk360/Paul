export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="edl-g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0B2E6B" />
          <stop offset="100%" stopColor="#1477C6" />
        </linearGradient>
      </defs>
      <path d="M50 6 L50 50 L88 28 A46 46 0 0 0 50 6 Z" fill="#0B2E6B" />
      <path d="M50 50 L88 28 A46 46 0 0 1 82 78 Z" fill="#1477C6" />
      <path d="M50 50 L82 78 A46 46 0 0 1 14 66 Z" fill="#29ABE2" />
      <path d="M50 50 L14 66 A46 46 0 0 1 50 6 Z" fill="#5FC3EC" />
    </svg>
  );
}

export function Logo({ size = 34, withTagline = true }: { size?: number; withTagline?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <div className="leading-tight">
        <div className="font-display text-[19px] font-bold tracking-wide text-navy">ENEDRIL</div>
        {withTagline && (
          <div className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            Fishing &amp; Drilling Solutions
          </div>
        )}
      </div>
    </div>
  );
}
