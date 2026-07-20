"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FORFAIT_TEMPLATES } from "@/lib/forfaitTemplates";
import type { Devis, DevisLigne, LigneType } from "@/lib/types";

export async function createDevis(affaireId: string, data: Partial<Devis>) {
  const supabase = createClient();
  const { data: row, error } = await supabase
    .from("devis")
    .insert({ ...data, affaire_id: affaireId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/devis`);
  return row as Devis;
}

export async function updateDevis(id: string, affaireId: string, data: Partial<Devis>) {
  const supabase = createClient();
  const { error } = await supabase
    .from("devis")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/devis`);
}

export async function deleteDevis(id: string, affaireId: string) {
  const supabase = createClient();

  // Tool List rows are kept independent from the quote on purpose (a
  // physical prep already in progress shouldn't vanish), but rows that
  // were only ever a placeholder for this quote's lines — never given a
  // serial number or assigned to a BL — are just clutter once the quote
  // is gone, so clean those up before the cascade delete nulls their link.
  const { data: lignes } = await supabase.from("devis_lignes").select("id").eq("devis_id", id);
  const ligneIds = (lignes ?? []).map((l) => l.id);
  if (ligneIds.length) {
    await supabase.from("tool_list_items").delete().in("devis_ligne_id", ligneIds).is("numero_serie", null).is("bl_id", null);
  }

  const { error } = await supabase.from("devis").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/devis`);
  revalidatePath(`/affaires/${affaireId}/tool-list`);
}

// Transport is a shipping charge, never a physical item to track — it must
// never land on the Tool List, so it starts off excluded (no Tool List
// toggle is shown for the Transport tab). Personnel/Serrage ("autres
// prestations") can legitimately need Tool List tracking too, so they
// default to included, same as equipment lines, with their own toggle.
const NON_EQUIPMENT_TYPES: LigneType[] = ["Transport", "Packaging", "Forfait", "Titre"];

export async function createDevisLigne(devisId: string, ordre: number, type: LigneType = "Operation") {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("devis_lignes")
    .insert({ devis_id: devisId, ordre, type, designation: "", quantite: 1, inclure_tool_list: !NON_EQUIPMENT_TYPES.includes(type) })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires`);
  return data as DevisLigne;
}

// Bulk-inserts a starter set of lines for a "Forfait" devis (e.g. the
// Directional Drilling lump-sum package) — a faster starting point than
// retyping every item/price by hand; the user edits or deletes lines
// afterward as needed for the specific affaire.
export async function insertForfaitTemplate(devisId: string, affaireId: string, templateKey: string) {
  const template = FORFAIT_TEMPLATES.find((t) => t.key === templateKey);
  if (!template) throw new Error("Trame introuvable.");

  const supabase = createClient();
  const { data: existing } = await supabase.from("devis_lignes").select("ordre").eq("devis_id", devisId).order("ordre", { ascending: false }).limit(1);
  let ordre = (existing?.[0]?.ordre ?? -1) + 1;

  const rows = template.lignes.map((l) => ({
    devis_id: devisId,
    ordre: ordre++,
    type: l.type,
    reference_article: l.reference_article,
    designation: l.designation,
    quantite: l.quantite,
    prix_forfait: l.prix_forfait,
    inclure_tool_list: !NON_EQUIPMENT_TYPES.includes(l.type),
  }));

  const { data, error } = await supabase.from("devis_lignes").insert(rows).select();
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/devis`);
  return data as DevisLigne[];
}

export async function updateDevisLigne(id: string, data: Partial<DevisLigne>) {
  const supabase = createClient();
  const { error } = await supabase.from("devis_lignes").update(data).eq("id", id);
  if (error) throw new Error(error.message);
}

// Linking a référence pre-fills the line's own price list from the
// catalogue (only fields still empty, never overwriting a price already
// typed in), same as before — but now also propagates the reference's
// declared accessoires (e.g. a Moteur's Rotor + Stator power section, see
// catalogue_accessoires) as new lines on the same devis, priced at 0 since
// they're already covered by the parent line's own price. Guarded by
// existing outil_id links on the devis so re-selecting the same référence
// (or a devis that already has its Rotor/Stator) doesn't duplicate them.
export async function selectDevisLigneOutil(ligneId: string, devisId: string, outilId: string | null): Promise<DevisLigne[]> {
  const supabase = createClient();
  const { data: ligne, error: ligneError } = await supabase.from("devis_lignes").select("*").eq("id", ligneId).maybeSingle();
  if (ligneError) throw new Error(ligneError.message);
  if (!ligne) throw new Error("Ligne introuvable.");

  if (!outilId) {
    const { data, error } = await supabase.from("devis_lignes").update({ outil_id: null }).eq("id", ligneId).select().single();
    if (error) throw new Error(error.message);
    return [data as DevisLigne];
  }

  const { data: outil, error: outilError } = await supabase.from("catalogue_outils").select("*").eq("id", outilId).maybeSingle();
  if (outilError) throw new Error(outilError.message);
  if (!outil) throw new Error("Référence catalogue introuvable.");

  const patch: Partial<DevisLigne> = { outil_id: outilId };
  if (!ligne.prix_stand_by) patch.prix_stand_by = outil.prix_stand_by;
  if (!ligne.prix_operation) patch.prix_operation = outil.prix_operation;
  if (!ligne.prix_uc) patch.prix_uc = outil.prix_uc;
  if (!ligne.prix_lih) patch.prix_lih = outil.prix_lih;
  if (!ligne.prix_inspection) patch.prix_inspection = outil.prix_inspection;
  if (!ligne.prix_restocking) patch.prix_restocking = outil.prix_restocking;
  if (!ligne.prix_serrage) patch.prix_serrage = outil.prix_serrage;
  if (!ligne.prix_forfait) patch.prix_forfait = outil.prix_defaut;

  const { data: updatedLigne, error: updateError } = await supabase.from("devis_lignes").update(patch).eq("id", ligneId).select().single();
  if (updateError) throw new Error(updateError.message);

  const rows: DevisLigne[] = [updatedLigne as DevisLigne];

  const { data: accessoireLinks } = await supabase.from("catalogue_accessoires").select("accessoire_id").eq("outil_id", outilId);
  const accessoireIds = (accessoireLinks ?? []).map((a) => a.accessoire_id as string);
  if (accessoireIds.length) {
    const { data: existingLignes } = await supabase.from("devis_lignes").select("outil_id").eq("devis_id", devisId);
    const existingOutilIds = new Set((existingLignes ?? []).map((l) => l.outil_id).filter(Boolean));
    const toAdd = accessoireIds.filter((id) => !existingOutilIds.has(id));

    if (toAdd.length) {
      const { data: accOutils } = await supabase.from("catalogue_outils").select("*").in("id", toAdd);

      // Insert right after this ligne's own ordre, not at the very end of
      // the devis, so Rotor/Stator read as this Moteur's power section —
      // shift every later ligne's ordre up to make room.
      const { data: toShift } = await supabase
        .from("devis_lignes")
        .select("id, ordre")
        .eq("devis_id", devisId)
        .gt("ordre", ligne.ordre)
        .order("ordre", { ascending: false });
      for (const row of toShift ?? []) {
        const { error } = await supabase.from("devis_lignes").update({ ordre: row.ordre + toAdd.length }).eq("id", row.id);
        if (error) throw new Error(error.message);
      }

      const toInsert = (accOutils ?? []).map((acc, i) => ({
        devis_id: devisId,
        ordre: ligne.ordre + i + 1,
        type: ligne.type,
        designation: acc.designation,
        reference_article: acc.numero_article,
        outil_id: acc.id,
        quantite: ligne.quantite,
        inclure_tool_list: true,
        prix_stand_by: 0,
        prix_operation: 0,
        prix_uc: 0,
        prix_lih: 0,
        prix_inspection: 0,
        prix_restocking: 0,
        prix_serrage: 0,
        prix_forfait: 0,
      }));
      const { data: inserted, error: insertError } = await supabase.from("devis_lignes").insert(toInsert).select();
      if (insertError) throw new Error(insertError.message);
      rows.push(...((inserted ?? []) as DevisLigne[]));
    }
  }

  revalidatePath(`/affaires`);
  return rows;
}

// Manual "+ Grapple" on an Overshot line — mirrors the accessoire-insert
// shift in selectDevisLigneOutil (positioned right after the triggering
// ligne, later lignes' ordre bumped to make room) but for a single
// unlinked line, since a Grapple isn't tracked as its own catalogue
// reference the way a Moteur's Rotor/Stator are.
export async function addGrappleLigne(devisId: string, ligneId: string): Promise<DevisLigne[]> {
  const supabase = createClient();
  const { data: ligne, error: ligneError } = await supabase.from("devis_lignes").select("*").eq("id", ligneId).maybeSingle();
  if (ligneError) throw new Error(ligneError.message);
  if (!ligne) throw new Error("Ligne introuvable.");

  const { data: toShift } = await supabase
    .from("devis_lignes")
    .select("id, ordre")
    .eq("devis_id", devisId)
    .gt("ordre", ligne.ordre)
    .order("ordre", { ascending: false });
  for (const row of toShift ?? []) {
    const { error } = await supabase.from("devis_lignes").update({ ordre: row.ordre + 1 }).eq("id", row.id);
    if (error) throw new Error(error.message);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("devis_lignes")
    .insert({
      devis_id: devisId,
      ordre: ligne.ordre + 1,
      type: ligne.type,
      designation: "Grapple",
      quantite: 1,
      inclure_tool_list: true,
      prix_stand_by: 0,
      prix_operation: 0,
      prix_uc: 0,
      prix_lih: 0,
      prix_inspection: 0,
      prix_restocking: 0,
      prix_serrage: 0,
      prix_forfait: 0,
    })
    .select()
    .single();
  if (insertError) throw new Error(insertError.message);

  revalidatePath(`/affaires`);
  return [inserted as DevisLigne];
}

// Same as addGrappleLigne, for a Hydraulic Pipe Cutter's Set of cutters.
export async function addSetOfCuttersLigne(devisId: string, ligneId: string): Promise<DevisLigne[]> {
  const supabase = createClient();
  const { data: ligne, error: ligneError } = await supabase.from("devis_lignes").select("*").eq("id", ligneId).maybeSingle();
  if (ligneError) throw new Error(ligneError.message);
  if (!ligne) throw new Error("Ligne introuvable.");

  const { data: toShift } = await supabase
    .from("devis_lignes")
    .select("id, ordre")
    .eq("devis_id", devisId)
    .gt("ordre", ligne.ordre)
    .order("ordre", { ascending: false });
  for (const row of toShift ?? []) {
    const { error } = await supabase.from("devis_lignes").update({ ordre: row.ordre + 1 }).eq("id", row.id);
    if (error) throw new Error(error.message);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("devis_lignes")
    .insert({
      devis_id: devisId,
      ordre: ligne.ordre + 1,
      type: ligne.type,
      designation: "Set of cutters",
      quantite: 1,
      inclure_tool_list: true,
      prix_stand_by: 0,
      prix_operation: 0,
      prix_uc: 0,
      prix_lih: 0,
      prix_inspection: 0,
      prix_restocking: 0,
      prix_serrage: 0,
      prix_forfait: 0,
    })
    .select()
    .single();
  if (insertError) throw new Error(insertError.message);

  revalidatePath(`/affaires`);
  return [inserted as DevisLigne];
}

export async function deleteDevisLigne(id: string, affaireId: string) {
  const supabase = createClient();

  // A removed quote line must not keep haunting the Tool List / Service
  // Ticket. Rows it generated that nobody has touched yet (no serial number,
  // no BL) are cleaned up here, mirroring deleteDevis's cascade rule; rows
  // already carrying on-site data are left alone rather than deleted.
  await supabase.from("tool_list_items").delete().eq("devis_ligne_id", id).is("numero_serie", null).is("bl_id", null);

  const { error } = await supabase.from("devis_lignes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/devis`);
  revalidatePath(`/affaires/${affaireId}/tool-list`);
}
