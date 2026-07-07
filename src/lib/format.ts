export function fmtEUR(n: number | null | undefined): string {
  const v = Number(n) || 0;
  return v.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
}

export function fmtNum(n: number | null | undefined): string {
  const v = Number(n) || 0;
  return v.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function fmtFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
}

export const STATUT_BADGE: Record<string, string> = {
  Disponible: "b-green",
  "En service": "b-green",
  "En cours": "b-green",
  Accepté: "b-green",
  Payée: "b-green",
  Signé: "b-green",
  Maintenance: "b-amber",
  "À venir": "b-amber",
  "En attente": "b-amber",
  Émise: "b-amber",
  "En mission": "b-amber",
  Envoyé: "b-amber",
  Relancé: "b-amber",
  Refusé: "b-red",
  "En retard": "b-red",
  Terminé: "b-gray",
  Congé: "b-gray",
  Brouillon: "b-gray",
};
