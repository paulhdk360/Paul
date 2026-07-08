import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fmtDate, fmtNum } from "@/lib/format";
import { drawFooter, drawInfoCard, drawLetterhead, MARGIN, tableTheme } from "@/lib/pdf/pdfTheme";
import type { Affaire, BonLivraison, Client, ToolListItem } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function finalY(doc: jsPDF): number {
  return (doc as any).lastAutoTable.finalY;
}

export function generateToolListPdf(items: ToolListItem[], bls: BonLivraison[], affaire: Affaire, client: Client | null) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const cursorY = drawLetterhead(doc, "TOOL LIST", "Liste de matériel");

  const infoY = drawInfoCard(
    doc,
    [
      { label: "N° Dossier", value: affaire.reference },
      { label: "Client", value: client?.raison_sociale ?? "—" },
      { label: "Chantier", value: affaire.chantier ?? affaire.well_location ?? "—" },
      { label: "Faite le", value: fmtDate(new Date().toISOString()) },
    ],
    cursorY,
    2,
  );

  autoTable(doc, {
    startY: infoY,
    margin: { left: MARGIN, right: MARGIN },
    head: [["#", "Réf. article", "N° de série", "Désignation", "Propriétaire", "Poids (kg)", "Dimensions", "Colisage", "Observations", "N° BL", "Statut"]],
    body: items.map((item) => [
      String(item.item_index),
      item.reference_article ?? "—",
      item.numero_serie ?? "—",
      item.designation,
      item.proprietaire ?? "—",
      item.poids_kg ? String(item.poids_kg) : "—",
      item.dimensions ?? "—",
      item.colisage ?? "—",
      item.observations ?? "",
      bls.find((bl) => bl.id === item.bl_id)?.numero_bl ?? "—",
      item.statut,
    ]),
    ...tableTheme(),
    styles: { ...tableTheme().styles, fontSize: 7.2 },
    headStyles: { ...tableTheme().headStyles, fontSize: 6.8, cellPadding: 1.8 },
    columnStyles: {
      0: { cellWidth: 6 },
      1: { cellWidth: 18 },
      2: { cellWidth: 18 },
      3: { cellWidth: 28 },
      4: { cellWidth: 16 },
      5: { cellWidth: 14 },
      6: { cellWidth: 24 },
      7: { cellWidth: 16 },
      8: { cellWidth: 18 },
      9: { cellWidth: 8 },
      10: { cellWidth: 16 },
    },
  });

  const poidsTotal = items.reduce((sum, item) => sum + (item.poids_kg || 0), 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(11, 46, 107);
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(`Poids total : ${fmtNum(poidsTotal)} kg`, pageWidth - MARGIN, finalY(doc) + 7, { align: "right" });

  drawFooter(doc);
  doc.save(`ToolList-${affaire.reference}.pdf`);
}
