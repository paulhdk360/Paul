import { jsPDF } from "jspdf";
import { fmtDate, fmtEUR } from "@/lib/format";
import { drawFooter, drawInfoCard, drawLetterhead, drawTotalCard, MARGIN, PDF_COLORS } from "@/lib/pdf/pdfTheme";
import type { Affaire, AvancementSituation, Client } from "@/lib/types";

// A progress invoice for one "situation d'avancement" — the montant for
// this specific invoice is the delta between this situation's % and the
// previous one's, applied to the affaire's fixed montant_contrat, so
// invoices sent over the life of a contract always sum to the contract
// total once 100% is reached.
export function generateFactureAvancementPdf(situation: AvancementSituation, previousPourcentage: number, affaire: Affaire, client: Client | null) {
  const montantContrat = affaire.montant_contrat ?? 0;
  const montantCumule = (montantContrat * situation.pourcentage) / 100;
  const montantPrecedent = (montantContrat * previousPourcentage) / 100;
  const montantSituation = montantCumule - montantPrecedent;
  const resteAFacturer = montantContrat - montantCumule;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  let cursorY = drawLetterhead(doc, "FACTURE D'AVANCEMENT", "Progress Invoice");

  cursorY = drawInfoCard(
    doc,
    [
      { label: "Affaire N°", value: affaire.reference },
      { label: "Client", value: client?.raison_sociale ?? "—" },
      { label: "Date de situation", value: fmtDate(situation.date) },
      { label: "Chantier", value: affaire.chantier ?? affaire.well_location ?? "—" },
      { label: "Pays", value: affaire.pays ?? "—" },
      { label: "Avancement cumulé", value: `${situation.pourcentage} %` },
    ],
    cursorY,
  );

  if (situation.description) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.navy);
    doc.text("Travaux / situation", MARGIN, cursorY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.ink);
    const lines = doc.splitTextToSize(situation.description, pageWidth - MARGIN * 2);
    doc.text(lines, MARGIN, cursorY + 4);
    cursorY += 4 + lines.length * 3.6 + 8;
  } else {
    cursorY += 4;
  }

  drawTotalCard(
    doc,
    [
      { label: "Montant total du contrat HT", value: fmtEUR(montantContrat) },
      { label: `Déjà facturé (${previousPourcentage} %)`, value: fmtEUR(montantPrecedent) },
      { label: `Cette situation (${situation.pourcentage} %)`, value: fmtEUR(montantSituation), strong: true },
      { label: "Reste à facturer", value: fmtEUR(resteAFacturer) },
    ],
    cursorY,
  );

  drawFooter(doc);
  doc.save(`Facture-avancement-${affaire.reference}-${situation.pourcentage}pct.pdf`);
}
