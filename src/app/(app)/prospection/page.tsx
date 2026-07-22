import { createClient } from "@/lib/supabase/server";
import { blockAtelierGlobal, blockOperateurGlobal } from "@/lib/auth";
import { ProspectionManager } from "@/components/ProspectionManager";
import type { Attachment, Prospect, ProspectInteraction } from "@/lib/types";

export default async function ProspectionPage() {
  await blockOperateurGlobal();
  await blockAtelierGlobal();
  const supabase = createClient();
  const [{ data: prospects }, { data: interactions }, { data: attachments }] = await Promise.all([
    supabase.from("prospects").select("*").order("entreprise"),
    supabase.from("prospect_interactions").select("*").order("created_at", { ascending: false }),
    supabase.from("attachments").select("*").eq("link_type", "prospects"),
  ]);
  return (
    <ProspectionManager
      prospects={(prospects ?? []) as Prospect[]}
      interactions={(interactions ?? []) as ProspectInteraction[]}
      attachments={(attachments ?? []) as Attachment[]}
    />
  );
}
