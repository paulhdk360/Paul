// Manifeste des dessins techniques disponibles (recolorés aux couleurs
// Enedril, extraits/validés un par un). L'association famille -> dessin
// vit en base (table outil_drawings, gérée depuis la Bibliothèque de
// dessins dans l'appli) — ce fichier liste juste ce qui existe comme
// fichier pour remplir le sélecteur.
export const AVAILABLE_DRAWINGS: { file: string; label: string }[] = [
  { file: "/drawings/spear.png", label: "Spear" },
  { file: "/drawings/overshot.png", label: "Overshot" },
  { file: "/drawings/drill-collar.png", label: "Drill Collar" },
  { file: "/drawings/taper-mill.png", label: "Taper Mill" },
  { file: "/drawings/stabilisateur.png", label: "Stabilisateur" },
  { file: "/drawings/packer-milling-tool.png", label: "Packer Milling Tool" },
];
