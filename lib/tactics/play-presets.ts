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
    id: "sweep-gauche",
    name: "Sweep gauche",
    phase: "offense",
    formationId: "singleback",
    description: "Jeu de course — la garde et le tackle droit tirent (pull) pour ouvrir la course du RB côté gauche.",
    positions: [
      { route: [], assignment: "Bloc down, scelle le côté fort" },
      { route: [seg(2, "straight"), seg(4, "outside", 70)], assignment: "Tire (pull), lead block côté gauche" },
      { route: [], assignment: "Bloc frontal, protège le centre" },
      { route: [seg(2, "straight"), seg(10, "inside", 80)], assignment: "Tire (pull), lead block côté gauche" },
      { route: [], assignment: "Bloc scellé, empêche la poursuite" },
      { route: [], assignment: "Remise au RB, fake bootleg" },
      { route: [seg(1, "straight"), seg(12, "outside", 75)], assignment: "Sweep gauche, suit les pulls" },
      { route: [], assignment: "Bloc backside, empêche la poursuite" },
      { route: [seg(5, "straight")], assignment: "Bloc stalk sur le CB" },
      { route: [seg(5, "straight")], assignment: "Bloc stalk sur le CB (côté opposé, leurre)" },
      { route: [seg(5, "straight")], assignment: "Bloc sur le safety ou le nickel" },
    ],
  },
  {
    id: "screen-rb",
    name: "Écran RB",
    phase: "offense",
    formationId: "shotgun-spread",
    description: "Passe-écran — la ligne laisse filer le rush puis part bloquer en avant, RB sort en retard vers l'écran.",
    positions: [
      { route: [seg(1, "straight"), seg(4, "outside", 60)], assignment: "Laisse filer 1 pas, sort bloquer en avant" },
      { route: [], assignment: "Bloc de passe (leurre)" },
      { route: [], assignment: "Bloc de passe (leurre)" },
      { route: [seg(1, "straight"), seg(4, "inside", 60)], assignment: "Laisse filer 1 pas, sort bloquer en avant" },
      { route: [], assignment: "Bloc de passe (leurre)" },
      { route: [seg(3, "straight")], assignment: "Drop 3 pas, fixe le rush puis lance l'écran" },
      { route: [seg(2, "straight"), seg(2, "outside", 90), seg(6, "straight")], assignment: "Feint bloc, sort en écran, suit les bloqueurs" },
      { route: [seg(15, "straight")], assignment: "Route verticale (leurre, éloigne la couverture)" },
      { route: [seg(15, "straight")], assignment: "Route verticale (leurre, éloigne la couverture)" },
      { route: [seg(15, "straight")], assignment: "Route verticale (leurre, éloigne la couverture)" },
      { route: [seg(15, "straight")], assignment: "Route verticale (leurre, éloigne la couverture)" },
    ],
  },
  {
    id: "flood-trips",
    name: "Flood trips",
    phase: "offense",
    formationId: "trips-right",
    description: "Passe rapide — 3 receveurs inondent le même côté à 3 profondeurs différentes (flat, intermédiaire, profond).",
    positions: [
      BLOCK,
      BLOCK,
      BLOCK,
      BLOCK,
      BLOCK,
      { route: [], assignment: "Drop 5 pas, lecture flat → intermédiaire → profond" },
      { route: [seg(2, "outside", 80)], assignment: "Route flat" },
      { route: [seg(8, "straight")], assignment: "Bloc de passe puis check-down" },
      { route: [seg(4, "straight")], assignment: "Route flat, niveau bas" },
      { route: [seg(10, "straight"), seg(4, "outside", 45)], assignment: "Out intermédiaire" },
      { route: [seg(18, "straight")], assignment: "Go profond, étire la zone" },
    ],
  },
  {
    id: "pa-post-profond",
    name: "Play action post profond",
    phase: "offense",
    formationId: "pistol",
    description: "Feinte de course puis passe profonde — le WR extérieur casse en post par-dessus la sécurité.",
    positions: [
      BLOCK,
      BLOCK,
      BLOCK,
      BLOCK,
      BLOCK,
      { route: [seg(2, "straight")], assignment: "Fake handoff, drop 5 pas, lecture profonde" },
      { route: [seg(2, "straight")], assignment: "Fake course, reste en bloc de passe" },
      { route: [seg(3, "straight")], assignment: "Bloc de passe puis release tardif" },
      { route: [seg(14, "straight"), seg(8, "inside", 45)], assignment: "Post profond" },
      { route: [seg(10, "straight"), seg(4, "outside", 45)], assignment: "Out, dégage la zone profonde" },
      { route: [seg(6, "straight")], assignment: "Curl, occupe le linebacker" },
    ],
  },
  {
    id: "wildcat-dive",
    name: "Wildcat dive",
    phase: "offense",
    formationId: "wildcat",
    description: "Snap direct au RB en position QB — course entre les gardes avec le FB en lead block.",
    positions: [
      { route: [], assignment: "Bloc down, scelle le côté fort" },
      { route: [], assignment: "Bloc down" },
      { route: [], assignment: "Bloc frontal, protège le centre" },
      { route: [], assignment: "Bloc down" },
      { route: [], assignment: "Bloc scellé" },
      { route: [seg(2, "straight"), seg(6, "straight")], assignment: "Snap direct, course entre les gardes" },
      { route: [seg(3, "straight")], assignment: "Lead block sur le linebacker" },
      { route: [seg(4, "outside", 30)], assignment: "Motion, menace de passe/course extérieure" },
      { route: [], assignment: "Bloc scellé, empêche la poursuite" },
      { route: [seg(5, "straight")], assignment: "Bloc stalk sur le CB" },
      { route: [seg(5, "straight")], assignment: "Bloc stalk sur le CB" },
    ],
  },
  {
    id: "cover-3",
    name: "Cover 3",
    phase: "defense",
    formationId: "3-4",
    description: "Zone classique — 3 défenseurs se partagent la profondeur en tiers de terrain, 4 défenseurs couvrent en dessous.",
    positions: [
      RUSH(6, "Contain extérieur, pression sur le QB"),
      RUSH(4, "Pénétration intérieure, tient le point d'ancrage"),
      RUSH(6, "Contain extérieur, pression sur le QB"),
      { route: [seg(3, "outside", 90)], assignment: "Zone flat, contain extérieur" },
      { route: [seg(4, "inside", 90)], assignment: "Zone sous, couvre le hook/curl" },
      { route: [seg(4, "outside", 90)], assignment: "Zone sous, couvre le hook/curl" },
      { route: [seg(3, "inside", 90)], assignment: "Zone flat, contain extérieur" },
      { route: [seg(12, "straight")], assignment: "Tiers de terrain gauche" },
      { route: [seg(12, "straight")], assignment: "Tiers de terrain droit" },
      { route: [seg(6, "straight")], assignment: "Soutien contre la course, aide profonde" },
      { route: [seg(14, "straight")], assignment: "Tiers de terrain central, profondeur maximale" },
    ],
  },
  {
    id: "press-man-blitz",
    name: "Press man + blitz corner",
    phase: "defense",
    formationId: "dime",
    description: "Pression surprise — un corner blitz depuis le bord pendant que le reste de la défense joue en couverture homme collée.",
    positions: [
      RUSH(5, "Contain"),
      RUSH(4, "Pénétration"),
      RUSH(4, "Pénétration"),
      RUSH(5, "Contain"),
      RUSH(6, "Spy QB, lecture course/passe"),
      { route: [seg(2, "outside", 15)], assignment: "Couverture homme press, jam au snap" },
      RUSH(8, "Blitz corner surprise depuis le bord"),
      { route: [seg(2, "inside", 15)], assignment: "Couverture homme sur le slot" },
      { route: [seg(2, "inside", 15)], assignment: "Couverture homme sur le slot" },
      { route: [seg(10, "straight")], assignment: "Zone profonde, aide sur le côté du blitz" },
      { route: [seg(10, "straight")], assignment: "Zone profonde, aide sur le côté opposé" },
    ],
  },
  {
    id: "prevent",
    name: "Prevent (fin de match)",
    phase: "defense",
    formationId: "quarters",
    description: "Défense de prévention — priorité absolue à empêcher le gros jeu, on concède le terrain court.",
    positions: [
      RUSH(4, "Contain, ne dépasse jamais le QB"),
      RUSH(3, "Pénétration contrôlée"),
      RUSH(3, "Pénétration contrôlée"),
      RUSH(4, "Contain, ne dépasse jamais le QB"),
      { route: [seg(6, "straight")], assignment: "Zone intermédiaire, reste toujours devant son homme" },
      { route: [seg(6, "straight")], assignment: "Zone intermédiaire, reste toujours devant son homme" },
      { route: [seg(6, "straight")], assignment: "Zone intermédiaire, reste toujours devant son homme" },
      { route: [seg(14, "straight")], assignment: "Quart de terrain profond, ne laisse rien passer derrière" },
      { route: [seg(14, "straight")], assignment: "Quart de terrain profond, ne laisse rien passer derrière" },
      { route: [seg(18, "straight")], assignment: "Quart de terrain profond, sécurité ultime" },
      { route: [seg(18, "straight")], assignment: "Quart de terrain profond, sécurité ultime" },
    ],
  },
  {
    id: "goal-line-stand",
    name: "Goal line stand",
    phase: "defense",
    formationId: "46-defense",
    description: "Défense en zone rouge/goal line — tout le monde attaque la ligne pour stopper la course à tout prix.",
    positions: [
      RUSH(3, "Pénétration maximale, remplit son trou"),
      RUSH(2, "Pénétration maximale, remplit son trou"),
      RUSH(2, "Pénétration maximale, remplit son trou"),
      RUSH(2, "Pénétration maximale, remplit son trou"),
      RUSH(3, "Pénétration maximale, remplit son trou"),
      RUSH(4, "Attaque le point d'attaque immédiatement"),
      RUSH(4, "Attaque le point d'attaque immédiatement"),
      { route: [seg(1, "outside", 15)], assignment: "Couverture homme collée, jam immédiat" },
      { route: [seg(1, "inside", 15)], assignment: "Couverture homme collée, jam immédiat" },
      { route: [seg(3, "straight")], assignment: "Soutien immédiat contre la course" },
      { route: [seg(3, "straight")], assignment: "Soutien immédiat contre la course" },
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
