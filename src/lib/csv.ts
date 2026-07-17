// Dependency-free CSV parsing — deliberately not using a binary .xlsx
// parser library: every actively-maintained option (xlsx/SheetJS, exceljs)
// currently pulls known-vulnerable transitive dependencies via npm, and the
// SheetJS-recommended patched build is only distributed from their own CDN,
// unreachable through this environment's outbound proxy. Excel exports to
// CSV natively ("Enregistrer sous > CSV"), so this covers the same need
// without adding a vulnerable dependency to the app.
export function parseCsv(text: string): string[][] {
  const firstLine = text.slice(0, text.indexOf("\n") === -1 ? undefined : text.indexOf("\n"));
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field || row.length) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }
  return rows;
}

// French Excel exports use "," as the decimal separator and sometimes a
// space or "." as the thousands separator (e.g. "1 234,50" or "1.234,50") —
// but a spreadsheet edited with an English locale might use "." as the
// decimal point instead, so both are accepted: whichever separator comes
// last is treated as the decimal point, the other as thousands grouping.
export function parseFrenchNumber(raw: string): number | null {
  let cleaned = raw.trim().replace(/\s/g, "");
  if (!cleaned) return null;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned =
      cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  }
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
