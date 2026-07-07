export function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-[10px] border border-border bg-bg-card p-4">
      <div className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-text-muted">{label}</div>
      <div className="font-mono text-[24px] font-semibold text-navy">{value}</div>
      {sub && <div className="mt-1 text-[12px] text-text-muted">{sub}</div>}
    </div>
  );
}
