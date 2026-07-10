"use client";

import type { ClubMembership } from "@/lib/current-user";
import { setActiveClub } from "@/lib/actions/session";

export function ClubSwitcher({
  clubs,
  activeClubId,
}: {
  clubs: ClubMembership[];
  activeClubId?: string;
}) {
  return (
    <form action={setActiveClub}>
      <select
        name="club_id"
        defaultValue={activeClubId}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="input"
      >
        {clubs.map((c) => (
          <option key={c.club_id} value={c.club_id}>
            {c.club_name}
          </option>
        ))}
      </select>
    </form>
  );
}
