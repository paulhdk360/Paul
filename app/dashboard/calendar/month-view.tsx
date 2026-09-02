import Link from "next/link";
import { dateKey, getMonthMatrix, isSameMonth, isToday, WEEKDAY_LABELS } from "@/lib/calendar-utils";
import { EVENT_TYPE_COLORS } from "@/lib/types";

type EventItem = { id: string; title: string; type: string; start_at: string };

export function MonthView({
  year,
  month,
  events,
}: {
  year: number;
  month: number; // 0-indexé
  events: EventItem[];
}) {
  const weeks = getMonthMatrix(year, month);

  const eventsByDay = new Map<string, EventItem[]>();
  for (const event of events) {
    const key = dateKey(new Date(event.start_at));
    const list = eventsByDay.get(key) ?? [];
    list.push(event);
    eventsByDay.set(key, list);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="grid grid-cols-7 bg-slate-100 text-center text-xs font-semibold text-slate-500">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((day) => {
          const key = dateKey(day);
          const dayEvents = eventsByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, year, month);
          const today = isToday(day);

          return (
            <div
              key={key}
              className={`min-h-[96px] border-b border-r border-slate-100 p-1.5 ${
                inMonth ? "bg-white" : "bg-slate-50"
              }`}
            >
              <span
                className={
                  today
                    ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-pitch-600 text-xs font-semibold text-white"
                    : `text-xs ${inMonth ? "text-slate-700" : "text-slate-300"}`
                }
              >
                {day.getDate()}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <Link
                    key={e.id}
                    href={`/dashboard/calendar/${e.id}`}
                    className={`block truncate rounded px-1 py-0.5 text-[11px] font-medium text-white ${
                      EVENT_TYPE_COLORS[e.type as keyof typeof EVENT_TYPE_COLORS]
                    }`}
                    title={e.title}
                  >
                    {e.title}
                  </Link>
                ))}
                {dayEvents.length > 3 && (
                  <p className="px-1 text-[10px] text-slate-500">+{dayEvents.length - 3} autre(s)</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
