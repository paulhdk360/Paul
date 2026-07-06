"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deleteAttachmentsFor } from "@/lib/crud";
import type { Devis, DevisLigne } from "@/lib/supabase/types";

export async function createDevis(values: Record<string, unknown>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("devis").insert(values).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/devis");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  return data as Devis;
}

export async function updateDevis(id: string, values: Record<string, unknown>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("devis").update(values).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/devis");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  return data as Devis;
}

export async function deleteDevis(id: string) {
  await deleteAttachmentsFor("devis", id);
  const supabase = createClient();
  const { error } = await supabase.from("devis").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/devis");
  revalidatePath("/dashboard");
}

export async function createChantierFromDevis(devisId: string) {
  const supabase = createClient();
  const { data: devis, error: devisError } = await supabase
    .from("devis")
    .select("*")
    .eq("id", devisId)
    .single();
  if (devisError) throw new Error(devisError.message);

  const d = devis as Devis;
  const lignes: DevisLigne[] = d.lignes ?? [];
  const ht = lignes.reduce((s, l) => s + (Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0), 0);
  const tva = ht * ((Number(d.tva) || 0) / 100);
  const ttc = ht + tva;
  const profondeurNum = parseInt(d.profondeur_previsionnelle || "0", 10) || 0;

  const { data: chantier, error: chantierError } = await supabase
    .from("chantiers")
    .insert({
      nom: "Chantier " + (d.client || d.reference || ""),
      client: d.client || "",
      adresse: d.adresse_chantier || "",
      statut: "À venir",
      profondeur_prevue: profondeurNum,
      profondeur_foree: 0,
      materiel_necessaire: [d.tubage_prevu, d.crepines, d.massif_filtrant].filter((v) => v && v !== "—").join(", "),
      montant_devis: Math.round(ttc),
      cout_reel: 0,
    })
    .select()
    .single();
  if (chantierError) throw new Error(chantierError.message);

  const { error: updateError } = await supabase
    .from("devis")
    .update({ chantier_genere_id: chantier.id })
    .eq("id", devisId);
  if (updateError) throw new Error(updateError.message);

  revalidatePath("/devis");
  revalidatePath("/chantiers");
  revalidatePath("/dashboard");
  return chantier.id as string;
}
