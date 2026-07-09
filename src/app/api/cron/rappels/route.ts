import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { RAPPEL_WINDOW_DAYS } from "@/lib/company";

// Runs daily (see vercel.json) to flag formations/habilitations and parc
// matériel controls whose deadline falls within RAPPEL_WINDOW_DAYS (or is
// already past), notifying every admin/direction/administratif_logistique
// user once per deadline — rappel_envoye stops it from repeating daily, and
// gets reset by the update actions whenever the date itself changes.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const windowEnd = new Date(Date.now() + RAPPEL_WINDOW_DAYS * 86400000).toISOString().slice(0, 10);

  const { data: recipients } = await supabase.from("profiles").select("id").in("role", ["admin", "direction", "administratif_logistique"]);
  const recipientIds = (recipients ?? []).map((r) => r.id as string);

  let notified = 0;

  const { data: formations } = await supabase
    .from("formations")
    .select("id, intitule, date_expiration, employes(nom, prenom)")
    .eq("rappel_envoye", false)
    .not("date_expiration", "is", null)
    .lte("date_expiration", windowEnd);

  for (const f of formations ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employe = (f as any).employes as { nom: string; prenom: string | null } | null;
    const nomEmploye = employe ? `${employe.prenom ? `${employe.prenom} ` : ""}${employe.nom}` : "un collaborateur";
    const message = `Formation « ${f.intitule} » de ${nomEmploye} expire le ${f.date_expiration}`;
    if (recipientIds.length) {
      await supabase.from("notifications").insert(recipientIds.map((user_id) => ({ user_id, message, link: "/rh/formations" })));
      notified += recipientIds.length;
    }
    await supabase.from("formations").update({ rappel_envoye: true }).eq("id", f.id);
  }

  const { data: materiels } = await supabase
    .from("parc_materiel")
    .select("id, designation, categorie, date_prochain_controle")
    .eq("rappel_envoye", false)
    .not("date_prochain_controle", "is", null)
    .lte("date_prochain_controle", windowEnd);

  for (const m of materiels ?? []) {
    const message = `Contrôle à prévoir pour ${m.designation} (${m.categorie}) — échéance ${m.date_prochain_controle}`;
    if (recipientIds.length) {
      await supabase.from("notifications").insert(recipientIds.map((user_id) => ({ user_id, message, link: "/parc-materiel" })));
      notified += recipientIds.length;
    }
    await supabase.from("parc_materiel").update({ rappel_envoye: true }).eq("id", m.id);
  }

  return NextResponse.json({ ok: true, formations: formations?.length ?? 0, materiels: materiels?.length ?? 0, notified });
}
