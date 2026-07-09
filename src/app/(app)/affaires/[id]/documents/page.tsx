import { createClient } from "@/lib/supabase/server";
import { blockAtelier, blockOperateur } from "@/lib/auth";
import { DocumentsManager } from "@/components/DocumentsManager";
import type { Attachment } from "@/lib/types";

export default async function DocumentsPage({ params }: { params: { id: string } }) {
  await blockOperateur(params.id);
  await blockAtelier(params.id);
  const supabase = createClient();
  const { data } = await supabase
    .from("attachments")
    .select("*")
    .eq("affaire_id", params.id)
    .order("created_at", { ascending: false });

  return <DocumentsManager affaireId={params.id} attachments={(data ?? []) as Attachment[]} />;
}
