"use client";

import { computeWaypoints, positionAtTime, type RouteSegment } from "@/lib/tactics/route";
import { WIDTH, HEIGHT, screenX, screenY, yardLines } from "@/lib/tactics/field-geometry";

export type OppositionPosition = {
  id: string;
  label: string;
  startX: number;
  startY: number;
  route: RouteSegment[];
  team: "offense" | "defense";
};

const TEAM_STYLE = {
  offense: { fill: "#0ea5e9", path: "#7dd3fc" },
  defense: { fill: "#e11d48", path: "#fda4af" },
} as const;

export function OppositionField({
  positions,
  currentTime,
}: {
  positions: OppositionPosition[];
  currentTime: number;
}) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full rounded-md border border-ink-400 bg-emerald-700"
      role="img"
      aria-label="Terrain avec le jeu d'attaque et le jeu de défense superposés"
    >
      {yardLines().map((y) => (
        <line
          key={y}
          x1={0}
          y1={screenY(y)}
          x2={WIDTH}
          y2={screenY(y)}
          stroke={y === 0 ? "#fef9c3" : "rgba(255,255,255,0.35)"}
          strokeWidth={y === 0 ? 2 : 1}
        />
      ))}

      {positions.map((p) => {
        const side = p.startX <= 0 ? "left" : "right";
        const waypoints = computeWaypoints({ x: p.startX, y: p.startY }, side, p.route);
        const pos = positionAtTime(waypoints, currentTime);
        const style = TEAM_STYLE[p.team];
        const pathD = waypoints.map((wp, i) => `${i === 0 ? "M" : "L"} ${screenX(wp.x)} ${screenY(wp.y)}`).join(" ");

        return (
          <g key={p.id}>
            <path d={pathD} fill="none" stroke={style.path} strokeWidth={2} strokeDasharray="4 4" opacity={0.7} />
            <circle cx={screenX(p.startX)} cy={screenY(p.startY)} r={3} fill="#0f172a" opacity={0.5} />
            <g transform={`translate(${screenX(pos.x)}, ${screenY(pos.y)})`}>
              <circle r={11} fill={style.fill} stroke="white" strokeWidth={2} />
              <text textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={600} fill="white">
                {p.label.slice(0, 3)}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
