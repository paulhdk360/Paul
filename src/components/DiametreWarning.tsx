"use client";

import { compareDiametres } from "@/lib/diametre";
import type { CatalogueOutil } from "@/lib/types";

// Inline warning shown next to an OutilPicker when the diameter actually
// wanted for the job doesn't match the linked catalogue reference's nominal
// diameter — the exact moment the tool needs rework before it can go out.
export function DiametreWarning({
  outilId,
  diametreSouhaite,
  outils,
}: {
  outilId: string | null;
  diametreSouhaite: string | null;
  outils: CatalogueOutil[];
}) {
  if (!outilId || !diametreSouhaite) return null;
  const outil = outils.find((o) => o.id === outilId);
  const ecart = compareDiametres(diametreSouhaite, outil?.diametre);
  if (!ecart) return null;

  return (
    <div className="mt-1 text-[10px] font-semibold text-danger">
      ⚠ {ecart === "rectifier" ? "À rectifier" : "À recharger"} (catalogue {outil?.diametre ?? "—"})
    </div>
  );
}
