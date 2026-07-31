// Curated dessins techniques (recolorés aux couleurs Enedril), associés par
// mot-clé sur la désignation/famille — confirmés un par un avec Paul plutôt
// que devinés automatiquement (source: classeur "Fishing tools drawings",
// sans nom de cellule fiable pour un mapping automatique). Étendre cette
// liste au fur et à mesure que de nouveaux dessins sont validés.
const TOOL_DRAWINGS: { match: RegExp; file: string }[] = [
  { match: /taper mill/i, file: "/drawings/taper-mill.png" },
  { match: /overshot/i, file: "/drawings/overshot.png" },
  { match: /spear/i, file: "/drawings/spear.png" },
  { match: /stab/i, file: "/drawings/stabilisateur.png" },
  { match: /drill collar/i, file: "/drawings/drill-collar.png" },
];

export function findToolDrawing(text: string | null | undefined): string | null {
  if (!text) return null;
  for (const d of TOOL_DRAWINGS) {
    if (d.match.test(text)) return d.file;
  }
  return null;
}
