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
    [`Client: ${client?.raison_sociale ?? ticket.client_nom ?? "—"}`, `Job N°: ${affaire.reference}`, `Well / Location: ${ticket.well_location ?? affaire.well_location ?? affaire.chantier ?? "—"}`],
    [
      `Opérateur: ${ticket.operateur_nom ?? "—"}`,
      `Période: ${ticket.period_start ? fmtDate(ticket.period_start) : "—"} → ${ticket.period_end ? fmtDate(ticket.period_end) : "—"}`,
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
    ...tableTheme(),
    styles: { ...tableTheme().styles, fontSize: 6.8 },
    columnStyles: { 1: { cellWidth: showPrices ? 28 : 52 } },
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
    drawTotalCard(
      doc,
      [
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
