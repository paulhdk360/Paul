import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { COMPANY } from "@/lib/company";
import { drawFooter, drawInfoCard, drawLetterhead, MARGIN, tableTheme } from "@/lib/pdf/pdfTheme";
import type { Affaire, BonLivraison, Client, ToolListItem } from "@/lib/types";

export function generateBlPdf(bl: BonLivraison, items: ToolListItem[], affaire: Affaire, client: Client | null) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const cursorY = drawLetterhead(doc, "BON DE LIVRAISON", "Delivery Ticket");

  const infoY = drawInfoCard(
    doc,
    [`BL N°: ${bl.numero_bl}`, `Job N°: ${affaire.reference}`, `Transport: ${bl.transporteur ?? "—"}`, `Chargement: ${bl.lieu_chargement ?? COMPANY.adresse}`],
    [`Client: ${client?.raison_sociale ?? "—"}`, `Well: ${affaire.well_location ?? affaire.chantier ?? "—"}`, `PO Transport: ${bl.po_transport ?? "—"}`, `Livraison: ${bl.lieu_livraison ?? "—"}`],
    cursorY,
  );

  autoTable(doc, {
    startY: infoY,
    margin: { left: MARGIN, right: MARGIN },
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
    ...tableTheme(),
    columnStyles: { 2: { cellWidth: 55 } },
  });

  drawFooter(doc);
  doc.save(`BL-${bl.numero_bl}.pdf`);
}
