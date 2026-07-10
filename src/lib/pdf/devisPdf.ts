import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFDocument } from "pdf-lib";
import { fmtDate, fmtEUR } from "@/lib/format";
import { drawFooter, drawInfoCard, drawLetterhead, drawTotalCard, MARGIN, sectionTitle, tableTheme, PDF_COLORS } from "@/lib/pdf/pdfTheme";
import { CONDITIONS_GENERALES } from "@/lib/company";
import { computeDevisTotals } from "@/lib/devis";
import type { Affaire, Client, Devis, DevisLigne } from "@/lib/types";

const PHYSICAL_TYPES = ["Operation", "Stand By", "Maintenance", "Inspection", "Restocking", "Lost In Hole"];

export async function generateDevisPdf(
  devis: Devis,
  lignes: DevisLigne[],
  affaire: Affaire,
  client: Client | null,
  contactName?: string | null,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const isVente = affaire.type_transaction === "Vente";

  let cursorY = drawLetterhead(doc, isVente ? "OFFRE DE VENTE" : "OFFRE DE LOCATION", isVente ? "Equipment Sale Quotation" : "Equipment Rental Quotation");

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

  const physicalLignes = isVente ? [] : lignes.filter((l) => PHYSICAL_TYPES.includes(l.type));
  const personnelLignes = isVente ? [] : lignes.filter((l) => l.type === "Personnel");
  const transportLignes = lignes.filter((l) => l.type === "Transport" || (!isVente && l.type === "Serrage"));
  const venteLignes = isVente ? lignes.filter((l) => l.type === "Vente") : [];
  const packagingLignes = isVente ? lignes.filter((l) => l.type === "Packaging") : [];
  const forfaitLignes = isVente ? [] : lignes.filter((l) => l.type === "Forfait");

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

  if (venteLignes.length) {
    cursorY = sectionTitle(doc, "VENTE", cursorY);
    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Désignation", "Qté", "Prix unitaire €", "Total €"]],
      body: venteLignes.map((l) => [l.designation, String(l.quantite), fmtEUR(l.prix_forfait), fmtEUR((l.prix_forfait || 0) * (l.quantite || 0))]),
      ...tableTheme(PDF_COLORS.blue),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cursorY = (doc as any).lastAutoTable.finalY + 9;
  }

  if (transportLignes.length) {
    cursorY = sectionTitle(doc, isVente ? "TRANSPORT" : "TRANSPORT & SERRAGE", cursorY);
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

  if (forfaitLignes.length) {
    cursorY = sectionTitle(doc, "FORFAIT", cursorY);
    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Item", "Description", "Lump Sum €"]],
      body: forfaitLignes.map((l) => [l.reference_article ?? "", l.designation, fmtEUR(l.prix_forfait)]),
      ...tableTheme(PDF_COLORS.blue),
      columnStyles: { 0: { cellWidth: 14 }, 2: { cellWidth: 30 } },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cursorY = (doc as any).lastAutoTable.finalY + 9;

    if (devis.forfait_notes) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...PDF_COLORS.navy);
      doc.text("Notes / conditions du forfait", MARGIN, cursorY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...PDF_COLORS.ink);
      const notesLines = doc.splitTextToSize(devis.forfait_notes, pageWidth - MARGIN * 2);
      doc.text(notesLines, MARGIN, cursorY + 4);
      cursorY += 4 + notesLines.length * 3.6 + 6;
    }
  }

  if (packagingLignes.length) {
    cursorY = sectionTitle(doc, "PACKAGING", cursorY);
    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Désignation", "Qté", "Prix unitaire €", "Total €"]],
      body: packagingLignes.map((l) => [l.designation, String(l.quantite), fmtEUR(l.prix_forfait), fmtEUR((l.prix_forfait || 0) * (l.quantite || 0))]),
      ...tableTheme(PDF_COLORS.blue),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cursorY = (doc as any).lastAutoTable.finalY + 9;
  }

  const totals = computeDevisTotals(lignes, devis.tva);
  if (isVente && totals.ht > 0) {
    if (cursorY > 230) {
      doc.addPage();
      cursorY = 20;
    }
    drawTotalCard(
      doc,
      [
        { label: "Total HT", value: fmtEUR(totals.ht) },
        { label: `TVA (${devis.tva}%)`, value: fmtEUR(totals.tva) },
        { label: "Total TTC", value: fmtEUR(totals.ttc), strong: true },
      ],
      cursorY,
    );
    cursorY += 3 * 5.6 + 7 + 9;
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
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.6);
  doc.text("Conditions générales complètes en annexe — voir pages suivantes.", MARGIN, cursorY + 4 + cgvLines.length * 3 + 4);

  drawFooter(doc);

  const filename = `${devis.reference}-${devis.version}.pdf`;
  await appendCgvAndDownload(doc, filename);
}

// Appends the full General Terms and Conditions of Delivery (public/cgv-enedril.pdf,
// bundled as a static asset) after the devis itself, instead of relying only
// on the short summary paragraph above — jsPDF can't merge an existing PDF's
// pages in, so the two are combined with pdf-lib and downloaded as one file.
async function appendCgvAndDownload(doc: jsPDF, filename: string) {
  const devisBytes = doc.output("arraybuffer");

  let cgvBytes: ArrayBuffer | null = null;
  try {
    const res = await fetch("/cgv-enedril.pdf");
    if (res.ok) cgvBytes = await res.arrayBuffer();
  } catch {
    cgvBytes = null;
  }

  if (!cgvBytes) {
    // Conditions générales complètes indisponibles — le devis reste
    // téléchargeable avec son résumé CGV intégré plutôt que de bloquer
    // l'export entier sur un problème réseau.
    doc.save(filename);
    return;
  }

  const merged = await PDFDocument.create();
  const devisDoc = await PDFDocument.load(devisBytes);
  const cgvDoc = await PDFDocument.load(cgvBytes);

  const devisPages = await merged.copyPages(devisDoc, devisDoc.getPageIndices());
  devisPages.forEach((p) => merged.addPage(p));
  const cgvPages = await merged.copyPages(cgvDoc, cgvDoc.getPageIndices());
  cgvPages.forEach((p) => merged.addPage(p));

  const mergedBytes = await merged.save();
  const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
