"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/actions/auth";
import { Logo } from "@/components/Logo";
import { ROLE_LABELS } from "@/lib/company";
import type { Role } from "@/lib/types";

const ALL_TABS = [
  { href: "/dashboard", label: "Tableau de bord", icon: "📊", roles: ["admin", "commercial", "atelier"] },
  { href: "/affaires", label: "Affaires", icon: "🗂️", roles: ["admin", "commercial", "atelier"] },
  { href: "/clients", label: "Clients", icon: "🤝", roles: ["admin", "commercial"] },
  { href: "/catalogue", label: "Catalogue outils", icon: "🧰", roles: ["admin", "commercial", "atelier"] },
  { href: "/service-ticket-operateur", label: "Mes tickets", icon: "📋", roles: ["operateur"] },
] as const;

export function Sidebar({ userEmail, role }: { userEmail: string | null; role: Role }) {
  const pathname = usePathname();
  const tabs = ALL_TABS.filter((t) => (t.roles as readonly string[]).includes(role));

  return (
    <aside className="flex w-[236px] shrink-0 flex-col border-r border-border bg-bg-panel p-3.5 max-md:w-full max-md:flex-row max-md:overflow-x-auto">
      <div className="mb-4 flex items-center border-b border-border px-2 pb-5 pt-1 max-md:hidden">
        <Logo size={36} />
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 max-md:flex-row">
        {tabs.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-blue/25 bg-blue/[.10] text-navy"
                  : "border-transparent text-text-muted hover:bg-bg-sunken hover:text-text-dark"
              }`}
            >
              <span className="w-[18px] text-center text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
        {role === "admin" && (
          <Link
            href="/parametres"
            className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname?.startsWith("/parametres")
                ? "border-blue/25 bg-blue/[.10] text-navy"
                : "border-transparent text-text-muted hover:bg-bg-sunken hover:text-text-dark"
            }`}
          >
            <span className="w-[18px] text-center text-base">⚙️</span>
            <span>Paramètres</span>
          </Link>
        )}
      </nav>
      <div className="mt-2.5 border-t border-border px-2 pt-2.5 text-[11px] text-text-muted max-md:hidden">
        {userEmail && <div className="mb-1 truncate">{userEmail}</div>}
        <div className="mb-2 font-semibold text-navy">{ROLE_LABELS[role]}</div>
        <form action={signOut}>
          <button type="submit" className="text-blue underline">
            Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  );
}
