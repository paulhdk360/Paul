"use client";

import { computeWaypoints, positionAtTime, type RouteSegment } from "@/lib/tactics/route";

const X_MIN = -25;
const X_MAX = 25;
const Y_MIN = -12;
const Y_MAX = 30;
const SCALE = 10;

const WIDTH = (X_MAX - X_MIN) * SCALE;
const HEIGHT = (Y_MAX - Y_MIN) * SCALE;

function screenX(x: number) {
  return (x - X_MIN) * SCALE;
}
function screenY(y: number) {
  return (Y_MAX - y) * SCALE;
}

export type FieldPosition = {
  id: string;
  label: string;
  startX: number;
  startY: number;
  route: RouteSegment[];
};

export function PlayField({
  positions,
  currentTime,
  selectedId,
  onSelect,
}: {
  positions: FieldPosition[];
  currentTime: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const yardLines: number[] = [];
  for (let y = Math.ceil(Y_MIN / 5) * 5; y <= Y_MAX; y += 5) {
    yardLines.push(y);
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full rounded-md border border-slate-300 bg-emerald-700"
      role="img"
      aria-label="Terrain avec les 11 joueurs et leurs routes"
    >
      {yardLines.map((y) => (
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
        const isSelected = p.id === selectedId;
        const pathD = waypoints.map((wp, i) => `${i === 0 ? "M" : "L"} ${screenX(wp.x)} ${screenY(wp.y)}`).join(" ");

        return (
          <g key={p.id}>
            <path
              d={pathD}
              fill="none"
              stroke={isSelected ? "#fbbf24" : "white"}
              strokeWidth={isSelected ? 3 : 1.5}
              strokeDasharray="4 4"
              opacity={isSelected ? 1 : 0.6}
            />
            <circle cx={screenX(p.startX)} cy={screenY(p.startY)} r={3} fill="#0f172a" opacity={0.5} />
            <g
              onClick={() => onSelect(p.id)}
              style={{ cursor: "pointer" }}
              transform={`translate(${screenX(pos.x)}, ${screenY(pos.y)})`}
            >
              <circle
                r={11}
                fill={isSelected ? "#f97316" : "#1c7a3e"}
                stroke="white"
                strokeWidth={isSelected ? 3 : 2}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={9}
                fontWeight={600}
                fill="white"
              >
                {p.label.slice(0, 3)}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
