import type { BreakDirection } from "./route";

export type RouteTreeSegment = {
  distanceYards: number;
  break: BreakDirection;
  breakAngleDeg: number;
};

export type RouteTreePreset = {
  id: string;
  name: string;
  segments: RouteTreeSegment[];
};

// Route tree classique du football américain. Les distances/angles sont des
// valeurs de départ raisonnables, modifiables ensuite comme n'importe quel
// segment personnalisé.
export const ROUTE_TREE: RouteTreePreset[] = [
  {
    id: "slant",
    name: "Slant",
    segments: [
      { distanceYards: 3, break: "straight", breakAngleDeg: 0 },
      { distanceYards: 8, break: "inside", breakAngleDeg: 45 },
    ],
  },
  {
    id: "out",
    name: "Out",
    segments: [
      { distanceYards: 10, break: "straight", breakAngleDeg: 0 },
      { distanceYards: 5, break: "outside", breakAngleDeg: 90 },
    ],
  },
  {
    id: "in",
    name: "In (Dig)",
    segments: [
      { distanceYards: 12, break: "straight", breakAngleDeg: 0 },
      { distanceYards: 8, break: "inside", breakAngleDeg: 90 },
    ],
  },
  {
    id: "post",
    name: "Post",
    segments: [
      { distanceYards: 12, break: "straight", breakAngleDeg: 0 },
      { distanceYards: 15, break: "inside", breakAngleDeg: 45 },
    ],
  },
  {
    id: "corner",
    name: "Corner",
    segments: [
      { distanceYards: 12, break: "straight", breakAngleDeg: 0 },
      { distanceYards: 10, break: "outside", breakAngleDeg: 45 },
    ],
  },
  {
    id: "go",
    name: "Go / Fly",
    segments: [{ distanceYards: 35, break: "straight", breakAngleDeg: 0 }],
  },
  {
    id: "curl",
    name: "Curl",
    segments: [
      { distanceYards: 9, break: "straight", breakAngleDeg: 0 },
      { distanceYards: 3, break: "inside", breakAngleDeg: 150 },
    ],
  },
  {
    id: "comeback",
    name: "Comeback",
    segments: [
      { distanceYards: 13, break: "straight", breakAngleDeg: 0 },
      { distanceYards: 4, break: "outside", breakAngleDeg: 150 },
    ],
  },
  {
    id: "screen",
    name: "Screen",
    segments: [
      { distanceYards: 1, break: "outside", breakAngleDeg: 90 },
      { distanceYards: 3, break: "straight", breakAngleDeg: 0 },
    ],
  },
  {
    id: "wheel",
    name: "Wheel",
    segments: [
      { distanceYards: 3, break: "outside", breakAngleDeg: 90 },
      { distanceYards: 15, break: "inside", breakAngleDeg: 90 },
    ],
  },
];
