import type { BreakDirection } from "./route";

export type PresetSegment = {
  distanceYards: number;
  break: BreakDirection;
  breakAngleDeg: number;
  speedYardsPerSecond: number;
};

export type PresetPosition = { route: PresetSegment[]; assignment: string };

export type PlayPreset = {
  id: string;
  name: string;
  phase: "offense" | "defense";
  formationId: string;
  description: string;
  // Même ordre que `positions` de la formation correspondante (lib/tactics/formations.ts).
  positions: PresetPosition[];
};

function seg(distanceYards: number, breakDir: BreakDirection = "straight", breakAngleDeg = 45): PresetSegment {
  return { distanceYards, break: breakDir, breakAngleDeg, speedYardsPerSecond: 7 };
}

const BLOCK: PresetPosition = { route: [], assignment: "Bloc de passe" };
const RUN_BLOCK: PresetPosition = { route: [], assignment: "Bloc de zone, pousse vers la droite" };
// Segment de 180° : quelle que soit la valeur inside/outside, ramène le
// joueur droit vers la ligne de mêlée — utile pour modéliser un rush/blitz
// défensif dans notre système de coordonnées (0° = s'éloigne de sa propre
// ligne de départ).
const RUSH = (distance: number, note: string): PresetPosition => ({
  route: [seg(distance, "inside", 180)],
  assignment: note,
});

export const PLAY_PRESETS: PlayPreset[] = [
  {
    id: "slants-jumeaux",
    name: "Slants jumeaux",
    phase: "offense",
    formationId: "singleback",
    description: "Passe rapide — les deux receveurs extérieurs cassent en slant, TE en soutien intérieur.",
    positions: [
      BLOCK,
      BLOCK,
      BLOCK,
      BLOCK,
      BLOCK,
      { route: [], assignment: "Drop 3 pas, lecture rapide des slants" },
      { route: [seg(3, "straight")], assignment: "Passe-protection puis check-down" },
      { route: [seg(2, "straight"), seg(8, "inside", 80)], assignment: "Drag intérieur" },
      { route: [seg(3, "straight"), seg(8, "inside", 45)], assignment: "Slant" },
      { route: [seg(3, "straight"), seg(8, "inside", 45)], assignment: "Slant" },
      { route: [seg(5, "straight")], assignment: "Bloc extérieur (leurre)" },
    ],
  },
  {
    id: "four-verticals",
    name: "Four Verticals",
    phase: "offense",
    formationId: "shotgun-spread",
    description: "Passe profonde — les 3 receveurs et le TE partent tous en Go, étirent la défense en profondeur.",
    positions: [
      BLOCK,
      BLOCK,
      BLOCK,
      BLOCK,
      BLOCK,
      { route: [], assignment: "Drop 5 pas, lecture profonde milieu → extérieur" },
      { route: [seg(3, "straight")], assignment: "Passe-protection, release tardif en check-down" },
      { route: [seg(30, "straight")], assignment: "Route verticale (seam)" },
      { route: [seg(35, "straight")], assignment: "Go / Fly" },
      { route: [seg(35, "straight")], assignment: "Go / Fly" },
      { route: [seg(35, "straight")], assignment: "Go / Fly" },
    ],
  },
  {
    id: "power-droite",
    name: "Power droite",
    phase: "offense",
    formationId: "i-formation",
    description: "Jeu de course — FB en lead block, RB vise le trou entre RT et TE.",
    positions: [
      RUN_BLOCK,
      RUN_BLOCK,
      RUN_BLOCK,
      RUN_BLOCK,
      RUN_BLOCK,
      { route: [], assignment: "Poignée avec le RB (fake si besoin)" },
      { route: [seg(3, "straight")], assignment: "Lead block sur le linebacker" },
      { route: [seg(2, "straight"), seg(6, "outside", 20)], assignment: "Course, vise le trou entre RT et TE" },
      { route: [], assignment: "Bloc scellé sur le DE" },
      { route: [], assignment: "Bloc stalk sur le CB" },
      { route: [], assignment: "Bloc stalk sur le CB" },
    ],
  },
  {
    id: "cover-2-zone",
    name: "Cover 2 Zone",
    phase: "defense",
    formationId: "4-3",
    description: "Zone classique — 2 safeties se partagent la profondeur, corners et linebackers couvrent en dessous.",
    positions: [
      RUSH(6, "Contain extérieur, pression sur le QB"),
      RUSH(4, "Pénétration intérieure"),
      RUSH(4, "Pénétration intérieure"),
      RUSH(6, "Contain extérieur, pression sur le QB"),
      { route: [seg(4, "outside", 90)], assignment: "Zone sous, couvre le hook/curl" },
      { route: [seg(3, "inside", 180)], assignment: "Zone sous, couvre le milieu" },
      { route: [seg(4, "inside", 90)], assignment: "Zone sous, couvre le hook/curl" },
      { route: [seg(3, "outside", 90)], assignment: "Jam puis zone flat" },
      { route: [seg(3, "outside", 90)], assignment: "Jam puis zone flat" },
      { route: [seg(10, "straight")], assignment: "Zone profonde, moitié de terrain" },
      { route: [seg(10, "straight")], assignment: "Zone profonde, moitié de terrain" },
    ],
  },
  {
    id: "blitz-mike-homme",
    name: "Blitz Mike + Couverture homme",
    phase: "defense",
    formationId: "nickel",
    description: "Pression — le linebacker central blitz, le reste de la défense joue en couverture homme serrée.",
    positions: [
      RUSH(5, "Contain"),
      RUSH(4, "Pénétration"),
      RUSH(4, "Pénétration"),
      RUSH(5, "Contain"),
      RUSH(9, "Blitz Mike, vise le QB"),
      { route: [seg(3, "outside", 90)], assignment: "Zone sous / spy QB" },
      { route: [seg(2, "outside", 20)], assignment: "Couverture homme serrée sur le WR extérieur" },
      { route: [seg(2, "outside", 20)], assignment: "Couverture homme serrée sur le WR extérieur" },
      { route: [seg(2, "inside", 20)], assignment: "Couverture homme sur le slot" },
      { route: [seg(10, "straight")], assignment: "Zone profonde, aide sur le côté fort" },
      { route: [seg(6, "straight")], assignment: "Zone profonde / soutien contre la course" },
    ],
  },
  {
    id: "mesh",
    name: "Mesh",
    phase: "offense",
    formationId: "trips-right",
    description: "Croisements courts — TE et WR1 se croisent à faible profondeur, WR2 en corner, WR3 en curl.",
    positions: [
      BLOCK,
      BLOCK,
      BLOCK,
      BLOCK,
      BLOCK,
      { route: [], assignment: "Drop 5 pas, lecture croisés puis corner" },
      { route: [seg(2, "straight"), seg(5, "outside", 70)], assignment: "Swing / check-down" },
      { route: [seg(2, "straight"), seg(10, "inside", 85)], assignment: "Croisement bas (mesh)" },
      { route: [seg(2, "straight"), seg(10, "outside", 85)], assignment: "Croisement haut (mesh, sens opposé)" },
      { route: [seg(10, "straight"), seg(8, "outside", 45)], assignment: "Corner route" },
      { route: [seg(12, "straight"), seg(3, "inside", 150)], assignment: "Curl profond" },
    ],
  },
];

export function getPlayPreset(id: string): PlayPreset | undefined {
  return PLAY_PRESETS.find((p) => p.id === id);
}
