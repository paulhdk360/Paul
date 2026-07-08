// Parses tool-diameter strings as commonly written on a devis or in the
// catalogue: `17`, `17"`, `17-1/2`, `17 1/2"`, `13-3/8`. Returns inches, or
// null if the string isn't a recognizable diameter.
export function parseDiametre(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[″"]/g, "").trim();
  const match = cleaned.match(/^(\d+(?:\.\d+)?)(?:[\s-](\d+)\/(\d+))?$/);
  if (!match) return null;
  const whole = Number(match[1]);
  if (!match[2] || !match[3]) return whole;
  return whole + Number(match[2]) / Number(match[3]);
}

export type DiametreEcart = "rectifier" | "recharger" | null;

// Compares the diameter actually wanted for the job against the linked
// catalogue reference's nominal diameter. Machining a tool down shrinks it
// (rectifier); building it back up — e.g. hardfacing — grows it (recharger).
// Returns null when either value can't be parsed, or they match.
export function compareDiametres(souhaite: string | null | undefined, catalogue: string | null | undefined): DiametreEcart {
  const a = parseDiametre(souhaite);
  const b = parseDiametre(catalogue);
  if (a === null || b === null || a === b) return null;
  return a < b ? "rectifier" : "recharger";
}
