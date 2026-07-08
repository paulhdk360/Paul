import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fmtDate } from "@/lib/format";
import { drawFooter, drawInfoCard, drawLetterhead, MARGIN, tableTheme } from "@/lib/pdf/pdfTheme";
import type { Affaire, BonLivraison, Client, ToolListItem } from "@/lib/types";

export function generateToolListPdf(items: ToolListItem[], bls: BonLivraison[], affaire: Affaire, client: Client | null) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const cursorY = drawLetterhead(doc, "TOOL LIST", "Liste de matériel");

  const infoY = drawInfoCard(
    doc,
    [`Client: ${client?.raison_sociale ?? "—"}`, `N° Dossier: ${affaire.reference}`],
    [`Chantier: ${affaire.chantier ?? affaire.well_location ?? "—"}`, `Faite le: ${fmtDate(new Date().toISOString())}`],
    cursorY,
  );

  autoTable(doc, {
    startY: infoY,
    margin: { left: MARGIN, right: MARGIN },
    head: [["#", "Réf. article", "N° de série", "Désignation", "Propriétaire", "Poids (kg)", "Dimensions", "Observations", "N° BL", "Statut"]],
    body: items.map((item) => [
      String(item.item_index),
      item.reference_article ?? "—",
      item.numero_serie ?? "—",
      item.designation,
      item.proprietaire ?? "—",
      item.poids_kg ? String(item.poids_kg) : "—",
      item.dimensions ?? "—",
      item.observations ?? "",
      bls.find((bl) => bl.id === item.bl_id)?.numero_bl ?? "—",
      item.statut,
    ]),
    ...tableTheme(),
    columnStyles: { 3: { cellWidth: 40 } },
  });

  drawFooter(doc);
  doc.save(`ToolList-${affaire.reference}.pdf`);
}
