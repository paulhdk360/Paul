import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { COMPANY } from "@/lib/company";
import { fmtDate, fmtEUR, fmtNum } from "@/lib/format";
import { computeDevisTotals } from "@/lib/devis";
import { LOGO_DATA_URL } from "@/lib/pdf/logo-base64";
import type { Devis } from "@/lib/supabase/types";

const PDF_BRAND_DARK: [number, number, number] = [15, 34, 38];
const PDF_BRAND_TEXT: [number, number, number] = [255, 255, 255];
const PDF_BRAND_TITLE: [number, number, number] = [15, 45, 40];
const PDF_BRAND_SHADE: [number, number, number] = [223, 240, 235];

function drawRunningHeader(doc: jsPDF, devis: Devis) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text(String(devis.reference || ""), 172, 12, { align: "right" });
  doc.text(String(devis.client || ""), 172, 17, { align: "right" });
  doc.text(fmtDate(devis.date_creation || ""), 172, 22, { align: "right" });
  try {
    doc.addImage(LOGO_DATA_URL, "PNG", 176, 6, 20, 20);
  } catch {
    // logo optionnel : on continue sans bloquer la génération
  }
}

function drawFooter(doc: jsPDF) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(COMPANY.mentionLegale, 105, 290, { align: "center" });
}

function sectionTitle(doc: jsPDF, y: number, text: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PDF_BRAND_TITLE);
  doc.text(text, 14, y);
  doc.setDrawColor(...PDF_BRAND_TITLE);
  doc.setLineWidth(0.6);
  doc.line(14, y + 2, 196, y + 2);
  doc.setLineWidth(0.2);
  return y + 9;
}

function keyValueTable(doc: jsPDF, y: number, rows: string[][]) {
  autoTable(doc, {
    startY: y,
    body: rows,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3.2, textColor: [40, 40, 40], lineColor: [210, 210, 210], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: "bold", fillColor: PDF_BRAND_SHADE, textColor: PDF_BRAND_TITLE },
      1: { cellWidth: 127 },
    },
    margin: { left: 14, right: 14 },
  });
  return (doc as any).lastAutoTable.finalY + 8;
}

function paragraphBlock(doc: jsPDF, y: number, text: string, maxWidth = 182) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  const lines = doc.splitTextToSize(text || "", maxWidth) as string[];
  const lineH = 4.8;
  const neededH = lines.length * lineH + 6;
  if (y + neededH > 272) {
    doc.addPage();
    y = 30;
  }
  doc.text(lines, 14, y);
  return y + lines.length * lineH + 4;
}

export function generateDevisPDF(devis: Devis) {
  const doc = new jsPDF();
  const totals = computeDevisTotals(devis);
  let y: number;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(...PDF_BRAND_TITLE);
  doc.text("BÉARN FORAGE ÉNERGIE", 14, 34);
  doc.setFontSize(12.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text(devis.objet || "Devis", 14, 43);
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(devis.client || "", 14, 50);

  y = 62;
  y = keyValueTable(doc, y, [
    ["Document", "Devis pour " + (devis.type_activite || "forage")],
    ["Activité", devis.type_activite || "—"],
    ["Société", COMPANY.nom],
    ["Version", devis.version || "V0"],
    ["Référence devis", devis.reference || "—"],
  ]);

  y = sectionTitle(doc, y, "1. Identification de l'entreprise");
  y = keyValueTable(doc, y, [
    ["Société", COMPANY.nom],
    ["Adresse", COMPANY.adresse],
    ["SIRET", COMPANY.siret],
    ["Code APE / NAF", COMPANY.ape],
    ["Représentant", COMPANY.representant],
    ["Téléphone / courriel", COMPANY.telephone + " – " + COMPANY.email],
  ]);

  y = sectionTitle(doc, y, "2. Identification client et chantier");
  y = keyValueTable(doc, y, [
    ["Client / maître d'ouvrage", devis.client || "—"],
    ["Adresse de facturation", devis.client_adresse_facturation || "—"],
    ["Contact chantier", devis.contact_chantier || "—"],
    ["Adresse du chantier", devis.adresse_chantier || "—"],
    ["Références cadastrales", devis.references_cadastrales || "—"],
    ["Usage prévu", devis.usage_prevu || "—"],
  ]);

  if (y > 240) {
    doc.addPage();
    y = 30;
  }
  y = sectionTitle(doc, y, "3. Objet du devis");
  y = paragraphBlock(doc, y, devis.objet_texte || "");

  doc.addPage();
  y = 30;
  y = sectionTitle(doc, y, "4. Données d'entrée et hypothèses techniques");
  y = keyValueTable(doc, y, [
    ["Type d'ouvrage", devis.type_ouvrage || "—"],
    ["Profondeur prévisionnelle", devis.profondeur_previsionnelle || "—"],
    ["Diamètre de forage", devis.diametre_forage || "—"],
    ["Tubage prévu", devis.tubage_prevu || "—"],
    ["Crépines", devis.crepines || "—"],
    ["Massif filtrant", devis.massif_filtrant || "—"],
    ["Cimentation annulaire", devis.cimentation_annulaire || "—"],
    ["Essais prévus", devis.essais_prevus || "—"],
  ]);

  doc.addPage();
  y = 30;
  y = sectionTitle(doc, y, "5. Détail estimatif des prix");

  const lignesBody = (devis.lignes || []).map((l, i) => [
    String(i + 1),
    String(l.designation || "—"),
    String(l.unite || ""),
    String(l.quantite || 0),
    fmtNum(l.prixUnitaire) + " €",
    fmtNum((Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0)) + " €",
  ]);
  autoTable(doc, {
    startY: y,
    head: [["N°", "Désignation", "Unité", "Qté", "PU HT", "Total HT"]],
    body: lignesBody,
    theme: "grid",
    headStyles: { fillColor: PDF_BRAND_DARK, textColor: PDF_BRAND_TEXT, fontStyle: "bold", fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3, textColor: [40, 40, 40], lineColor: [210, 210, 210], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 16, halign: "center" },
      4: { cellWidth: 24, halign: "right" },
      5: { cellWidth: 26, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  const acompteMontant = totals.ttc * ((Number(devis.acompte_pct) || 0) / 100);
  autoTable(doc, {
    startY: y,
    head: [["Récapitulatif", "Montant"]],
    body: [
      ["Total HT prestations de base", fmtEUR(totals.ht)],
      ["TVA (" + (devis.tva || 0) + " %)", fmtEUR(totals.tva)],
      ["Total TTC", fmtEUR(totals.ttc)],
      ["Acompte à la commande", (devis.acompte_pct || 0) + " % soit " + fmtEUR(acompteMontant)],
      ["Solde", "à réception facture"],
    ],
    theme: "grid",
    headStyles: { fillColor: PDF_BRAND_DARK, textColor: PDF_BRAND_TEXT, fontStyle: "bold", fontSize: 9.5 },
    styles: { fontSize: 9.5, cellPadding: 3.2, textColor: [40, 40, 40], lineColor: [210, 210, 210], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: "bold", fillColor: PDF_BRAND_SHADE, textColor: PDF_BRAND_TITLE },
      1: { cellWidth: 82 },
    },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  if (y > 250) {
    doc.addPage();
    y = 30;
  }
  y = sectionTitle(doc, y, "6. Prestations incluses");
  y = paragraphBlock(doc, y, devis.prestations_incluses || "");

  doc.addPage();
  y = 30;
  y = sectionTitle(doc, y, "7. Limites de prestation et exclusions");
  y = paragraphBlock(doc, y, devis.limites_exclusions || "");

  if (y > 230) {
    doc.addPage();
    y = 30;
  }
  y = sectionTitle(doc, y, "8. Conditions commerciales");
  y = keyValueTable(doc, y, [
    ["Validité du devis", (devis.validite_jours || 30) + " jours"],
    ["Acompte à la commande", (devis.acompte_pct || 0) + " % TTC à la signature"],
    ["Paiement du solde", "à réception de facture"],
    [
      "Prix unitaires",
      "Les quantités réelles seront ajustées selon profondeur atteinte, équipement posé et options réalisées.",
    ],
    [
      "Retard de paiement",
      "Pénalités au taux annuel de 3 fois le taux d'intérêt légal en vigueur. Indemnité forfaitaire de 40 € pour frais de recouvrement (clients professionnels).",
    ],
  ]);

  if (y > 220) {
    doc.addPage();
    y = 30;
  }
  y = sectionTitle(doc, y, "9. Acceptation du devis");
  y = paragraphBlock(
    doc,
    y,
    "Le client reconnaît avoir pris connaissance des hypothèses techniques, limites de prestation, exclusions, conditions commerciales et aléas propres aux travaux de forage.",
  );
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(40, 40, 40);
  doc.text("Pour BFE", 14, y);
  doc.text("Pour le client", 110, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.text("Nom : " + COMPANY.representant, 14, y);
  doc.text("Nom :", 110, y);
  y += 7;
  doc.text("Fonction : " + COMPANY.fonction, 14, y);
  doc.text("Fonction :", 110, y);
  y += 7;
  doc.text("Date : " + fmtDate(devis.date_creation || ""), 14, y);
  doc.text("Date :", 110, y);
  y += 7;
  doc.text("Signature et cachet :", 14, y);
  doc.text('Signature précédée de "Bon pour accord" :', 110, y);

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawRunningHeader(doc, devis);
    drawFooter(doc);
  }

  const safeName = (devis.client || "devis").replace(/[^a-zA-Z0-9]+/g, "_");
  doc.save((devis.reference || "Devis") + "_" + safeName + ".pdf");
}
