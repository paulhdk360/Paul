export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="nr-leg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BEEBFF" />
          <stop offset="55%" stopColor="#29ABE2" />
          <stop offset="100%" stopColor="#0B2E6B" />
        </linearGradient>
      </defs>
      <line x1="14" y1="94" x2="86" y2="94" stroke="#0B2E6B" strokeWidth="5.5" strokeLinecap="round" />
      <line x1="20" y1="92" x2="50" y2="8" stroke="url(#nr-leg)" strokeWidth="7.5" strokeLinecap="round" />
      <line x1="80" y1="92" x2="50" y2="8" stroke="url(#nr-leg)" strokeWidth="7.5" strokeLinecap="round" />
      <line x1="41.4" y1="32" x2="58.6" y2="32" stroke="#29ABE2" strokeWidth="6" strokeLinecap="round" />
      <line x1="32.1" y1="58" x2="67.9" y2="58" stroke="#1477C6" strokeWidth="6" strokeLinecap="round" />
      <circle cx="50" cy="8" r="6.5" fill="#BEEBFF" />
    </svg>
  );
}

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <div className="font-display text-[19px] font-bold tracking-wide text-navy">NORDRIG</div>
    </div>
  );
}
