// Free-text detection instead of relying on a catalogue link: commercial
// rarely has one fixed catalogue reference per Moteur (sizes/models vary,
// hence "Moteur", "PDM Motor", etc.), so this triggers straight off
// whatever's typed in the designation — no outil_id required up front.
// Shared between src/actions/toolList.ts (server) and ToolListManager.tsx
// (client, to show the manual "+ Rotor / Stator" button) — kept out of the
// "use server" file since that file may only export async functions.
const MOTEUR_KEYWORDS = ["moteur", "pdm"];

export function isMoteurDesignation(designation: string | null | undefined): boolean {
  if (!designation) return false;
  const normalized = designation.toLowerCase();
  return MOTEUR_KEYWORDS.some((k) => normalized.includes(k));
}
