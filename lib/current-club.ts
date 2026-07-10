import { cookies } from "next/headers";
import type { ClubMembership } from "@/lib/current-user";

export function resolveActiveClub(clubs: ClubMembership[]): ClubMembership | null {
  if (clubs.length === 0) return null;

  const cookieClubId = cookies().get("ftm_club_id")?.value;
  const fromCookie = clubs.find((c) => c.club_id === cookieClubId);

  return fromCookie ?? clubs[0];
}
