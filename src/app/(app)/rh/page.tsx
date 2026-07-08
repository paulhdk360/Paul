import { createClient } from "@/lib/supabase/server";
import { blockOperateurGlobal } from "@/lib/auth";
import { EmployesManager } from "@/components/EmployesManager";
import type { Employe } from "@/lib/types";

export default async function RhPage() {
  await blockOperateurGlobal();
  const supabase = createClient();
  const { data } = await supabase.from("employes").select("*").order("nom");

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide text-navy">Ressources humaines</div>
      <div className="mb-6 text-[13.5px] text-text-muted">Collaborateurs et disponibilité</div>
      <EmployesManager employes={(data ?? []) as Employe[]} />
    </div>
  );
}
