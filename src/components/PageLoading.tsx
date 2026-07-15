export function PageLoading() {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-navy" />
        <div className="text-[12.5px] text-text-muted">Chargement…</div>
      </div>
    </div>
  );
}
