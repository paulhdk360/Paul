import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fmtDate, fmtNum } from "@/lib/format";
import { drawFooter, drawInfoCard, drawLetterhead, MARGIN, tableTheme } from "@/lib/pdf/pdfTheme";
import type { Affaire, BonLivraison, CatalogueOutil, Client, ToolListItem } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function finalY(doc: jsPDF): number {
  return (doc as any).lastAutoTable.finalY;
}

export function generateToolListPdf(items: ToolListItem[], bls: BonLivraison[], outils: CatalogueOutil[], affaire: Affaire, client: Client | null) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const outilById = new Map(outils.map((o) => [o.id, o]));

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

  // Matches exactly what the app's own Tool List table shows — the "Outil
  // catalogue" reference (+ diamètre souhaité when it differs) replaces the
  // free-text "Réf. article" as the item's identifier, alongside its N° de
  // série, rather than showing both.
  autoTable(doc, {
    startY: infoY,
    margin: { left: MARGIN, right: MARGIN },
    head: [["#", "Désignation", "Outil catalogue", "N° de série", "Propriétaire", "Observations", "N° BL", "Statut"]],
    body: items.map((item) => {
      const outil = item.outil_id ? outilById.get(item.outil_id) : undefined;
      const outilLabel = outil ? (outil.numero_article ?? outil.designation) + (item.diametre_souhaite ? ` (Ø ${item.diametre_souhaite})` : "") : "—";
      return [
        String(item.item_index),
        item.designation,
        outilLabel,
        item.numero_serie ?? "—",
        item.proprietaire ?? "—",
        item.observations ?? "",
        bls.find((bl) => bl.id === item.bl_id)?.numero_bl ?? "—",
        item.statut,
      ];
    }),
    ...tableTheme(),
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 50 },
      2: { cellWidth: 28 },
      3: { cellWidth: 20 },
      4: { cellWidth: 22 },
      5: { cellWidth: 30 },
      6: { cellWidth: 12 },
      7: { cellWidth: 12 },
    },
  });

  // Poids/dimensions/colisage are entered once for the whole shipment
  // (affaire-level), not tracked per line on the Tool List itself.
  if (affaire.tool_list_poids_total_kg || affaire.tool_list_dimensions || affaire.tool_list_colisage) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const lines: string[] = [];
    if (affaire.tool_list_poids_total_kg) lines.push(`Poids total : ${fmtNum(affaire.tool_list_poids_total_kg)} kg`);
    if (affaire.tool_list_dimensions) lines.push(`Dimensions : ${affaire.tool_list_dimensions}`);
    if (affaire.tool_list_colisage) lines.push(`Colisage : ${affaire.tool_list_colisage}`);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(11, 46, 107);
    let y = finalY(doc) + 7;
    lines.forEach((line) => {
      doc.text(line, pageWidth - MARGIN, y, { align: "right" });
      y += 5;
    });
  }

  drawFooter(doc);
  doc.save(`ToolList-${affaire.reference}.pdf`);
}
