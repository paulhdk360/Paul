import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fmtDate, fmtEUR } from "@/lib/format";
import { computeEquipementTotals, computePersonnelTotals, computeTransportTotal } from "@/lib/serviceTicketTotals";
import { drawFooter, drawInfoCard, drawLetterhead, drawTotalCard, MARGIN, sectionTitle, tableTheme, PDF_COLORS } from "@/lib/pdf/pdfTheme";
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
  const pageHeight = doc.internal.pageSize.getHeight();

  let cursorY = drawLetterhead(doc, "SERVICE TICKET", showPrices ? "Édition interne — avec tarification" : "Édition opérateur — sans tarification");

  cursorY = drawInfoCard(
    doc,
    [
      { label: "Job N°", value: affaire.reference },
      { label: "Client", value: client?.raison_sociale ?? ticket.client_nom ?? "—" },
      { label: "Well / Location", value: ticket.well_location ?? affaire.well_location ?? affaire.chantier ?? "—" },
      { label: "Opérateur", value: ticket.operateur_nom ?? "—" },
      { label: "Période", value: `${ticket.period_start ? fmtDate(ticket.period_start) : "—"} au ${ticket.period_end ? fmtDate(ticket.period_end) : "—"}` },
    ],
    cursorY,
  );

  const personnelTotals = computePersonnelTotals(personnel, dates, pointage);
  if (personnelTotals.length) {
    cursorY = sectionTitle(doc, "A — Personnel", cursorY);
    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN, right: MARGIN },
      head: showPrices
        ? [["Nom", "Société", "Jours MOB", "Jours DEMOB", "Jours S", "Jours O", "Mob €", "Demob €", "Tarif/j €", "Total €"]]
        : [["Nom", "Société", "Jours MOB", "Jours DEMOB", "Jours S", "Jours O"]],
      body: personnelTotals.map((row) =>
        showPrices
          ? [
              row.personnel.nom,
              row.personnel.societe ?? "—",
              String(row.joursMob),
              String(row.joursDemob),
              String(row.joursS),
              String(row.joursO),
              fmtEUR(row.personnel.tarif_mob),
              fmtEUR(row.personnel.tarif_demob),
              fmtEUR(row.personnel.tarif_jour),
              fmtEUR(row.total),
            ]
          : [row.personnel.nom, row.personnel.societe ?? "—", String(row.joursMob), String(row.joursDemob), String(row.joursS), String(row.joursO)],
      ),
      ...tableTheme(),
    });
    cursorY = finalY(doc) + 9;
  }

  if (transport.length) {
    cursorY = sectionTitle(doc, "B — Transport & prestations ponctuelles", cursorY);
    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN, right: MARGIN },
      head: showPrices ? [["Désignation", "Code", "BL", "Qté", "Prix unit. €", "Total €"]] : [["Désignation", "Code", "BL", "Qté"]],
      body: transport.map((t) =>
        showPrices
          ? [t.designation, t.code, t.bl_reference ?? "—", String(t.quantite), fmtEUR(t.prix_unitaire), fmtEUR((t.prix_unitaire || 0) * (t.quantite || 0))]
          : [t.designation, t.code, t.bl_reference ?? "—", String(t.quantite)],
      ),
      ...tableTheme(PDF_COLORS.blue),
    });
    cursorY = finalY(doc) + 9;
  }

  if (cursorY > 238) {
    doc.addPage();
    cursorY = 20;
  }

  const equipementTotals = computeEquipementTotals(equipements, dates, pointage);
  cursorY = sectionTitle(doc, showPrices ? "C — Location d'équipements" : "Équipements", cursorY);
  autoTable(doc, {
    startY: cursorY,
    margin: { left: MARGIN, right: MARGIN },
    head: showPrices
      ? [["Réf.", "Désignation", "N° série", "BL", "J. SB", "J. Op.", "Stand By €", "Operation €", "Insp. €", "Restock. €", "Serrage €", "LIH €", "UC €", "Total €"]]
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
        fmtEUR(row.inspection),
        fmtEUR(row.restocking),
        fmtEUR(row.serrage),
        fmtEUR(row.lih),
        fmtEUR(row.uc),
        fmtEUR(row.total),
      ];
    }),
    ...tableTheme(),
    styles: { ...tableTheme().styles, fontSize: 6.4, cellPadding: 1.3 },
    headStyles: { ...tableTheme().headStyles, fontSize: 6.2, cellPadding: 1.2 },
    columnStyles: showPrices
      ? {
          0: { cellWidth: 12 },
          1: { cellWidth: 30 },
          2: { cellWidth: 15 },
          3: { cellWidth: 9 },
          4: { cellWidth: 8 },
          5: { cellWidth: 8 },
          6: { cellWidth: 14 },
          7: { cellWidth: 14 },
          8: { cellWidth: 11 },
          9: { cellWidth: 12 },
          10: { cellWidth: 11 },
          11: { cellWidth: 11 },
          12: { cellWidth: 12 },
          13: { cellWidth: 15 },
        }
      : { 1: { cellWidth: 52 } },
  });
  cursorY = finalY(doc) + 9;

  if (showPrices) {
    const personnelTotal = personnelTotals.reduce((s, r) => s + r.total, 0);
    const transportTotal = computeTransportTotal(transport);
    const equipementTotal = equipementTotals.reduce((s, r) => s + r.total, 0);
    const grandTotal = personnelTotal + transportTotal + equipementTotal;

    if (cursorY > pageHeight - 60) {
      doc.addPage();
      cursorY = 20;
    }
    const mobDemobTotal = personnelTotals.reduce((s, r) => s + r.montantMobDemob, 0);
    const joursOTotal = personnelTotals.reduce((s, r) => s + r.montantJour, 0);
    drawTotalCard(
      doc,
      [
        { label: "Sous-total Mob / Demob", value: fmtEUR(mobDemobTotal) },
        { label: "Sous-total Jours Operation", value: fmtEUR(joursOTotal) },
        { label: "Sous-total Personnel", value: fmtEUR(personnelTotal) },
        { label: "Sous-total Transport", value: fmtEUR(transportTotal) },
        { label: "Sous-total Équipements", value: fmtEUR(equipementTotal) },
        { label: "Total général HT", value: fmtEUR(grandTotal), strong: true },
      ],
      cursorY,
    );
  }

  drawFooter(doc);
  doc.save(`ServiceTicket-${showPrices ? "Enedril" : "Operateur"}-${affaire.reference}.pdf`);
}
