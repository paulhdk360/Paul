"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { clearOutilDrawing, setOutilDrawing } from "@/actions/outilDrawings";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { AVAILABLE_DRAWINGS } from "@/lib/toolDrawings";
import type { OutilDrawing } from "@/lib/types";

export function DrawingLibraryManager({
  familles,
  outilDrawings,
  onClose,
}: {
  familles: string[];
  outilDrawings: OutilDrawing[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const byFamille = useMemo(() => new Map(outilDrawings.map((d) => [d.famille, d.fichier])), [outilDrawings]);
  const filtered = familles.filter((f) => f.toLowerCase().includes(search.toLowerCase()));

  function assign(famille: string, fichier: string) {
    startTransition(async () => {
      try {
        if (fichier) {
          await setOutilDrawing(famille, fichier);
        } else {
          await clearOutilDrawing(famille);
        }
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  return (
    <Modal title="Bibliothèque de dessins" onClose={onClose} wide>
      <div className="space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrer par famille…"
          className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
        />
        <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-[13px]">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-text-muted">
                <th className="px-3 py-2 font-semibold">Famille</th>
                <th className="px-3 py-2 font-semibold">Dessin</th>
                <th className="px-3 py-2 font-semibold">Associer</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((famille) => {
                const fichier = byFamille.get(famille);
                return (
                  <tr key={famille} className="border-b border-border/60">
                    <td className="px-3 py-2 text-navy">{famille}</td>
                    <td className="px-3 py-2">
                      {fichier ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={fichier} alt={famille} className="h-10 w-auto object-contain" />
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={fichier ?? ""}
                        onChange={(e) => assign(famille, e.target.value)}
                        className="rounded-lg border border-border px-2 py-1.5 text-[12.5px] focus:border-blue focus:outline-none"
                      >
                        <option value="">— Aucun —</option>
                        {AVAILABLE_DRAWINGS.map((d) => (
                          <option key={d.file} value={d.file}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-text-muted">
                    Aucune famille ne correspond.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
