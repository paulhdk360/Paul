export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="br-needle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF6FA0" />
          <stop offset="100%" stopColor="#C6297E" />
        </linearGradient>
        <linearGradient id="br-ring" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6B76A0" />
          <stop offset="100%" stopColor="#232840" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="37" fill="none" stroke="url(#br-ring)" strokeWidth="7" />
      <line x1="50" y1="6" x2="50" y2="15" stroke="#12141F" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="50" y1="85" x2="50" y2="94" stroke="#12141F" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="6" y1="50" x2="15" y2="50" stroke="#12141F" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="85" y1="50" x2="94" y2="50" stroke="#12141F" strokeWidth="3.5" strokeLinecap="round" />
      <polygon points="50,18 58,50 42,50" fill="url(#br-needle)" />
      <polygon points="50,82 58,50 42,50" fill="#4A5578" />
      <circle cx="50" cy="50" r="7" fill="#12141F" />
    </svg>
  );
}

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <div className="font-display text-[19px] font-bold tracking-wide text-navy">BEARING</div>
    </div>
  );
}
