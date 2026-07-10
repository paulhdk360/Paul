"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";

const TABS = [
  { suffix: "", label: "Aperçu", hideFromOperateur: true, hideFromAtelier: true },
  { suffix: "/devis", label: "Devis", hideFromOperateur: true, hideFromAtelier: true },
  { suffix: "/tool-list", label: "Tool List", hideFromOperateur: true, hideFromAtelier: false },
  { suffix: "/bl", label: "Bons de livraison", hideFromOperateur: true, hideFromAtelier: false },
  { suffix: "/pointage-retour", label: "Pointage retour", hideFromOperateur: true, hideFromAtelier: false },
  { suffix: "/service-ticket", label: "Service Ticket Nordrig", hideFromOperateur: true, hideFromAtelier: true },
  { suffix: "/service-ticket-operateur", label: "Service Ticket Opérateur", hideFromOperateur: false, hideFromAtelier: true },
  { suffix: "/facturation", label: "Récap facturation", hideFromOperateur: true, hideFromAtelier: true },
  { suffix: "/rentabilite", label: "Rentabilité", hideFromOperateur: true, hideFromAtelier: true },
  { suffix: "/documents", label: "Documents", hideFromOperateur: true, hideFromAtelier: true },
];

export function AffaireTabs({ affaireId, role }: { affaireId: string; role: Role }) {
  const pathname = usePathname();
  const base = `/affaires/${affaireId}`;
  const tabs = TABS.filter((tab) => !(role === "operateur" && tab.hideFromOperateur) && !(role === "atelier" && tab.hideFromAtelier));

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
