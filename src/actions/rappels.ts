"use server";

import { requireUser } from "@/lib/auth";
import { RAPPEL_WINDOW_DAYS } from "@/lib/company";
import { createServiceClient } from "@/lib/supabase/service";

export interface RappelsSummary {
  formations: number;
  materiels: number;
  anniversaires: number;
  notified: number;
}

// Flags formations/habilitations and parc matériel controls whose deadline
// falls within RAPPEL_WINDOW_DAYS (or is already past), and any employé
// birthday today — notifying every admin/direction/administratif_logistique
// user. Shared by the daily cron (/api/cron/rappels) and triggerRappelsManually
// below, so the exact same logic runs either way — no separate code path to
// drift or silently break.
export async function runRappels(): Promise<RappelsSummary> {
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

  // Birthdays: unlike formations/parc matériel, there's no future "deadline"
  // to flag ahead of time and no rappel_envoye flag needed — the day itself
  // only matches once a year, so a plain month/day comparison against today
  // is naturally a once-a-year notification with no extra state to track.
  // Two different messages: the birthday person themselves gets a "Joyeux
  // anniversaire" (matched to their own login by email, since employés and
  // profiles are separate tables with no direct link), everyone else who can
  // actually see notifications (operateur has no notification bell at all)
  // gets told whose birthday it is.
  const todayMonthDay = new Date().toISOString().slice(5, 10);
  const { data: employes } = await supabase.from("employes").select("id, nom, prenom, email, date_naissance").eq("actif", true).not("date_naissance", "is", null);
  const anniversaires = (employes ?? []).filter((e) => e.date_naissance && (e.date_naissance as string).slice(5, 10) === todayMonthDay);

  if (anniversaires.length) {
    const { data: allProfiles } = await supabase.from("profiles").select("id, email, role");
    const visibleProfiles = (allProfiles ?? []).filter((p) => p.role !== "operateur");

    for (const e of anniversaires) {
      const nomEmploye = `${e.prenom ? `${e.prenom} ` : ""}${e.nom}`;
      const matched = e.email ? visibleProfiles.find((p) => p.email.toLowerCase() === (e.email as string).toLowerCase()) : undefined;

      if (matched) {
        await supabase.from("notifications").insert({ user_id: matched.id, message: `🎂 Joyeux anniversaire, ${e.prenom || e.nom} !`, link: null });
        notified += 1;
      }

      const others = visibleProfiles.filter((p) => p.id !== matched?.id);
      if (others.length) {
        await supabase
          .from("notifications")
          .insert(others.map((p) => ({ user_id: p.id, message: `🎂 C'est l'anniversaire de ${nomEmploye} aujourd'hui !`, link: `/rh/${e.id}` })));
        notified += others.length;
      }
    }
  }

  return {
    formations: formations?.length ?? 0,
    materiels: materiels?.length ?? 0,
    anniversaires: anniversaires.length,
    notified,
  };
}

// Lets an admin verify (or fix) the reminder pipeline right now instead of
// waiting on the daily Vercel cron and an actual birthday/deadline to roll
// around — same logic, triggered from Paramètres.
export async function triggerRappelsManually(): Promise<RappelsSummary> {
  const { profile } = await requireUser();
  if (profile.role !== "admin") throw new Error("Réservé aux administrateurs.");
  return runRappels();
}
