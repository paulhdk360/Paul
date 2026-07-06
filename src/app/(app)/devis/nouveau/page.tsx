import { createClient } from "@/lib/supabase/server";
import { generateDevisReference } from "@/lib/devis";
import { defaultDevisValues } from "@/lib/devisDefaults";
import { DevisForm } from "@/components/DevisForm";

export default async function NouveauDevisPage() {
  const supabase = createClient();
  const { data } = await supabase.from("devis").select("reference");
  const reference = generateDevisReference((data ?? []).map((d) => d.reference));
  const initial = defaultDevisValues(reference);
  initial.id = crypto.randomUUID();

  return <DevisForm mode="new" initial={initial} initialAttachments={[]} previousStatut={null} />;
}
