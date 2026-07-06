import { createClient } from "@/lib/supabase/server";
import { getAttachmentsMap } from "@/lib/lookups";
import { DevisList } from "@/components/DevisList";
import type { Devis } from "@/lib/supabase/types";

export default async function DevisPage() {
  const supabase = createClient();
  const { data: rows } = await supabase.from("devis").select("*").order("date_creation", { ascending: false });
  const devisRows = (rows ?? []) as Devis[];
  const attachmentsByRow = await getAttachmentsMap(
    "devis",
    devisRows.map((r) => r.id),
  );
  const chantierIds = devisRows.map((d) => d.chantier_genere_id).filter((v): v is string => !!v);
  let chantierNames: Record<string, string> = {};
  if (chantierIds.length) {
    const { data: chantiers } = await supabase.from("chantiers").select("id, nom").in("id", chantierIds);
    chantierNames = Object.fromEntries((chantiers ?? []).map((c) => [c.id, c.nom]));
  }

  return (
    <DevisList
      devis={devisRows}
      attachmentCounts={Object.fromEntries(Object.entries(attachmentsByRow).map(([k, v]) => [k, v.length]))}
      chantierNames={chantierNames}
    />
  );
}
