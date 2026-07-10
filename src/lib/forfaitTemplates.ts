import type { DevisLigne } from "@/lib/types";

// Starter line sets for "Forfait" (lump-sum) devis, transcribed from
// Enedril's own reference sheets (Fishing 18-1/2" package, Directional
// Drilling package). Inserted as a batch via "Insérer une trame" — the user
// edits/deletes lines afterward as needed for the specific affaire, this is
// just a faster starting point than retyping every tool by hand.
export type ForfaitTemplateLigne = Pick<
  DevisLigne,
  "type" | "designation" | "quantite" | "prix_operation" | "prix_uc" | "prix_inspection" | "prix_lih" | "prix_forfait"
>;

export interface ForfaitTemplate {
  key: string;
  label: string;
  lignes: ForfaitTemplateLigne[];
}

function op(
  designation: string,
  purpose: string,
  section: string,
  prix: { operation?: number; uc?: number; inspection?: number; lih?: number },
): ForfaitTemplateLigne {
  return {
    type: "Operation",
    designation: `${designation} (${purpose} — ${section})`,
    quantite: 1,
    prix_operation: prix.operation ?? null,
    prix_uc: prix.uc ?? null,
    prix_inspection: prix.inspection ?? null,
    prix_lih: prix.lih ?? null,
    prix_forfait: null,
  };
}

function forfait(designation: string, prixUnitaire: number, quantite = 1): ForfaitTemplateLigne {
  return {
    type: "Forfait",
    designation,
    quantite,
    prix_operation: null,
    prix_uc: null,
    prix_inspection: null,
    prix_lih: null,
    prix_forfait: prixUnitaire,
  };
}

const FISHING_185: ForfaitTemplateLigne[] = [
  op("11-1/4\" OD type 150 FS Overshot Bowen w/ 6-5/8\" Reg Box", "Fishing 18-1/2 & 14-3/4\" sections", "18-1/2 - 14-3/4", { operation: 306, inspection: 30, lih: 20080 }),
  op("Extension 3ft for 11-1/4\" OD type 150 FS Overshot w/ sellers Pin x Box", "Fishing 18-1/2 & 14-3/4\" sections", "18-1/2 - 14-3/4", { operation: 140, inspection: 60, lih: 6762 }),
  op("15in Oversize guide for 11-1/4\" OD type 150 FS Overshot w/ sellers Pin", "Fishing 18-1/2 & 14-3/4\" sections", "18-1/2", { operation: 131, inspection: 30, lih: 8850 }),
  op("catch 9-5/8 for 11-1/4\" FS Spiral Grapple + Packer + Control", "PDM 9-5/8\" - Absorber 9-5/8\"", "18-1/2 - 14-3/4", { uc: 974, lih: 1948 }),
  op("catch 9-1/2 for 11-1/4\" FS Spiral Grapple + Packer + Control", "DC 9-1/2\"", "18-1/2", { uc: 974, lih: 1948 }),
  op("catch 9-3/8 for 11-1/4\" FS Spiral Grapple + Packer + Control", "DC 9-1/2\" undersize", "18-1/2", { uc: 1846, lih: 3692 }),
  op("catch 8-1/4 for 11-1/4\" FS Basket Grapple + Mill Control Packer", "DC 8-1/4\"", "18-1/2 - 14-3/4", { uc: 1846, lih: 3692 }),
  op("catch 8-1/8 for 11-1/4\" FS Basket Grapple + Mill Control Packer", "DC 8-1/4\" undersize", "18-1/2 - 14-3/4", { uc: 1846, lih: 3692 }),
  op("catch 8 for 11-1/4\" FS Basket Grapple + Mill Control Packer", "FN 8\"", "18-1/2 - 14-3/4", { uc: 1846, lih: 3692 }),
  op("catch 7-7/8 for 11-1/4\" FS Basket Grapple + Mill Control Packer", "FN 8\" undersize", "18-1/2 - 14-3/4", { uc: 1846, lih: 3692 }),
  op("catch 6-5/8 for 11-1/4\" FS Basket Grapple + Mill Control Packer", "TJ 5\" DPs", "18-1/2 - 14-3/4", { uc: 1846, lih: 3692 }),
  op("catch 6-1/2 for 11-1/4\" FS Basket Grapple + Mill Control Packer", "TJ 5\" DPs undersize", "18-1/2 - 14-3/4", { uc: 1846, lih: 3692 }),
  op("catch 6-3/8 for 11-1/4\" FS Basket Grapple + Mill Control Packer", "TJ 5\" DPs undersize", "18-1/2 - 14-3/4", { uc: 1846, lih: 3692 }),
  op("catch 5 for 11-1/4\" FS Basket Grapple + Mill Control Packer", "DPs 5in", "18-1/2 - 14-3/4", { uc: 1846, lih: 3692 }),
  op("catch 4-7/8 for 11-1/4\" FS Basket Grapple + Mill Control Packer", "DPs 5in undersize", "18-1/2 - 14-3/4", { uc: 1846, lih: 3692 }),
  op("9-3/8\" OD type 150 FS Overshot Bowen w/ 4-1/2\" IF Box", "Fishing 9-1/2\" sections", "8-1/2 - 9-1/2", { operation: 218, inspection: 150, lih: 11662 }),
  op("9-3/8\" OD Extension 3ft for 9-3/8\" OD type 150 FS Overshot w/ sellers Pin x Box", "Fishing 9-1/2\" sections", "8-1/2 - 9-1/2", { operation: 100, inspection: 60, lih: 4776 }),
  op("catch 6-7/8\" for 9-3/8\" FS Basket Grapple + Mill Control Packer", "FN 6-7/8\"", "8-1/2 - 9-1/2", { uc: 636, lih: 1272 }),
  op("catch 6-3/4\" for 9-3/8\" FS Basket Grapple + Mill Control Packer", "DC 6-3/4\"", "8-1/2 - 9-1/2", { uc: 636, lih: 1272 }),
  op("catch 6-5/8\" for 9-3/8\" FS Basket Grapple + Mill Control Packer", "TJ 5\" DPs", "8-1/2 - 9-1/2", { uc: 636, lih: 1272 }),
  op("catch 6-1/2\" for 9-3/8\" FS Basket Grapple + Mill Control Packer", "FN 6-1/2\"", "8-1/2 - 9-1/2", { uc: 636, lih: 1272 }),
  op("catch 6-3/8\" for 9-3/8\" FS Basket Grapple + Mill Control Packer", "FN 6-1/2\" undersize", "8-1/2 - 9-1/2", { uc: 636, lih: 1272 }),
  op("catch 5\" for 9-3/8\" FS Basket Grapple + Mill Control Packer", "DPs 5in", "8-1/2 - 9-1/2", { uc: 1018, lih: 2036 }),
  op("catch 4-7/8\" for 9-3/8\" FS Basket Grapple + Mill Control Packer", "DPs 5in undersize", "8-1/2 - 9-1/2", { uc: 1018, lih: 2036 }),
  op("6-1/2\" OD Taper Tap, Catch 2-5/8\" to 4\" w/ 4-1/2\" IF Box", "DPs, DCs", "csg 16\"-10,75\" and sections", { operation: 228, inspection: 30, lih: 8464 }),
  op("13-1/2\" Lead Impression Block, w/ 6-5/8\" REG Box", "OH 14-3/4\" - csg 16\"", "14-3/4\"", { operation: 324, inspection: 30, lih: 12096 }),
  op("9-3/8\" Lead Impression Block, w/ 4-1/2\" IF Box", "Casing 10-3/4\"", "10-3/4\"", { operation: 232, inspection: 30, lih: 4325 }),
  op("7-7/8\" Lead Impression Block, w/ 4-1/2\" IF Box", "OH 9-1/2\" - CSG 10-3/4\"", "9-1/2", { operation: 174, inspection: 30, lih: 3548 }),
  op("15-1/2\" OD Fishing Magnet w/ 7-5/8\" Reg Pin", "OH 18-1/2\"", "18-1/2", { operation: 438, inspection: 30, lih: 57105 }),
  op("13-1/2\" OD Fishing Magnet w/ 6-5/8 Reg Pin", "OH 14-3/4", "14-3/4\"", { operation: 398, inspection: 30, lih: 49887 }),
  op("7-5/8\" OD Fishing Magnet Bowen w/ 4-1/2\" Reg Pin", "OH 9-1/2\" - 8-1/2\"", "9-1/2\" - 8-1/2\"", { operation: 262, inspection: 30, lih: 15017 }),
  op("13-3/8\" OD Cup Junk Sub, 9-1/2\" Body w/ 7-5/8\" Reg Pin Up x Box Down connection", "OH-CSG", "18-1/2 - 17-1/2", { operation: 85, inspection: 60, lih: 15545 }),
  op("9-5/8\" OD Cup Junk Sub, 8\" Body w/ 6-5/8\" Reg Pin Up x Box Down connection", "OH-CSG", "18-1/2 - 14-3/4", { operation: 75, inspection: 60, lih: 10354 }),
  op("6-5/8\" OD Cup Junk Sub, 6\" OD Body w/ 4-1/2\" Reg Pin Up x Box Down connection", "OH-CSG", "8-1/2 - 9-1/2", { operation: 25, inspection: 60, lih: 5185 }),
  op("15\" OD Reverse Circulating Junk Basket 17\" Rough OD Type C Shoe w/ 6-5/8\" Reg Box connection", "OH 18-1/2\" - 17-1/2\"", "18-1/2\" - 17-1/2\"", { operation: 550, uc: 3385, inspection: 150, lih: 67798 }),
  op("13-3/8\" OD Reverse Circulating Junk Basket 14-5/8\" Rough OD Type C Shoe w/ 6-5/8\" Reg Box connection", "OH 14-3/4\"", "14-3/4\"", { operation: 398, uc: 2645, inspection: 150, lih: 54025 }),
  op("9-1/8\" OD Reverse Circulating Junk Basket 9-3/8\" Rough OD Type C Shoe w/ 4-1/2\" IF Box connection", "OH 9-1/2\"", "9-1/2\"", { operation: 255, uc: 1875, inspection: 150, lih: 34575 }),
  op("8\" OD Fishing Bumper sub, 3 1/2\" ID, 6 5/8 Reg Pin x Box connection", "OH 18-1/2\" - 14-3/4\"", "18-1/2 - 14-3/4", { operation: 246, uc: 350, inspection: 60, lih: 23954 }),
  op("8\" OD Hydraulic Fishing jar Type Z, 3 1/16\" ID, 6 5/8 Reg Pin x Box connection", "OH 18-1/2\" - 14-3/4\"", "18-1/2 - 14-3/4", { operation: 394, uc: 550, inspection: 60, lih: 43228 }),
  op("6-1/4\" OD Fishing Bumper sub, 2-1/4\" ID, 4-1/2\" IF Pin x Box connection", "OH 9-1/2\"", "8-1/2 - 9-1/2", { operation: 202, uc: 350, inspection: 60, lih: 18090 }),
  op("6-1/4\" OD Hydraulic Fishing jar Type Z, 2-1/4\" ID, 4-1/2\" IF Pin x Box connection", "OH 9-1/2\"", "8-1/2 - 9-1/2", { operation: 323, uc: 550, inspection: 60, lih: 30246 }),
  op("6-1/4\" OD Hydraulic Fishing jar Intensifier, 2-1/4\" ID, 4-1/2\" IF Pin x Box connection", "OH 9-1/2\"", "8-1/2 - 9-1/2", { operation: 307, uc: 750, inspection: 60, lih: 53917 }),
  op("18-3/8\" OD SuperJunkMill type crushed carbide w/ 7-5/8\" Reg Pin", "OH 18-1/2\"", "18-1/2", { uc: 3731, inspection: 30, lih: 8292 }),
  op("14-5/8\" OD SuperJunkMill type crushed carbide w/ 6-5/8\" Reg Pin", "OH 14-3/4\"", "14-3/4", { uc: 3142, inspection: 30, lih: 7028 }),
  op("9-3/8\" OD SuperJunkMill type crushed carbide w/ 4-1/2\" Reg Pin", "OH 9-1/2\"", "9-1/2", { uc: 2555, inspection: 30, lih: 5188 }),
  op("8-1/8\" OD SuperJunkMill type crushed carbide w/ 4-1/2\" Reg Pin", "OH 8-1/2\"", "8-1/2", { uc: 2155, inspection: 30, lih: 4788 }),
  forfait("Daily rental fishing basket tools for 26\" et 18-1/2\" sections (tarif journalier de référence)", 505),
  forfait("Daily rental fishing basket tools for 14-3/4\" section (tarif journalier de référence)", 625),
  forfait("Daily rental fishing basket tools for 8-1/2\" section (tarif journalier de référence)", 450),
  forfait("LUMP SUM — Location stand by du panier de fishing pour la durée du projet (2 puits)", 25000),
  forfait("Transport dédié Lons - Rig de Forage — FOC si envoi conjoint avec matériel Déviation, sinon at cost +15%", 2500),
];

const DIRECTIONAL_DRILLING: ForfaitTemplateLigne[] = [
  forfait(
    "Prix Forfaitaire pour Chantier PRODUCTEUR incluant MWD (Positive pulse) / Gamma / PDMs en 18-1/2\"-14-3/4in sections / Jars/Stab/Monels et 4 Engineers (2 DD, 2 MWD) + Cabine et remote system pour phases 18-1/2\" et 14-3/4\" — puits réalisés un après l'autre",
    333900,
  ),
  forfait(
    "Prix Forfaitaire pour Chantier INJECTEUR incluant MWD (Positive pulse) / Gamma / PDMs en 18-1/2\"-14-3/4in sections / Jars/Stab/Monels et 4 Engineers (2 DD, 2 MWD) + Cabine et remote system pour phases 18-1/2\" et 14-3/4\" — puits réalisés un après l'autre",
    368700,
  ),
  forfait("Absorber + IBS + NBS + Drilling jar en section 26\" — PRODUCTEUR — puits réalisés un après l'autre", 12985),
  forfait("Absorber + IBS + NBS + Drilling jar en section 26\" — INJECTEUR — puits réalisés un après l'autre", 8678),
  forfait("Option MWD inclinaison section 26\", PRODUCTEUR (installation par opérateur Enedril incluse)", 19550),
  forfait("Option MWD inclinaison section 26\", INJECTEUR (installation par opérateur Enedril incluse)", 7520),
  forfait("Option Prix Forfaitaire Chantier PRODUCTEUR section 8-1/2\" incluant PDM + 1 opérateur + jars/stabs/DHT pour reforage rat hole", 17242),
  forfait("Option Prix Forfaitaire Chantier INJECTEUR section 8-1/2\" incluant PDM + 1 opérateur + jars/stabs/DHT pour reforage rat hole", 17242),
  forfait("Option Prix Forfaitaire Chantier PRODUCTEUR section 8-1/2\" reforage équipements + jars/stabs/DHT pour reforage rat hole", 6850),
  forfait("Option Prix Forfaitaire Chantier INJECTEUR section 8-1/2\" reforage équipements + jars/stabs/DHT pour reforage rat hole", 6850),
  forfait(
    "LUMP SUM — Location stand by du panier de fishing pour la durée du projet (2 puits), transport FOC si envoi conjoint de matériel de déviation, sinon refacturé at cost +15%",
    25000,
  ),
  forfait("Prix Forfaitaire cut and pull incluant 1 opérateur pour casing 10\"3/4 - 51,0 lb/ft - K55 - BTC et fourniture d'un casing scraper tube API 16\" - 75 lb/ft - K55 - BTC", 20415),
  forfait("Remise applicable pour puits en batch drilling (à vérifier/ajuster selon le nombre de puits réels)", -23000),
];

export const FORFAIT_TEMPLATES: ForfaitTemplate[] = [
  { key: "fishing-185", label: "Fishing 18-1/2\"", lignes: FISHING_185 },
  { key: "directional-drilling", label: "Directional Drilling", lignes: DIRECTIONAL_DRILLING },
];
