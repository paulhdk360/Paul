import type { jsPDF } from "jspdf";
import { COMPANY } from "@/lib/company";

export const MARGIN = 14;

export const PDF_COLORS = {
  navy: [11, 46, 107] as [number, number, number],
  blue: [41, 171, 226] as [number, number, number],
  ink: [30, 34, 44] as [number, number, number],
  muted: [104, 112, 128] as [number, number, number],
  border: [221, 227, 236] as [number, number, number],
  sunken: [243, 246, 251] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

// Navy letterhead band with a simple vector logo mark (no image asset needed)
// and a right-aligned document title. Returns the Y cursor to continue at.
export function drawLetterhead(doc: jsPDF, title: string, subtitle?: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...PDF_COLORS.navy);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setFillColor(...PDF_COLORS.blue);
  doc.rect(0, 28, pageWidth, 1.2, "F");

  doc.setFillColor(...PDF_COLORS.white);
  doc.roundedRect(MARGIN, 6, 15, 15, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PDF_COLORS.navy);
  doc.text("E", MARGIN + 7.5, 16.3, { align: "center" });

  doc.setTextColor(...PDF_COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(COMPANY.nom, MARGIN + 20, 12.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(COMPANY.web, MARGIN + 20, 17.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.5);
  doc.text(title, pageWidth - MARGIN, 13, { align: "right" });
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.3);
    doc.text(subtitle, pageWidth - MARGIN, 19, { align: "right" });
  }

  return 37;
}

// Rounded metadata card (client / job / date fields) shown as two columns.
export function drawInfoCard(doc: jsPDF, left: string[], right: string[], startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const rows = Math.max(left.length, right.length);
  const height = rows * 5 + 7;

  doc.setFillColor(...PDF_COLORS.sunken);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(MARGIN, startY, pageWidth - MARGIN * 2, height, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.6);
  doc.setTextColor(...PDF_COLORS.ink);
  left.forEach((line, i) => doc.text(line, MARGIN + 4.5, startY + 7.5 + i * 5));
  right.forEach((line, i) => doc.text(line, pageWidth / 2 + 4, startY + 7.5 + i * 5));

  return startY + height + 7;
}

// Section heading with a short accent underline, matching the brand blue.
export function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...PDF_COLORS.navy);
  doc.text(text, MARGIN, y);
  doc.setDrawColor(...PDF_COLORS.blue);
  doc.setLineWidth(0.7);
  doc.line(MARGIN, y + 1.5, MARGIN + 20, y + 1.5);
  return y + 6;
}

// Shared autoTable styling so every document reads as one consistent system.
export function tableTheme(headColor: [number, number, number] = PDF_COLORS.navy) {
  return {
    styles: {
      fontSize: 7.8,
      cellPadding: 1.9,
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
    },
    alternateRowStyles: { fillColor: PDF_COLORS.sunken },
  };
}

// A bordered highlight card used for grand-total / summary blocks.
export function drawTotalCard(doc: jsPDF, lines: { label: string; value: string; strong?: boolean }[], y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const width = 82;
  const x = pageWidth - MARGIN - width;
  const height = lines.length * 5.6 + 6;

  doc.setDrawColor(...PDF_COLORS.border);
  doc.setFillColor(...PDF_COLORS.white);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 2, 2, "FD");

  lines.forEach((line, i) => {
    const ly = y + 6.5 + i * 5.6;
    if (line.strong) {
      doc.setDrawColor(...PDF_COLORS.blue);
      doc.setLineWidth(0.4);
      doc.line(x + 3, ly - 4, x + width - 3, ly - 4);
    }
    doc.setFont("helvetica", line.strong ? "bold" : "normal");
    doc.setFontSize(line.strong ? 9.5 : 8.3);
    doc.setTextColor(...(line.strong ? PDF_COLORS.navy : PDF_COLORS.muted));
    doc.text(line.label, x + 3, ly);
    doc.text(line.value, x + width - 3, ly, { align: "right" });
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
