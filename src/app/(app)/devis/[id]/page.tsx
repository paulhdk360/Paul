import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DevisForm } from "@/components/DevisForm";
import type { Devis } from "@/lib/supabase/types";

export default async function EditDevisPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: devis } = await supabase.from("devis").select("*").eq("id", params.id).single();
  if (!devis) notFound();

  const { data: attachments } = await supabase
    .from("attachments")
    .select("*")
    .eq("link_type", "devis")
    .eq("link_id", params.id);

  return (
    <DevisForm
      mode="edit"
      initial={devis as Devis}
      initialAttachments={attachments ?? []}
      previousStatut={(devis as Devis).statut}
    />
  );
}
