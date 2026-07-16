import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RappelsTester } from "@/components/RappelsTester";
import { UserManagement } from "@/components/UserManagement";
import type { Profile } from "@/lib/types";

export default async function ParametresPage() {
  const { user, profile } = await requireUser();
  if (profile.role !== "admin") redirect("/dashboard");

  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at");

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide text-navy">Paramètres</div>
      <div className="mb-6 text-[13.5px] text-text-muted">Gestion des utilisateurs et des rôles</div>
      <UserManagement profiles={(data ?? []) as Profile[]} currentUserId={user.id} />
      <RappelsTester />
    </div>
  );
}
