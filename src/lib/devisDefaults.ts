import { ACTIVITE_DEFAULTS, type TypeActivite } from "@/lib/company";
import { newDevisLigne } from "@/lib/devis";
import type { Devis } from "@/lib/supabase/types";

export function defaultDevisValues(reference: string): Devis {
  const activite: TypeActivite = "Forage géothermique";
  const defaults = ACTIVITE_DEFAULTS[activite];
  const now = new Date().toISOString().slice(0, 10);
  return {
    id: "",
    reference,
    version: "V0",
    client: "",
    objet: "",
    type_activite: activite,
    statut: "Brouillon",
    tva: 10,
    date_creation: now,
    date_envoi: null,
    date_relance: null,
    date_reponse: null,
    client_adresse_facturation: "",
    contact_chantier: "",
    adresse_chantier: "",
    references_cadastrales: "Implantation du forage sur place",
    usage_prevu: "",
    type_ouvrage: "",
    profondeur_previsionnelle: "",
    diametre_forage: "",
    tubage_prevu: "",
    crepines: "",
    massif_filtrant: "",
    cimentation_annulaire: "",
    essais_prevus: "",
    objet_texte: defaults.objetTexte,
    prestations_incluses: defaults.prestationsIncluses,
    limites_exclusions: defaults.limitesExclusions,
    acompte_pct: 30,
    validite_jours: 30,
    chantier_genere_id: null,
    lignes: [newDevisLigne()],
    created_at: now,
    updated_at: now,
  };
}
