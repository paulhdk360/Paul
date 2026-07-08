"use client";

import { useEffect, useRef, useState } from "react";
import type { CatalogueOutil } from "@/lib/types";

// Links a devis/Tool List row to its real catalogue reference, independent
// of whatever wording is typed in the row's own designation field — e.g. a
// devis can say "17\" OD Junk Mill" for the client while pointing at the
// catalogue's "17-1/2\" OD Junk Mill" so stock tracking stays accurate.
export function OutilPicker({
  outils,
  value,
  onSelect,
}: {
  outils: CatalogueOutil[];
  value: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = outils.find((o) => o.id === value) ?? null;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = outils
    .filter((o) => `${o.designation} ${o.numero_article ?? ""} ${o.famille ?? ""}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 30);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={selected ? `${selected.designation} (${selected.numero_article ?? "—"})` : "Lier à une référence du catalogue"}
        className={`w-[130px] truncate rounded border px-1.5 py-1 text-left text-[11.5px] ${
          selected ? "border-blue/40 bg-blue/5 text-navy" : "border-border text-text-muted"
        }`}
      >
        {selected ? selected.designation : "— Lier —"}
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-[260px] rounded-lg border border-border bg-white shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une référence…"
            className="w-full border-b border-border px-2 py-1.5 text-[12px] focus:outline-none"
          />
          <div className="max-h-[220px] overflow-y-auto">
            {selected && (
              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  setOpen(false);
                  setQuery("");
                }}
                className="block w-full px-2 py-1.5 text-left text-[12px] text-danger hover:bg-bg-sunken"
              >
                ✕ Retirer le lien
              </button>
            )}
            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  onSelect(o.id);
                  setOpen(false);
                  setQuery("");
                }}
                className="block w-full px-2 py-1.5 text-left text-[12px] hover:bg-bg-sunken"
              >
                <div className="font-medium">{o.designation}</div>
                <div className="text-[10.5px] text-text-muted">{o.numero_article ?? "—"}</div>
              </button>
            ))}
            {filtered.length === 0 && <div className="px-2 py-3 text-center text-[11.5px] text-text-muted">Aucun résultat.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
