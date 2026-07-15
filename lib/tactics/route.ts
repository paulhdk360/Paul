// Modélisation d'une route de joueur pour l'animation tactique (§16.4).
// Le terrain est représenté en yards : x = latéral (positif vers la droite),
// y = profondeur vers l'avant (positif = vers l'en-but adverse).

export type BreakDirection = "straight" | "inside" | "outside";

export type RouteSegment = {
  id: string;
  distanceYards: number;
  break: BreakDirection;
  breakAngleDeg: number; // ignoré si break === "straight"
  speedYardsPerSecond: number;
};

export type Point = { x: number; y: number };

export type RouteWaypoint = Point & {
  /** Temps cumulé (secondes) depuis le début du jeu pour atteindre ce point. */
  t: number;
};

export function createSegment(overrides: Partial<RouteSegment> = {}): RouteSegment {
  return {
    id: crypto.randomUUID(),
    distanceYards: 5,
    break: "straight",
    breakAngleDeg: 45,
    speedYardsPerSecond: 7,
    ...overrides,
  };
}

/**
 * Calcule les points de passage d'une route à partir d'une position de départ,
 * d'un côté d'alignement (gauche/droite du centre du snap) et d'une suite de
 * segments. "inside" tourne toujours vers le centre du terrain, "outside"
 * s'en éloigne, quel que soit le côté d'alignement.
 */
export function computeWaypoints(
  start: Point,
  side: "left" | "right",
  segments: RouteSegment[]
): RouteWaypoint[] {
  let heading = 0; // degrés depuis l'axe "tout droit vers l'avant", positif = vers la droite
  let position = { ...start };
  let t = 0;

  const waypoints: RouteWaypoint[] = [{ ...position, t: 0 }];

  for (const segment of segments) {
    if (segment.break !== "straight") {
      const sign = side === "left" ? 1 : -1; // vers le centre du terrain
      const turn = segment.break === "inside" ? sign : -sign;
      heading += turn * segment.breakAngleDeg;
    }

    const rad = (heading * Math.PI) / 180;
    position = {
      x: position.x + segment.distanceYards * Math.sin(rad),
      y: position.y + segment.distanceYards * Math.cos(rad),
    };
    t += segment.distanceYards / Math.max(segment.speedYardsPerSecond, 0.1);

    waypoints.push({ ...position, t });
  }

  return waypoints;
}

export function totalDuration(waypoints: RouteWaypoint[]): number {
  return waypoints[waypoints.length - 1]?.t ?? 0;
}

/** Interpole la position du joueur le long de la route au temps t (secondes). */
export function positionAtTime(waypoints: RouteWaypoint[], t: number): Point {
  if (waypoints.length === 0) return { x: 0, y: 0 };
  if (t <= waypoints[0].t) return waypoints[0];
  const last = waypoints[waypoints.length - 1];
  if (t >= last.t) return last;

  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const next = waypoints[i];
    if (t <= next.t) {
      const span = next.t - prev.t;
      const ratio = span === 0 ? 0 : (t - prev.t) / span;
      return {
        x: prev.x + (next.x - prev.x) * ratio,
        y: prev.y + (next.y - prev.y) * ratio,
      };
    }
  }

  return last;
}
