import { jsPDF } from "jspdf";
import { CATEGORIE_PERSONNEL_LABELS } from "@/lib/company";
import { drawFooter, drawLetterhead, MARGIN, PDF_COLORS } from "@/lib/pdf/pdfTheme";
import { buildOrgTree, flattenOrgTree, orgTreeMaxDepth, orgTreeTotalWidth, type OrgNode } from "@/lib/orgchart";
import type { Employe } from "@/lib/types";

const CATEGORIE_COLOR: Record<string, [number, number, number]> = {
  bureaux: PDF_COLORS.blue,
  atelier: [201, 138, 30],
  chantier: [28, 154, 108],
};

// Draws the same tree the on-screen organigramme shows (see src/lib/orgchart.ts
// for the layout algorithm — leaves get one unit, parents center over their
// children), as boxes connected by T-shaped lines, instead of trying to
// screenshot the DOM.
export function generateOrganigrammePdf(employes: Employe[]) {
  const nodes = buildOrgTree(employes);
  const flat = flattenOrgTree(nodes);
  const totalUnits = Math.max(orgTreeTotalWidth(nodes), 1);
  const maxDepth = orgTreeMaxDepth(nodes);

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = drawLetterhead(doc, "ORGANIGRAMME", `${employes.length} collaborateur(s)`);

  const usableWidth = pageWidth - MARGIN * 2;
  const unitWidth = Math.max(24, Math.min(46, usableWidth / totalUnits));
  const boxWidth = unitWidth - 6;
  const boxHeight = 16;
  const rowHeight = 30;

  const xFor = (n: OrgNode) => MARGIN + n.x * unitWidth;
  const yFor = (n: OrgNode) => cursorY + n.depth * rowHeight;

  function drawConnectors(n: OrgNode) {
    if (!n.children.length) return;
    const parentX = xFor(n);
    const parentBottom = yFor(n) + boxHeight;
    const midY = parentBottom + (rowHeight - boxHeight) / 2;
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.4);
    doc.line(parentX, parentBottom, parentX, midY);
    const firstX = xFor(n.children[0]);
    const lastX = xFor(n.children[n.children.length - 1]);
    doc.line(firstX, midY, lastX, midY);
    for (const c of n.children) {
      doc.line(xFor(c), midY, xFor(c), yFor(c));
      drawConnectors(c);
    }
  }
  nodes.forEach(drawConnectors);

  for (const n of flat) {
    const x = xFor(n) - boxWidth / 2;
    const y = yFor(n);
    doc.setFillColor(...PDF_COLORS.white);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, boxWidth, boxHeight, 1.6, 1.6, "FD");
    doc.setFillColor(...(CATEGORIE_COLOR[n.employe.categorie] ?? PDF_COLORS.navy));
    doc.roundedRect(x, y, 1.4, boxHeight, 0.7, 0.7, "F");

    const nom = `${n.employe.prenom ? `${n.employe.prenom} ` : ""}${n.employe.nom}`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.4);
    doc.setTextColor(...PDF_COLORS.ink);
    doc.text(doc.splitTextToSize(nom, boxWidth - 5), x + 3, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text(doc.splitTextToSize(n.employe.fonction || CATEGORIE_PERSONNEL_LABELS[n.employe.categorie], boxWidth - 5), x + 3, y + 11.5);
  }

  if (cursorY + (maxDepth + 1) * rowHeight > doc.internal.pageSize.getHeight() - 16) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text("Organigramme large — export PDF fourni à titre indicatif, se référer à l'écran pour le détail complet.", MARGIN, doc.internal.pageSize.getHeight() - 16);
  }

  drawFooter(doc);
  doc.save(`Organigramme-${new Date().toISOString().slice(0, 10)}.pdf`);
}
