import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { COMPANY } from "@/lib/company";
import { fmtDate, fmtEUR } from "@/lib/format";
import { computeEquipementTotals, computePersonnelTotals, computeTransportTotal } from "@/lib/serviceTicketTotals";
import type {
  Affaire,
  BonLivraison,
  Client,
  PointageCode,
  ServiceTicket,
  ServiceTicketPersonnel,
  ServiceTicketTransport,
  ToolListItem,
} from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function finalY(doc: jsPDF): number {
  return (doc as any).lastAutoTable.finalY;
}

export function generateServiceTicketPdf(params: {
  ticket: ServiceTicket;
  personnel: ServiceTicketPersonnel[];
  transport: ServiceTicketTransport[];
  equipements: ToolListItem[];
  bls: BonLivraison[];
  dates: string[];
  pointage: Map<string, PointageCode>;
  affaire: Affaire;
  client: Client | null;
  variant: "interne" | "operateur";
}) {
  const { ticket, personnel, transport, equipements, bls, dates, pointage, affaire, client, variant } = params;
  const showPrices = variant === "interne";

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(11, 46, 107);
  doc.text(showPrices ? "SERVICE TICKET · ENEDRIL" : "SERVICE TICKET · OPÉRATEUR", pageWidth / 2, 16, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const left = [
    `Client: ${client?.raison_sociale ?? ticket.client_nom ?? "—"}`,
    `Job N°: ${affaire.reference}`,
    `Well / Location: ${ticket.well_location ?? affaire.well_location ?? affaire.chantier ?? "—"}`,
  ];
  const right = [
    `Opérateur: ${ticket.operateur_nom ?? "—"}`,
    `Période: ${ticket.period_start ? fmtDate(ticket.period_start) : "—"} → ${ticket.period_end ? fmtDate(ticket.period_end) : "—"}`,
  ];
  left.forEach((line, i) => doc.text(line, margin, 26 + i * 5));
  right.forEach((line, i) => doc.text(line, pageWidth / 2 + 4, 26 + i * 5));

  let cursorY = 44;

  const personnelTotals = computePersonnelTotals(personnel, dates, pointage);
  if (personnelTotals.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(11, 46, 107);
    doc.text("A — Personnel", margin, cursorY);
    autoTable(doc, {
      startY: cursorY + 2,
      margin: { left: margin, right: margin },
      head: showPrices
        ? [["Nom", "Société", "Jours S", "Jours O", "Mob €", "Demob €", "Tarif/j €", "Total €"]]
        : [["Nom", "Société", "Jours S", "Jours O"]],
      body: personnelTotals.map((row) =>
        showPrices
          ? [
              row.personnel.nom,
              row.personnel.societe ?? "—",
              String(row.joursS),
              String(row.joursO),
              fmtEUR(row.personnel.tarif_mob),
              fmtEUR(row.personnel.tarif_demob),
              fmtEUR(row.personnel.tarif_jour),
              fmtEUR(row.total),
            ]
          : [row.personnel.nom, row.personnel.societe ?? "—", String(row.joursS), String(row.joursO)],
      ),
      styles: { fontSize: 7.5, cellPadding: 1.6 },
      headStyles: { fillColor: [11, 46, 107], textColor: 255 },
    });
    cursorY = finalY(doc) + 8;
  }

  if (transport.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(11, 46, 107);
    doc.text("B — Transport & prestations ponctuelles", margin, cursorY);
    autoTable(doc, {
      startY: cursorY + 2,
      margin: { left: margin, right: margin },
      head: showPrices ? [["Désignation", "Code", "BL", "Qté", "Prix unit. €", "Total €"]] : [["Désignation", "Code", "BL", "Qté"]],
      body: transport.map((t) =>
        showPrices
          ? [t.designation, t.code, t.bl_reference ?? "—", String(t.quantite), fmtEUR(t.prix_unitaire), fmtEUR((t.prix_unitaire || 0) * (t.quantite || 0))]
          : [t.designation, t.code, t.bl_reference ?? "—", String(t.quantite)],
      ),
      styles: { fontSize: 7.5, cellPadding: 1.6 },
      headStyles: { fillColor: [20, 119, 198], textColor: 255 },
    });
    cursorY = finalY(doc) + 8;
  }

  if (cursorY > 240) {
    doc.addPage();
    cursorY = 16;
  }

  const equipementTotals = computeEquipementTotals(equipements, dates, pointage);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(11, 46, 107);
  doc.text(showPrices ? "C — Location d'équipements" : "Équipements", margin, cursorY);
  autoTable(doc, {
    startY: cursorY + 2,
    margin: { left: margin, right: margin },
    head: showPrices
      ? [["Réf.", "Désignation", "N° série", "BL", "J. SB", "J. Op.", "Stand By €", "Operation €", "Maint. €", "Insp. €", "Restock. €", "LIH €", "UC €", "Total €"]]
      : [["Réf.", "Désignation", "N° série", "BL", "J. SB", "J. Op."]],
    body: equipementTotals.map((row) => {
      const bl = bls.find((b) => b.id === row.item.bl_id);
      const base = [
        row.item.reference_article ?? "—",
        row.item.designation.split("\n")[0],
        row.item.numero_serie ?? "—",
        bl?.numero_bl ?? "—",
        String(row.joursStandBy),
        String(row.joursOperation),
      ];
      if (!showPrices) return base;
      return [
        ...base,
        fmtEUR(row.montantStandBy),
        fmtEUR(row.montantOperation),
        fmtEUR(row.maintenance),
        fmtEUR(row.inspection),
        fmtEUR(row.restocking),
        fmtEUR(row.lih),
        fmtEUR(row.uc),
        fmtEUR(row.total),
      ];
    }),
    styles: { fontSize: 6.5, cellPadding: 1.4 },
    headStyles: { fillColor: [41, 171, 226], textColor: 255 },
    columnStyles: { 1: { cellWidth: showPrices ? 30 : 55 } },
  });
  cursorY = finalY(doc) + 8;

  if (showPrices) {
    const personnelTotal = personnelTotals.reduce((s, r) => s + r.total, 0);
    const transportTotal = computeTransportTotal(transport);
    const equipementTotal = equipementTotals.reduce((s, r) => s + r.total, 0);
    const grandTotal = personnelTotal + transportTotal + equipementTotal;

    if (cursorY > 260) {
      doc.addPage();
      cursorY = 16;
    }
    doc.setFontSize(9.5);
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "normal");
    doc.text(`Sous-total Personnel : ${fmtEUR(personnelTotal)}`, pageWidth - margin, cursorY, { align: "right" });
    doc.text(`Sous-total Transport & prestations : ${fmtEUR(transportTotal)}`, pageWidth - margin, cursorY + 5, { align: "right" });
    doc.text(`Sous-total Équipements : ${fmtEUR(equipementTotal)}`, pageWidth - margin, cursorY + 10, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(`Total général HT : ${fmtEUR(grandTotal)}`, pageWidth - margin, cursorY + 17, { align: "right" });
  }

  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`${COMPANY.nom} — ${COMPANY.adresse} — ${COMPANY.tel} — ${COMPANY.web}`, pageWidth / 2, pageHeight - 8, {
    align: "center",
  });

  doc.save(`ServiceTicket-${showPrices ? "Enedril" : "Operateur"}-${affaire.reference}.pdf`);
}
