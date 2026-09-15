"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: "🏠" },
  { href: "/dashboard/club", label: "Club", icon: "🏟️" },
  { href: "/dashboard/teams", label: "Équipes", icon: "👥" },
  { href: "/dashboard/players", label: "Joueurs", icon: "🏈" },
  { href: "/dashboard/stats", label: "Statistiques", icon: "📊" },
  { href: "/dashboard/staff", label: "Staff", icon: "🧢" },
  { href: "/dashboard/calendar", label: "Calendrier", icon: "📅" },
  { href: "/dashboard/convocations", label: "Convocations", icon: "📣" },
  { href: "/dashboard/tactics", label: "Tactiques", icon: "🧠" },
  { href: "/dashboard/videos", label: "Vidéos", icon: "🎥" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "flex items-center gap-2 rounded-lg border-l-2 border-gold-500 bg-pitch-500/15 px-3 py-2 text-sm font-semibold text-gold-400"
                : "flex items-center gap-2 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-slate-400 transition hover:bg-ink-600 hover:text-slate-100"
            }
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
