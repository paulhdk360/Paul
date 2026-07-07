"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { suffix: "", label: "Aperçu" },
  { suffix: "/devis", label: "Devis" },
  { suffix: "/tool-list", label: "Tool List" },
  { suffix: "/bl", label: "Bons de livraison" },
  { suffix: "/service-ticket", label: "Service Ticket Enedril" },
  { suffix: "/service-ticket-operateur", label: "Service Ticket Opérateur" },
  { suffix: "/documents", label: "Documents" },
];

export function AffaireTabs({ affaireId }: { affaireId: string }) {
  const pathname = usePathname();
  const base = `/affaires/${affaireId}`;

  return (
    <div className="mb-5 flex flex-wrap gap-1.5 border-b border-border pb-3">
      {TABS.map((tab) => {
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
