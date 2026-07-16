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
  // (affaire-level), not tracked per line on the Tool List itself — always
  // shown as a clear summary card at the end rather than easy-to-miss small
  // print, even when a field hasn't been filled in yet.
  let summaryY = finalY(doc) + 8;
  if (summaryY > 265) {
    doc.addPage();
    summaryY = 20;
  }
  drawInfoCard(
    doc,
    [
      { label: "Poids total", value: affaire.tool_list_poids_total_kg ? `${fmtNum(affaire.tool_list_poids_total_kg)} kg` : "—" },
      { label: "Colisage", value: affaire.tool_list_colisage ?? "—" },
      { label: "Dimensions", value: affaire.tool_list_dimensions ?? "—" },
    ],
    summaryY,
    3,
  );

  drawFooter(doc);
  doc.save(`ToolList-${affaire.reference}.pdf`);
}
