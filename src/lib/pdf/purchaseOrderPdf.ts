import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fmtDate } from "@/lib/format";
import { drawFooter, drawInfoCard, drawLetterhead, MARGIN, tableTheme } from "@/lib/pdf/pdfTheme";
import type { Affaire, Client, PurchaseOrder, ToolListItem } from "@/lib/types";

export function generatePurchaseOrderPdf(po: PurchaseOrder, affaire: Affaire, client: Client | null, items: ToolListItem[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const cursorY = drawLetterhead(doc, "BON DE COMMANDE", "Purchase Order");

  const infoY = drawInfoCard(
    doc,
    [
      { label: "PO N°", value: po.numero },
      { label: "Date", value: fmtDate(po.created_at) },
      { label: "Job N°", value: affaire.reference },
      { label: "Client", value: client?.raison_sociale ?? "—" },
      { label: "Désignation", value: po.designation ?? "—" },
      { label: "Fournisseur", value: po.fournisseur ?? "—" },
      { label: "Statut", value: po.statut },
    ],
    cursorY,
  );

  let finalY = infoY;
  if (items.length > 0) {
    autoTable(doc, {
      startY: infoY,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Ref", "Désignation", "N° série", "Diamètre souhaité", "Observations"]],
      body: items.map((item) => [
        String(item.item_index),
        item.designation,
        item.numero_serie ?? "—",
        item.diametre_souhaite ?? "—",
        item.observations ?? "",
      ]),
      ...tableTheme(),
      columnStyles: { 1: { cellWidth: 55 } },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    finalY = (doc as any).lastAutoTable.finalY as number;
  }

  if (po.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.6);
    doc.setTextColor(30, 34, 44);
    doc.text("Notes", MARGIN, finalY + 8);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(po.notes, doc.internal.pageSize.getWidth() - MARGIN * 2), MARGIN, finalY + 13);
  }

  drawFooter(doc);
  doc.save(`${po.numero}.pdf`);
}
