import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { distinctMonths, monthLabel } from "@/lib/calendar";
import { fmtDate, fmtEUR } from "@/lib/format";
import { drawFooter, drawInfoCard, drawLetterhead, MARGIN, PDF_COLORS, sectionTitle, tableTheme } from "@/lib/pdf/pdfTheme";
import type {
  Affaire,
  BonLivraison,
  Client,
  PointageCode,
  ServiceTicket,
  ServiceTicketPersonnel,
  ServiceTicketTransport,
  ToolListItem,
} from "@/lib/types";

const CODE_OPTIONS = ["", "MOB", "S", "O", "FOC", "DEMOB", "FIN", "LIH"];
const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function finalY(doc: jsPDF): number {
  return (doc as any).lastAutoTable.finalY;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Compact day label for the équipements date column.
function dayOnly(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(new Date(iso));
}

// Monday-first weekday index (0=Lun...6=Dim), to lay a month out the way a
// real wall calendar reads.
function isoWeekday(date: Date): number {
  const d = date.getDay();
  return d === 0 ? 6 : d - 1;
}

function monthRowCount(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  const startWeekday = isoWeekday(new Date(y, m - 1, 1));
  return Math.ceil((startWeekday + days) / 7);
}

const PERSONNEL_PRICE_COLUMNS: { key: keyof ServiceTicketPersonnel; header: string }[] = [
  { key: "tarif_jour", header: "Tarif jour €" },
  { key: "tarif_mob", header: "Tarif MOB €" },
  { key: "tarif_demob", header: "Tarif DEMOB €" },
];

const EQUIPEMENT_PRICE_COLUMNS: { key: keyof ToolListItem; header: string }[] = [
  { key: "prix_stand_by", header: "Stand-by €/j" },
  { key: "prix_operation", header: "Opération €/j" },
  { key: "prix_uc", header: "UC €" },
  { key: "prix_lih", header: "LIH €" },
  { key: "prix_inspection", header: "Inspection €" },
  { key: "prix_restocking", header: "Restocking €" },
  { key: "prix_serrage", header: "Serrage €" },
];

// Truncates with an ellipsis based on actual rendered width at the doc's
// currently-set font, instead of a fixed character count — a fixed slice()
// still overflowed past its cell for anything denser than average text
// (e.g. "2026-055-BL1"), bleeding into the next column since jsPDF text
// calls aren't clipped to the rect they're drawn over.
function fitText(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && doc.getTextWidth(`${truncated}…`) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

// A live fillable PDF (AcroForm dropdown per day/entity cell) so a client
// without an app login can still complete a Service Ticket in any real PDF
// reader (Adobe Reader, Preview, Chrome...) and send it back — no static
// print-only document. Existing pointage pre-fills each dropdown so the
// client only has to correct/complete, not start from scratch. Sent
// directly to the client, so it carries the applicable day rates up front
// (a compact "Tarifs" recap, not repeated on every grid cell) rather than
// leaving pricing implicit.
export function generateFillableServiceTicketPdf(params: {
  ticket: ServiceTicket;
  personnel: ServiceTicketPersonnel[];
  equipements: ToolListItem[];
  transport: ServiceTicketTransport[];
  bls: BonLivraison[];
  dates: string[];
  pointage: Map<string, PointageCode>;
  affaire: Affaire;
  client: Client | null;
}) {
  const { ticket, personnel, equipements, transport, bls, dates, pointage, affaire, client } = params;
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let cursorY = drawLetterhead(doc, "SERVICE TICKET", "Fiche à remplir");

  cursorY = drawInfoCard(
    doc,
    [
      { label: "Job N°", value: affaire.reference },
      { label: "Client", value: client?.raison_sociale ?? ticket.client_nom ?? "—" },
      { label: "Opérateur", value: ticket.operateur_nom ?? "—" },
      { label: "Période", value: dates.length ? `${fmtDate(dates[0])} au ${fmtDate(dates[dates.length - 1])}` : "—" },
    ],
    cursorY,
    4,
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.ink);
  doc.text("Pour chaque jour, cliquez la case et choisissez un code. Laissez vide si non applicable.", MARGIN, cursorY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text(
    "MOB Mobilisation  ·  S Stand By  ·  O Opération  ·  FOC Gratuit  ·  DEMOB Démobilisation  ·  FIN Fin de mission  ·  LIH Perdu en puits",
    MARGIN,
    cursorY + 5,
  );
  cursorY += 12;

  const activePersonnelCols = PERSONNEL_PRICE_COLUMNS.filter((c) => personnel.some((p) => p[c.key]));
  const activeEquipCols = EQUIPEMENT_PRICE_COLUMNS.filter((c) => equipements.some((e) => e[c.key]));
  if (activePersonnelCols.length || activeEquipCols.length) {
    cursorY = sectionTitle(doc, "Tarifs applicables", cursorY);

    if (activePersonnelCols.length) {
      autoTable(doc, {
        startY: cursorY,
        margin: { left: MARGIN, right: MARGIN },
        head: [["Personnel", ...activePersonnelCols.map((c) => c.header)]],
        body: personnel.map((p) => [p.nom, ...activePersonnelCols.map((c) => (p[c.key] ? fmtEUR(p[c.key] as number) : "—"))]),
        ...tableTheme(PDF_COLORS.blue),
      });
      cursorY = finalY(doc) + 6;
    }

    if (activeEquipCols.length) {
      autoTable(doc, {
        startY: cursorY,
        margin: { left: MARGIN, right: MARGIN },
        head: [["Équipement", ...activeEquipCols.map((c) => c.header)]],
        body: equipements.map((e) => [
          e.designation.split("\n")[0],
          ...activeEquipCols.map((c) => (e[c.key] ? fmtEUR(e[c.key] as number) : "—")),
        ]),
        ...tableTheme(PDF_COLORS.blue),
      });
      cursorY = finalY(doc) + 8;
    }
  }

  if (transport.length) {
    cursorY = sectionTitle(doc, "Transport & prestations ponctuelles", cursorY);
    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Désignation", "Code", "N° BL", "Qté"]],
      body: transport.map((t) => [t.designation, t.code, t.bl_reference ?? "—", String(t.quantite)]),
      ...tableTheme(PDF_COLORS.blue),
    });
    cursorY = finalY(doc) + 8;
  }

  let fieldSeq = 0;

  // Personnel pointage reads like a real work schedule, so it's laid out as
  // an actual wall calendar (one card per person per month, Lun-Dim grid)
  // instead of a long list of dates — far more compact for a typical
  // month-long ticket, and familiar for an opérateur to fill in.
  const CAL_COLS_PER_ROW = 3;
  const CAL_GAP = 6;
  const CAL_HEADER_H = 6;
  const CAL_WEEKDAY_H = 5;
  const CAL_CELL_H = 9;
  const calAvailWidth = pageWidth - MARGIN * 2;
  const calCardWidth = (calAvailWidth - CAL_GAP * (CAL_COLS_PER_ROW - 1)) / CAL_COLS_PER_ROW;
  const dateSet = new Set(dates);

  function drawCalendarCard(x: number, y: number, personLabel: string, monthKey: string, personId: string) {
    const [year, month] = monthKey.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startWeekday = isoWeekday(new Date(year, month - 1, 1));
    const numRows = monthRowCount(monthKey);
    const colW = calCardWidth / 7;

    doc.setFillColor(...PDF_COLORS.navy);
    doc.rect(x, y, calCardWidth, CAL_HEADER_H, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.6);
    doc.setTextColor(...PDF_COLORS.white);
    doc.text(fitText(doc, `${personLabel} — ${monthLabel(monthKey)}`, calCardWidth - 4), x + 2, y + CAL_HEADER_H / 2 + 1.3);
    let cy = y + CAL_HEADER_H;

    WEEKDAY_LABELS.forEach((wd, i) => {
      doc.setFillColor(...PDF_COLORS.sunken);
      doc.setDrawColor(...PDF_COLORS.border);
      doc.setLineWidth(0.15);
      doc.rect(x + i * colW, cy, colW, CAL_WEEKDAY_H, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.6);
      doc.setTextColor(...PDF_COLORS.muted);
      doc.text(wd, x + i * colW + colW / 2, cy + CAL_WEEKDAY_H / 2 + 1.1, { align: "center" });
    });
    cy += CAL_WEEKDAY_H;

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < 7; col++) {
        const cellIndex = row * 7 + col;
        const dayNum = cellIndex - startWeekday + 1;
        const cx = x + col * colW;
        const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
        const iso = inMonth ? `${monthKey}-${String(dayNum).padStart(2, "0")}` : null;
        const inRange = !!iso && dateSet.has(iso);

        doc.setDrawColor(...PDF_COLORS.border);
        doc.setLineWidth(0.15);
        doc.setFillColor(...(inRange ? PDF_COLORS.white : PDF_COLORS.sunken));
        doc.rect(cx, cy, colW, CAL_CELL_H, "FD");

        if (inMonth) {
          doc.setFont("helvetica", inRange ? "bold" : "normal");
          doc.setFontSize(5.6);
          doc.setTextColor(...(inRange ? PDF_COLORS.ink : PDF_COLORS.muted));
          doc.text(String(dayNum), cx + 1.2, cy + 3);
        }

        if (inRange && iso) {
          const current = pointage.get(`${personId}:${iso}`) ?? "";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const field = new (doc as any).AcroFormComboBox();
          field.fieldName = `pointage_${fieldSeq++}_${personId}_${iso}`;
          field.x = cx + 0.5;
          field.y = cy + 3.2;
          field.width = colW - 1;
          field.height = CAL_CELL_H - 3.6;
          field.fontSize = 5.5;
          field.setOptions(CODE_OPTIONS);
          field.value = current;
          doc.addField(field);
        }
      }
      cy += CAL_CELL_H;
    }
  }

  function drawPersonnelCalendars() {
    const months = distinctMonths(dates);
    if (!personnel.length || !months.length) return;

    cursorY = sectionTitle(doc, "Personnel", cursorY);
    const entries = personnel.flatMap((p) => months.map((monthKey) => ({ person: p, monthKey })));
    const rows = chunk(entries, CAL_COLS_PER_ROW);

    rows.forEach((row) => {
      const rowHeight = Math.max(...row.map((e) => CAL_HEADER_H + CAL_WEEKDAY_H + monthRowCount(e.monthKey) * CAL_CELL_H));
      if (cursorY + rowHeight > pageHeight - 18) {
        doc.addPage("a4", "landscape");
        cursorY = 20;
      }
      row.forEach((e, i) => {
        const x = MARGIN + i * (calCardWidth + CAL_GAP);
        drawCalendarCard(x, cursorY, e.person.nom, e.monthKey, e.person.id);
      });
      cursorY += rowHeight + CAL_GAP;
    });
    cursorY += 4;
  }

  const dateColWidth = 22;
  const rowHeight = 7;
  const headerHeight = 12;

  // Header repeats on every page a grid spills onto, so the table reads as
  // one continuous sheet instead of a stack of separately-titled blocks —
  // days become rows (naturally paginating like any long table) instead of
  // columns (which forced manual chunking into narrow weekly blocks).
  function drawHeaderRow(entities: { label: string; sub?: string }[], colWidth: number) {
    doc.setFillColor(...PDF_COLORS.navy);
    doc.rect(MARGIN, cursorY, dateColWidth, headerHeight, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(...PDF_COLORS.white);
    doc.text("Date", MARGIN + 2, cursorY + headerHeight / 2 + 1.4);

    entities.forEach((e, i) => {
      const x = MARGIN + dateColWidth + i * colWidth;
      doc.setFillColor(...PDF_COLORS.navy);
      doc.rect(x, cursorY, colWidth, headerHeight, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.4);
      doc.setTextColor(...PDF_COLORS.white);
      doc.text(fitText(doc, e.label, colWidth - 3), x + colWidth / 2, cursorY + 5.2, { align: "center" });
      if (e.sub) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(5.6);
        doc.text(fitText(doc, e.sub, colWidth - 3), x + colWidth / 2, cursorY + 9.6, { align: "center" });
      }
    });
    cursorY += headerHeight;
  }

  function drawGrid(title: string, entities: { id: string; label: string; sub?: string }[]) {
    if (!entities.length || !dates.length) return;

    const availWidth = pageWidth - MARGIN * 2 - dateColWidth;
    const colWidth = Math.max(16, availWidth / entities.length);

    if (cursorY > pageHeight - 50) {
      doc.addPage("a4", "landscape");
      cursorY = 20;
    }
    cursorY = sectionTitle(doc, title, cursorY);
    drawHeaderRow(entities, colWidth);

    dates.forEach((d, di) => {
      if (cursorY + rowHeight > pageHeight - 18) {
        doc.addPage("a4", "landscape");
        cursorY = 20;
        drawHeaderRow(entities, colWidth);
      }
      const bg = di % 2 === 0 ? PDF_COLORS.white : PDF_COLORS.sunken;
      doc.setDrawColor(...PDF_COLORS.border);
      doc.setLineWidth(0.15);
      doc.setFillColor(...bg);
      doc.rect(MARGIN, cursorY, dateColWidth, rowHeight, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(...PDF_COLORS.ink);
      doc.text(dayOnly(d), MARGIN + dateColWidth / 2, cursorY + rowHeight / 2 + 1.4, { align: "center" });

      entities.forEach((e, ei) => {
        const x = MARGIN + dateColWidth + ei * colWidth;
        doc.setFillColor(...bg);
        doc.rect(x, cursorY, colWidth, rowHeight, "FD");

        const current = pointage.get(`${e.id}:${d}`) ?? "";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const field = new (doc as any).AcroFormComboBox();
        field.fieldName = `pointage_${fieldSeq++}_${e.id}_${d}`;
        field.x = x + 0.4;
        field.y = cursorY + 0.4;
        field.width = colWidth - 0.8;
        field.height = rowHeight - 0.8;
        field.fontSize = 7;
        field.setOptions(CODE_OPTIONS);
        field.value = current;
        doc.addField(field);
      });
      cursorY += rowHeight;
    });
    cursorY += 10;
  }

  drawPersonnelCalendars();
  drawGrid(
    "Équipements",
    equipements.map((e) => {
      const bl = bls.find((b) => b.id === e.bl_id);
      const sub = [e.numero_serie ? `SN ${e.numero_serie}` : null, bl?.numero_bl ? `BL ${bl.numero_bl}` : null].filter(Boolean).join(" · ");
      return { id: e.id, label: e.designation.split("\n")[0], sub: sub || undefined };
    }),
  );

  drawFooter(doc);
  doc.save(`ServiceTicket-Fiche-${affaire.reference}.pdf`);
}
