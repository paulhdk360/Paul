import type { DevisLigne } from "@/lib/types";

// Starter line set for "Forfait" (lump-sum) devis, transcribed from
// Enedril's own Directional Drilling reference sheet. Inserted as a batch
// via "Insérer une trame" — the user edits/deletes lines afterward as
// needed for the specific affaire, this is just a faster starting point
// than retyping every item by hand.
export type ForfaitTemplateLigne = Pick<DevisLigne, "type" | "reference_article" | "designation" | "quantite" | "prix_forfait">;

export interface ForfaitTemplate {
  key: string;
  label: string;
  lignes: ForfaitTemplateLigne[];
}

function forfait(item: string, description: string, lumpSum: number): ForfaitTemplateLigne {
  return {
    type: "Forfait",
    reference_article: item,
    designation: description,
    quantite: 1,
    prix_forfait: lumpSum,
  };
}

const DIRECTIONAL_DRILLING: ForfaitTemplateLigne[] = [
  forfait(
    "1",
    "Prix Forfaitaire pour Chantier PRODUCTEUR incluant MWD (Positive pulse) / Gamma / PDMs en 18-1/2\"-14-3/4in sections / Jars/Stab/Monels et 4 Engineers (2 DD, 2 MWD) + Cabine et remote system pour phases 18-1/2\" et 14-3/4\" — puits réalisés un après l'autre",
    333900,
  ),
  forfait(
    "2",
    "Prix Forfaitaire pour Chantier INJECTEUR incluant MWD (Positive pulse) / Gamma / PDMs en 18-1/2\"-14-3/4in sections / Jars/Stab/Monels et 4 Engineers (2 DD, 2 MWD) + Cabine et remote system pour phases 18-1/2\" et 14-3/4\" — puits réalisés un après l'autre",
    368700,
  ),
  forfait("3", "Absorber + IBS + NBS + Drilling jar en section 26\" — PRODUCTEUR — puits réalisés un après l'autre", 12985),
  forfait("4", "Absorber + IBS + NBS + Drilling jar en section 26\" — INJECTEUR — puits réalisés un après l'autre", 8678),
  forfait("5", "Option MWD inclinaison section 26\", PRODUCTEUR (installation par opérateur Enedril incluse)", 19550),
  forfait("6", "Option MWD inclinaison section 26\", INJECTEUR (installation par opérateur Enedril incluse)", 7520),
  forfait("7", "Option Prix Forfaitaire Chantier PRODUCTEUR section 8-1/2\" incluant PDM + 1 opérateur + jars/stabs/DHT pour reforage rat hole", 17242),
  forfait("8", "Option Prix Forfaitaire Chantier INJECTEUR section 8-1/2\" incluant PDM + 1 opérateur + jars/stabs/DHT pour reforage rat hole", 17242),
  forfait("9", "Option Prix Forfaitaire Chantier PRODUCTEUR section 8-1/2\" reforage équipements + jars/stabs/DHT pour reforage rat hole", 6850),
  forfait("10", "Option Prix Forfaitaire Chantier INJECTEUR section 8-1/2\" reforage équipements + jars/stabs/DHT pour reforage rat hole", 6850),
  forfait(
    "11",
    "LUMP SUM — Location stand by du panier de fishing pour la durée du projet (2 puits), transport FOC si envoi conjoint de matériel de déviation, sinon refacturé at cost +15%",
    25000,
  ),
  forfait(
    "12",
    "Prix Forfaitaire cut and pull incluant 1 opérateur pour casing 10\"3/4 - 51,0 lb/ft - K55 - BTC et fourniture d'un casing scraper tube API 16\" - 75 lb/ft - K55 - BTC",
    20415,
  ),
  forfait("13", "Remise applicable pour puits en batch drilling (à vérifier/ajuster selon le nombre de puits réels)", -23000),
];

export const FORFAIT_TEMPLATES: ForfaitTemplate[] = [{ key: "directional-drilling", label: "Directional Drilling", lignes: DIRECTIONAL_DRILLING }];
