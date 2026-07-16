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
    head: [["#", "Désignation", "Diamètre souhaité", "N° de série", "Observations"]],
    body: items.map((item) => [
      String(item.item_index),
      item.designation,
      item.diametre_souhaite ?? "—",
      item.numero_serie ?? "—",
      item.observations ?? "",
    ]),
    ...tableTheme(),
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 60 },
      2: { cellWidth: 30 },
      3: { cellWidth: 26 },
      4: { cellWidth: 58 },
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
