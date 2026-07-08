import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

export async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  return { user, profile: profile as Profile };
}

export function canAccessCommercial(role: Role) {
  return role === "admin" || role === "commercial";
}

export function canAccessAtelier(role: Role) {
  return role === "admin" || role === "commercial" || role === "atelier";
}

export function isOperateur(role: Role) {
  return role === "operateur";
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
