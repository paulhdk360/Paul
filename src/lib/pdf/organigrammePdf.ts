import { jsPDF } from "jspdf";
import { CATEGORIE_PERSONNEL_LABELS } from "@/lib/company";
import { drawFooter, drawLetterhead, MARGIN, PDF_COLORS } from "@/lib/pdf/pdfTheme";
import { groupEmployesForOrganigramme } from "@/lib/orgchart";
import type { Employe } from "@/lib/types";

const CATEGORIE_COLOR: Record<string, [number, number, number]> = {
  bureaux: PDF_COLORS.blue,
  consultant: [139, 92, 246],
  atelier: [201, 138, 30],
  chantier: [28, 154, 108],
};

const CARD_WIDTH = 46;
const CARD_HEIGHT = 15;
const CARD_GAP_X = 4;
const CARD_GAP_Y = 4;
const SUBGROUP_GAP = 6;

// Draws one section per personnel category (Bureaux / Consultant / Atelier /
// Opérateur), each sub-grouped by spécialité when applicable, as a simple
// flowing grid of cards — mirrors the on-screen bubble layout in
// OrganigrammeManager instead of a manager-hierarchy tree.
export function generateOrganigrammePdf(employes: Employe[]) {
  const groups = groupEmployesForOrganigramme(employes);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - MARGIN * 2;
  const cardsPerRow = Math.max(1, Math.floor((usableWidth + CARD_GAP_X) / (CARD_WIDTH + CARD_GAP_X)));

  let cursorY = drawLetterhead(doc, "ORGANIGRAMME", `${employes.length} collaborateur(s)`);

  function ensureSpace(needed: number) {
    if (cursorY + needed > pageHeight - 18) {
      drawFooter(doc);
      doc.addPage();
      cursorY = MARGIN + 4;
    }
  }

  for (const { categorie, groupes } of groups) {
    const color = CATEGORIE_COLOR[categorie] ?? PDF_COLORS.navy;
    const total = groupes.reduce((sum, g) => sum + g.membres.length, 0);

    ensureSpace(12);
    doc.setFillColor(...color);
    doc.circle(MARGIN + 1.4, cursorY - 1.2, 1.4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...PDF_COLORS.navy);
    doc.text(`${CATEGORIE_PERSONNEL_LABELS[categorie]} (${total})`, MARGIN + 5.5, cursorY);
    cursorY += 6;

    for (const g of groupes) {
      if (g.label) {
        ensureSpace(6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...PDF_COLORS.muted);
        doc.text(g.label.toUpperCase(), MARGIN, cursorY);
        cursorY += 4.5;
      }

      let col = 0;
      for (const m of g.membres) {
        ensureSpace(CARD_HEIGHT + 2);
        if (col === cardsPerRow) {
          col = 0;
          cursorY += CARD_HEIGHT + CARD_GAP_Y;
          ensureSpace(CARD_HEIGHT + 2);
        }
        const x = MARGIN + col * (CARD_WIDTH + CARD_GAP_X);
        const y = cursorY;
        doc.setFillColor(...PDF_COLORS.white);
        doc.setDrawColor(...PDF_COLORS.border);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, CARD_WIDTH, CARD_HEIGHT, 1.6, 1.6, "FD");
        doc.setFillColor(...color);
        doc.roundedRect(x, y, 1.4, CARD_HEIGHT, 0.7, 0.7, "F");

        const nom = `${m.prenom ? `${m.prenom} ` : ""}${m.nom}`;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.2);
        doc.setTextColor(...PDF_COLORS.ink);
        doc.text(doc.splitTextToSize(nom, CARD_WIDTH - 5), x + 3, y + 5.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(...PDF_COLORS.muted);
        doc.text(doc.splitTextToSize(m.fonction || CATEGORIE_PERSONNEL_LABELS[m.categorie], CARD_WIDTH - 5), x + 3, y + 10.5);

        col += 1;
      }
      cursorY += CARD_HEIGHT + SUBGROUP_GAP;
      col = 0;
    }
    cursorY += 4;
  }

  drawFooter(doc);
  doc.save(`Organigramme-${new Date().toISOString().slice(0, 10)}.pdf`);
}
