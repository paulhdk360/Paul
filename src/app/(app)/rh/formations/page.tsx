import { createClient } from "@/lib/supabase/server";
import { blockAtelierGlobal, blockOperateurGlobal } from "@/lib/auth";
import { FormationsManager } from "@/components/FormationsManager";
import type { Employe, Formation } from "@/lib/types";

export default async function FormationsPage() {
  await blockOperateurGlobal();
  await blockAtelierGlobal();
  const supabase = createClient();
  const [{ data: formations }, { data: employes }] = await Promise.all([
    supabase.from("formations").select("*").order("date_expiration"),
    supabase.from("employes").select("*").order("nom"),
  ]);
  return <FormationsManager formations={(formations ?? []) as Formation[]} employes={(employes ?? []) as Employe[]} />;
}
