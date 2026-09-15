import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { ROLE_BADGE_COLORS, ROLE_LABELS } from "@/lib/types";
import { signOut } from "@/lib/actions/auth";
import { ClubSwitcher } from "./club-switcher";
import { NavLinks } from "./nav-links";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.clubs.length === 0) redirect("/onboarding");

  const activeClub = resolveActiveClub(current.clubs);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-ink-500 bg-ink-800 md:block">
        <div className="border-b border-ink-500 bg-gradient-to-br from-pitch-700 via-ink-800 to-ink-900 px-4 py-4">
          <p className="font-display text-lg uppercase tracking-wider text-white">🏈 Football Team Manager</p>
        </div>
        <NavLinks />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-ink-500 bg-ink-800 px-6 py-3">
          <div className="flex items-center gap-3">
            {current.clubs.length > 1 ? (
              <ClubSwitcher clubs={current.clubs} activeClubId={activeClub?.club_id} />
            ) : (
              <p className="font-medium text-slate-100">{activeClub?.club_name}</p>
            )}
            {activeClub && (
              <span className={`badge ${ROLE_BADGE_COLORS[activeClub.role]}`}>{ROLE_LABELS[activeClub.role]}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{current.profile?.full_name}</span>
            <form action={signOut}>
              <button className="btn-secondary" type="submit">
                Déconnexion
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
