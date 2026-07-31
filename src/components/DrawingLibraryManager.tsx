"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
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
  const [pastedFile, setPastedFile] = useState<File | Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newFamille, setNewFamille] = useState("");
  // Familles typed in during this session that aren't in the catalogue yet
  // (or already saved to outil_drawings) — kept locally so the row stays
  // visible to assign a drawing to, without requiring the famille to exist
  // as a catalogue item first.
  const [extraFamilles, setExtraFamilles] = useState<string[]>([]);

  const byFamille = useMemo(() => new Map(outilDrawings.map((d) => [d.famille, d.fichier])), [outilDrawings]);
  const allFamilles = useMemo(
    () => Array.from(new Set([...familles, ...outilDrawings.map((d) => d.famille), ...extraFamilles])).sort(),
    [familles, outilDrawings, extraFamilles],
  );
  const filtered = allFamilles.filter((f) => f.toLowerCase().includes(search.toLowerCase()));

  function addFamille() {
    const name = newFamille.trim();
    if (!name) return;
    if (!allFamilles.includes(name)) setExtraFamilles((prev) => [...prev, name]);
    setNewFamille("");
    setSearch(name);
  }

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

  function acceptImage(blob: File | Blob) {
    setPastedFile(blob);
    setPreviewUrl(URL.createObjectURL(blob));
  }

  // Listens on the whole document while this modal is open, instead of
  // requiring the paste zone itself to have focus — clicking into "Nom du
  // dessin" first (very likely, since you'd naturally type the name before
  // pasting) meant Ctrl+V never reached the zone's own onPaste handler and
  // silently did nothing.
  useEffect(() => {
    function onDocPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            acceptImage(blob);
            e.preventDefault();
          }
          return;
        }
      }
    }
    document.addEventListener("paste", onDocPaste);
    return () => document.removeEventListener("paste", onDocPaste);
  }, []);

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) acceptImage(file);
    e.target.value = "";
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
            Ajouter un dessin — copie une image dans Excel (clic droit sur le dessin → Copier), puis appuie sur Ctrl+V
            n&apos;importe où dans cette fenêtre
          </div>
          <div className="flex gap-3">
            <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border text-center text-[11.5px] text-text-muted">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Aperçu" className="max-h-full max-w-full object-contain" />
              ) : (
                "Ctrl+V ici (ou n'importe où dans cette fenêtre)"
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <input
                value={pasteName}
                onChange={(e) => setPasteName(e.target.value)}
                placeholder="Nom du dessin (ex : Junk Mill)"
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  disabled={!pastedFile || !pasteName.trim() || uploading}
                  onClick={saveDrawing}
                  className="w-fit rounded-lg bg-blue px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-dark disabled:opacity-50"
                >
                  {uploading ? "Ajout…" : "+ Ajouter à la bibliothèque"}
                </button>
                <label className="cursor-pointer text-[12px] font-semibold text-blue hover:underline">
                  ou choisir un fichier image
                  <input type="file" accept="image/*" onChange={onFilePicked} className="hidden" />
                </label>
              </div>
              {!pastedFile && (
                <div className="text-[11px] text-text-muted">
                  Si Ctrl+V ne fonctionne pas (Excel ne met pas toujours une vraie image dans le presse-papier selon la
                  version), enregistre le dessin comme fichier image et utilise « choisir un fichier ».
                </div>
              )}
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
          <div className="mb-2 flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrer par famille…"
              className="flex-1 rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
            />
            <input
              value={newFamille}
              onChange={(e) => setNewFamille(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFamille()}
              placeholder="Famille absente du catalogue…"
              className="flex-1 rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
            />
            <button
              onClick={addFamille}
              disabled={!newFamille.trim()}
              className="shrink-0 rounded-lg border border-border px-3 py-2 text-[12.5px] font-semibold text-navy hover:bg-bg-sunken disabled:opacity-50"
            >
              + Ajouter
            </button>
          </div>
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
