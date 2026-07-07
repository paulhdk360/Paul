import type { DevisLigne } from "@/lib/types";

export interface DevisLigneTotal {
  ligne: DevisLigne;
  total: number;
}

// Mirrors the pricing columns from the Excel quote: a single equipment line
// can carry any combination of these charges at once (UC, LIH, Inspection,
// Restocking, and/or a lump-sum), each multiplied by quantity. Stand-By and
// Operation are day-rates settled later from the actual days logged on the
// service ticket, so they're shown for reference but excluded from the
// quote total here.
export function computeLigneTotal(ligne: DevisLigne): number {
  const qty = ligne.quantite || 0;
  const perUnit = (ligne.prix_uc || 0) + (ligne.prix_lih || 0) + (ligne.prix_inspection || 0) + (ligne.prix_restocking || 0) + (ligne.prix_forfait || 0);
  return perUnit * qty;
}

export function computeDevisTotals(lignes: DevisLigne[], tva: number) {
  const ht = lignes.reduce((sum, l) => sum + computeLigneTotal(l), 0);
  const montantTva = ht * (tva / 100);
  return { ht, tva: montantTva, ttc: ht + montantTva };
}
