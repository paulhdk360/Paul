import type { PointageCode } from "@/lib/types";

const CYCLE: (PointageCode | null)[] = ["MOB", "S", "O", "DEMOB", "FIN", "LIH", null];

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

// All calendar days for a "YYYY-MM" month string, used by the RH planning grid.
export function monthDateRange(yearMonth: string): string[] {
  const [y, m] = yearMonth.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => `${yearMonth}-${String(i + 1).padStart(2, "0")}`);
}

// The 1st of the current calendar month, as a "YYYY-MM-DD" string — used to
// let a Service Ticket period jump straight to the start of the month
// instead of typing the date out by hand.
export function firstOfCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function shiftMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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
  LIH: "bg-danger/20 text-danger",
};

// A day billed at the Stand-By rate: explicit "S", plus MOB/DEMOB which are
// themselves billed as Stand-By per the Enedril workflow.
export function countBillableDays(codes: (PointageCode | undefined)[]): number {
  return codes.filter((c) => c === "S" || c === "O" || c === "MOB" || c === "DEMOB").length;
}

export function countCodeDays(codes: (PointageCode | undefined)[], code: PointageCode): number {
  return codes.filter((c) => c === code).length;
}

// The first FIN or LIH ends day-counting for that equipment: nothing dated
// on or after it is billed as Stand-By/Operation (the LIH day itself is
// billed separately, once, via the flat Lost-In-Hole charge instead).
function activeBoundary(codes: (PointageCode | undefined)[]): number {
  for (let i = 0; i < codes.length; i++) {
    if (codes[i] === "FIN" || codes[i] === "LIH") return i;
  }
  return codes.length;
}

export interface DayCounts {
  standByDays: number;
  operationDays: number;
  hasOperation: boolean;
  hasLih: boolean;
}

export function computeDayCounts(codes: (PointageCode | undefined)[]): DayCounts {
  const boundary = activeBoundary(codes);
  let standByDays = 0;
  let operationDays = 0;
  for (let i = 0; i < boundary; i++) {
    const c = codes[i];
    if (c === "S" || c === "MOB" || c === "DEMOB") standByDays++;
    else if (c === "O") operationDays++;
  }
  return {
    standByDays,
    operationDays,
    hasOperation: operationDays > 0,
    hasLih: codes.includes("LIH"),
  };
}
