export function fmtEUR(value: number | null | undefined): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(
    value ?? 0,
  );
}

export function fmtNum(value: number | null | undefined): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value ?? 0);
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value));
}
