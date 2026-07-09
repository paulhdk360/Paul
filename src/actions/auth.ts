"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prevState: { error: string } | null, formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Surfaced verbatim (temporarily) to diagnose auth setup issues —
    // swap back to a generic message once login is confirmed working.
    return { error: `${error.message} (status ${error.status ?? "?"})` };
  }

  // Opérateurs only ever have one screen that matters to them, and atelier
  // has no access to the dashboard — send each straight to the landing page
  // they're actually allowed to see.
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  const landing = profile?.role === "operateur" ? "/service-ticket-operateur" : profile?.role === "atelier" ? "/affaires" : "/dashboard";
  redirect(landing);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
