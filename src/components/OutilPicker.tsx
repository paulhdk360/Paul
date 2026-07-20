"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createOutil } from "@/actions/catalogue";
import { useToast } from "@/components/Toast";
import type { CatalogueOutil } from "@/lib/types";

// Links a devis/Tool List row to its real catalogue reference, independent
// of whatever wording is typed in the row's own designation field — e.g. a
// devis can say "17\" OD Junk Mill" for the client while pointing at the
// catalogue's "17-1/2\" OD Junk Mill" so stock tracking stays accurate.
export function OutilPicker({
  outils,
  value,
  onSelect,
  designationHint,
}: {
  outils: CatalogueOutil[];
  value: string | null;
  onSelect: (id: string | null) => void;
  // The row's own designation text (e.g. "Moteur 4-3/4\" OD ...") — seeded
  // into the search box the first time the dropdown opens on an unlinked
  // row, so it starts out scoped to what's already typed there (typing
  // "Moteur" shouldn't surface a Junk Mill) instead of listing the entire
  // catalogue until the user types something themselves.
  designationHint?: string;
}) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = outils.find((o) => o.id === value) ?? null;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Rendered through a portal into <body> with fixed positioning — this
  // table's row lives inside an overflow-x-auto wrapper, and per the CSS
  // spec setting only overflow-x to a non-visible value silently forces
  // overflow-y to "auto" too, clipping any absolutely-positioned dropdown
  // that would otherwise extend below the table. A portal escapes that
  // clipping entirely regardless of which ancestor scrolls.
  function toggleOpen() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.left });
      if (!query && !selected && designationHint?.trim()) {
        setQuery(designationHint.trim().split(/\s+/)[0]);
      }
    }
    setOpen((v) => !v);
  }

  // Word-based matching (every typed word must appear somewhere, in any
  // order) rather than one big substring — "4-3/4 moteur" must still find
  // "Moteur 4-3/4\" OD" even though the words are reversed. Quotes are
  // normalized so a straight " vs a curly ” typed differently doesn't
  // silently break the match either.
  const normalize = (s: string) => s.toLowerCase().replace(/[""'']/g, '"').trim();

  // N° article is rarely filled in on the imported fleet (most physical
  // units are identified by N° de série instead) — showing it alone left
  // near-identical rows ("—" under every Economill of the same size)
  // impossible to tell apart. Falls back to the diamètre when neither
  // reference exists at all.
  function refLine(o: CatalogueOutil): string {
    const parts: string[] = [];
    if (o.numero_serie) parts.push(`S/N ${o.numero_serie}`);
    if (o.numero_article) parts.push(o.numero_article);
    if (!parts.length && o.diametre) parts.push(`${o.diametre}" OD`);
    return parts.join(" · ") || "—";
  }

  const queryWords = normalize(query).split(/\s+/).filter(Boolean);
  const filtered = outils
    .filter((o) => {
      const haystack = normalize(`${o.designation} ${o.numero_article ?? ""} ${o.famille ?? ""}`);
      return queryWords.every((w) => haystack.includes(w));
    })
    .slice(0, 30);

  async function createAndSelect() {
    setCreating(true);
    try {
      const row = await createOutil({ designation: query.trim(), statut: "En stock" });
      onSelect(row.id);
      setOpen(false);
      setQuery("");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Échec de la création de la référence.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        title={selected ? `${selected.designation} (${refLine(selected)})` : "Lier à une référence du catalogue"}
        className={`w-[130px] truncate rounded border px-1.5 py-1 text-left text-[11.5px] ${
          selected ? "border-blue/40 bg-blue/5 text-navy" : "border-border text-text-muted"
        }`}
      >
        {selected ? selected.designation : "— Lier —"}
      </button>
      {selected && <div className="w-[130px] truncate text-[10px] text-text-muted">{refLine(selected)}</div>}
      {open &&
        coords &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ position: "fixed", top: coords.top, left: coords.left }}
            className="z-50 w-[260px] rounded-lg border border-border bg-white shadow-xl"
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Rechercher une référence… (${outils.length} au catalogue)`}
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
                  <div className="text-[10.5px] text-text-muted">{refLine(o)}</div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-2 py-3 text-center text-[11.5px] text-text-muted">
                  {query.trim() ? "Aucun résultat — cette référence n'existe pas encore dans le catalogue." : "Tapez pour rechercher."}
                </div>
              )}
            </div>
            {query.trim() && (
              <button
                type="button"
                disabled={creating}
                onClick={createAndSelect}
                className="block w-full border-t border-border px-2 py-1.5 text-left text-[12px] font-semibold text-blue hover:bg-bg-sunken disabled:opacity-50"
              >
                {creating ? "Création…" : `+ Créer « ${query.trim()} » dans le catalogue`}
              </button>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
