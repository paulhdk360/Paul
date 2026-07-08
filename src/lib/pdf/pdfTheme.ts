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

// Rounded metadata card (client / job / date fields) shown as two columns,
// with a brand-blue accent tab on the left edge for a bit of visual weight.
export function drawInfoCard(doc: jsPDF, left: string[], right: string[], startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const rows = Math.max(left.length, right.length);
  const height = rows * 5.3 + 8;

  doc.setFillColor(...PDF_COLORS.sunken);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(MARGIN, startY, pageWidth - MARGIN * 2, height, 2.4, 2.4, "FD");
  doc.setFillColor(...PDF_COLORS.blue);
  doc.roundedRect(MARGIN, startY, 1.4, height, 0.7, 0.7, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.6);
  doc.setTextColor(...PDF_COLORS.ink);
  left.forEach((line, i) => doc.text(line, MARGIN + 5.5, startY + 8 + i * 5.3));
  right.forEach((line, i) => doc.text(line, pageWidth / 2 + 4, startY + 8 + i * 5.3));

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
      cellPadding: 2.2,
      textColor: PDF_COLORS.ink,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: headColor,
      textColor: PDF_COLORS.white,
      fontStyle: "bold" as const,
      fontSize: 7.6,
      halign: "left" as const,
      cellPadding: 2.4,
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
