"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: "🏠" },
  { href: "/dashboard/club", label: "Club", icon: "🏟️" },
  { href: "/dashboard/teams", label: "Équipes", icon: "👥" },
  { href: "/dashboard/players", label: "Joueurs", icon: "🏈" },
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
                ? "flex items-center gap-2 rounded-lg bg-pitch-100 px-3 py-2 text-sm font-semibold text-pitch-800"
                : "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-pitch-50 hover:text-pitch-800"
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
