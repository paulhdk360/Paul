"use client";

import { countBillableDays, fmtDayLabel, nextPointageCode, POINTAGE_TONE } from "@/lib/calendar";
import type { PointageCode } from "@/lib/types";

export interface CalendarRow {
  id: string;
  label: string;
  sublabel?: string;
  secondary?: string;
}

const FIRST_COL_WIDTH = 190;
const SECOND_COL_WIDTH = 100;

export function CalendarGrid({
  rows,
  dates,
  pointage,
  onCellClick,
  readOnly,
  secondaryColumnLabel,
}: {
  rows: CalendarRow[];
  dates: string[];
  pointage: Map<string, PointageCode>;
  onCellClick?: (rowId: string, date: string, current: PointageCode | null) => void;
  readOnly?: boolean;
  secondaryColumnLabel?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
      <table className="border-collapse text-[11.5px]">
        <thead>
          <tr>
            <th
              style={{ width: FIRST_COL_WIDTH, minWidth: FIRST_COL_WIDTH }}
              className="sticky left-0 z-10 border-b border-r border-border bg-bg-sunken px-3 py-2 text-left text-[10.5px] font-semibold uppercase text-text-muted"
            >
              Équipement / Personnel
            </th>
            {secondaryColumnLabel && (
              <th
                style={{ left: FIRST_COL_WIDTH, width: SECOND_COL_WIDTH, minWidth: SECOND_COL_WIDTH }}
                className="sticky z-10 border-b border-r border-border bg-bg-sunken px-3 py-2 text-left text-[10.5px] font-semibold uppercase text-text-muted"
              >
                {secondaryColumnLabel}
              </th>
            )}
            {dates.map((d) => {
              const { dow, dm } = fmtDayLabel(d);
              return (
                <th key={d} className="min-w-[38px] border-b border-border bg-bg-sunken px-1 py-1.5 text-center text-[10px] font-medium text-text-muted">
                  <div>{dow}</div>
                  <div>{dm}</div>
                </th>
              );
            })}
            <th className="border-b border-border bg-bg-sunken px-3 py-2 text-center text-[10.5px] font-semibold uppercase text-text-muted">
              Jours
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowCodes = dates.map((d) => pointage.get(`${row.id}:${d}`));
            const firstActive = rowCodes.findIndex((c) => c === "MOB" || c === "S" || c === "O");
            const endIndex = rowCodes.findIndex((c) => c === "FIN" || c === "LIH");
            const lastActive = endIndex >= 0 ? endIndex : rowCodes.length - 1;

            return (
              <tr key={row.id}>
                <td
                  style={{ width: FIRST_COL_WIDTH, minWidth: FIRST_COL_WIDTH }}
                  className="sticky left-0 z-10 border-b border-r border-border bg-white px-3 py-1.5 text-[12px] font-medium"
                >
                  <div>{row.label}</div>
                  {row.sublabel && <div className="text-[10.5px] font-normal text-text-muted">{row.sublabel}</div>}
                </td>
                {secondaryColumnLabel && (
                  <td
                    style={{ left: FIRST_COL_WIDTH, width: SECOND_COL_WIDTH, minWidth: SECOND_COL_WIDTH }}
                    className="sticky z-10 border-b border-r border-border bg-white px-3 py-1.5 text-[12px] text-text-muted"
                  >
                    {row.secondary || "—"}
                  </td>
                )}
                {dates.map((d, i) => {
                  const code = pointage.get(`${row.id}:${d}`) ?? null;
                  const outside = firstActive >= 0 && (i < firstActive || i > lastActive);
                  return (
                    <td key={d} className={`border-b border-border p-0.5 text-center ${outside ? "bg-bg-sunken/70" : ""}`}>
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => onCellClick?.(row.id, d, code)}
                        className={`h-6 w-8 rounded text-[10.5px] font-semibold ${
                          code ? POINTAGE_TONE[code] : "text-transparent hover:bg-bg-sunken hover:text-text-muted"
                        } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                        title={code ?? "Vide"}
                      >
                        {code ?? "·"}
                      </button>
                    </td>
                  );
                })}
                <td className="border-b border-border px-3 py-1.5 text-center font-mono font-semibold text-navy">
                  {countBillableDays(rowCodes)}
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={dates.length + 2 + (secondaryColumnLabel ? 1 : 0)} className="p-6 text-center text-text-muted">
                Aucune ligne à afficher.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export { nextPointageCode };
