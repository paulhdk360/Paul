import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { COMPANY } from "@/lib/company";
import { fmtDate } from "@/lib/format";
import type { Affaire, BonLivraison, Client, ToolListItem } from "@/lib/types";

export function generateToolListPdf(items: ToolListItem[], bls: BonLivraison[], affaire: Affaire, client: Client | null) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(11, 46, 107);
  doc.text("TOOL LIST · LISTE DE MATÉRIEL", pageWidth / 2, 16, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const left = [`Client: ${client?.raison_sociale ?? "—"}`, `N° Dossier: ${affaire.reference}`];
  const right = [`Chantier: ${affaire.chantier ?? affaire.well_location ?? "—"}`, `Faite le: ${fmtDate(new Date().toISOString())}`];
  left.forEach((line, i) => doc.text(line, margin, 26 + i * 5));
  right.forEach((line, i) => doc.text(line, pageWidth / 2 + 4, 26 + i * 5));

  autoTable(doc, {
    startY: 38,
    margin: { left: margin, right: margin },
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
    styles: { fontSize: 7.5, cellPadding: 1.6 },
    headStyles: { fillColor: [11, 46, 107], textColor: 255 },
    columnStyles: { 3: { cellWidth: 42 } },
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`${COMPANY.nom} — ${COMPANY.adresse} — ${COMPANY.tel} — ${COMPANY.web}`, pageWidth / 2, pageHeight - 8, {
    align: "center",
  });

  doc.save(`ToolList-${affaire.reference}.pdf`);
}
