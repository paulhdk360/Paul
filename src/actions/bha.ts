"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Bha, BhaItem } from "@/lib/types";

export async function createBha(data: Partial<Bha>) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: row, error } = await supabase
    .from("bha_compositions")
    .insert({ ...data, created_by: user?.id ?? null })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/bha");
  return row as Bha;
}

export async function updateBha(id: string, data: Partial<Bha>) {
  const supabase = createClient();
  const { error } = await supabase.from("bha_compositions").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/bha");
}

export async function deleteBha(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("bha_compositions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/bha");
}

// Adding a référence from the catalogue copies its specs straight onto the
// new line (OD, ID, connexion, N° série, longueur from "dimensions") so
// typing a tool name and picking it is enough to place it on the BHA —
// every field stays editable afterward for whatever differs on this stack.
export async function addBhaItemFromOutil(bhaId: string, outilId: string): Promise<BhaItem> {
  const supabase = createClient();
  const { data: outil, error: outilError } = await supabase.from("catalogue_outils").select("*").eq("id", outilId).maybeSingle();
  if (outilError) throw new Error(outilError.message);
  if (!outil) throw new Error("Référence catalogue introuvable.");

  const { data: existing } = await supabase
    .from("bha_items")
    .select("ordre")
    .eq("bha_id", bhaId)
    .order("ordre", { ascending: false })
    .limit(1);
  const nextOrdre = existing && existing.length ? existing[0].ordre + 1 : 0;

  const { data: row, error } = await supabase
    .from("bha_items")
    .insert({
      bha_id: bhaId,
      ordre: nextOrdre,
      outil_id: outil.id,
      designation: outil.designation,
      famille: outil.famille,
      od: outil.diametre,
      id_int: outil.diametre_interieur,
      connexion: outil.connexion,
      numero_serie: outil.numero_serie,
      longueur: outil.dimensions,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/bha");
  return row as BhaItem;
}

export async function addBhaItemFreeform(bhaId: string, designation: string): Promise<BhaItem> {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("bha_items")
    .select("ordre")
    .eq("bha_id", bhaId)
    .order("ordre", { ascending: false })
    .limit(1);
  const nextOrdre = existing && existing.length ? existing[0].ordre + 1 : 0;

  const { data: row, error } = await supabase
    .from("bha_items")
    .insert({ bha_id: bhaId, ordre: nextOrdre, designation })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/bha");
  return row as BhaItem;
}

export async function updateBhaItem(id: string, data: Partial<BhaItem>) {
  const supabase = createClient();
  const { error } = await supabase.from("bha_items").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/bha");
}

export async function deleteBhaItem(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("bha_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/bha");
}
