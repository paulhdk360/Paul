"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PurchaseOrder } from "@/lib/types";

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

  const { count } = await supabase.from("purchase_orders").select("id", { count: "exact", head: true });
  const numero = `PO-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { data, error } = await supabase.from("purchase_orders").insert({ numero, affaire_id: affaireId }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/purchase-orders");
  return data as PurchaseOrder;
}

export async function updatePurchaseOrder(id: string, data: Partial<PurchaseOrder>) {
  const supabase = createClient();
  const { error } = await supabase.from("purchase_orders").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/purchase-orders");
}
