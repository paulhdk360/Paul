import type { DevisLigne } from "@/lib/types";

export interface DevisLigneTotal {
  ligne: DevisLigne;
  total: number;
}

// Mirrors the pricing columns from the Excel quote: each unit price is
// per-unit / per-day depending on the column, multiplied by quantity,
// except Stand-By & Operation which are day-rates settled later on the
// service ticket and are shown but not summed into the quote total.
export function computeLigneTotal(ligne: DevisLigne): number {
  const qty = ligne.quantite || 0;
  if (ligne.type === "Transport" || ligne.type === "Personnel" || ligne.type === "Serrage") {
    return (ligne.prix_forfait || 0) * qty;
  }
  return ((ligne.prix_uc || 0) + (ligne.prix_lih || 0) + (ligne.prix_inspection || 0) + (ligne.prix_restocking || 0)) * qty;
}

export function computeDevisTotals(lignes: DevisLigne[], tva: number) {
  const ht = lignes.reduce((sum, l) => sum + computeLigneTotal(l), 0);
  const montantTva = ht * (tva / 100);
  return { ht, tva: montantTva, ttc: ht + montantTva };
}
