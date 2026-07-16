import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

// A single route often calls this many times over — once from the root
// layout, again from a nested affaire layout, again from blockOperateur/
// blockAtelier, again from the page itself — and each call was two full
// network round-trips (auth.getUser() re-validates the JWT against
// Supabase's Auth server, then a separate profiles query). Five calls on
// one page load meant ten sequential round-trips before the page's own
// data even started fetching. react's cache() memoizes this per request:
// every call within the same render pass reuses the first call's result,
// so the real work happens exactly once no matter how many layouts/guards
// call it.
export const requireUser = cache(async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  return { user, profile: profile as Profile };
});

export function canAccessCommercial(role: Role) {
  return role === "admin" || role === "commercial" || role === "direction";
}

export function canAccessAtelier(role: Role) {
  return role === "admin" || role === "commercial" || role === "atelier" || role === "direction" || role === "administratif_logistique";
}

export function isOperateur(role: Role) {
  return role === "operateur";
}

export function isAtelier(role: Role) {
  return role === "atelier";
}

// Devis, Tool List, Bons de Livraison and the Service Ticket Enedril all
// carry commercial/pricing data an opérateur must never reach — even by
// typing the URL directly. Call at the top of those pages; RLS backs this up
// at the data layer for devis/devis_lignes (see migration 0006).
export async function blockOperateur(affaireId: string) {
  const { profile } = await requireUser();
  if (isOperateur(profile.role)) {
    redirect(`/affaires/${affaireId}/service-ticket-operateur`);
  }
}

// An opérateur's access is limited to the Service Ticket Opérateur only —
// nothing else (dashboard, affaires list, clients, catalogue, RH, an
// affaire's Aperçu/Documents...) is theirs to see, even read-only. Call at
// the top of every page that isn't itself part of that flow.
export async function blockOperateurGlobal() {
  const { profile } = await requireUser();
  if (isOperateur(profile.role)) {
    redirect("/service-ticket-operateur");
  }
}

// Atelier is restricted to an affaire's Tool List, Bons de livraison and
// Pointage retour only — not the Aperçu, Devis, Service Ticket(s), Récap
// facturation, Rentabilité or Documents tabs, which carry commercial/pricing
// data or aren't relevant to their job. Call at the top of every affaire
// sub-page outside that trio.
export async function blockAtelier(affaireId: string) {
  const { profile } = await requireUser();
  if (isAtelier(profile.role)) {
    redirect(`/affaires/${affaireId}/tool-list`);
  }
}

// Outside of a specific affaire, atelier can only browse the affaires list
// (to pick one to work on) and Achats (limited to the Atelier category by
// RLS) — dashboard, clients, catalogue outils and RH are off-limits.
export async function blockAtelierGlobal() {
  const { profile } = await requireUser();
  if (isAtelier(profile.role)) {
    redirect("/affaires");
  }
}
