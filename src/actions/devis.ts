"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
const NON_EQUIPMENT_TYPES: LigneType[] = ["Transport", "Packaging"];

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

export async function updateDevisLigne(id: string, data: Partial<DevisLigne>) {
  const supabase = createClient();
  const { error } = await supabase.from("devis_lignes").update(data).eq("id", id);
  if (error) throw new Error(error.message);
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
