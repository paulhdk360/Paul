import Link from "next/link";
import { dateKey, getMonthMatrix, isSameMonth, isToday, MONTH_NAMES } from "@/lib/calendar-utils";

type EventItem = { id: string; title: string; type: string; start_at: string };

function MiniMonth({ year, month, eventDays }: { year: number; month: number; eventDays: Set<string> }) {
  const weeks = getMonthMatrix(year, month);

  return (
    <Link
      href={`/dashboard/calendar?view=month&year=${year}&month=${month + 1}`}
      className="card block space-y-2 transition hover:-translate-y-0.5"
    >
      <p className="text-sm font-semibold text-pitch-800">{MONTH_NAMES[month]}</p>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[10px] text-slate-400">
        {weeks.flat().map((day) => {
          const key = dateKey(day);
          const inMonth = isSameMonth(day, year, month);
          const hasEvents = eventDays.has(key);
          const today = isToday(day);

          if (!inMonth) return <span key={key} />;

          return (
            <span
              key={key}
              className={`relative flex h-5 items-center justify-center ${today ? "font-bold text-pitch-700" : "text-slate-600"}`}
            >
              {day.getDate()}
              {hasEvents && (
                <span className="absolute bottom-0 h-1 w-1 rounded-full bg-amber-500" />
              )}
            </span>
          );
        })}
      </div>
    </Link>
  );
}

export function YearView({ year, events }: { year: number; events: EventItem[] }) {
  const eventDaysByMonth: Set<string>[] = Array.from({ length: 12 }, () => new Set<string>());
  for (const event of events) {
    const date = new Date(event.start_at);
    if (date.getFullYear() !== year) continue;
    eventDaysByMonth[date.getMonth()].add(dateKey(date));
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {MONTH_NAMES.map((_, month) => (
        <MiniMonth key={month} year={year} month={month} eventDays={eventDaysByMonth[month]} />
      ))}
    </div>
  );
}
