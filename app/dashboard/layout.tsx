import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { ROLE_LABELS } from "@/lib/types";
import { signOut } from "@/lib/actions/auth";
import { ClubSwitcher } from "./club-switcher";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/dashboard/club", label: "Club" },
  { href: "/dashboard/teams", label: "Équipes" },
  { href: "/dashboard/players", label: "Joueurs" },
  { href: "/dashboard/staff", label: "Staff" },
  { href: "/dashboard/calendar", label: "Calendrier" },
  { href: "/dashboard/convocations", label: "Convocations" },
  { href: "/dashboard/tactics", label: "Tactiques" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.clubs.length === 0) redirect("/onboarding");

  const activeClub = resolveActiveClub(current.clubs);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:block">
        <div className="border-b border-slate-200 px-4 py-4">
          <p className="text-sm font-semibold">Football Team Manager</p>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
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
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                {ROLE_LABELS[activeClub.role]}
              </span>
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

        <main className="flex-1 bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  );
}
