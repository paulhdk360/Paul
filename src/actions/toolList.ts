"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ToolListItem } from "@/lib/types";

const PHYSICAL_LINE_TYPES = ["Operation", "Stand By", "Maintenance", "Inspection", "Restocking", "Lost In Hole"];

// Expands each eligible devis line's quantity into individual Tool List
// rows (one per physical unit), and reconciles counts when quantities
// change: missing rows are added, and surplus rows are only removed if
// nobody has entered a serial number or assigned them to a BL yet — data
// already filled in on-site is never silently deleted.
export async function generateToolListFromDevis(devisId: string, affaireId: string) {
  const supabase = createClient();

  const { data: lignes, error: lignesError } = await supabase
    .from("devis_lignes")
    .select("*")
    .eq("devis_id", devisId)
    .in("type", PHYSICAL_LINE_TYPES);
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

    if (existing.length < target) {
      const toInsert = Array.from({ length: target - existing.length }, () => ({
        affaire_id: affaireId,
        devis_ligne_id: ligne.id,
        item_index: nextIndex++,
        designation: ligne.designation,
        statut: "En stock" as const,
        prix_stand_by: ligne.prix_stand_by,
        prix_operation: ligne.prix_operation,
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
