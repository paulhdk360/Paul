import { createClient } from "@/lib/supabase/server";
import { blockOperateurGlobal } from "@/lib/auth";
import { PurchaseOrdersManager } from "@/components/PurchaseOrdersManager";
import type { Affaire, Client, PurchaseOrder, ToolListItem } from "@/lib/types";

export default async function PurchaseOrdersPage() {
  await blockOperateurGlobal();
  const supabase = createClient();
  const [{ data: purchaseOrders }, { data: affaires }, { data: clients }, { data: items }] = await Promise.all([
    supabase.from("purchase_orders").select("*").order("created_at", { ascending: false }),
    supabase.from("affaires").select("id, reference, client_id"),
    supabase.from("clients").select("id, raison_sociale"),
    supabase.from("tool_list_items").select("*").not("purchase_order_id", "is", null),
  ]);
  return (
    <PurchaseOrdersManager
      purchaseOrders={(purchaseOrders ?? []) as PurchaseOrder[]}
      affaires={(affaires ?? []) as Pick<Affaire, "id" | "reference" | "client_id">[]}
      clients={(clients ?? []) as Pick<Client, "id" | "raison_sociale">[]}
      items={(items ?? []) as ToolListItem[]}
    />
  );
}
