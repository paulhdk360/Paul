import { SPECIALITES_PAR_CATEGORIE } from "@/lib/company";
import type { CategoriePersonnel, Employe } from "@/lib/types";

const CATEGORIE_ORDER: CategoriePersonnel[] = ["bureaux", "consultant", "atelier", "chantier"];

export const AUTRES_LABEL = "Autres";

export interface OrgGroup {
  label: string | null;
  membres: Employe[];
}

export interface OrgCategorie {
  categorie: CategoriePersonnel;
  groupes: OrgGroup[];
}

// Groups active employees for the organigramme: one bubble per personnel
// category, sub-grouped by spécialité for Atelier/Opérateur (chantier),
// with an "Autres" bucket for anyone without a matching spécialité.
export function groupEmployesForOrganigramme(employes: Employe[]): OrgCategorie[] {
  return CATEGORIE_ORDER.map((categorie) => {
    const membres = employes.filter((e) => e.categorie === categorie);
    const specialites = SPECIALITES_PAR_CATEGORIE[categorie];
    if (!specialites) {
      return { categorie, groupes: [{ label: null, membres }] };
    }
    const groupes: OrgGroup[] = [
      ...specialites.map((s) => ({ label: s, membres: membres.filter((m) => m.specialite === s) })),
      { label: AUTRES_LABEL, membres: membres.filter((m) => !m.specialite || !specialites.includes(m.specialite)) },
    ].filter((g) => g.membres.length > 0);
    return { categorie, groupes };
  }).filter((g) => g.groupes.some((sub) => sub.membres.length > 0));
}
