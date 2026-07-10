import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export type ClubMembership = {
  club_id: string;
  club_name: string;
  role: UserRole;
};

export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: memberships } = await supabase
    .from("club_members")
    .select("club_id, role, clubs(name)")
    .eq("user_id", user.id);

  const clubs: ClubMembership[] = (memberships ?? []).map((m: any) => ({
    club_id: m.club_id,
    club_name: m.clubs?.name ?? "",
    role: m.role,
  }));

  return { user, profile, clubs };
}
