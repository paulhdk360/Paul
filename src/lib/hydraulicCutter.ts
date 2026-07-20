// Same pattern as isMoteurDesignation/isOvershotDesignation: free-text
// detection off the designation, so the "+ Set of cutters" button shows up
// on a Hydraulic Pipe Cutter line without needing a catalogue link.
const HYDRAULIC_CUTTER_KEYWORDS = ["hydraulic pipe cutter", "pipe cutter", "hydraulic cutter"];

export function isHydraulicCutterDesignation(designation: string | null | undefined): boolean {
  if (!designation) return false;
  const normalized = designation.toLowerCase();
  return HYDRAULIC_CUTTER_KEYWORDS.some((k) => normalized.includes(k));
}
