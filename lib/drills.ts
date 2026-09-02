export type DrillCategory = "warmup" | "offense" | "defense" | "special_teams" | "team";

export const DRILL_CATEGORY_LABELS: Record<DrillCategory, string> = {
  warmup: "Échauffement",
  offense: "Attaque",
  defense: "Défense",
  special_teams: "Special Teams",
  team: "Équipe (général)",
};

export const DRILL_CATEGORY_COLORS: Record<DrillCategory, string> = {
  warmup: "bg-amber-100 text-amber-800",
  offense: "bg-emerald-100 text-emerald-800",
  defense: "bg-red-100 text-red-800",
  special_teams: "bg-violet-100 text-violet-800",
  team: "bg-sky-100 text-sky-800",
};

export const DRILL_CATEGORY_ORDER: DrillCategory[] = ["warmup", "offense", "defense", "special_teams", "team"];

/** Couleur pleine (fond uni) pour les blocs de la timeline — classes Tailwind statiques, ne pas générer dynamiquement. */
export const DRILL_CATEGORY_SOLID_COLORS: Record<DrillCategory, string> = {
  warmup: "bg-amber-500",
  offense: "bg-emerald-500",
  defense: "bg-red-500",
  special_teams: "bg-violet-500",
  team: "bg-sky-500",
};

// Proposition de plan type pour une séance de ~2h, équilibrée entre les
// catégories. Utilisée par le bouton "Suggérer un plan de séance".
export const SUGGESTED_PLAN: string[] = [
  "warmup-jog",
  "warmup-dynamic-stretch",
  "offense-route-tree",
  "offense-qb-progression",
  "defense-tackling",
  "defense-coverage",
  "st-kickoff",
  "st-punt",
  "team-11v11",
];

export type DrillTemplate = {
  id: string;
  category: DrillCategory;
  title: string;
  objective: string;
  durationMinutes: number;
  description: string;
};

// Bibliothèque de modèles pour construire rapidement une séance de ~2h,
// découpée comme une séance US classique : échauffement, travail par
// section (attaque/défense), special teams, puis travail d'équipe.
export const DRILL_TEMPLATES: DrillTemplate[] = [
  // Échauffement (~15-20 min)
  {
    id: "warmup-jog",
    category: "warmup",
    title: "Footing + mobilité articulaire",
    objective: "Élever la température corporelle",
    durationMinutes: 10,
    description: "Tour de terrain en footing léger puis mobilité dynamique (chevilles, hanches, épaules).",
  },
  {
    id: "warmup-dynamic-stretch",
    category: "warmup",
    title: "Étirements dynamiques",
    objective: "Préparer les muscles à l'effort explosif",
    durationMinutes: 10,
    description: "High knees, butt kicks, fentes marchées, montées de genoux.",
  },
  {
    id: "warmup-agility",
    category: "warmup",
    title: "Échelle d'agilité",
    objective: "Activation neuromusculaire",
    durationMinutes: 10,
    description: "Passages d'échelle de rythme variés, 2-3 séries par exercice.",
  },
  {
    id: "warmup-position-specific",
    category: "warmup",
    title: "Échauffement spécifique par poste",
    objective: "Gestes techniques propres au poste",
    durationMinutes: 10,
    description: "QB : passes courtes. RB : prises de ballon. Ligne : sorties de bloc.",
  },

  // Attaque (~15-20 min chacun)
  {
    id: "offense-route-tree",
    category: "offense",
    title: "Route tree receveurs",
    objective: "Précision et timing des routes",
    durationMinutes: 15,
    description: "Travail individuel des receveurs sur le route tree (slant, out, post, corner...) avec QB.",
  },
  {
    id: "offense-ol-blocking",
    category: "offense",
    title: "Sorties de bloc ligne offensive",
    objective: "Technique de blocage individuel",
    durationMinutes: 15,
    description: "Travail sur mannequins puis en opposition 1 contre 1.",
  },
  {
    id: "offense-qb-progression",
    category: "offense",
    title: "Progression de lecture QB",
    objective: "Prise de décision rapide",
    durationMinutes: 15,
    description: "QB face à différentes couvertures simulées, lecture et choix de la cible.",
  },
  {
    id: "offense-run-scheme",
    category: "offense",
    title: "Schémas de course",
    objective: "Timing course/ligne offensive",
    durationMinutes: 15,
    description: "Répétition des schémas de course (inside zone, outside zone, power) contre défense passive.",
  },
  {
    id: "offense-7v7",
    category: "offense",
    title: "7 contre 7",
    objective: "Jeu aérien en situation",
    durationMinutes: 20,
    description: "Attaque contre défense sans ligne, focus jeu de passe.",
  },

  // Défense (~15-20 min chacun)
  {
    id: "defense-tackling",
    category: "defense",
    title: "Technique de plaquage",
    objective: "Sécurité et efficacité du tacle",
    durationMinutes: 15,
    description: "Plaquage sur mannequin puis en situation réduite (form tackling).",
  },
  {
    id: "defense-coverage",
    category: "defense",
    title: "Couverture individuelle",
    objective: "Technique de couverture homme/zone",
    durationMinutes: 15,
    description: "DB/LB en couverture face à des receveurs sur routes courtes.",
  },
  {
    id: "defense-pass-rush",
    category: "defense",
    title: "Pass rush ligne défensive",
    objective: "Techniques de franchissement",
    durationMinutes: 15,
    description: "Moves de pass rush (bull rush, swim, spin) contre OL sur mannequin puis en opposition.",
  },
  {
    id: "defense-run-fit",
    category: "defense",
    title: "Run fits",
    objective: "Positionnement collectif contre la course",
    durationMinutes: 15,
    description: "Répétition des assignments de gap contre schémas de course adverses.",
  },
  {
    id: "defense-blitz-package",
    category: "defense",
    title: "Packages de blitz",
    objective: "Timing et angles de blitz",
    durationMinutes: 15,
    description: "Répétition des blitz prévus au plan de jeu.",
  },

  // Special Teams (~10-15 min chacun)
  {
    id: "st-kickoff",
    category: "special_teams",
    title: "Coup d'envoi / retour",
    objective: "Couverture et blocs de retour",
    durationMinutes: 10,
    description: "Répétition kickoff et kickoff return à vitesse contrôlée puis pleine vitesse.",
  },
  {
    id: "st-punt",
    category: "special_teams",
    title: "Botté / retour de botté",
    objective: "Protection et couverture punt",
    durationMinutes: 10,
    description: "Snap-hold-punt, protection, puis couverture.",
  },
  {
    id: "st-field-goal",
    category: "special_teams",
    title: "Field goal / PAT",
    objective: "Précision et protection",
    durationMinutes: 10,
    description: "Snap-hold-kick, protection de la ligne, tentatives à différentes distances.",
  },

  // Équipe général (~15-25 min chacun)
  {
    id: "team-11v11",
    category: "team",
    title: "11 contre 11 - Situation",
    objective: "Application match de tous les schémas travaillés",
    durationMinutes: 25,
    description: "Scrimmage complet, situations de jeu variées (1er down, 3e down, red zone).",
  },
  {
    id: "team-situational",
    category: "team",
    title: "Situations spéciales",
    objective: "2 points, fin de match, red zone",
    durationMinutes: 15,
    description: "Répétition des situations rares mais décisives (2-point conversion, 2 minutes, goal line).",
  },
  {
    id: "team-conditioning",
    category: "team",
    title: "Travail physique collectif",
    objective: "Condition physique en fin de séance",
    durationMinutes: 10,
    description: "Sprints, gassers, ou circuit training selon la charge de la semaine.",
  },
];
