"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";

const TABS = [
  { suffix: "", label: "Aperçu", hideFromOperateur: false },
  { suffix: "/devis", label: "Devis", hideFromOperateur: true },
  { suffix: "/tool-list", label: "Tool List", hideFromOperateur: true },
  { suffix: "/bl", label: "Bons de livraison", hideFromOperateur: true },
  { suffix: "/service-ticket", label: "Service Ticket Enedril", hideFromOperateur: true },
  { suffix: "/service-ticket-operateur", label: "Service Ticket Opérateur", hideFromOperateur: false },
  { suffix: "/documents", label: "Documents", hideFromOperateur: false },
];

export function AffaireTabs({ affaireId, role }: { affaireId: string; role: Role }) {
  const pathname = usePathname();
  const base = `/affaires/${affaireId}`;
  const tabs = TABS.filter((tab) => !(role === "operateur" && tab.hideFromOperateur));

  return (
    <div className="mb-5 flex flex-wrap gap-1.5 border-b border-border pb-3">
      {tabs.map((tab) => {
        const href = `${base}${tab.suffix}`;
        const active = tab.suffix === "" ? pathname === base : pathname?.startsWith(href);
        return (
          <Link
            key={tab.suffix}
            href={href}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              active ? "bg-navy text-white" : "text-text-muted hover:bg-bg-sunken hover:text-text-dark"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
