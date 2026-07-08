import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { COMPANY } from "@/lib/company";
import { fmtNum } from "@/lib/format";
import { drawFooter, drawInfoCard, drawLetterhead, MARGIN, tableTheme } from "@/lib/pdf/pdfTheme";
import type { Affaire, BonLivraison, Client, ToolListItem } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function finalY(doc: jsPDF): number {
  return (doc as any).lastAutoTable.finalY;
}

export function generateBlPdf(bl: BonLivraison, items: ToolListItem[], affaire: Affaire, client: Client | null) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const cursorY = drawLetterhead(doc, "BON DE LIVRAISON", "Delivery Ticket");

  const infoY = drawInfoCard(
    doc,
    [
      { label: "BL N°", value: bl.numero_bl },
      { label: "Job N°", value: affaire.reference },
      { label: "Client", value: client?.raison_sociale ?? "—" },
      { label: "Transport", value: bl.transporteur ?? "—" },
      { label: "PO Transport", value: bl.po_transport ?? "—" },
      { label: "Well", value: affaire.well_location ?? affaire.chantier ?? "—" },
      { label: "Chargement", value: bl.lieu_chargement ?? COMPANY.adresse },
      { label: "Livraison", value: bl.lieu_livraison ?? "—" },
    ],
    cursorY,
  );

  autoTable(doc, {
    startY: infoY,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Ref", "N° série", "Désignation", "Propriétaire", "Poids (kg)", "Dimensions", "Colisage", "Observations"]],
    body: items.map((item) => [
      String(item.item_index),
      item.numero_serie ?? "—",
      item.designation,
      item.proprietaire ?? "—",
      item.poids_kg ? String(item.poids_kg) : "—",
      item.dimensions ?? "—",
      item.colisage ?? "—",
      item.observations ?? "",
    ]),
    ...tableTheme(),
    columnStyles: { 2: { cellWidth: 45 } },
  });

  const poidsTotal = items.reduce((sum, item) => sum + (item.poids_kg || 0), 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(11, 46, 107);
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(`Poids total : ${fmtNum(poidsTotal)} kg`, pageWidth - MARGIN, finalY(doc) + 7, { align: "right" });

  drawFooter(doc);
  doc.save(`BL-${bl.numero_bl}.pdf`);
}
