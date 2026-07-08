import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fmtDate, fmtEUR } from "@/lib/format";
import { monthLabel } from "@/lib/calendar";
import { drawFooter, drawInfoCard, drawLetterhead, drawTotalCard, MARGIN, tableTheme } from "@/lib/pdf/pdfTheme";
import type { EquipementTotalRow, PersonnelTotalRow } from "@/lib/serviceTicketTotals";
import type { Affaire, Client, ServiceTicket } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function finalY(doc: jsPDF): number {
  return (doc as any).lastAutoTable.finalY;
}

export function generateRecapFacturationPdf(params: {
  affaire: Affaire;
  client: Client | null;
  ticket: ServiceTicket;
  monthKey: string;
  personnelTotals: PersonnelTotalRow[];
  equipementTotals: EquipementTotalRow[];
  transportTotal: number;
  includeTransport: boolean;
  personnelTotal: number;
  equipementTotal: number;
  grandTotal: number;
}) {
  const { affaire, client, ticket, monthKey, personnelTotals, equipementTotals, transportTotal, includeTransport, personnelTotal, equipementTotal, grandTotal } = params;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let cursorY = drawLetterhead(doc, "RÉCAP FACTURATION", monthLabel(monthKey));

  cursorY = drawInfoCard(
    doc,
    [`Client: ${client?.raison_sociale ?? ticket.client_nom ?? "—"}`, `Job N°: ${affaire.reference}`],
    [`Well / Location: ${ticket.well_location ?? affaire.well_location ?? affaire.chantier ?? "—"}`, `Mois facturé: ${monthLabel(monthKey)} (édité le ${fmtDate(new Date().toISOString())})`],
    cursorY,
  );

  if (personnelTotals.length) {
    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Personnel", "Jours MOB", "Jours DEMOB", "Jours S", "Jours O", "Total €"]],
      body: personnelTotals.map((row) => [row.personnel.nom, String(row.joursMob), String(row.joursDemob), String(row.joursS), String(row.joursO), fmtEUR(row.total)]),
      ...tableTheme(),
    });
    cursorY = finalY(doc) + 9;
  }

  if (equipementTotals.length) {
    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Équipement", "N° série", "J. SB", "J. Op.", "Stand By €", "Operation €", "Insp. €", "Restock. €", "Serrage €", "LIH €", "UC €", "Total €"]],
      body: equipementTotals.map((row) => [
        row.item.designation.split("\n")[0],
        row.item.numero_serie ?? "—",
        String(row.joursStandBy),
        String(row.joursOperation),
        fmtEUR(row.montantStandBy),
        fmtEUR(row.montantOperation),
        fmtEUR(row.inspection),
        fmtEUR(row.restocking),
        fmtEUR(row.serrage),
        fmtEUR(row.lih),
        fmtEUR(row.uc),
        fmtEUR(row.total),
      ]),
      ...tableTheme(),
      styles: { ...tableTheme().styles, fontSize: 6.8 },
      columnStyles: { 0: { cellWidth: 28 } },
    });
    cursorY = finalY(doc) + 9;
  }

  const totalLines = [
    { label: "Sous-total Personnel", value: fmtEUR(personnelTotal) },
    { label: "Sous-total Équipements", value: fmtEUR(equipementTotal) },
    ...(includeTransport ? [{ label: "Transport (période complète)", value: fmtEUR(transportTotal) }] : []),
    { label: "Total à envoyer", value: fmtEUR(grandTotal), strong: true },
  ];

  if (cursorY > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage();
    cursorY = 20;
  }
  drawTotalCard(doc, totalLines, cursorY);

  drawFooter(doc);
  doc.save(`RecapFacturation-${affaire.reference}-${monthKey}.pdf`);
}
