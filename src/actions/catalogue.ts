"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CatalogueOutil } from "@/lib/types";

export async function createOutil(data: Partial<CatalogueOutil>) {
  const supabase = createClient();
  const { data: row, error } = await supabase.from("catalogue_outils").insert(data).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/catalogue");
  return row as CatalogueOutil;
}

export async function updateOutil(id: string, data: Partial<CatalogueOutil>) {
  const supabase = createClient();

  if (data.statut !== undefined) {
    const { data: current } = await supabase.from("catalogue_outils").select("statut").eq("id", id).maybeSingle();
    if (current && current.statut !== data.statut) {
      await supabase.from("catalogue_outils_historique").insert({
        outil_id: id,
        ancien_statut: current.statut,
        nouveau_statut: data.statut,
        affaire_id: data.affaire_reservee_id ?? null,
        note: "Modifié manuellement depuis le catalogue",
      });
    }
  }

  const { error } = await supabase.from("catalogue_outils").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/catalogue");
}

// Central place any part of the app goes through to change a catalogue
// item's statut automatically (Tool List link, BL assignment, pointage...),
// so every change — automatic or manual — leaves a trace in the history.
// No-ops (and logs nothing) if the statut isn't actually changing.
export async function syncCatalogueStatut(outilId: string, nouveauStatut: string, affaireId: string | null, note?: string) {
  const supabase = createClient();
  const { data: current, error: readError } = await supabase.from("catalogue_outils").select("statut").eq("id", outilId).maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!current) throw new Error("Référence catalogue introuvable — le lien est peut-être cassé.");
  if (current.statut === nouveauStatut) return;

  // .select() after .update() so a zero-row update (most often an RLS policy
  // silently blocking the write for the current role) surfaces as a real
  // error instead of looking like nothing happened.
  const { data: updated, error } = await supabase
    .from("catalogue_outils")
    .update({ statut: nouveauStatut, affaire_reservee_id: affaireId })
    .eq("id", outilId)
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) {
    throw new Error("Mise à jour du catalogue refusée (droits insuffisants pour votre rôle) — contactez un administrateur.");
  }

  await supabase.from("catalogue_outils_historique").insert({
    outil_id: outilId,
    ancien_statut: current.statut,
    nouveau_statut: nouveauStatut,
    affaire_id: affaireId,
    note: note ?? null,
  });
  revalidatePath("/catalogue");
}

export async function deleteOutil(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("catalogue_outils").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/catalogue");
}

// A reference can declare other references that should follow it wherever
// it's used (e.g. a Moteur's Rotor + Stator power section) — see
// selectDevisLigneOutil / updateToolListItem for where this is consumed.
export async function addCatalogueAccessoire(outilId: string, accessoireId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("catalogue_accessoires").insert({ outil_id: outilId, accessoire_id: accessoireId });
  if (error) throw new Error(error.message);
  revalidatePath("/catalogue");
}

export async function removeCatalogueAccessoire(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("catalogue_accessoires").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/catalogue");
}
