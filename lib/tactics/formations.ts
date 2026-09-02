export type PositionPreset = { label: string; startX: number; startY: number };
export type FormationPreset = {
  id: string;
  name: string;
  phase: "offense" | "defense";
  positions: PositionPreset[];
};

// Ligne offensive standard, partagée par toutes les formations d'attaque.
const OFFENSIVE_LINE: PositionPreset[] = [
  { label: "LT", startX: -4, startY: 0 },
  { label: "LG", startX: -2, startY: 0 },
  { label: "C", startX: 0, startY: 0 },
  { label: "RG", startX: 2, startY: 0 },
  { label: "RT", startX: 4, startY: 0 },
];

export const FORMATIONS: FormationPreset[] = [
  {
    id: "i-formation",
    name: "I-Formation",
    phase: "offense",
    positions: [
      ...OFFENSIVE_LINE,
      { label: "QB", startX: 0, startY: -3 },
      { label: "FB", startX: 0, startY: -6 },
      { label: "RB", startX: 0, startY: -9 },
      { label: "TE", startX: 6, startY: 0 },
      { label: "WR1", startX: -15, startY: 0 },
      { label: "WR2", startX: 15, startY: 0 },
    ],
  },
  {
    id: "shotgun-spread",
    name: "Shotgun Spread",
    phase: "offense",
    positions: [
      ...OFFENSIVE_LINE,
      { label: "QB", startX: 0, startY: -5 },
      { label: "RB", startX: -3, startY: -5 },
      { label: "TE", startX: 9, startY: 0 },
      { label: "WR1", startX: -18, startY: 0 },
      { label: "WR2", startX: -9, startY: 0 },
      { label: "WR3", startX: 18, startY: 0 },
    ],
  },
  {
    id: "singleback",
    name: "Singleback",
    phase: "offense",
    positions: [
      ...OFFENSIVE_LINE,
      { label: "QB", startX: 0, startY: -3 },
      { label: "RB", startX: 0, startY: -6 },
      { label: "TE", startX: 9, startY: 0 },
      { label: "WR1", startX: -15, startY: 0 },
      { label: "WR2", startX: 15, startY: 0 },
      { label: "WR3", startX: -9, startY: 0 },
    ],
  },
  {
    id: "4-3",
    name: "4-3",
    phase: "defense",
    positions: [
      { label: "DE", startX: -6, startY: 2 },
      { label: "DT", startX: -2, startY: 2 },
      { label: "DT", startX: 2, startY: 2 },
      { label: "DE", startX: 6, startY: 2 },
      { label: "LB", startX: -6, startY: 6 },
      { label: "LB", startX: 0, startY: 6 },
      { label: "LB", startX: 6, startY: 6 },
      { label: "CB", startX: -15, startY: 3 },
      { label: "CB", startX: 15, startY: 3 },
      { label: "S", startX: -6, startY: 12 },
      { label: "S", startX: 6, startY: 12 },
    ],
  },
  {
    id: "3-4",
    name: "3-4",
    phase: "defense",
    positions: [
      { label: "DE", startX: -4, startY: 2 },
      { label: "NT", startX: 0, startY: 2 },
      { label: "DE", startX: 4, startY: 2 },
      { label: "LB", startX: -8, startY: 5 },
      { label: "LB", startX: -3, startY: 6 },
      { label: "LB", startX: 3, startY: 6 },
      { label: "LB", startX: 8, startY: 5 },
      { label: "CB", startX: -15, startY: 3 },
      { label: "CB", startX: 15, startY: 3 },
      { label: "S", startX: -6, startY: 12 },
      { label: "S", startX: 6, startY: 12 },
    ],
  },
  {
    id: "nickel",
    name: "Nickel (4-2-5)",
    phase: "defense",
    positions: [
      { label: "DE", startX: -6, startY: 2 },
      { label: "DT", startX: -2, startY: 2 },
      { label: "DT", startX: 2, startY: 2 },
      { label: "DE", startX: 6, startY: 2 },
      { label: "LB", startX: -4, startY: 6 },
      { label: "LB", startX: 4, startY: 6 },
      { label: "CB", startX: -15, startY: 3 },
      { label: "CB", startX: 15, startY: 3 },
      { label: "NB", startX: 9, startY: 3 },
      { label: "S", startX: -6, startY: 12 },
      { label: "S", startX: 6, startY: 12 },
    ],
  },
];

export function getFormation(id: string): FormationPreset | undefined {
  return FORMATIONS.find((f) => f.id === id);
}
