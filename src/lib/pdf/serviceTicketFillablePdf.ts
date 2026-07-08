import { jsPDF } from "jspdf";
import { fmtDate } from "@/lib/format";
import { drawFooter, drawInfoCard, drawLetterhead, MARGIN, PDF_COLORS, sectionTitle } from "@/lib/pdf/pdfTheme";
import type { Affaire, Client, PointageCode, ServiceTicket, ServiceTicketPersonnel, ToolListItem } from "@/lib/types";

const CODE_OPTIONS = ["", "MOB", "S", "O", "FOC", "DEMOB", "FIN", "LIH"];

// A live fillable PDF (AcroForm dropdown per day/entity cell) so a client
// without an app login can still complete a Service Ticket in any real PDF
// reader (Adobe Reader, Preview, Chrome...) and send it back — no static
// print-only document. Existing pointage pre-fills each dropdown so the
// client only has to correct/complete, not start from scratch. Carries no
// pricing, so it's safe to hand out regardless of which variant it was
// downloaded from.
export function generateFillableServiceTicketPdf(params: {
  ticket: ServiceTicket;
  personnel: ServiceTicketPersonnel[];
  equipements: ToolListItem[];
  dates: string[];
  pointage: Map<string, PointageCode>;
  affaire: Affaire;
  client: Client | null;
}) {
  const { ticket, personnel, equipements, dates, pointage, affaire, client } = params;
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let cursorY = drawLetterhead(doc, "SERVICE TICKET", "Fiche à remplir");

  cursorY = drawInfoCard(
    doc,
    [
      { label: "Job N°", value: affaire.reference },
      { label: "Client", value: client?.raison_sociale ?? ticket.client_nom ?? "—" },
      { label: "Opérateur", value: ticket.operateur_nom ?? "—" },
      { label: "Période", value: dates.length ? `${fmtDate(dates[0])} au ${fmtDate(dates[dates.length - 1])}` : "—" },
    ],
    cursorY,
    4,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.6);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text(
    "Cliquez chaque case et choisissez un code : MOB (mobilisation) / S (Stand By) / O (Operation) / FOC (Free Of Charge) / DEMOB (démobilisation) / FIN / LIH (Lost In Hole). Laissez vide si non applicable.",
    MARGIN,
    cursorY,
  );
  cursorY += 8;

  let fieldSeq = 0;

  function drawGrid(title: string, rows: { id: string; label: string }[]) {
    if (!rows.length) return;
    cursorY = sectionTitle(doc, title, cursorY);

    const labelWidth = 52;
    const availWidth = pageWidth - MARGIN * 2 - labelWidth;
    const colWidth = dates.length ? Math.max(7, availWidth / dates.length) : availWidth;
    const rowHeight = 8;

    if (cursorY + rowHeight > pageHeight - 20) {
      doc.addPage("a4", "landscape");
      cursorY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.4);
    doc.setTextColor(...PDF_COLORS.white);
    doc.setFillColor(...PDF_COLORS.navy);
    doc.rect(MARGIN, cursorY, labelWidth, rowHeight, "F");
    doc.text("Désignation", MARGIN + 2, cursorY + rowHeight / 2 + 1.4);
    dates.forEach((d, i) => {
      const x = MARGIN + labelWidth + i * colWidth;
      doc.setFillColor(...PDF_COLORS.navy);
      doc.rect(x, cursorY, colWidth, rowHeight, "F");
      const dm = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(new Date(d));
      doc.text(dm, x + colWidth / 2, cursorY + rowHeight / 2 + 1.4, { align: "center" });
    });
    cursorY += rowHeight;

    rows.forEach((row, ri) => {
      if (cursorY + rowHeight > pageHeight - 20) {
        doc.addPage("a4", "landscape");
        cursorY = 20;
      }
      const bg = ri % 2 === 0 ? PDF_COLORS.white : PDF_COLORS.sunken;
      doc.setDrawColor(...PDF_COLORS.border);
      doc.setLineWidth(0.15);
      doc.setFillColor(...bg);
      doc.rect(MARGIN, cursorY, labelWidth, rowHeight, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...PDF_COLORS.ink);
      doc.text(row.label.slice(0, 28), MARGIN + 2, cursorY + rowHeight / 2 + 1.4);

      dates.forEach((d, ci) => {
        const x = MARGIN + labelWidth + ci * colWidth;
        doc.setFillColor(...bg);
        doc.rect(x, cursorY, colWidth, rowHeight, "FD");

        const current = pointage.get(`${row.id}:${d}`) ?? "";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const field = new (doc as any).AcroFormComboBox();
        field.fieldName = `pointage_${fieldSeq++}_${row.id}_${d}`;
        field.x = x + 0.4;
        field.y = cursorY + 0.4;
        field.width = colWidth - 0.8;
        field.height = rowHeight - 0.8;
        field.fontSize = 7;
        field.setOptions(CODE_OPTIONS);
        field.value = current;
        doc.addField(field);
      });
      cursorY += rowHeight;
    });
    cursorY += 7;
  }

  drawGrid(
    "Personnel",
    personnel.map((p) => ({ id: p.id, label: p.nom })),
  );
  drawGrid(
    "Équipements",
    equipements.map((e) => ({ id: e.id, label: e.designation.split("\n")[0] })),
  );

  drawFooter(doc);
  doc.save(`ServiceTicket-Fiche-${affaire.reference}.pdf`);
}
