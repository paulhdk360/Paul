import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fmtDate, fmtEUR } from "@/lib/format";
import { drawFooter, drawInfoCard, drawLetterhead, MARGIN, sectionTitle, tableTheme, PDF_COLORS } from "@/lib/pdf/pdfTheme";
import { CONDITIONS_GENERALES } from "@/lib/company";
import type { Affaire, Client, Devis, DevisLigne } from "@/lib/types";

const PHYSICAL_TYPES = ["Operation", "Stand By", "Maintenance", "Inspection", "Restocking", "Lost In Hole"];

export function generateDevisPdf(
  devis: Devis,
  lignes: DevisLigne[],
  affaire: Affaire,
  client: Client | null,
  contactName?: string | null,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  let cursorY = drawLetterhead(doc, "OFFRE DE LOCATION", "Equipment Rental Quotation");

  cursorY = drawInfoCard(
    doc,
    [
      { label: "Offer No.", value: `${devis.reference} (${devis.version})` },
      { label: "Client", value: client?.raison_sociale ?? "—" },
      { label: "Date", value: fmtDate(devis.date_creation) },
      { label: "Well / Location", value: affaire.well_location ?? affaire.chantier ?? "—" },
      { label: "Validity", value: `${devis.validite_jours} jours` },
      { label: "Contact", value: contactName ?? devis.contact ?? "—" },
    ],
    cursorY,
  );

  const physicalLignes = lignes.filter((l) => PHYSICAL_TYPES.includes(l.type));
  const personnelLignes = lignes.filter((l) => l.type === "Personnel");
  const transportLignes = lignes.filter((l) => l.type === "Transport" || l.type === "Serrage");

  if (physicalLignes.length) {
    cursorY = sectionTitle(doc, "ÉQUIPEMENTS", cursorY);
    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN, right: MARGIN },
      head: [["#", "Description", "Qty", "Stand-by €/j", "Operations €/j", "UC €/item", "LIH/DBR €/item", "Inspection €", "Restocking €", "Serrage €"]],
      body: physicalLignes.map((l, i) => [
        String(i + 1),
        l.designation,
        String(l.quantite),
        l.prix_stand_by ? fmtEUR(l.prix_stand_by) : "—",
        l.prix_operation ? fmtEUR(l.prix_operation) : "—",
        l.prix_uc ? fmtEUR(l.prix_uc) : "—",
        l.prix_lih ? fmtEUR(l.prix_lih) : "—",
        l.prix_inspection ? fmtEUR(l.prix_inspection) : "—",
        l.prix_restocking ? fmtEUR(l.prix_restocking) : "—",
        l.prix_serrage ? fmtEUR(l.prix_serrage) : "—",
      ]),
      ...tableTheme(),
      styles: { ...tableTheme().styles, fontSize: 7.2 },
      headStyles: { ...tableTheme().headStyles, fontSize: 6.6, cellPadding: 1.8 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 40 },
        2: { cellWidth: 10 },
        3: { cellWidth: 18 },
        4: { cellWidth: 18 },
        5: { cellWidth: 18 },
        6: { cellWidth: 20 },
        7: { cellWidth: 18 },
        8: { cellWidth: 18 },
        9: { cellWidth: 14 },
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cursorY = (doc as any).lastAutoTable.finalY + 9;
  }

  if (personnelLignes.length) {
    cursorY = sectionTitle(doc, "PERSONNEL · On-site Operators", cursorY);
    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Désignation", "Qté", "Prix unitaire €", "Total €"]],
      body: personnelLignes.map((l) => [l.designation, String(l.quantite), fmtEUR(l.prix_forfait), fmtEUR((l.prix_forfait || 0) * (l.quantite || 0))]),
      ...tableTheme(PDF_COLORS.blue),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cursorY = (doc as any).lastAutoTable.finalY + 9;
  }

  if (transportLignes.length) {
    cursorY = sectionTitle(doc, "TRANSPORT & SERRAGE", cursorY);
    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Désignation", "Qté", "Prix unitaire €", "Total €"]],
      body: transportLignes.map((l) => [l.designation, String(l.quantite), fmtEUR(l.prix_forfait), fmtEUR((l.prix_forfait || 0) * (l.quantite || 0))]),
      ...tableTheme(PDF_COLORS.blue),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cursorY = (doc as any).lastAutoTable.finalY + 9;
  }

  if (devis.remarques_commerciales) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.navy);
    doc.text("Remarques commerciales", MARGIN, cursorY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.ink);
    const lines = doc.splitTextToSize(devis.remarques_commerciales, pageWidth - MARGIN * 2);
    doc.text(lines, MARGIN, cursorY + 4);
    cursorY += 4 + lines.length * 3.6 + 5;
  }

  if (devis.conditions_particulieres) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.navy);
    doc.text("Conditions particulières", MARGIN, cursorY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_COLORS.ink);
    const lines = doc.splitTextToSize(devis.conditions_particulieres, pageWidth - MARGIN * 2);
    doc.text(lines, MARGIN, cursorY + 4);
    cursorY += 4 + lines.length * 3.4 + 6;
  }

  if (cursorY > 248) {
    doc.addPage();
    cursorY = 20;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.navy);
  doc.text("Conditions générales", MARGIN, cursorY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.muted);
  const cgvLines = doc.splitTextToSize(CONDITIONS_GENERALES, pageWidth - MARGIN * 2);
  doc.text(cgvLines, MARGIN, cursorY + 4);

  drawFooter(doc);
  doc.save(`${devis.reference}-${devis.version}.pdf`);
}
