import { createClient } from "@/lib/supabase/server";
import { blockOperateurGlobal, requireUser } from "@/lib/auth";
import { AchatsManager } from "@/components/AchatsManager";
import type { Achat, Affaire } from "@/lib/types";

export default async function AchatsPage() {
  await blockOperateurGlobal();
  const { profile } = await requireUser();
  const supabase = createClient();
  const [{ data: achats }, { data: affaires }] = await Promise.all([
    supabase.from("achats").select("*").order("date_achat", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("affaires").select("id, reference").order("reference"),
  ]);
  return (
    <AchatsManager
      achats={(achats ?? []) as Achat[]}
      affaires={(affaires ?? []) as Pick<Affaire, "id" | "reference">[]}
      currentRole={profile.role}
    />
  );
}
