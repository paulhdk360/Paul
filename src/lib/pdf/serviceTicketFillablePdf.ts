import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fmtDate } from "@/lib/format";
import { drawFooter, drawInfoCard, drawLetterhead, MARGIN, PDF_COLORS, sectionTitle, tableTheme } from "@/lib/pdf/pdfTheme";
import type { Affaire, BonLivraison, Client, PointageCode, ServiceTicket, ServiceTicketPersonnel, ServiceTicketTransport, ToolListItem } from "@/lib/types";

const CODE_OPTIONS = ["", "MOB", "S", "O", "FOC", "DEMOB", "FIN", "LIH"];
// Days per grid block — keeps each date column wide enough to comfortably
// click/read, splitting a long period into several titled sub-grids (or
// pages) instead of cramming every day into one unreadably narrow row.
const DAYS_PER_BLOCK = 10;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function finalY(doc: jsPDF): number {
  return (doc as any).lastAutoTable.finalY;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function dm(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(new Date(iso));
}

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
// client only has to correct/complete, not start from scratch. Carries no
// pricing, so it's safe to hand out regardless of which variant it was
// downloaded from.
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

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.6);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text(
    "Cliquez chaque case et choisissez un code : MOB (mobilisation) / S (Stand By) / O (Operation) / FOC (Free Of Charge) / DEMOB (démobilisation) / FIN / LIH (Lost In Hole). Laissez vide si non applicable.",
    MARGIN,
    cursorY,
  );
  cursorY += 8;

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

  function drawGrid(
    title: string,
    labelHeader: string,
    rows: { id: string; label: string; extra?: string[] }[],
    extraHeaders: { header: string; width: number }[],
  ) {
    if (!rows.length) return;

    const dateBlocks = dates.length ? chunk(dates, DAYS_PER_BLOCK) : [[]];
    const labelWidth = 46;
    const extraWidth = extraHeaders.reduce((sum, h) => sum + h.width, 0);

    dateBlocks.forEach((blockDates) => {
      if (cursorY > pageHeight - 40) {
        doc.addPage("a4", "landscape");
        cursorY = 20;
      }
      const blockTitle = dateBlocks.length > 1 && blockDates.length ? `${title} — du ${dm(blockDates[0])} au ${dm(blockDates[blockDates.length - 1])}` : title;
      cursorY = sectionTitle(doc, blockTitle, cursorY);

      const availWidth = pageWidth - MARGIN * 2 - labelWidth - extraWidth;
      const colWidth = blockDates.length ? Math.max(9, availWidth / blockDates.length) : availWidth;
      const rowHeight = 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.6);
      doc.setTextColor(...PDF_COLORS.white);
      doc.setFillColor(...PDF_COLORS.navy);
      doc.rect(MARGIN, cursorY, labelWidth, rowHeight, "F");
      doc.text(labelHeader, MARGIN + 2, cursorY + rowHeight / 2 + 1.4);
      let hx = MARGIN + labelWidth;
      extraHeaders.forEach((h) => {
        doc.setFillColor(...PDF_COLORS.navy);
        doc.rect(hx, cursorY, h.width, rowHeight, "F");
        doc.text(h.header, hx + 2, cursorY + rowHeight / 2 + 1.4);
        hx += h.width;
      });
      blockDates.forEach((d, i) => {
        const x = hx + i * colWidth;
        doc.setFillColor(...PDF_COLORS.navy);
        doc.rect(x, cursorY, colWidth, rowHeight, "F");
        doc.text(dm(d), x + colWidth / 2, cursorY + rowHeight / 2 + 1.4, { align: "center" });
      });
      cursorY += rowHeight;

      rows.forEach((row, ri) => {
        if (cursorY + rowHeight > pageHeight - 20) {
          doc.addPage("a4", "landscape");
          cursorY = 20;
        }
        const bg = ri % 2 === 0 ? PDF_COLORS.white : PDF_COLORS.sunken;
        doc.setDrawColor(...PDF_COLORS.border);
        doc.setLineWidth(0.15);
        doc.setFillColor(...bg);
        doc.rect(MARGIN, cursorY, labelWidth, rowHeight, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.8);
        doc.setTextColor(...PDF_COLORS.ink);
        doc.text(fitText(doc, row.label, labelWidth - 4), MARGIN + 2, cursorY + rowHeight / 2 + 1.4);

        let ex = MARGIN + labelWidth;
        extraHeaders.forEach((h, hi) => {
          doc.setFillColor(...bg);
          doc.rect(ex, cursorY, h.width, rowHeight, "FD");
          const val = row.extra?.[hi] ?? "—";
          doc.text(fitText(doc, val, h.width - 4), ex + 2, cursorY + rowHeight / 2 + 1.4);
          ex += h.width;
        });

        blockDates.forEach((d, ci) => {
          const x = ex + ci * colWidth;
          doc.setFillColor(...bg);
          doc.rect(x, cursorY, colWidth, rowHeight, "FD");

          const current = pointage.get(`${row.id}:${d}`) ?? "";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const field = new (doc as any).AcroFormComboBox();
          field.fieldName = `pointage_${fieldSeq++}_${row.id}_${d}`;
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
      cursorY += 7;
    });
  }

  drawGrid(
    "Personnel",
    "Nom",
    personnel.map((p) => ({ id: p.id, label: p.nom })),
    [],
  );
  drawGrid(
    "Équipements",
    "Désignation",
    equipements.map((e) => {
      const bl = bls.find((b) => b.id === e.bl_id);
      return { id: e.id, label: e.designation.split("\n")[0], extra: [e.numero_serie ?? "—", bl?.numero_bl ?? "—"] };
    }),
    [
      { header: "N° série", width: 20 },
      { header: "N° BL", width: 24 },
    ],
  );

  drawFooter(doc);
  doc.save(`ServiceTicket-Fiche-${affaire.reference}.pdf`);
}
