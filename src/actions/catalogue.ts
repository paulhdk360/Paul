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
  const { data: current } = await supabase.from("catalogue_outils").select("statut").eq("id", outilId).maybeSingle();
  if (!current || current.statut === nouveauStatut) return;

  const { error } = await supabase
    .from("catalogue_outils")
    .update({ statut: nouveauStatut, affaire_reservee_id: affaireId })
    .eq("id", outilId);
  if (error) throw new Error(error.message);

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
