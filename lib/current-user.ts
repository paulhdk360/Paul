import { auth } from "@/auth";
import { sql } from "@/lib/db";
import type { UserRole } from "@/lib/types";

export type ClubMembership = {
  club_id: string;
  club_name: string;
  role: UserRole;
};

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const profileRows = await sql`
    select id, full_name, email, avatar_url from users where id = ${userId} limit 1
  `;
  const profile = (profileRows[0] as { id: string; full_name: string; email: string; avatar_url: string | null } | undefined) ?? null;

  const membershipRows = await sql`
    select cm.club_id, cm.role, c.name as club_name
    from club_members cm
    join clubs c on c.id = cm.club_id
    where cm.user_id = ${userId}
  `;

  const clubs: ClubMembership[] = membershipRows.map((m: any) => ({
    club_id: m.club_id,
    club_name: m.club_name,
    role: m.role,
  }));

  return { user: { id: userId }, profile, clubs };
}
