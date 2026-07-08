import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { COMPANY } from "@/lib/company";
import type { Affaire, BonLivraison, Client, ToolListItem } from "@/lib/types";

export function generateBlPdf(bl: BonLivraison, items: ToolListItem[], affaire: Affaire, client: Client | null) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(11, 46, 107);
  doc.text("BON DE LIVRAISON · DELIVERY TICKET", pageWidth / 2, 16, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const left = [
    `BL N°: ${bl.numero_bl}`,
    `Job N°: ${affaire.reference}`,
    `Transport: ${bl.transporteur ?? "—"}`,
    `Chargement: ${bl.lieu_chargement ?? COMPANY.adresse}`,
  ];
  const right = [
    `Client: ${client?.raison_sociale ?? "—"}`,
    `Well: ${affaire.well_location ?? affaire.chantier ?? "—"}`,
    `PO Transport: ${bl.po_transport ?? "—"}`,
    `Livraison: ${bl.lieu_livraison ?? "—"}`,
  ];
  left.forEach((line, i) => doc.text(line, margin, 26 + i * 5));
  right.forEach((line, i) => doc.text(line, pageWidth / 2 + 4, 26 + i * 5));

  autoTable(doc, {
    startY: 50,
    margin: { left: margin, right: margin },
    head: [["Ref", "N° série", "Désignation", "Propriétaire", "Poids (kg)", "Dimensions", "Observations"]],
    body: items.map((item) => [
      String(item.item_index),
      item.numero_serie ?? "—",
      item.designation,
      item.proprietaire ?? "—",
      item.poids_kg ? String(item.poids_kg) : "—",
      item.dimensions ?? "—",
      item.observations ?? "",
    ]),
    styles: { fontSize: 8, cellPadding: 1.8 },
    headStyles: { fillColor: [11, 46, 107], textColor: 255 },
    columnStyles: { 2: { cellWidth: 60 } },
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `${COMPANY.nom} — ${COMPANY.adresse} — ${COMPANY.tel} — ${COMPANY.web}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" },
  );

  doc.save(`BL-${bl.numero_bl}.pdf`);
}
