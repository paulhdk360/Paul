"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function exportAllData() {
  const supabase = createClient();
  const tables = ["foreuses", "equipes", "chantiers", "devis", "factures", "achats", "maintenances", "attachments"];
  const result: Record<string, unknown[]> = {};
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw new Error(error.message);
    result[table] = data ?? [];
  }
  return result;
}

// ---------------------------------------------------------------------------
// Import des données saisies dans le prototype HTML (stockées dans le
// localStorage du navigateur sous les clés bfe_chantiers, bfe_devis, etc.)
// Le format d'origine référence les foreuses/équipes/chantiers par leur NOM
// (et non par identifiant), sauf pour les pièces jointes et le champ
// "chantierGenere" d'un devis qui utilisent l'identifiant interne du
// prototype : on reconstruit donc à la fois une correspondance par nom et
// une correspondance ancien-id → nouvel-id.
// ---------------------------------------------------------------------------

type LegacyRecord = Record<string, any>;

type LegacyExport = {
  chantiers?: LegacyRecord[];
  foreuses?: LegacyRecord[];
  equipes?: LegacyRecord[];
  devis?: LegacyRecord[];
  factures?: LegacyRecord[];
  achats?: LegacyRecord[];
  maintenances?: LegacyRecord[];
  files?: LegacyRecord[];
};

function toNull(v: unknown) {
  return v === "" || v === undefined ? null : v;
}

async function uploadLegacyFile(
  supabase: ReturnType<typeof createClient>,
  linkType: string,
  linkId: string,
  file: LegacyRecord,
) {
  if (!file.dataUrl || typeof file.dataUrl !== "string") return;
  const match = file.dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return;
  const [, contentType, base64] = match;
  const buffer = Buffer.from(base64, "base64");
  const storagePath = `${linkType}/${linkId}/${crypto.randomUUID()}-${file.nom || "document"}`;
  const { error } = await supabase.storage.from("attachments").upload(storagePath, buffer, { contentType });
  if (error) return;
  await supabase.from("attachments").insert({
    link_type: linkType,
    link_id: linkId,
    nom: file.nom || "document",
    type: file.type || contentType,
    taille: file.taille || buffer.byteLength,
    storage_path: storagePath,
  });
}

export async function importLegacyData(jsonText: string) {
  const supabase = createClient();
  let legacy: LegacyExport;
  try {
    legacy = JSON.parse(jsonText);
  } catch {
    throw new Error("Le fichier n'est pas un JSON valide.");
  }

  const log: string[] = [];
  const foreuseIdMap = new Map<string, string>();
  const foreuseNomMap = new Map<string, string>();
  const equipeIdMap = new Map<string, string>();
  const equipeNomMap = new Map<string, string>();
  const chantierIdMap = new Map<string, string>();
  const chantierNomMap = new Map<string, string>();
  const devisIdMap = new Map<string, string>();
  const achatIdMap = new Map<string, string>();
  const maintenanceIdMap = new Map<string, string>();

  for (const f of legacy.foreuses ?? []) {
    const { data, error } = await supabase
      .from("foreuses")
      .insert({
        nom: f.nom,
        statut: f.statut || "Disponible",
        localisation: toNull(f.localisation),
        heures_moteur: Number(f.heuresMoteur) || 0,
        prochaine_maintenance: toNull(f.prochaineMaintenance),
        cout_horaire: Number(f.coutHoraire) || 0,
      })
      .select("id")
      .single();
    if (!error && data) {
      foreuseIdMap.set(f.id, data.id);
      foreuseNomMap.set(f.nom, data.id);
    }
  }
  log.push(`${foreuseIdMap.size} foreuse(s) importée(s)`);

  for (const e of legacy.equipes ?? []) {
    const { data, error } = await supabase
      .from("equipes")
      .insert({
        nom: e.nom,
        chef: toNull(e.chef),
        membres: toNull(e.membres),
        habilitations: toNull(e.habilitations),
        disponibilite: e.disponibilite || "Disponible",
      })
      .select("id")
      .single();
    if (!error && data) {
      equipeIdMap.set(e.id, data.id);
      equipeNomMap.set(e.nom, data.id);
    }
  }
  log.push(`${equipeIdMap.size} équipe(s) importée(s)`);

  for (const c of legacy.chantiers ?? []) {
    const { data, error } = await supabase
      .from("chantiers")
      .insert({
        nom: c.nom,
        client: toNull(c.client),
        adresse: toNull(c.adresse),
        statut: c.statut || "À venir",
        foreuse_id: c.foreuse ? foreuseNomMap.get(c.foreuse) ?? null : null,
        equipe_id: c.equipe ? equipeNomMap.get(c.equipe) ?? null : null,
        profondeur_prevue: Number(c.profondeurPrevue) || 0,
        profondeur_foree: Number(c.profondeurForee) || 0,
        materiel_necessaire: toNull(c.materielNecessaire),
        montant_devis: Number(c.montantDevis) || 0,
        cout_reel: Number(c.coutReel) || 0,
        date_debut: toNull(c.dateDebut),
        date_fin: toNull(c.dateFin),
      })
      .select("id")
      .single();
    if (!error && data) {
      chantierIdMap.set(c.id, data.id);
      chantierNomMap.set(c.nom, data.id);
    }
  }
  log.push(`${chantierIdMap.size} chantier(s) importé(s)`);

  let facturesCount = 0;
  for (const f of legacy.factures ?? []) {
    const { error } = await supabase.from("factures").insert({
      chantier_id: f.chantier ? chantierNomMap.get(f.chantier) ?? null : null,
      montant: Number(f.montant) || 0,
      statut: f.statut || "Émise",
      date_emission: toNull(f.dateEmission),
      date_echeance: toNull(f.dateEcheance),
    });
    if (!error) facturesCount++;
  }
  log.push(`${facturesCount} facture(s) importée(s)`);

  let achatsCount = 0;
  for (const a of legacy.achats ?? []) {
    const { data, error } = await supabase
      .from("achats")
      .insert({
        date: a.date || new Date().toISOString().slice(0, 10),
        fournisseur: toNull(a.fournisseur),
        categorie: a.categorie || "Autre",
        designation: toNull(a.designation),
        quantite: Number(a.quantite) || 0,
        montant: Number(a.montant) || 0,
        chantier_id: a.chantier ? chantierNomMap.get(a.chantier) ?? null : null,
      })
      .select("id")
      .single();
    if (!error && data) {
      achatIdMap.set(a.id, data.id);
      achatsCount++;
    }
  }
  log.push(`${achatsCount} achat(s) importé(s)`);

  let maintenancesCount = 0;
  for (const m of legacy.maintenances ?? []) {
    const { data, error } = await supabase
      .from("maintenances")
      .insert({
        foreuse_id: m.foreuse ? foreuseNomMap.get(m.foreuse) ?? null : null,
        date: m.date || new Date().toISOString().slice(0, 10),
        type: m.type || "Préventive",
        description: toNull(m.description),
        cout: Number(m.cout) || 0,
        heures_moteur: Number(m.heuresMoteur) || 0,
      })
      .select("id")
      .single();
    if (!error && data) {
      maintenanceIdMap.set(m.id, data.id);
      maintenancesCount++;
    }
  }
  log.push(`${maintenancesCount} maintenance(s) importée(s)`);

  let devisCount = 0;
  for (const d of legacy.devis ?? []) {
    const { data, error } = await supabase
      .from("devis")
      .insert({
        reference: d.reference || `BFE-DEV-${new Date().getFullYear()}-${String(devisCount + 1).padStart(3, "0")}`,
        version: d.version || "V0",
        client: toNull(d.client),
        objet: toNull(d.objet),
        type_activite: d.typeActivite || "Forage géothermique",
        statut: d.statut || "Brouillon",
        tva: Number(d.tva) || 0,
        date_creation: d.dateCreation || new Date().toISOString().slice(0, 10),
        date_envoi: toNull(d.dateEnvoi),
        date_relance: toNull(d.dateRelance),
        date_reponse: toNull(d.dateReponse),
        client_adresse_facturation: toNull(d.clientAdresseFacturation),
        contact_chantier: toNull(d.contactChantier),
        adresse_chantier: toNull(d.adresseChantier),
        references_cadastrales: toNull(d.referencesCadastrales),
        usage_prevu: toNull(d.usagePrevu),
        type_ouvrage: toNull(d.typeOuvrage),
        profondeur_previsionnelle: toNull(d.profondeurPrevisionnelle),
        diametre_forage: toNull(d.diametreForage),
        tubage_prevu: toNull(d.tubagePrevu),
        crepines: toNull(d.crepines),
        massif_filtrant: toNull(d.massifFiltrant),
        cimentation_annulaire: toNull(d.cimentationAnnulaire),
        essais_prevus: toNull(d.essaisPrevus),
        objet_texte: toNull(d.objetTexte),
        prestations_incluses: toNull(d.prestationsIncluses),
        limites_exclusions: toNull(d.limitesExclusions),
        acompte_pct: Number(d.acomptePct) || 0,
        validite_jours: Number(d.validiteJours) || 30,
        chantier_genere_id: d.chantierGenere ? chantierIdMap.get(d.chantierGenere) ?? null : null,
        lignes: Array.isArray(d.lignes) ? d.lignes : [],
      })
      .select("id")
      .single();
    if (!error && data) {
      devisIdMap.set(d.id, data.id);
      devisCount++;
    }
  }
  log.push(`${devisCount} devis importé(s)`);

  let filesCount = 0;
  const linkMaps: Record<string, Map<string, string>> = {
    chantiers: chantierIdMap,
    devis: devisIdMap,
    achats: achatIdMap,
    maintenances: maintenanceIdMap,
  };
  for (const file of legacy.files ?? []) {
    const map = linkMaps[file.linkType];
    const newLinkId = map?.get(file.linkId);
    if (!newLinkId) continue;
    await uploadLegacyFile(supabase, file.linkType, newLinkId, file);
    filesCount++;
  }
  log.push(`${filesCount} document(s) importé(s)`);

  revalidatePath("/", "layout");
  return log;
}
