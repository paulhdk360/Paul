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
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:block">
        <div className="bg-gradient-to-br from-pitch-600 to-pitch-800 px-4 py-4">
          <p className="text-sm font-semibold text-white">🏈 Football Team Manager</p>
        </div>
        <NavLinks />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="flex items-center gap-3">
            {current.clubs.length > 1 ? (
              <ClubSwitcher clubs={current.clubs} activeClubId={activeClub?.club_id} />
            ) : (
              <p className="font-medium">{activeClub?.club_name}</p>
            )}
            {activeClub && (
              <span className={`badge ${ROLE_BADGE_COLORS[activeClub.role]}`}>{ROLE_LABELS[activeClub.role]}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{current.profile?.full_name}</span>
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
