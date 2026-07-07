import type { PointageCode } from "@/lib/types";

const CYCLE: (PointageCode | null)[] = ["MOB", "S", "O", "DEMOB", "FIN", null];

export function nextPointageCode(current: PointageCode | null): PointageCode | null {
  const idx = CYCLE.indexOf(current);
  return CYCLE[(idx + 1) % CYCLE.length];
}

export function dateRange(start: string | null | undefined, end: string | null | undefined, fallbackDays = 92): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = start ? new Date(start) : today;
  const endDate = end ? new Date(end) : new Date(startDate.getTime() + (fallbackDays - 1) * 86400000);

  const dates: string[] = [];
  const cursor = new Date(startDate);
  // Hard cap (~1 year) so a mistaken far-future date can't render an unbounded table.
  let guard = 0;
  while (cursor <= endDate && guard < 366) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }
  return dates;
}

export function fmtDayLabel(iso: string): { dow: string; dm: string } {
  const d = new Date(iso);
  return {
    dow: new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(d),
    dm: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(d),
  };
}

export const POINTAGE_TONE: Record<string, string> = {
  MOB: "bg-blue/20 text-blue",
  S: "bg-warning/20 text-warning",
  O: "bg-success/20 text-success",
  DEMOB: "bg-blue/20 text-blue",
  FIN: "bg-navy/15 text-navy",
};

export function countBillableDays(codes: (PointageCode | undefined)[]): number {
  return codes.filter((c) => c === "S" || c === "O").length;
}
