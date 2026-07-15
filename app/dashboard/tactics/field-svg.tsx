"use client";

import type { Point, RouteWaypoint } from "@/lib/tactics/route";

const X_MIN = -25;
const X_MAX = 25;
const Y_MIN = -5;
const Y_MAX = 30;
const SCALE = 10; // pixels par yard

const WIDTH = (X_MAX - X_MIN) * SCALE;
const HEIGHT = (Y_MAX - Y_MIN) * SCALE;

function screenX(x: number) {
  return (x - X_MIN) * SCALE;
}

function screenY(y: number) {
  return (Y_MAX - y) * SCALE;
}

export function FieldSvg({
  waypoints,
  playerPosition,
}: {
  waypoints: RouteWaypoint[];
  playerPosition: Point;
}) {
  const yardLines = [];
  for (let y = Math.ceil(Y_MIN / 5) * 5; y <= Y_MAX; y += 5) {
    yardLines.push(y);
  }

  const pathD = waypoints.map((wp, i) => `${i === 0 ? "M" : "L"} ${screenX(wp.x)} ${screenY(wp.y)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full rounded-md border border-slate-300 bg-emerald-700"
      role="img"
      aria-label="Terrain avec la route animée du joueur"
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

      {/* Tracé complet de la route, en pointillés */}
      <path d={pathD} fill="none" stroke="white" strokeWidth={2} strokeDasharray="4 4" opacity={0.8} />

      {/* Position de départ */}
      {waypoints[0] && (
        <circle cx={screenX(waypoints[0].x)} cy={screenY(waypoints[0].y)} r={5} fill="#0f172a" />
      )}

      {/* Joueur animé */}
      <circle cx={screenX(playerPosition.x)} cy={screenY(playerPosition.y)} r={7} fill="#f97316" stroke="white" strokeWidth={2} />
    </svg>
  );
}
