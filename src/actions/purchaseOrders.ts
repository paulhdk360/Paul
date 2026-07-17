"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { PurchaseOrder } from "@/lib/types";

async function nextPoNumero(supabase: SupabaseClient): Promise<string> {
  const { count } = await supabase.from("purchase_orders").select("id", { count: "exact", head: true });
  return `PO-${String((count ?? 0) + 1).padStart(4, "0")}`;
}

// One inspection PO stays "Ouvert" and keeps collecting tools sent to the
// external inspector until the invoice comes back and it's closed off — so
// several "À inspecter" decisions on the same affaire land on the same PO
// number instead of spawning one per tool. Called from pointageRetour.
export async function getOrCreateOpenPurchaseOrder(affaireId: string): Promise<PurchaseOrder> {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("purchase_orders")
    .select("*")
    .eq("affaire_id", affaireId)
    .eq("statut", "Ouvert")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return existing as PurchaseOrder;

  const numero = await nextPoNumero(supabase);
  const { data, error } = await supabase.from("purchase_orders").insert({ numero, affaire_id: affaireId }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/purchase-orders");
  return data as PurchaseOrder;
}

// Manual POs — hôtel, transport, etc. — for anything a tiers will invoice
// Enedril against, that isn't tied to a tool sent for inspection. Open to
// every role with access to the page (RLS already allows admin/commercial/
// atelier/direction/administratif_logistique equally; this was previously
// only reachable via the atelier-centric pointage-retour flow).
export async function createPurchaseOrder(data: {
  affaire_id: string;
  designation: string;
  fournisseur?: string | null;
  notes?: string | null;
}): Promise<PurchaseOrder> {
  const supabase = createClient();
  const numero = await nextPoNumero(supabase);
  const { data: row, error } = await supabase
    .from("purchase_orders")
    .insert({
      numero,
      affaire_id: data.affaire_id,
      designation: data.designation,
      fournisseur: data.fournisseur || null,
      notes: data.notes || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/purchase-orders");
  return row as PurchaseOrder;
}

export async function updatePurchaseOrder(id: string, data: Partial<PurchaseOrder>) {
  const supabase = createClient();
  const { error } = await supabase.from("purchase_orders").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/purchase-orders");
}
