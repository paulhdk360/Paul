"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Devis, DevisLigne } from "@/lib/types";

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
  const { error } = await supabase.from("devis").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/devis`);
}

export async function createDevisLigne(devisId: string, ordre: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("devis_lignes")
    .insert({ devis_id: devisId, ordre, type: "Operation", designation: "", quantite: 1 })
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

export async function deleteDevisLigne(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("devis_lignes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
