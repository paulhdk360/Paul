// Intl's fr-FR formatting inserts a narrow no-break space (U+202F) as the
// thousands separator and a no-break space (U+00A0) before the currency
// symbol. jsPDF's built-in "helvetica" font can't render either — amounts
// come out garbled or with characters missing — so both are normalized to a
// plain space, which is harmless on screen and required for PDF export.
function stripNoBreakSpaces(s: string): string {
  return s.replace(/[  ]/g, " ");
}

export function fmtEUR(value: number | null | undefined): string {
  return stripNoBreakSpaces(
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value ?? 0),
  );
}

export function fmtNum(value: number | null | undefined): string {
  return stripNoBreakSpaces(new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value ?? 0));
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value));
}
