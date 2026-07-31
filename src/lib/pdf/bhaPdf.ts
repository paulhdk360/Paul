import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fmtDate } from "@/lib/format";
import { drawFooter, drawInfoCard, drawLetterhead, MARGIN, tableTheme, PDF_COLORS } from "@/lib/pdf/pdfTheme";
import type { Bha, BhaItem } from "@/lib/types";

const DRAWING_COL_WIDTH = 20;
const DRAWING_MAX_W = 16;
const DRAWING_MAX_H = 20;

async function loadImage(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const dims: { width: number; height: number } = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = dataUrl;
    });
    return { dataUrl, ...dims };
  } catch {
    return null;
  }
}

export async function generateBhaPdf(bha: Bha, items: BhaItem[], drawingByFamille: Map<string, string>) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Pre-load every distinct drawing once (as a data URL + natural size) so
  // the table's didDrawCell hook can draw synchronously per row afterward —
  // jsPDF/autoTable's rendering pass itself can't await a fetch.
  const distinctUrls = Array.from(new Set(items.map((it) => (it.famille ? drawingByFamille.get(it.famille) : undefined)).filter((u): u is string => !!u)));
  const imageCache = new Map<string, { dataUrl: string; width: number; height: number }>();
  await Promise.all(
    distinctUrls.map(async (url) => {
      const loaded = await loadImage(url);
      if (loaded) imageCache.set(url, loaded);
    }),
  );

  let cursorY = drawLetterhead(doc, "BOTTOM HOLE ASSEMBLY", bha.nom);

  cursorY = drawInfoCard(
    doc,
    [
      { label: "Client", value: bha.client ?? "—" },
      { label: "Puits", value: bha.well ?? "—" },
      { label: "Job N°", value: bha.job_no ?? "—" },
      { label: "Date", value: bha.date ? fmtDate(bha.date) : "—" },
    ],
    cursorY,
    4,
  );

  const sorted = [...items].sort((a, b) => a.ordre - b.ordre);

  autoTable(doc, {
    startY: cursorY,
    margin: { left: MARGIN, right: MARGIN },
    head: [["#", "Dessin", "Désignation", "N° série", "OD", "ID", "Connexion", "Longueur", "Qté", "Torque"]],
    body: sorted.map((it, idx) => [
      String(idx + 1),
      "",
      it.designation,
      it.numero_serie ?? "—",
      it.od ?? "—",
      it.id_int ?? "—",
      it.connexion ?? "—",
      it.longueur ?? "—",
      String(it.quantite),
      it.torque ?? "—",
    ]),
    ...tableTheme(),
    styles: { ...tableTheme().styles, minCellHeight: DRAWING_MAX_H + 2, valign: "middle" },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: DRAWING_COL_WIDTH },
      2: { cellWidth: 38 },
      3: { cellWidth: 24 },
      4: { cellWidth: 16 },
      5: { cellWidth: 16 },
      6: { cellWidth: 28 },
      7: { cellWidth: 18 },
      8: { cellWidth: 10 },
      9: { cellWidth: 16 },
    },
    didDrawCell: (data) => {
      if (data.column.index !== 1 || data.row.section !== "body") return;
      const item = sorted[data.row.index];
      const url = item.famille ? drawingByFamille.get(item.famille) : undefined;
      const img = url ? imageCache.get(url) : undefined;
      if (!img) return;
      const ratio = Math.min(DRAWING_MAX_W / img.width, DRAWING_MAX_H / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      const x = data.cell.x + (data.cell.width - w) / 2;
      const y = data.cell.y + (data.cell.height - h) / 2;
      doc.addImage(img.dataUrl, "PNG", x, y, w, h);
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cursorY2 = (doc as any).lastAutoTable.finalY + 6;
  if (bha.notes) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text(doc.splitTextToSize(`Notes : ${bha.notes}`, doc.internal.pageSize.getWidth() - MARGIN * 2), MARGIN, cursorY2);
    cursorY2 += 6;
  }

  drawFooter(doc);
  doc.save(`BHA_${bha.nom.replace(/[^a-z0-9]+/gi, "_")}.pdf`);
}
