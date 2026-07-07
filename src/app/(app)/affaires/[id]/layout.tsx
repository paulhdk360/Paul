import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AffaireTabs } from "@/components/AffaireTabs";
import { Badge } from "@/components/Badge";
import type { Affaire, Client } from "@/lib/types";

export default async function AffaireLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: affaire } = await supabase.from("affaires").select("*").eq("id", params.id).single();
  if (!affaire) notFound();

  let client: Client | null = null;
  if ((affaire as Affaire).client_id) {
    const { data } = await supabase.from("clients").select("*").eq("id", (affaire as Affaire).client_id!).single();
    client = data as Client | null;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <div className="font-display text-[28px] font-bold tracking-wide text-navy">
            {(affaire as Affaire).reference}
          </div>
          <div className="text-[13px] text-text-muted">
            {client?.nom ?? "Client non renseigné"}
            {(affaire as Affaire).chantier ? ` · ${(affaire as Affaire).chantier}` : ""}
            {(affaire as Affaire).well_location ? ` · ${(affaire as Affaire).well_location}` : ""}
          </div>
        </div>
        <Badge label={(affaire as Affaire).statut} />
      </div>
      <AffaireTabs affaireId={params.id} />
      {children}
    </div>
  );
}
