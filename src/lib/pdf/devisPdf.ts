import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { COMPANY, CONDITIONS_GENERALES } from "@/lib/company";
import { fmtDate, fmtEUR } from "@/lib/format";
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
  const margin = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(11, 46, 107);
  doc.text("OFFRE DE LOCATION · EQUIPMENT RENTAL QUOTATION", pageWidth / 2, 16, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const infoLeft = [
    `Offer No.: ${devis.reference} (${devis.version})`,
    `Date: ${fmtDate(devis.date_creation)}`,
    `Validity: ${devis.validite_jours} jours`,
  ];
  const infoRight = [
    `Client: ${client?.raison_sociale ?? "—"}`,
    `Well / Location: ${affaire.well_location ?? affaire.chantier ?? "—"}`,
    `Contact: ${contactName ?? devis.contact ?? "—"}`,
  ];
  infoLeft.forEach((line, i) => doc.text(line, margin, 26 + i * 5));
  infoRight.forEach((line, i) => doc.text(line, pageWidth / 2 + 4, 26 + i * 5));

  const physicalLignes = lignes.filter((l) => PHYSICAL_TYPES.includes(l.type));
  const personnelLignes = lignes.filter((l) => l.type === "Personnel");
  const transportLignes = lignes.filter((l) => l.type === "Transport" || l.type === "Serrage");

  let cursorY = 44;

  if (physicalLignes.length) {
    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [["#", "Description", "Qty", "Stand-by €/j", "Operations €/j", "UC €/item", "LIH/DBR €/item", "Inspection €", "Restocking €"]],
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
      ]),
      styles: { fontSize: 7.5, cellPadding: 1.6 },
      headStyles: { fillColor: [11, 46, 107], textColor: 255 },
      columnStyles: { 1: { cellWidth: 55 } },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cursorY = (doc as any).lastAutoTable.finalY + 6;
  }

  if (personnelLignes.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(11, 46, 107);
    doc.text("PERSONNEL · On-site Operators", margin, cursorY);
    autoTable(doc, {
      startY: cursorY + 2,
      margin: { left: margin, right: margin },
      head: [["Désignation", "Qté", "Prix forfait €"]],
      body: personnelLignes.map((l) => [l.designation, String(l.quantite), fmtEUR(l.prix_forfait)]),
      styles: { fontSize: 8, cellPadding: 1.6 },
      headStyles: { fillColor: [20, 119, 198], textColor: 255 },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cursorY = (doc as any).lastAutoTable.finalY + 6;
  }

  if (transportLignes.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(11, 46, 107);
    doc.text("TRANSPORT & SERRAGE", margin, cursorY);
    autoTable(doc, {
      startY: cursorY + 2,
      margin: { left: margin, right: margin },
      head: [["Désignation", "Qté", "Prix forfait €"]],
      body: transportLignes.map((l) => [l.designation, String(l.quantite), fmtEUR(l.prix_forfait)]),
      styles: { fontSize: 8, cellPadding: 1.6 },
      headStyles: { fillColor: [41, 171, 226], textColor: 255 },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cursorY = (doc as any).lastAutoTable.finalY + 6;
  }

  if (devis.remarques_commerciales) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Remarques commerciales", margin, cursorY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(devis.remarques_commerciales, pageWidth - margin * 2);
    doc.text(lines, margin, cursorY + 4);
    cursorY += 4 + lines.length * 3.6 + 4;
  }

  if (devis.conditions_particulieres) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Conditions particulières", margin, cursorY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const lines = doc.splitTextToSize(devis.conditions_particulieres, pageWidth - margin * 2);
    doc.text(lines, margin, cursorY + 4);
    cursorY += 4 + lines.length * 3.4 + 5;
  }

  if (cursorY > 250) {
    doc.addPage();
    cursorY = 16;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Conditions générales", margin, cursorY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const cgvLines = doc.splitTextToSize(CONDITIONS_GENERALES, pageWidth - margin * 2);
  doc.text(cgvLines, margin, cursorY + 4);

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `${COMPANY.nom} — ${COMPANY.adresse} — ${COMPANY.tel} — ${COMPANY.web} — SIRET ${COMPANY.siret} - TVA ${COMPANY.tva}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" },
  );

  doc.save(`${devis.reference}-${devis.version}.pdf`);
}
