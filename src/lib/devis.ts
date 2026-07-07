import type { Devis, DevisLigne } from "@/lib/supabase/types";

export function computeDevisTotals(devis: Pick<Devis, "lignes" | "tva"> | null | undefined) {
  const lignes = devis?.lignes ?? [];
  if (lignes.length) {
    const ht = lignes.reduce(
      (s, l) => s + (Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0),
      0,
    );
    const tva = ht * ((Number(devis?.tva) || 0) / 100);
    return { ht, tva, ttc: ht + tva };
  }
  return { ht: 0, tva: 0, ttc: 0 };
}

export function ligneTotal(ligne: Pick<DevisLigne, "quantite" | "prixUnitaire">) {
  return (Number(ligne.quantite) || 0) * (Number(ligne.prixUnitaire) || 0);
}

export function generateDevisReference(existingReferences: string[]): string {
  const year = new Date().getFullYear();
  const pattern = new RegExp(`^BFE-DEV-${year}-(\\d+)$`);
  const nums = existingReferences
    .map((r) => r.match(pattern))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => parseInt(m[1], 10));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `BFE-DEV-${year}-${String(next).padStart(3, "0")}`;
}

export function newDevisLigne(): DevisLigne {
  return {
    id: crypto.randomUUID(),
    designation: "",
    quantite: 1,
    unite: "u",
    prixUnitaire: 0,
  };
}
