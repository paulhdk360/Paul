import { createClient } from "@/lib/supabase/server";
import { ClientsManager } from "@/components/ClientsManager";
import type { Client } from "@/lib/types";

export default async function ClientsPage() {
  const supabase = createClient();
  const { data } = await supabase.from("clients").select("*").order("nom");
  return <ClientsManager clients={(data ?? []) as Client[]} />;
}
