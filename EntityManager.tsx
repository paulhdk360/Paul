"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/actions/auth";

const TABS = [
  { href: "/dashboard", label: "Tableau de bord", icon: "📊" },
  { href: "/chantiers", label: "Chantiers", icon: "👷" },
  { href: "/foreuses", label: "Foreuses", icon: "🚜" },
  { href: "/equipes", label: "Équipes", icon: "👥" },
  { href: "/devis", label: "Devis", icon: "📄" },
  { href: "/factures", label: "Facturation", icon: "💶" },
  { href: "/achats", label: "Achats", icon: "🛒" },
  { href: "/maintenances", label: "Maintenance", icon: "🔧" },
  { href: "/planning", label: "Planning", icon: "🗓️" },
  { href: "/stats", label: "Statistiques", icon: "📈" },
];

export function Sidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-[236px] shrink-0 flex-col border-r border-border bg-bg-panel p-3.5 max-md:w-full max-md:flex-row max-md:overflow-x-auto">
      <div className="mb-4 flex items-center gap-2.5 border-b border-border px-2 pb-5 pt-1 max-md:hidden">
        <Image src="/logo-bfe.png" alt="Béarn Forage Énergie" width={38} height={38} className="object-contain" />
        <div className="font-display text-[15px] font-bold leading-tight tracking-wide">
          BÉARN FORAGE
          <span className="block text-[11px] font-semibold tracking-widest text-accent-bright">
            ÉNERGIE — PILOTAGE
          </span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 max-md:flex-row">
        {TABS.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-accent-bright/25 bg-accent/[.16] text-accent-bright"
                  : "border-transparent text-text-muted hover:bg-bg-card hover:text-text-light"
              }`}
            >
              <span className="w-[18px] text-center text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
        <Link
          href="/parametres"
          className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname?.startsWith("/parametres")
              ? "border-accent-bright/25 bg-accent/[.16] text-accent-bright"
              : "border-transparent text-text-muted hover:bg-bg-card hover:text-text-light"
          }`}
        >
          <span className="w-[18px] text-center text-base">⚙️</span>
          <span>Paramètres</span>
        </Link>
      </nav>
      <div className="mt-2.5 border-t border-border px-2 pt-2.5 text-[11px] text-text-muted max-md:hidden">
        {userEmail && <div className="mb-2 truncate">{userEmail}</div>}
        <form action={signOut}>
          <button type="submit" className="text-accent-bright underline">
            Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  );
}
