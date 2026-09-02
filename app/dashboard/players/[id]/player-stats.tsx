import { STAT_FIELDS } from "@/lib/stats";

export function PlayerStats({
  attendance,
  injuryCount,
  matchesCount,
  seasonStats,
}: {
  attendance: { presentCount: number; totalCount: number };
  injuryCount: number;
  matchesCount: number;
  seasonStats: Record<string, number>;
}) {
  const attendanceRate =
    attendance.totalCount > 0 ? Math.round((attendance.presentCount / attendance.totalCount) * 100) : null;

  const nonZeroStats = STAT_FIELDS.filter((f) => (seasonStats[f.key] ?? 0) !== 0);

  return (
    <div className="card space-y-4">
      <h2 className="text-lg font-medium">📊 Statistiques</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-emerald-50 p-3 text-center">
          <p className="text-2xl font-semibold text-emerald-700">{attendanceRate != null ? `${attendanceRate}%` : "—"}</p>
          <p className="text-xs text-slate-500">
            Taux de présence {attendance.totalCount > 0 ? `(${attendance.presentCount}/${attendance.totalCount})` : ""}
          </p>
        </div>
        <div className="rounded-lg bg-red-50 p-3 text-center">
          <p className="text-2xl font-semibold text-red-700">{injuryCount}</p>
          <p className="text-xs text-slate-500">Blessure(s) signalée(s)</p>
        </div>
        <div className="rounded-lg bg-sky-50 p-3 text-center">
          <p className="text-2xl font-semibold text-sky-700">{matchesCount}</p>
          <p className="text-xs text-slate-500">Match(s) avec statistiques</p>
        </div>
      </div>

      {nonZeroStats.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-slate-600">Totaux saison</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {nonZeroStats.map((f) => (
              <div key={f.key} className="rounded-lg border border-slate-200 p-2 text-center">
                <p className="text-lg font-semibold">{seasonStats[f.key]}</p>
                <p className="text-[11px] text-slate-500">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {nonZeroStats.length === 0 && (
        <p className="text-sm text-slate-500">Aucune statistique de match enregistrée pour l'instant.</p>
      )}
    </div>
  );
}
