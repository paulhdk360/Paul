export type StatField = { key: string; label: string };

export const STAT_FIELDS: StatField[] = [
  { key: "passing_yards", label: "Yards passés" },
  { key: "passing_tds", label: "TD passés" },
  { key: "rushing_yards", label: "Yards courus" },
  { key: "rushing_tds", label: "TD courus" },
  { key: "receptions", label: "Réceptions" },
  { key: "receiving_yards", label: "Yards reçus" },
  { key: "receiving_tds", label: "TD reçus" },
  { key: "tackles", label: "Tacles" },
  { key: "sacks", label: "Sacks" },
  { key: "interceptions", label: "Interceptions" },
  { key: "fumbles_recovered", label: "Fumbles récupérés" },
  { key: "plays_won", label: "Actions gagnées" },
  { key: "plays_lost", label: "Actions perdues" },
];
