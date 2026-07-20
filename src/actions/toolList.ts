"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { syncCatalogueStatut } from "@/actions/catalogue";
import { getOrCreateOpenPurchaseOrder } from "@/actions/purchaseOrders";
import { RETOUR_DECISIONS, TOOL_STATUT_TO_CATALOGUE_STATUT, type RetourDecision } from "@/lib/company";
import { compareDiametres } from "@/lib/diametre";
import { isMoteurDesignation } from "@/lib/moteur";
import type { ToolListItem } from "@/lib/types";

export type { RetourDecision };

// item_index is a plain integer used as the row's "#" everywhere (Tool
// List, BL, Service Ticket, PDFs) — inserting Rotor/Stator right under
// their Moteur line, instead of tacking them onto the very end, means
// shifting every row already below that point up to make room rather than
// just appending at whatever the current max happens to be.
async function insertToolListItemsAfter(
  supabase: SupabaseClient,
  affaireId: string,
  afterItemIndex: number,
  rows: Array<Partial<ToolListItem> & { designation: string }>,
): Promise<void> {
  const { data: toShift } = await supabase
    .from("tool_list_items")
    .select("id, item_index")
    .eq("affaire_id", affaireId)
    .gt("item_index", afterItemIndex)
    .order("item_index", { ascending: false });
  for (const row of toShift ?? []) {
    const { error } = await supabase
      .from("tool_list_items")
      .update({ item_index: row.item_index + rows.length })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
  }
  const { error } = await supabase.from("tool_list_items").insert(
    rows.map((r, i) => ({ ...r, affaire_id: affaireId, item_index: afterItemIndex + i + 1 })),
  );
  if (error) throw new Error(error.message);
}

// Expands each eligible devis line's quantity into individual Tool List
// rows (one per physical unit), and reconciles counts when quantities
// change: missing rows are added, and surplus rows are only removed if
// nobody has entered a serial number or assigned them to a BL yet — data
// already filled in on-site is never silently deleted. Designation,
// propriétaire, reference/catalogue link and pricing are re-synced on every
// regeneration so a later devis edit (fixing a typo, correcting a price)
// always propagates. Eligibility is driven purely by the line's
// "inclure_tool_list" flag, so commercial can pull a line into the Tool
// List — or keep it out — independently of its pricing type.
export async function generateToolListFromDevis(devisId: string, affaireId: string) {
  const supabase = createClient();

  const { data: lignes, error: lignesError } = await supabase
    .from("devis_lignes")
    .select("*")
    .eq("devis_id", devisId)
    .eq("inclure_tool_list", true);
  if (lignesError) throw new Error(lignesError.message);

  const { data: existingItems, error: itemsError } = await supabase
    .from("tool_list_items")
    .select("*")
    .eq("affaire_id", affaireId);
  if (itemsError) throw new Error(itemsError.message);

  const { data: countRow } = await supabase
    .from("tool_list_items")
    .select("item_index")
    .eq("affaire_id", affaireId)
    .order("item_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  let nextIndex = (countRow?.item_index ?? 0) + 1;

  const log: string[] = [];

  for (const ligne of lignes ?? []) {
    // Power-section rows (see below) share this ligne's devis_ligne_id so a
    // deleted devis line cleans them up too, but they must stay out of the
    // quantity reconciliation below — only clones of the ligne's own
    // designation count toward its target.
    const existingForLigne = (existingItems ?? []).filter((i) => i.devis_ligne_id === ligne.id);
    const existing = existingForLigne.filter((i) => i.designation === ligne.designation);
    const target = Math.max(0, Math.round(ligne.quantite || 0));

    // Keep pricing in sync on rows that already exist (e.g. generated
    // before prices were entered on the devis, or before the price
    // columns existed at all) — everything else about the row is left
    // untouched.
    if (existing.length) {
      const { error } = await supabase
        .from("tool_list_items")
        .update({
          designation: ligne.designation,
          proprietaire: ligne.proprietaire,
          diametre_souhaite: ligne.diametre_souhaite,
          prix_stand_by: ligne.prix_stand_by,
          prix_operation: ligne.prix_operation,
          prix_uc: ligne.prix_uc,
          prix_lih: ligne.prix_lih,
          prix_inspection: ligne.prix_inspection,
          prix_restocking: ligne.prix_restocking,
          prix_serrage: ligne.prix_serrage,
          reference_article: ligne.reference_article,
          outil_id: ligne.outil_id,
        })
        .in(
          "id",
          existing.map((i) => i.id),
        );
      if (error) throw new Error(error.message);
    }

    let survivingCloneIndices = existing.map((i) => i.item_index);

    if (existing.length < target) {
      const toInsert = Array.from({ length: target - existing.length }, () => ({
        affaire_id: affaireId,
        devis_ligne_id: ligne.id,
        item_index: nextIndex++,
        designation: ligne.designation,
        reference_article: ligne.reference_article,
        outil_id: ligne.outil_id,
        diametre_souhaite: ligne.diametre_souhaite,
        proprietaire: ligne.proprietaire,
        statut: "En stock" as const,
        prix_stand_by: ligne.prix_stand_by,
        prix_operation: ligne.prix_operation,
        prix_uc: ligne.prix_uc,
        prix_lih: ligne.prix_lih,
        prix_inspection: ligne.prix_inspection,
        prix_restocking: ligne.prix_restocking,
        prix_serrage: ligne.prix_serrage,
      }));
      const { error } = await supabase.from("tool_list_items").insert(toInsert);
      if (error) throw new Error(error.message);
      log.push(`${ligne.designation.split("\n")[0]} : +${toInsert.length} ligne(s)`);
      survivingCloneIndices = [...survivingCloneIndices, ...toInsert.map((r) => r.item_index)];
    } else if (existing.length > target) {
      const removable = existing.filter((i) => !i.numero_serie && !i.bl_id).slice(0, existing.length - target);
      const removableIds = new Set(removable.map((i) => i.id));
      if (removableIds.size) {
        const { error } = await supabase.from("tool_list_items").delete().in("id", Array.from(removableIds));
        if (error) throw new Error(error.message);
        log.push(`${ligne.designation.split("\n")[0]} : -${removableIds.size} ligne(s)`);
      }
      survivingCloneIndices = existing.filter((i) => !removableIds.has(i.id)).map((i) => i.item_index);
    }

    // A devis line linked to a real catalogue reference reserves it for this
    // affaire the moment it lands on the Tool List — one sync per reference,
    // not per physical unit (the catalogue tracks the reference, not serials).
    // If the diameter actually wanted differs from the catalogue reference's
    // nominal diameter, the reservation itself flags the rework needed
    // (rectifier = machined down, recharger = built back up) instead of
    // just "Réservé".
    if (ligne.outil_id && target > 0) {
      const { data: outil } = await supabase.from("catalogue_outils").select("diametre").eq("id", ligne.outil_id).maybeSingle();
      const ecart = compareDiametres(ligne.diametre_souhaite, outil?.diametre);
      if (ecart === "rectifier") {
        await syncCatalogueStatut(ligne.outil_id, "À rectifier", affaireId, `Diamètre demandé ${ligne.diametre_souhaite} ≠ catalogue ${outil?.diametre} — à rectifier`);
      } else if (ecart === "recharger") {
        await syncCatalogueStatut(ligne.outil_id, "À recharger", affaireId, `Diamètre demandé ${ligne.diametre_souhaite} ≠ catalogue ${outil?.diametre} — à recharger`);
      } else {
        await syncCatalogueStatut(ligne.outil_id, "Réservé", affaireId, "Lié depuis le devis");
      }
    }

    // Moteur power section: Rotor + Stator wear independently and need
    // their own serial number, but nobody knows which physical rotor/stator
    // is going out until atelier preps the shipment — so these land
    // unlinked (no outil_id), for atelier to pick via the Tool List's own
    // OutilPicker. Inserted right after this ligne's own row(s) — not
    // appended at the end — so they read as this Moteur's power section,
    // not an unrelated tail entry. The existence check is re-queried fresh
    // here rather than reusing existingForLigne (snapshotted once at the
    // top of the function) — clicking "Générer" twice in quick succession
    // used to race two runs against the same stale snapshot and each would
    // conclude nothing existed yet, doubling up the pair.
    if (target > 0 && isMoteurDesignation(ligne.designation)) {
      const { data: freshSiblings } = await supabase
        .from("tool_list_items")
        .select("designation")
        .eq("devis_ligne_id", ligne.id)
        .in("designation", ["Rotor", "Stator"]);
      const toAdd: string[] = [];
      if (!freshSiblings?.some((i) => i.designation === "Rotor")) toAdd.push("Rotor");
      if (!freshSiblings?.some((i) => i.designation === "Stator")) toAdd.push("Stator");
      if (toAdd.length && survivingCloneIndices.length) {
        const afterIndex = Math.max(...survivingCloneIndices);
        await insertToolListItemsAfter(
          supabase,
          affaireId,
          afterIndex,
          toAdd.map((designation) => ({ devis_ligne_id: ligne.id, designation, statut: "En stock" as const })),
        );
        nextIndex += toAdd.length;
        log.push(`${ligne.designation.split("\n")[0]} : + ${toAdd.join(" + ")} (power section)`);
      }
    }
  }

  revalidatePath(`/affaires/${affaireId}/tool-list`);
  revalidatePath(`/affaires/${affaireId}/service-ticket`);
  revalidatePath(`/affaires/${affaireId}/service-ticket-operateur`);
  return log;
}

// Same Rotor/Stator auto-add as generateToolListFromDevis, for a Moteur
// typed directly onto the Tool List (not synced from a devis line) —
// unlinked rows, atelier picks the actual catalogue references afterward.
// Inserted right after the Moteur row itself (afterItemIndex), not
// appended at the end. Inherits the Moteur row's own devis_ligne_id (null
// for a genuinely standalone row) so that if it came from a devis line,
// deleting that line also cleans up its Rotor/Stator — otherwise they'd be
// orphaned exactly like a manually-added row, surviving forever even after
// the devis is emptied out.
async function addMoteurPowerSection(supabase: SupabaseClient, affaireId: string, afterItemIndex: number, devisLigneId: string | null) {
  await insertToolListItemsAfter(supabase, affaireId, afterItemIndex, [
    { devis_ligne_id: devisLigneId, designation: "Rotor", statut: "En stock" as const },
    { devis_ligne_id: devisLigneId, designation: "Stator", statut: "En stock" as const },
  ]);
}

export async function createToolListItem(affaireId: string, data: Partial<ToolListItem>) {
  const supabase = createClient();
  const { data: countRow } = await supabase
    .from("tool_list_items")
    .select("item_index")
    .eq("affaire_id", affaireId)
    .order("item_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  const itemIndex = (countRow?.item_index ?? 0) + 1;
  const { error } = await supabase.from("tool_list_items").insert({
    ...data,
    affaire_id: affaireId,
    item_index: itemIndex,
  });
  if (error) throw new Error(error.message);
  // Brand new, so it's already the last row — nothing below it to shift.
  if (isMoteurDesignation(data.designation)) await addMoteurPowerSection(supabase, affaireId, itemIndex, data.devis_ligne_id ?? null);
  revalidatePath(`/affaires/${affaireId}/tool-list`);
  revalidatePath(`/affaires/${affaireId}/service-ticket`);
  revalidatePath(`/affaires/${affaireId}/service-ticket-operateur`);
}

// Mirrors selectDevisLigneOutil's propagation for the case where a Tool
// List row is linked to a catalogue reference directly (not via a devis
// line) — e.g. a Moteur added straight onto the Tool List should still
// bring its Rotor + Stator power section along, right under it. Guarded by
// any tool_list_item on this affaire already carrying that outil_id, from
// either path, so a Moteur devis line that already spawned its
// Rotor/Stator via the devis doesn't get them duplicated here as the Tool
// List syncs.
async function propagateAccessoiresToToolList(
  supabase: SupabaseClient,
  affaireId: string,
  outilId: string,
  afterItemIndex: number,
  devisLigneId: string | null,
) {
  const { data: accessoireLinks } = await supabase.from("catalogue_accessoires").select("accessoire_id").eq("outil_id", outilId);
  const accessoireIds = (accessoireLinks ?? []).map((a) => a.accessoire_id as string);
  if (!accessoireIds.length) return;

  const { data: existingItems } = await supabase.from("tool_list_items").select("outil_id").eq("affaire_id", affaireId);
  const existingOutilIds = new Set((existingItems ?? []).map((i) => i.outil_id).filter(Boolean));
  const toAdd = accessoireIds.filter((accId) => !existingOutilIds.has(accId));
  if (!toAdd.length) return;

  const { data: accOutils } = await supabase.from("catalogue_outils").select("*").in("id", toAdd);
  await insertToolListItemsAfter(
    supabase,
    affaireId,
    afterItemIndex,
    (accOutils ?? []).map((acc) => ({
      devis_ligne_id: devisLigneId,
      designation: acc.designation,
      reference_article: acc.numero_article,
      outil_id: acc.id,
      statut: "En stock" as const,
    })),
  );
}

export async function updateToolListItem(id: string, affaireId: string, data: Partial<ToolListItem>) {
  const supabase = createClient();

  // Linking to a real catalogue reference, entering its serial number, or
  // setting/editing the diameter actually wanted all confirm the reference
  // is reserved for this affaire — and if the wanted diameter differs from
  // the catalogue reference's nominal diameter, that reservation itself
  // flags the rework needed (rectifier/recharger) instead of plain Réservé.
  // Once reserved, the row's own statut (Sur site/Retour/...) keeps the
  // catalogue statut in sync automatically.
  const touchesReservation =
    data.outil_id !== undefined || data.statut !== undefined || data.numero_serie !== undefined || data.diametre_souhaite !== undefined;
  if (touchesReservation) {
    const { data: current } = await supabase
      .from("tool_list_items")
      .select("outil_id, statut, diametre_souhaite, item_index, devis_ligne_id")
      .eq("id", id)
      .maybeSingle();
    const outilId = data.outil_id !== undefined ? data.outil_id : current?.outil_id;

    if (outilId) {
      const diametreSouhaite = data.diametre_souhaite !== undefined ? data.diametre_souhaite : current?.diametre_souhaite;
      const isNewLink = data.outil_id !== undefined && data.outil_id !== current?.outil_id;
      const serialJustSet = data.numero_serie !== undefined && !!data.numero_serie;
      const diametreChanged = data.diametre_souhaite !== undefined && data.diametre_souhaite !== current?.diametre_souhaite;

      if (isNewLink || serialJustSet || diametreChanged) {
        const { data: outil } = await supabase.from("catalogue_outils").select("diametre").eq("id", outilId).maybeSingle();
        const ecart = compareDiametres(diametreSouhaite, outil?.diametre);
        if (ecart === "rectifier") {
          await syncCatalogueStatut(outilId, "À rectifier", affaireId, `Diamètre demandé ${diametreSouhaite} ≠ catalogue ${outil?.diametre} — à rectifier`);
        } else if (ecart === "recharger") {
          await syncCatalogueStatut(outilId, "À recharger", affaireId, `Diamètre demandé ${diametreSouhaite} ≠ catalogue ${outil?.diametre} — à recharger`);
        } else if (isNewLink || serialJustSet) {
          await syncCatalogueStatut(outilId, "Réservé", affaireId, isNewLink ? "Lié depuis la Tool List" : "N° de série renseigné sur la Tool List");
        }
        if (isNewLink) await propagateAccessoiresToToolList(supabase, affaireId, outilId, current?.item_index ?? 0, current?.devis_ligne_id ?? null);
      } else if (data.statut !== undefined) {
        const mapped = TOOL_STATUT_TO_CATALOGUE_STATUT[data.statut];
        if (mapped) await syncCatalogueStatut(outilId, mapped, affaireId);
      }
    }
  }

  // Typing "Moteur"/"PDM Motor" into a standalone Tool List row (not one
  // synced from a devis line, which is handled by generateToolListFromDevis
  // instead) adds its Rotor + Stator the moment the designation newly
  // matches — guarded against re-firing on every blur by comparing against
  // what the row's designation was before this edit.
  if (data.designation !== undefined && isMoteurDesignation(data.designation)) {
    const { data: current } = await supabase.from("tool_list_items").select("designation, devis_ligne_id, item_index").eq("id", id).maybeSingle();
    if (current && current.devis_ligne_id === null && !isMoteurDesignation(current.designation)) {
      await addMoteurPowerSection(supabase, affaireId, current.item_index, null);
    }
  }

  const { error } = await supabase.from("tool_list_items").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/tool-list`);
  revalidatePath(`/affaires/${affaireId}/bl`);
  revalidatePath(`/affaires/${affaireId}/pointage-retour`);
  revalidatePath(`/affaires/${affaireId}/service-ticket`);
  revalidatePath(`/affaires/${affaireId}/service-ticket-operateur`);
}

// Explicit, on-demand version of the same Rotor/Stator add — for a Moteur
// row that predates this feature (its designation matched before the
// auto-detection existed, so nothing ever triggered it), or any case where
// the automatic paths missed it. No dedup guard: this is a deliberate
// click, same as "+ Ajouter un équipement" always adding a fresh row.
export async function addPowerSectionManually(itemId: string, affaireId: string) {
  const supabase = createClient();
  const { data: item, error } = await supabase.from("tool_list_items").select("item_index, devis_ligne_id").eq("id", itemId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!item) throw new Error("Ligne introuvable.");
  await addMoteurPowerSection(supabase, affaireId, item.item_index, item.devis_ligne_id);
  revalidatePath(`/affaires/${affaireId}/tool-list`);
  revalidatePath(`/affaires/${affaireId}/service-ticket`);
  revalidatePath(`/affaires/${affaireId}/service-ticket-operateur`);
}

// Same idea as addPowerSectionManually but for an Overshot's Grapple — a
// single unlinked row inserted right after the Overshot's own row, for
// atelier to pick the actual grapple via the Tool List's OutilPicker.
export async function addGrappleManually(itemId: string, affaireId: string) {
  const supabase = createClient();
  const { data: item, error } = await supabase.from("tool_list_items").select("item_index, devis_ligne_id").eq("id", itemId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!item) throw new Error("Ligne introuvable.");
  await insertToolListItemsAfter(supabase, affaireId, item.item_index, [
    { devis_ligne_id: item.devis_ligne_id, designation: "Grapple", statut: "En stock" as const },
  ]);
  revalidatePath(`/affaires/${affaireId}/tool-list`);
  revalidatePath(`/affaires/${affaireId}/service-ticket`);
  revalidatePath(`/affaires/${affaireId}/service-ticket-operateur`);
}

// Same idea again, for a Hydraulic Pipe Cutter's Set of cutters.
export async function addSetOfCuttersManually(itemId: string, affaireId: string) {
  const supabase = createClient();
  const { data: item, error } = await supabase.from("tool_list_items").select("item_index, devis_ligne_id").eq("id", itemId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!item) throw new Error("Ligne introuvable.");
  await insertToolListItemsAfter(supabase, affaireId, item.item_index, [
    { devis_ligne_id: item.devis_ligne_id, designation: "Set of cutters", statut: "En stock" as const },
  ]);
  revalidatePath(`/affaires/${affaireId}/tool-list`);
  revalidatePath(`/affaires/${affaireId}/service-ticket`);
  revalidatePath(`/affaires/${affaireId}/service-ticket-operateur`);
}

export async function deleteToolListItem(id: string, affaireId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("tool_list_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/tool-list`);
  revalidatePath(`/affaires/${affaireId}/service-ticket`);
  revalidatePath(`/affaires/${affaireId}/service-ticket-operateur`);
}

// Matches the original Excel Tool List: typing a BL number against an
// equipment row is enough — the corresponding BL record is created on the
// fly if it doesn't exist yet, no separate "create BL" step required.
export async function setToolListItemBlByNumber(itemId: string, affaireId: string, numeroBl: string) {
  const supabase = createClient();
  const trimmed = numeroBl.trim();

  if (!trimmed) {
    const { error } = await supabase.from("tool_list_items").update({ bl_id: null }).eq("id", itemId);
    if (error) throw new Error(error.message);
    revalidatePath(`/affaires/${affaireId}/tool-list`);
    revalidatePath(`/affaires/${affaireId}/bl`);
    revalidatePath(`/affaires/${affaireId}/service-ticket`);
    revalidatePath(`/affaires/${affaireId}/service-ticket-operateur`);
    return;
  }

  const { data: item } = await supabase.from("tool_list_items").select("outil_id").eq("id", itemId).maybeSingle();
  if (item?.outil_id) {
    await syncCatalogueStatut(item.outil_id, "En transit", affaireId, "N° de BL renseigné sur la Tool List");
  }

  const { data: existingBl } = await supabase
    .from("bons_livraison")
    .select("id")
    .eq("affaire_id", affaireId)
    .eq("numero_bl", trimmed)
    .maybeSingle();

  let blId = existingBl?.id as string | undefined;
  if (!blId) {
    // Same cross-affaire duplicate guard as createBL — the DB only enforces
    // uniqueness per affaire, so without this check the same BL number
    // could silently get reused on a different job.
    const { data: conflict } = await supabase
      .from("bons_livraison")
      .select("affaire_id, affaires(reference)")
      .eq("numero_bl", trimmed)
      .neq("affaire_id", affaireId)
      .limit(1)
      .maybeSingle();
    if (conflict) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ref = (conflict as any).affaires?.reference ?? "une autre affaire";
      throw new Error(`Le N° de BL « ${trimmed} » est déjà utilisé sur l'affaire ${ref} — choisis un autre numéro.`);
    }

    const { data: newBl, error: createError } = await supabase
      .from("bons_livraison")
      .insert({ affaire_id: affaireId, numero_bl: trimmed })
      .select("id")
      .single();
    if (createError) throw new Error(createError.message);
    blId = newBl.id;
  }

  const { error } = await supabase.from("tool_list_items").update({ bl_id: blId }).eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/tool-list`);
  revalidatePath(`/affaires/${affaireId}/bl`);
  revalidatePath(`/affaires/${affaireId}/service-ticket`);
  revalidatePath(`/affaires/${affaireId}/service-ticket-operateur`);
}

// Any decision that isn't "straight back to stock" is real repair work —
// gives Atelier a workorder to log it against (hours, carbures, inserts,
// soudure). One workorder per tool_list_item: if the item already has one
// (e.g. the decision was changed from "inspecter" to "rectifier"), it's
// kept in sync rather than duplicated, so nothing already logged is lost.
async function syncWorkorderForDecision(itemId: string, affaireId: string, outilId: string | null, decision: RetourDecision) {
  const supabase = createClient();
  if (decision === "stock") return;

  const { data: existing } = await supabase.from("workorders").select("id").eq("tool_list_item_id", itemId).maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("workorders")
      .update({ decision, outil_id: outilId, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("workorders").insert({ affaire_id: affaireId, tool_list_item_id: itemId, outil_id: outilId, decision });
    if (error) throw new Error(error.message);
  }
}

// Workorders are generated per BL, not per line — Atelier gets one complete
// batch once every item shipped on that BL has been pointed (bien arrivé +
// décision), instead of workorders trickling in one at a time while the BL
// is still half-processed. Re-checked on every decision change, so editing
// a decision after the BL was already complete re-syncs its workorder too.
async function maybeGenerateWorkordersForBl(blId: string | null, affaireId: string) {
  if (!blId) return;
  const supabase = createClient();
  const { data: items } = await supabase.from("tool_list_items").select("id, outil_id, retour_confirme, retour_decision").eq("bl_id", blId);
  if (!items || items.length === 0) return;
  const blFullyTraite = items.every((i) => i.retour_confirme && i.retour_decision);
  if (!blFullyTraite) return;

  for (const item of items) {
    if (!item.retour_decision || item.retour_decision === "stock") continue;
    await syncWorkorderForDecision(item.id, affaireId, item.outil_id, item.retour_decision as RetourDecision);
  }
}

// A returned tool goes through the same catalogue statut choke point
// (syncCatalogueStatut) as every other Tool List change, but here the
// destination statut is a deliberate human call — rectifier, recharger,
// inspect, repaint, or straight back to stock — rather than something
// inferred automatically. The decision is always recorded on the item itself
// (retour_decision) regardless of whether it's linked to a catalogue
// reference yet; the catalogue statut only gets the update when it is.
export async function pointageRetour(itemId: string, affaireId: string, decision: RetourDecision) {
  const supabase = createClient();
  const { data: item } = await supabase.from("tool_list_items").select("outil_id, bl_id").eq("id", itemId).maybeSingle();

  // "À inspecter" involves an external inspection company that bills against
  // a PO — so the item lands on the affaire's currently open inspection PO
  // (created on the fly if none). Any other decision clears the link, so
  // switching a decision away from "inspecter" doesn't leave a stray item on
  // a PO it no longer belongs to.
  const purchaseOrderId = decision === "inspecter" ? (await getOrCreateOpenPurchaseOrder(affaireId)).id : null;

  const { error } = await supabase
    .from("tool_list_items")
    .update({ statut: "Retour", retour_decision: decision, purchase_order_id: purchaseOrderId })
    .eq("id", itemId);
  if (error) throw new Error(error.message);

  if (item?.outil_id) {
    await syncCatalogueStatut(item.outil_id, RETOUR_DECISIONS[decision], affaireId, `Pointage retour — ${RETOUR_DECISIONS[decision]}`);
  }
  await maybeGenerateWorkordersForBl(item?.bl_id ?? null, affaireId);

  revalidatePath(`/affaires/${affaireId}/tool-list`);
  revalidatePath(`/affaires/${affaireId}/pointage-retour`);
  revalidatePath(`/affaires/${affaireId}/bl`);
  revalidatePath("/workorders");
  revalidatePath("/purchase-orders");
}

// First step of Pointage retour: confirm the item physically made it back
// to the base before anyone decides what to do with it. Un-checking it is
// allowed too (a mis-click, or a BL marked back too early).
export async function confirmerRetourBase(itemId: string, affaireId: string, confirme: boolean) {
  const supabase = createClient();
  const { data: item } = await supabase.from("tool_list_items").select("outil_id").eq("id", itemId).maybeSingle();

  const { error } = await supabase
    .from("tool_list_items")
    .update({ retour_confirme: confirme, retour_confirme_at: confirme ? new Date().toISOString() : null })
    .eq("id", itemId);
  if (error) throw new Error(error.message);

  if (confirme && item?.outil_id) {
    await syncCatalogueStatut(item.outil_id, "Retour à la base", affaireId, "Pointage retour — bien arrivé à la base");
  }

  revalidatePath(`/affaires/${affaireId}/tool-list`);
  revalidatePath(`/affaires/${affaireId}/pointage-retour`);
  revalidatePath(`/affaires/${affaireId}/bl`);
}
