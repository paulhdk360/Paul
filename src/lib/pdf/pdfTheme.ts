import type { jsPDF } from "jspdf";
import { COMPANY } from "@/lib/company";
import { LOGO_WHITE_ASPECT, LOGO_WHITE_PNG } from "@/lib/pdf/logo";

export const MARGIN = 14;

export const PDF_COLORS = {
  navy: [11, 46, 107] as [number, number, number],
  navyDark: [7, 32, 78] as [number, number, number],
  blue: [41, 171, 226] as [number, number, number],
  ink: [30, 34, 44] as [number, number, number],
  muted: [104, 112, 128] as [number, number, number],
  border: [221, 227, 236] as [number, number, number],
  sunken: [243, 246, 251] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const LETTERHEAD_HEIGHT = 32;

// Navy letterhead band with the real Enedril logo (white cutout, embedded as
// a data URI so PDF generation stays fully synchronous), a subtle depth
// layer and corner accent, and a right-aligned document title pill.
// Returns the Y cursor to continue at.
export function drawLetterhead(doc: jsPDF, title: string, subtitle?: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...PDF_COLORS.navy);
  doc.rect(0, 0, pageWidth, LETTERHEAD_HEIGHT, "F");
  // Darker base layer peeking out at the bottom for a bit of depth, plus a
  // soft diagonal wedge of brand blue in the corner instead of a flat band.
  doc.setFillColor(...PDF_COLORS.navyDark);
  doc.rect(0, LETTERHEAD_HEIGHT - 2.2, pageWidth, 2.2, "F");
  doc.setFillColor(...PDF_COLORS.blue);
  doc.triangle(pageWidth - 46, 0, pageWidth, 0, pageWidth, LETTERHEAD_HEIGHT - 2.2, "F");
  doc.setFillColor(...PDF_COLORS.navy);
  doc.triangle(pageWidth - 34, 0, pageWidth - 8, 0, pageWidth, LETTERHEAD_HEIGHT - 2.2, "F");

  const logoHeight = 13.5;
  const logoWidth = logoHeight * LOGO_WHITE_ASPECT;
  doc.addImage(LOGO_WHITE_PNG, "PNG", MARGIN, (LETTERHEAD_HEIGHT - 2.2 - logoHeight) / 2, logoWidth, logoHeight);

  doc.setTextColor(...PDF_COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(title, pageWidth - MARGIN, 14.5, { align: "right" });
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.6);
    doc.text(subtitle, pageWidth - MARGIN, 21, { align: "right" });
  }

  return LETTERHEAD_HEIGHT + 9;
}

export interface InfoField {
  label: string;
  value: string;
}

// Metadata "spec sheet" card (client / job / date fields) laid out as a grid
// of labelled fields — small caps muted label above a bold value, separated
// by soft column dividers — instead of a flat block of plain text lines.
export function drawInfoCard(doc: jsPDF, fields: InfoField[], startY: number, columns = 3): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const cardWidth = pageWidth - MARGIN * 2;
  const padLeft = 7;
  const colWidth = (cardWidth - padLeft - 4) / columns;
  const rowHeight = 11.5;

  // Pre-wrap every value (max 2 lines) so row heights account for overflow
  // before the card background is drawn. splitTextToSize measures using
  // whichever font is currently active, so it must match the bold font the
  // values are actually rendered in below — otherwise it underestimates the
  // rendered width and text overflows into the next column.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.3);
  const wrapped = fields.map((f) => doc.splitTextToSize(f.value || "—", colWidth - 4).slice(0, 2) as string[]);
  const rows = Math.ceil(fields.length / columns);
  let height = 8;
  for (let r = 0; r < rows; r++) {
    const rowFields = wrapped.slice(r * columns, r * columns + columns);
    const maxLines = Math.max(1, ...rowFields.map((w) => w.length));
    height += rowHeight + (maxLines - 1) * 4;
  }

  doc.setFillColor(...PDF_COLORS.sunken);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(MARGIN, startY, cardWidth, height, 2.6, 2.6, "FD");
  doc.setFillColor(...PDF_COLORS.blue);
  doc.roundedRect(MARGIN, startY, 1.6, height, 0.8, 0.8, "F");

  let cursorY = startY + 8;
  for (let r = 0; r < rows; r++) {
    const rowFields = wrapped.slice(r * columns, r * columns + columns);
    const maxLines = Math.max(1, ...rowFields.map((w) => w.length));
    for (let c = 0; c < rowFields.length; c++) {
      const i = r * columns + c;
      const x = MARGIN + padLeft + c * colWidth;

      if (c > 0) {
        doc.setDrawColor(...PDF_COLORS.border);
        doc.setLineWidth(0.2);
        doc.line(x - 5, cursorY - 5.5, x - 5, cursorY + rowHeight - 6.5 + (maxLines - 1) * 4);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.6);
      doc.setTextColor(...PDF_COLORS.muted);
      doc.text(fields[i].label.toUpperCase(), x, cursorY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.3);
      doc.setTextColor(...PDF_COLORS.ink);
      doc.text(wrapped[i], x, cursorY + 4.6);
    }
    cursorY += rowHeight + (maxLines - 1) * 4;
  }

  return startY + height + 8;
}

// Section heading with a small filled accent chip, matching the brand blue.
export function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFillColor(...PDF_COLORS.blue);
  doc.roundedRect(MARGIN, y - 3.6, 2.6, 2.6, 0.6, 0.6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.8);
  doc.setTextColor(...PDF_COLORS.navy);
  doc.text(text, MARGIN + 5, y);
  return y + 6.5;
}

// Shared autoTable styling so every document reads as one consistent system.
export function tableTheme(headColor: [number, number, number] = PDF_COLORS.navy) {
  return {
    styles: {
      fontSize: 7.8,
      cellPadding: 2.4,
      textColor: PDF_COLORS.ink,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.15,
      valign: "middle" as const,
    },
    headStyles: {
      fillColor: headColor,
      textColor: PDF_COLORS.white,
      fontStyle: "bold" as const,
      fontSize: 7.6,
      halign: "left" as const,
      valign: "middle" as const,
      cellPadding: 2.8,
    },
    alternateRowStyles: { fillColor: PDF_COLORS.sunken },
  };
}

// A bordered highlight card used for grand-total / summary blocks, with a
// soft drop-shadow effect and a brand-blue top accent bar.
export function drawTotalCard(doc: jsPDF, lines: { label: string; value: string; strong?: boolean }[], y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const width = 84;
  const x = pageWidth - MARGIN - width;
  const height = lines.length * 5.6 + 7;

  doc.setFillColor(...PDF_COLORS.border);
  doc.roundedRect(x + 0.8, y + 0.8, width, height, 2.4, 2.4, "F");
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setFillColor(...PDF_COLORS.white);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 2.4, 2.4, "FD");
  doc.setFillColor(...PDF_COLORS.blue);
  doc.roundedRect(x, y, width, 1.6, 2.4, 2.4, "F");
  doc.rect(x, y + 1, width, 0.6, "F");

  lines.forEach((line, i) => {
    const ly = y + 7.5 + i * 5.6;
    if (line.strong) {
      doc.setDrawColor(...PDF_COLORS.blue);
      doc.setLineWidth(0.4);
      doc.line(x + 3.5, ly - 4, x + width - 3.5, ly - 4);
    }
    doc.setFont("helvetica", line.strong ? "bold" : "normal");
    doc.setFontSize(line.strong ? 9.8 : 8.3);
    doc.setTextColor(...(line.strong ? PDF_COLORS.navy : PDF_COLORS.muted));
    doc.text(line.label, x + 3.5, ly);
    doc.text(line.value, x + width - 3.5, ly, { align: "right" });
  });

  return y + height;
}

// Border + page numbers + company line, applied to every page after content is final.
export function drawFooter(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...PDF_COLORS.blue);
    doc.rect(MARGIN, pageHeight - 13, 14, 0.6, "F");
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, pageHeight - 12.5, pageWidth - MARGIN, pageHeight - 12.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text(
      `${COMPANY.nom} — ${COMPANY.adresse} — ${COMPANY.tel} — ${COMPANY.web} — SIRET ${COMPANY.siret} — TVA ${COMPANY.tva}`,
      MARGIN,
      pageHeight - 7.5,
    );
    doc.text(`Page ${i} / ${pageCount}`, pageWidth - MARGIN, pageHeight - 7.5, { align: "right" });
  }
}
