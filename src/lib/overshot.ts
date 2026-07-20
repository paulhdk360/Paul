// Same pattern as isMoteurDesignation (src/lib/moteur.ts): free-text
// detection off whatever's typed in the designation, so the "+ Grapple"
// button shows up on an Overshot line without needing a catalogue link.
const OVERSHOT_KEYWORDS = ["overshot"];

export function isOvershotDesignation(designation: string | null | undefined): boolean {
  if (!designation) return false;
  const normalized = designation.toLowerCase();
  return OVERSHOT_KEYWORDS.some((k) => normalized.includes(k));
}
