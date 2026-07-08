"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { syncCatalogueStatut } from "@/actions/catalogue";
import { TOOL_STATUT_TO_CATALOGUE_STATUT } from "@/lib/company";
import type { ToolListItem } from "@/lib/types";

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
    const existing = (existingItems ?? []).filter((i) => i.devis_ligne_id === ligne.id);
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
          prix_stand_by: ligne.prix_stand_by,
          prix_operation: ligne.prix_operation,
          prix_maintenance: ligne.prix_maintenance,
          prix_uc: ligne.prix_uc,
          prix_lih: ligne.prix_lih,
          prix_inspection: ligne.prix_inspection,
          prix_restocking: ligne.prix_restocking,
          reference_article: ligne.reference_article,
          outil_id: ligne.outil_id,
        })
        .in(
          "id",
          existing.map((i) => i.id),
        );
      if (error) throw new Error(error.message);
    }

    if (existing.length < target) {
      const toInsert = Array.from({ length: target - existing.length }, () => ({
        affaire_id: affaireId,
        devis_ligne_id: ligne.id,
        item_index: nextIndex++,
        designation: ligne.designation,
        reference_article: ligne.reference_article,
        outil_id: ligne.outil_id,
        proprietaire: ligne.proprietaire,
        statut: "En stock" as const,
        prix_stand_by: ligne.prix_stand_by,
        prix_operation: ligne.prix_operation,
        prix_maintenance: ligne.prix_maintenance,
        prix_uc: ligne.prix_uc,
        prix_lih: ligne.prix_lih,
        prix_inspection: ligne.prix_inspection,
        prix_restocking: ligne.prix_restocking,
      }));
      const { error } = await supabase.from("tool_list_items").insert(toInsert);
      if (error) throw new Error(error.message);
      log.push(`${ligne.designation.split("\n")[0]} : +${toInsert.length} ligne(s)`);
    } else if (existing.length > target) {
      const removable = existing
        .filter((i) => !i.numero_serie && !i.bl_id)
        .slice(0, existing.length - target)
        .map((i) => i.id);
      if (removable.length) {
        const { error } = await supabase.from("tool_list_items").delete().in("id", removable);
        if (error) throw new Error(error.message);
        log.push(`${ligne.designation.split("\n")[0]} : -${removable.length} ligne(s)`);
      }
    }

    // A devis line linked to a real catalogue reference reserves it for this
    // affaire the moment it lands on the Tool List — one sync per reference,
    // not per physical unit (the catalogue tracks the reference, not serials).
    if (ligne.outil_id && target > 0) {
      await syncCatalogueStatut(ligne.outil_id, "Réservé", affaireId, "Lié depuis le devis");
    }
  }

  revalidatePath(`/affaires/${affaireId}/tool-list`);
  return log;
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
  const { error } = await supabase.from("tool_list_items").insert({
    ...data,
    affaire_id: affaireId,
    item_index: (countRow?.item_index ?? 0) + 1,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/tool-list`);
}

export async function updateToolListItem(id: string, affaireId: string, data: Partial<ToolListItem>) {
  const supabase = createClient();

  // Linking (or re-linking) to a real catalogue reference reserves it for
  // this affaire; once linked, the row's own statut (En stock/Sur site/
  // Retour/...) keeps the catalogue reference's statut in sync automatically.
  if (data.outil_id !== undefined || data.statut !== undefined) {
    const { data: current } = await supabase.from("tool_list_items").select("outil_id, statut").eq("id", id).maybeSingle();
    const outilId = data.outil_id !== undefined ? data.outil_id : current?.outil_id;
    if (outilId) {
      if (data.outil_id !== undefined && data.outil_id !== current?.outil_id) {
        await syncCatalogueStatut(outilId, "Réservé", affaireId, "Lié depuis la Tool List");
      } else if (data.statut !== undefined) {
        const mapped = TOOL_STATUT_TO_CATALOGUE_STATUT[data.statut];
        if (mapped) await syncCatalogueStatut(outilId, mapped, affaireId);
      }
    }
  }

  const { error } = await supabase.from("tool_list_items").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/tool-list`);
  revalidatePath(`/affaires/${affaireId}/bl`);
}

export async function deleteToolListItem(id: string, affaireId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("tool_list_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/tool-list`);
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
}
