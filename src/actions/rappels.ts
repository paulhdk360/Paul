"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/auth";
import { RAPPEL_WINDOW_DAYS } from "@/lib/company";
import { createClient } from "@/lib/supabase/server";

export interface RappelsSummary {
  formations: number;
  materiels: number;
  anniversaires: number;
  notified: number;
  error?: string;
}

// "Today" as the calendar date in France, not wherever the server happens to
// run (Vercel functions run in UTC) — France is ahead of UTC (CET/CEST), so
// a plain toISOString() comparison is wrong for roughly the first two hours
// of every French day: it would still show yesterday's date. en-CA locale
// formats as YYYY-MM-DD, which is what the "date" column comparisons below
// expect.
function parisDate(offsetMs = 0): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date(Date.now() + offsetMs));
}

// Flags formations/habilitations and parc matériel controls whose deadline
// falls within RAPPEL_WINDOW_DAYS (or is already past), and any employé
// birthday today — notifying every admin/direction/administratif_logistique
// user. Shared by the daily cron (/api/cron/rappels, no user session — needs
// the service-role client) and triggerRappelsManually below (already an
// authenticated admin — the admin's own session client works fine under
// RLS, so the manual test button doesn't depend on SUPABASE_SERVICE_ROLE_KEY
// being configured at all). Every Supabase error is thrown rather than
// swallowed into an empty array — a misconfigured key or a missing table
// used to fail completely silently (0 notifications, no error), which is
// indistinguishable from "nothing was due today" unless every step is
// checked explicitly.
export async function runRappels(supabase: SupabaseClient): Promise<RappelsSummary> {
  const windowEnd = parisDate(RAPPEL_WINDOW_DAYS * 86400000);

  const { data: recipients, error: recipientsError } = await supabase
    .from("profiles")
    .select("id")
    .in("role", ["admin", "direction", "administratif_logistique"]);
  if (recipientsError) throw new Error(`Lecture des destinataires : ${recipientsError.message}`);
  const recipientIds = (recipients ?? []).map((r) => r.id as string);

  let notified = 0;

  const { data: formations, error: formationsError } = await supabase
    .from("formations")
    .select("id, intitule, date_expiration, employes(nom, prenom)")
    .eq("rappel_envoye", false)
    .not("date_expiration", "is", null)
    .lte("date_expiration", windowEnd);
  if (formationsError) throw new Error(`Lecture des formations : ${formationsError.message}`);

  for (const f of formations ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employe = (f as any).employes as { nom: string; prenom: string | null } | null;
    const nomEmploye = employe ? `${employe.prenom ? `${employe.prenom} ` : ""}${employe.nom}` : "un collaborateur";
    const message = `Formation « ${f.intitule} » de ${nomEmploye} expire le ${f.date_expiration}`;
    if (recipientIds.length) {
      const { error } = await supabase.from("notifications").insert(recipientIds.map((user_id) => ({ user_id, message, link: "/rh/formations" })));
      if (error) throw new Error(`Notification formation : ${error.message}`);
      notified += recipientIds.length;
    }
    const { error } = await supabase.from("formations").update({ rappel_envoye: true }).eq("id", f.id);
    if (error) throw new Error(`Mise à jour formation : ${error.message}`);
  }

  const { data: materiels, error: materielsError } = await supabase
    .from("parc_materiel")
    .select("id, designation, categorie, date_prochain_controle")
    .eq("rappel_envoye", false)
    .not("date_prochain_controle", "is", null)
    .lte("date_prochain_controle", windowEnd);
  if (materielsError) throw new Error(`Lecture du parc matériel : ${materielsError.message}`);

  for (const m of materiels ?? []) {
    const message = `Contrôle à prévoir pour ${m.designation} (${m.categorie}) — échéance ${m.date_prochain_controle}`;
    if (recipientIds.length) {
      const { error } = await supabase.from("notifications").insert(recipientIds.map((user_id) => ({ user_id, message, link: "/parc-materiel" })));
      if (error) throw new Error(`Notification parc matériel : ${error.message}`);
      notified += recipientIds.length;
    }
    const { error } = await supabase.from("parc_materiel").update({ rappel_envoye: true }).eq("id", m.id);
    if (error) throw new Error(`Mise à jour parc matériel : ${error.message}`);
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
  const todayMonthDay = parisDate().slice(5, 10);
  const { data: employes, error: employesError } = await supabase
    .from("employes")
    .select("id, nom, prenom, email, date_naissance")
    .eq("actif", true)
    .not("date_naissance", "is", null);
  if (employesError) throw new Error(`Lecture des employés : ${employesError.message}`);
  const anniversaires = (employes ?? []).filter((e) => e.date_naissance && (e.date_naissance as string).slice(5, 10) === todayMonthDay);

  if (anniversaires.length) {
    const { data: allProfiles, error: profilesError } = await supabase.from("profiles").select("id, email, role");
    if (profilesError) throw new Error(`Lecture des profils : ${profilesError.message}`);
    const visibleProfiles = (allProfiles ?? []).filter((p) => p.role !== "operateur");

    for (const e of anniversaires) {
      const nomEmploye = `${e.prenom ? `${e.prenom} ` : ""}${e.nom}`;
      const matched = e.email ? visibleProfiles.find((p) => p.email.toLowerCase() === (e.email as string).toLowerCase()) : undefined;

      if (matched) {
        const { error } = await supabase
          .from("notifications")
          .insert({ user_id: matched.id, message: `🎂 Joyeux anniversaire, ${e.prenom || e.nom} !`, link: null });
        if (error) throw new Error(`Notification anniversaire : ${error.message}`);
        notified += 1;
      }

      const others = visibleProfiles.filter((p) => p.id !== matched?.id);
      if (others.length) {
        const { error } = await supabase
          .from("notifications")
          .insert(others.map((p) => ({ user_id: p.id, message: `🎂 C'est l'anniversaire de ${nomEmploye} aujourd'hui !`, link: `/rh/${e.id}` })));
        if (error) throw new Error(`Notification anniversaire (équipe) : ${error.message}`);
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

const EMPTY_SUMMARY = { formations: 0, materiels: 0, anniversaires: 0, notified: 0 };

// Lets an admin verify (or fix) the reminder pipeline right now instead of
// waiting on the daily Vercel cron and an actual birthday/deadline to roll
// around — same logic, triggered from Paramètres. Errors are returned, not
// thrown: Next.js strips the message off anything thrown out of a Server
// Action in a production build ("The specific message is omitted..."),
// which defeats the whole point of a diagnostic button — a returned string
// reaches the client untouched.
export async function triggerRappelsManually(): Promise<RappelsSummary> {
  const { profile } = await requireUser();
  if (profile.role !== "admin") return { ...EMPTY_SUMMARY, error: "Réservé aux administrateurs." };
  try {
    return await runRappels(createClient());
  } catch (e) {
    return { ...EMPTY_SUMMARY, error: e instanceof Error ? e.message : "Erreur inconnue." };
  }
}
