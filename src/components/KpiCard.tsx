export function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "accent" | "warn";
}) {
  return (
    <div className="kpi-card relative overflow-hidden rounded-[10px] border border-border bg-bg-card p-[18px] pl-[26px]">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</div>
      <div
        className={`font-mono text-3xl font-semibold ${
          tone === "accent" ? "text-accent-bright" : tone === "warn" ? "text-warning" : "text-text-light"
        }`}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[11.5px] text-text-muted">{sub}</div>}
    </div>
  );
}
