import {
  DRILL_CATEGORY_COLORS,
  DRILL_CATEGORY_LABELS,
  DRILL_CATEGORY_ORDER,
  DRILL_CATEGORY_SOLID_COLORS,
  type DrillCategory,
} from "@/lib/drills";

type Drill = {
  id: string;
  title: string;
  duration_minutes: number | null;
  category: DrillCategory;
};

function formatOffset(startAt: string, offsetMinutes: number) {
  const date = new Date(new Date(startAt).getTime() + offsetMinutes * 60000);
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function TrainingTimeline({ startAt, drills }: { startAt: string; drills: Drill[] }) {
  const lanes = DRILL_CATEGORY_ORDER.map((category) => {
    let offset = 0;
    const blocks = drills
      .filter((d) => d.category === category)
      .map((d) => {
        const duration = d.duration_minutes ?? 10;
        const block = { drill: d, start: offset, duration };
        offset += duration;
        return block;
      });
    return { category, blocks, total: offset };
  }).filter((lane) => lane.blocks.length > 0);

  if (lanes.length === 0) return null;

  const maxMinutes = Math.max(60, ...lanes.map((l) => l.total));

  return (
    <div className="space-y-2 overflow-x-auto">
      <p className="text-xs text-slate-500">
        Timeline indicative (les pistes tournent en parallèle : ex. attaque et défense travaillent en même temps sur
        des groupes différents).
      </p>
      <div className="min-w-[600px] space-y-2">
        {lanes.map((lane) => (
          <div key={lane.category} className="flex items-center gap-2">
            <span className={`w-28 shrink-0 badge ${DRILL_CATEGORY_COLORS[lane.category]}`}>
              {DRILL_CATEGORY_LABELS[lane.category]}
            </span>
            <div className="relative h-9 flex-1 rounded bg-slate-100">
              {lane.blocks.map((block) => (
                <div
                  key={block.drill.id}
                  className={`absolute top-0.5 h-8 truncate rounded px-1.5 text-[11px] font-medium leading-8 text-white ${DRILL_CATEGORY_SOLID_COLORS[lane.category]}`}
                  style={{
                    left: `${(block.start / maxMinutes) * 100}%`,
                    width: `${(block.duration / maxMinutes) * 100}%`,
                  }}
                  title={`${block.drill.title} (${formatOffset(startAt, block.start)} - ${formatOffset(startAt, block.start + block.duration)})`}
                >
                  {block.drill.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
