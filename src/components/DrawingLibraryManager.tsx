"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { deleteDrawing, uploadDrawing } from "@/actions/drawingLibrary";
import { clearOutilDrawing, setOutilDrawing } from "@/actions/outilDrawings";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import type { DrawingLibraryEntry, OutilDrawing } from "@/lib/types";

export function DrawingLibraryManager({
  familles,
  outilDrawings,
  library,
  onClose,
}: {
  familles: string[];
  outilDrawings: OutilDrawing[];
  library: DrawingLibraryEntry[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [pasteName, setPasteName] = useState("");
  const [pastedFile, setPastedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const pasteZoneRef = useRef<HTMLDivElement>(null);

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

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const blob = item.getAsFile();
        if (blob) {
          setPastedFile(blob);
          setPreviewUrl(URL.createObjectURL(blob));
        }
        e.preventDefault();
        return;
      }
    }
    showToast("Aucune image trouvée dans le presse-papier.");
  }

  async function saveDrawing() {
    if (!pastedFile || !pasteName.trim()) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", pastedFile, "paste.png");
      await uploadDrawing(pasteName.trim(), formData);
      setPastedFile(null);
      setPreviewUrl(null);
      setPasteName("");
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Échec de l'ajout du dessin.");
    } finally {
      setUploading(false);
    }
  }

  function removeDrawing(entry: DrawingLibraryEntry) {
    if (!confirm(`Supprimer le dessin « ${entry.nom} » de la bibliothèque ?`)) return;
    startTransition(async () => {
      try {
        await deleteDrawing(entry.id, entry.url);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  return (
    <Modal title="Bibliothèque de dessins" onClose={onClose} wide>
      <div className="space-y-5">
        <div>
          <div className="mb-1.5 text-[12.5px] font-semibold text-text-muted">
            Ajouter un dessin (copier une image depuis Excel, puis coller ci-dessous)
          </div>
          <div className="flex gap-3">
            <div
              ref={pasteZoneRef}
              tabIndex={0}
              onPaste={handlePaste}
              className="flex h-24 w-40 shrink-0 cursor-text items-center justify-center rounded-lg border-2 border-dashed border-border text-center text-[11.5px] text-text-muted focus:border-blue focus:outline-none"
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Aperçu" className="max-h-full max-w-full object-contain" />
              ) : (
                "Clique ici puis Ctrl+V"
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <input
                value={pasteName}
                onChange={(e) => setPasteName(e.target.value)}
                placeholder="Nom du dessin (ex : Junk Mill)"
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
              <button
                disabled={!pastedFile || !pasteName.trim() || uploading}
                onClick={saveDrawing}
                className="w-fit rounded-lg bg-blue px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-dark disabled:opacity-50"
              >
                {uploading ? "Ajout…" : "+ Ajouter à la bibliothèque"}
              </button>
            </div>
          </div>
        </div>

        {library.length > 0 && (
          <div>
            <div className="mb-1.5 text-[12.5px] font-semibold text-text-muted">Dessins disponibles ({library.length})</div>
            <div className="flex flex-wrap gap-2">
              {library.map((d) => (
                <div key={d.id} className="relative rounded-lg border border-border p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.url} alt={d.nom} className="h-14 w-14 object-contain" />
                  <div className="mt-1 max-w-14 truncate text-center text-[9.5px] text-text-muted">{d.nom}</div>
                  <button
                    onClick={() => removeDrawing(d)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] text-white hover:bg-danger/80"
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-1.5 text-[12.5px] font-semibold text-text-muted">Associer un dessin à chaque famille</div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer par famille…"
            className="mb-2 w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
          />
          <div className="max-h-[45vh] overflow-y-auto rounded-lg border border-border">
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
                          {library.map((d) => (
                            <option key={d.id} value={d.url}>
                              {d.nom}
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
      </div>
    </Modal>
  );
}
