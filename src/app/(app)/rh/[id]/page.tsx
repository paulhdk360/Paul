import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { blockAtelierGlobal, blockOperateurGlobal } from "@/lib/auth";
import { EmployeFicheManager } from "@/components/EmployeFicheManager";
import type { Attachment, Employe, Formation } from "@/lib/types";

export default async function EmployeFichePage({ params }: { params: { id: string } }) {
  await blockOperateurGlobal();
  await blockAtelierGlobal();
  const supabase = createClient();

  const { data: employe } = await supabase.from("employes").select("*").eq("id", params.id).maybeSingle();
  if (!employe) notFound();

  const [{ data: formations }, { data: attachments }] = await Promise.all([
    supabase.from("formations").select("*").eq("employe_id", params.id).order("date_expiration", { ascending: true, nullsFirst: false }),
    supabase.from("attachments").select("*").eq("link_type", "employes").eq("link_id", params.id).order("created_at", { ascending: false }),
  ]);

  return (
    <EmployeFicheManager
      employe={employe as Employe}
      formations={(formations ?? []) as Formation[]}
      attachments={(attachments ?? []) as Attachment[]}
    />
  );
}
