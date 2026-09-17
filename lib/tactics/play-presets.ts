import type { BreakDirection } from "./route";

export type PresetSegment = {
  distanceYards: number;
  break: BreakDirection;
  breakAngleDeg: number;
  speedYardsPerSecond: number;
};

export type PresetPosition = { route: PresetSegment[]; assignment: string };

export type PlayComment = { atSeconds: number; text: string };

export type PlayPreset = {
  id: string;
  name: string;
  phase: "offense" | "defense";
  formationId: string;
  description: string;
  // Explication de fond : pourquoi ce jeu, contre quel type de défense/attaque il fonctionne.
  concept: string;
  // Ce que le joueur clé (QB, safety libre...) doit lire pour prendre la bonne décision.
  readKey?: string;
  // Commentaire "coach" qui défile pendant l'animation, horodaté en secondes depuis le snap.
  commentary: PlayComment[];
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
    concept:
      "Passe rapide à trois pas pensée pour prendre de vitesse une pression ou casser une couverture homme serrée : les deux receveurs extérieurs cassent tout de suite vers l'intérieur, le TE nettoie la zone courte en dessous si les slants sont coupés.",
    readKey: "Le QB regarde le linebacker/safety du côté fort au snap : s'il mord sur la fausse course ou reste planté, le slant est ouvert.",
    commentary: [
      { atSeconds: 0, text: "Snap. Trois routes courtes partent en même temps : deux slants extérieurs et un drag intérieur — l'idée est de battre la pression avant qu'elle n'arrive." },
      { atSeconds: 0.4, text: "Les deux receveurs cassent à 45° vers l'intérieur : cet angle leur fait gagner une longueur d'avance sur leur défenseur, qui doit changer de direction." },
      { atSeconds: 0.8, text: "Fin du drop 3 pas du QB — c'est le tempo classique d'une passe rapide : le ballon doit partir avant que le rush ne soit sur lui." },
      { atSeconds: 1.2, text: "Si la zone centrale est couverte, le drag intérieur du TE reste l'option de repli, juste sous les linebackers." },
      { atSeconds: 1.5, text: "Le ballon part sur le slant : le récepteur est déjà entre les deux niveaux de la défense, gain rapide et sans risque." },
    ],
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
    concept:
      "Jeu de passe profonde \"quatre verticales\" : les trois receveurs et le TE partent tous en ligne droite pour étirer la défense sur toute la largeur et la profondeur du terrain. Objectif : trouver le trou entre deux zones profondes ou gagner un duel en un-contre-un.",
    readKey: "Le QB lit du milieu vers l'extérieur : d'abord les deux routes intérieures (plus rapides à lire), puis les extérieures si la sécurité centrale ne peut pas couvrir les deux.",
    commentary: [
      { atSeconds: 0, text: "Snap, drop profond de 5 pas. Quatre récepteurs filent tout droit — la défense doit choisir qui couvrir en premier." },
      { atSeconds: 1, text: "Les routes intérieures (seam) arrivent déjà dans la zone du linebacker : si personne ne les suit, c'est une faille immédiate au milieu." },
      { atSeconds: 2.5, text: "Les routes extérieures continuent leur course — en Cover 2, les corners doivent lâcher la profondeur aux safeties, qui ne peuvent pas être partout." },
      { atSeconds: 4, text: "Un seul safety profond ne peut pas couvrir deux verticales à la fois : le QB doit avoir fait son choix à ce stade." },
      { atSeconds: 5, text: "Réception en profondeur : la défense a été étirée au-delà de sa capacité de couverture." },
    ],
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
    concept:
      "Jeu de course de puissance classique : le fullback ouvre une brèche entre le tackle droit et le tight end pendant que le RB attend la clé avant de s'engager dans le trou.",
    readKey: "Le RB lit le bloc du FB sur le linebacker : s'il est scellé à l'intérieur, presser vers l'extérieur ; s'il est repoussé, couper franchement dans le trou.",
    commentary: [
      { atSeconds: 0, text: "Remise au RB. Le FB part immédiatement en tête pour aller chercher le linebacker le plus proche du trou — c'est lui qui ouvre la voie." },
      { atSeconds: 0.3, text: "Le TE et le RT scellent leur homme vers l'intérieur pour fermer la porte derrière le point d'attaque : personne ne doit revenir de ce côté." },
      { atSeconds: 0.7, text: "Le RB presse la ligne de mêlée en attendant la clé du bloc du FB avant de planter son pied et de couper." },
      { atSeconds: 1.1, text: "Une fois le trou identifié, le RB accélère franchement — la puissance du jeu vient de la double poussée FB + ligne, pas de la vitesse du RB." },
    ],
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
    concept:
      "Zone classique à deux niveaux : deux safeties se partagent la profondeur en deux moitiés de terrain, pendant que les cinq défenseurs sous eux couvrent chacun une zone courte (flat, hook/curl). Le point faible historique est la zone profonde entre les deux safeties et les lignes de côté peu profondes.",
    readKey: "Les corners doivent \"jam\" les receveurs extérieurs au snap pour retarder leur route et laisser le temps aux safeties de couvrir la profondeur.",
    commentary: [
      { atSeconds: 0, text: "Snap. Les quatre défenseurs de ligne rushent pour presser le QB pendant que les sept autres reculent en couverture de zone." },
      { atSeconds: 0.4, text: "Les corners jouent la zone flat basse : leur rôle est de couper les routes courtes, pas de suivre un receveur en profondeur." },
      { atSeconds: 0.9, text: "Les linebackers occupent les zones hook/curl au milieu — ils doivent lire les yeux du QB pour anticiper une passe intermédiaire." },
      { atSeconds: 1.4, text: "Les deux safeties tiennent leur moitié de terrain en profondeur : la faille classique du Cover 2 est juste entre eux, au milieu du terrain." },
    ],
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
    concept:
      "Pression surprise au milieu : le linebacker central (Mike) blitz directement sur le QB pendant que tout le reste de la défense joue en couverture homme serrée, sans aide de zone en dessous. Le pari : faire craquer la ligne avant que les receveurs ne se démarquent.",
    readKey: "Le safety libre doit repérer très vite si le blitz arrive à temps ou si le QB a une cible ouverte rapide — c'est lui la dernière ligne de sécurité.",
    commentary: [
      { atSeconds: 0, text: "Snap. Le linebacker Mike fonce immédiatement au centre, exploitant un trou dans la protection avant que la ligne adverse ne puisse s'ajuster." },
      { atSeconds: 0.4, text: "Les corners et le nickel collent leurs receveurs homme à homme, sans filet de zone en dessous — chaque duel individuel compte." },
      { atSeconds: 0.9, text: "Le rush extérieur maintient le contain pour empêcher le QB de sortir de la poche et de gagner du temps en roulant." },
      { atSeconds: 1.3, text: "Si le blitz du Mike arrive à temps, le QB doit précipiter sa décision — c'est exactement l'objectif de ce blitz." },
    ],
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
    concept:
      "Course avec pulls : la garde gauche et la garde droite quittent leur poste pour aller ouvrir la voie côté gauche, pendant que le RB attend que ses deux bloqueurs passent devant lui avant de s'engager. Efficace contre un front qui joue trop droit sur sa position initiale.",
    readKey: "Le RB suit ses pulls, pas le trou : il court derrière ses deux bloqueurs et laisse leur lecture du défenseur décider où couper.",
    commentary: [
      { atSeconds: 0, text: "Remise au RB, direction gauche. Les deux gardes quittent la ligne pour tirer (pull) vers l'extérieur — le trou ne s'ouvre pas encore, il se construit." },
      { atSeconds: 0.5, text: "La garde gauche arrive la première en tête de course, prête à bloquer le premier défenseur non bloqué qu'elle rencontre côté large." },
      { atSeconds: 1.0, text: "La garde droite, qui a parcouru plus de distance, arrive en renfort juste derrière — c'est elle qui scelle souvent le safety ou le corner en soutien." },
      { atSeconds: 1.5, text: "Le RB, qui a suivi ses pulls sans se presser, accélère maintenant derrière ses deux bloqueurs de tête." },
      { atSeconds: 1.86, text: "Si les deux blocs tiennent, la course peut aller très loin : ce jeu punit une défense trop agressive vers l'intérieur." },
    ],
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
    concept:
      "Passe-écran classique : la ligne offensive laisse volontairement le rush passer, feignant une protection qui craque, puis part bloquer en avant pendant que le RB sort discrètement en retard vers l'espace ouvert. Redoutable contre une défense qui blitz beaucoup.",
    readKey: "Le QB doit vendre la panique — regarder loin, presque se faire sacker — pour que les rushers continuent tout droit et ne reviennent pas sur l'écran.",
    commentary: [
      { atSeconds: 0, text: "Snap. Le QB fait un drop classique, comme sur une passe profonde normale — rien ne doit trahir l'écran à ce stade." },
      { atSeconds: 0.4, text: "Deux joueurs de ligne laissent filer leur adversaire un instant avant de se détacher discrètement pour aller bloquer en avant du RB." },
      { atSeconds: 0.9, text: "Le rush adverse continue sa course vers le QB, pensant avoir percé la protection — c'est exactement l'effet recherché." },
      { atSeconds: 1.4, text: "Le RB, resté en protection un instant pour vendre le bluff, sort enfin vers l'espace dégagé par ses deux bloqueurs." },
      { atSeconds: 2.1, text: "Ballon lâché juste avant que le rush n'atteigne le QB : le RB récupère avec des bloqueurs devant lui, les rushers étant tous restés derrière la jouée." },
    ],
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
    concept:
      "Flood (inondation) : trois receveurs du même côté partent à trois profondeurs différentes (flat, intermédiaire, profond), ce qui oblige un seul défenseur de zone à choisir lequel couvrir — les deux autres sont automatiquement ouverts.",
    readKey: "Le QB lit du plus bas vers le plus haut : flat d'abord (le plus rapide à sortir), puis intermédiaire, puis le profond si la zone est complètement débordée.",
    commentary: [
      { atSeconds: 0, text: "Snap, drop 5 pas. Trois receveurs partent du même côté à trois niveaux différents — un seul défenseur ne peut pas couvrir les trois." },
      { atSeconds: 0.5, text: "La route flat sort en premier et en bas : c'est l'option rapide si la pression arrive vite." },
      { atSeconds: 1.2, text: "Le défenseur de zone intermédiaire doit choisir entre suivre la route flat qui descend ou rester sur sa profondeur — quel que soit son choix, une des trois routes reste ouverte." },
      { atSeconds: 2.0, text: "La route out intermédiaire arrive dans l'espace que le défenseur vient de quitter." },
      { atSeconds: 2.57, text: "Si toute la zone a été tirée vers le bas, la route profonde arrive seule tout en haut — le gain maximal du jeu." },
    ],
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
    concept:
      "Play action puis passe profonde : la feinte de remise fige les linebackers et fait avancer les safeties d'un pas, ce qui ouvre une fenêtre pour un receveur qui casse en post par-dessus la défense profonde.",
    readKey: "Le QB regarde d'abord la réaction du safety libre sur la feinte : s'il mord vers la ligne, le post est ouvert par-dessus lui.",
    commentary: [
      { atSeconds: 0, text: "Feinte de remise au RB — tous les linebackers doivent croire à la course pendant une fraction de seconde." },
      { atSeconds: 0.5, text: "Le safety profond hésite un instant sur la feinte : c'est exactement cette hésitation d'un pas qui va ouvrir la route profonde." },
      { atSeconds: 1.5, text: "Le receveur extérieur a déjà couvert la moitié de sa route verticale pendant que le safety se replace." },
      { atSeconds: 2.5, text: "Cassure en post : le receveur coupe vers le centre du terrain, juste au moment où le safety essaie de rattraper son retard." },
      { atSeconds: 3.14, text: "Ballon lancé en profondeur, par-dessus la tête de la défense qui a été prise de vitesse par la feinte initiale." },
    ],
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
    concept:
      "Snap direct au RB en position de QB : la défense doit identifier en une fraction de seconde qui porte réellement le ballon, pendant qu'un bloqueur de tête (FB) ouvre le trou central.",
    readKey: "Le RB porteur lit le bloc du FB sur le premier linebacker qui se présente dans le trou avant de choisir son couloir.",
    commentary: [
      { atSeconds: 0, text: "Snap direct — pas de QB classique, le ballon va droit dans les mains du porteur, ce qui prend la défense un instant de court." },
      { atSeconds: 0.4, text: "Le FB fonce en tête pour bloquer le premier défenseur qui apparaît dans le trou central." },
      { atSeconds: 0.8, text: "Le joueur en motion écarté menace une passe ou une course extérieure, obligeant un défenseur à rester large plutôt que de venir aider au centre." },
      { atSeconds: 1.14, text: "Le porteur accélère dans le trou ouvert par le FB — l'effet de surprise du snap direct fait souvent gagner les premières yards avant même la réaction défensive." },
    ],
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
    concept:
      "Zone à trois niveaux profonds : trois défenseurs se partagent le terrain en tiers (gauche, centre, droite) tandis que quatre défenseurs couvrent en dessous. Solide contre les jeux extérieurs, plus vulnérable au milieu du terrain entre les deux tiers latéraux.",
    readKey: "Les défenseurs de zone flat doivent presser les receveurs extérieurs pour ralentir leurs routes avant de se replier vers leur zone.",
    commentary: [
      { atSeconds: 0, text: "Snap. Trois défenseurs rushent pendant que huit reculent — deux d'entre eux prennent en charge chaque flat extérieur." },
      { atSeconds: 0.5, text: "Les défenseurs de zone hook/curl occupent le milieu du terrain, prêts à réagir à une passe intermédiaire." },
      { atSeconds: 1.0, text: "Les deux corners tiennent leur tiers de terrain latéral, en gardant toujours le receveur devant eux plutôt que de le suivre des yeux sur le ballon." },
      { atSeconds: 1.7, text: "Le safety central couvre le tiers du milieu, la zone où ce schéma est historiquement le plus vulnérable si un receveur trouve la fenêtre entre les deux tiers latéraux." },
    ],
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
    concept:
      "Pression surprise depuis le bord : un corner blitz alors qu'il semblait couvrir en homme, pendant que le reste de la défense joue en couverture serrée collée aux receveurs. L'objectif est de surprendre une protection qui ne l'attend pas de ce côté.",
    readKey: "Le QB doit repérer très vite le corner qui abandonne sa couverture pour blitz — s'il ne le voit pas, la pression arrive sans être bloquée.",
    commentary: [
      { atSeconds: 0, text: "Snap. Au premier regard, tout ressemble à une couverture homme classique — rien n'indique encore le blitz du corner." },
      { atSeconds: 0.3, text: "Les défenseurs en couverture homme pressent leurs receveurs au contact (press coverage), retardant leur relâche." },
      { atSeconds: 0.7, text: "Le corner censé couvrir se précipite en fait vers le QB — la ligne offensive, qui ne l'a pas vu venir, ne peut pas l'ajuster à temps." },
      { atSeconds: 1.1, text: "Le linebacker resté en \"spy\" surveille toujours le QB au cas où il essaierait de s'échapper de la pression." },
      { atSeconds: 1.43, text: "Si le corner arrive à temps, c'est une pression totalement gratuite — personne dans la ligne offensive n'était assigné pour le bloquer." },
    ],
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
    concept:
      "Défense de prévention pour fin de match : on accepte de céder le jeu court pour ne jamais se faire surprendre par un gros jeu qui coûterait le match. Chaque défenseur reste toujours devant son adversaire, jamais en position de poursuite.",
    readKey: "La consigne absolue : ne jamais laisser passer un receveur derrière soi, même au prix de concéder des yards faciles devant.",
    commentary: [
      { atSeconds: 0, text: "Snap. Le rush reste contrôlé — personne ne prend de risque qui pourrait laisser le QB s'échapper et gagner du temps." },
      { atSeconds: 0.6, text: "Les défenseurs de zone intermédiaire restent délibérément en retrait, prêts à concéder une réception courte plutôt que de risquer un gros jeu derrière eux." },
      { atSeconds: 1.3, text: "Les quatre défenseurs profonds maintiennent une marge de sécurité importante : mieux vaut un tacle après 10 yards qu'un touchdown." },
      { atSeconds: 2.0, text: "Même si une réception courte est concédée ici, l'horloge continue de tourner en faveur de l'équipe qui défend." },
      { atSeconds: 2.57, text: "Aucun défenseur profond n'a été pris de vitesse — l'objectif de la prévention est atteint, même si quelques yards ont été cédés devant." },
    ],
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
    concept:
      "Tout le monde attaque la ligne : en zone rouge, chaque yard compte, donc la défense sacrifie totalement la couverture profonde pour maximiser les corps au point d'attaque et empêcher la course d'atteindre l'en-but.",
    readKey: "Chaque défenseur de ligne et linebacker doit remplir son trou immédiatement — il n'y a pas de profondeur de terrain à perdre en zone rouge.",
    commentary: [
      { atSeconds: 0, text: "Snap. Toute la ligne et les linebackers attaquent instantanément vers l'avant — aucune raison de temporiser à quelques yards de l'en-but." },
      { atSeconds: 0.2, text: "Les deux corners jouent un marquage homme collé et agressif : la moindre hésitation peut coûter un touchdown." },
      { atSeconds: 0.4, text: "Les deux safeties, habituellement profonds, sont ici juste derrière la ligne pour apporter un soutien immédiat contre la course." },
      { atSeconds: 0.57, text: "Chaque défenseur remplit son trou assigné en même temps — la philosophie du goal line stand est de ne laisser aucun espace, même au prix de la couverture profonde." },
    ],
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
    concept:
      "Croisements courts (mesh) : le TE et le WR1 se croisent volontairement à faible profondeur pour créer un \"embouteillage\" naturel qui gêne une couverture homme, pendant que les deux autres receveurs occupent les niveaux plus profonds.",
    readKey: "Le QB lit d'abord les deux croisements courts (souvent ouverts contre l'homme grâce au pick naturel), puis remonte vers le corner ou le curl profond si la zone couvre bien le mesh.",
    commentary: [
      { atSeconds: 0, text: "Snap, drop 5 pas. Le TE et le WR1 partent l'un vers l'autre en dessous — leurs trajectoires vont se croiser à faible profondeur." },
      { atSeconds: 0.6, text: "Le RB sort en swing pour une option de repli rapide si la pression arrive avant que le mesh ne se développe." },
      { atSeconds: 1.2, text: "Les deux receveurs se croisent presque épaule contre épaule : en couverture homme, leurs défenseurs doivent se faufiler entre eux, ce qui les ralentit naturellement." },
      { atSeconds: 1.9, text: "Pendant ce temps, le receveur en corner route étire la défense en profondeur, emmenant son défenseur loin de la zone du mesh." },
      { atSeconds: 2.57, text: "Si le croisement a créé une confusion en couverture homme, un des deux receveurs ressort complètement démarqué de l'autre côté." },
    ],
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
