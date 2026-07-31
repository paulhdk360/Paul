"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  addBhaItemFreeform,
  addBhaItemFromOutil,
  createBha,
  deleteBha,
  deleteBhaItem,
  updateBha,
  updateBhaItem,
} from "@/actions/bha";
import { DrawingLibraryManager } from "@/components/DrawingLibraryManager";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { generateBhaPdf } from "@/lib/pdf/bhaPdf";
import type { Bha, BhaItem, CatalogueOutil, DrawingLibraryEntry, OutilDrawing } from "@/lib/types";

const EMPTY_BHA: Partial<Bha> = { nom: "", client: "", well: "", job_no: "", date: "", notes: "" };

// Sums every item's "longueur" that starts with a plain number (e.g. "9.3"
// or "0.6 m") and silently skips freeform text (e.g. "Slick") — the field
// stays free text because not every entry copied from the catalogue's
// "dimensions" column is a clean number, but most BHA reports still want a
// running total to sanity-check against the well depth.
function parseLongueur(v: string | null): number {
  if (!v) return 0;
  const m = v.trim().match(/^-?\d+(?:[.,]\d+)?/);
  return m ? parseFloat(m[0].replace(",", ".")) : 0;
}

export function BhaManager({
  bhas,
  items,
  outils,
  outilDrawings,
  library,
}: {
  bhas: Bha[];
  items: BhaItem[];
  outils: CatalogueOutil[];
  outilDrawings: OutilDrawing[];
  library: DrawingLibraryEntry[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(bhas[0]?.id ?? null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBha, setEditingBha] = useState<Bha | null>(null);
  const [form, setForm] = useState<Partial<Bha>>(EMPTY_BHA);
  const [query, setQuery] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const selected = bhas.find((b) => b.id === selectedId) ?? null;
  const selectedItems = useMemo(
    () => items.filter((it) => it.bha_id === selectedId).sort((a, b) => a.ordre - b.ordre),
    [items, selectedId],
  );
  const drawingByFamille = useMemo(() => new Map(outilDrawings.map((d) => [d.famille, d.fichier])), [outilDrawings]);
  const familles = useMemo(
    () => Array.from(new Set(outils.map((o) => o.famille).filter((f): f is string => !!f))).sort(),
    [outils],
  );

  const normalize = (s: string) => s.toLowerCase().replace(/[""'']/g, '"').trim();
  const queryWords = normalize(query).split(/\s+/).filter(Boolean);
  const suggestions = queryWords.length
    ? outils
        .filter((o) => {
          const haystack = normalize(`${o.designation} ${o.numero_article ?? ""} ${o.famille ?? ""}`);
          return queryWords.every((w) => haystack.includes(w));
        })
        .slice(0, 20)
    : [];

  function openCreate() {
    setEditingBha(null);
    setForm(EMPTY_BHA);
    setModalOpen(true);
  }

  function openEdit(b: Bha) {
    setEditingBha(b);
    setForm(b);
    setModalOpen(true);
  }

  function submitBha() {
    if (!form.nom?.trim()) {
      showToast("Le nom de la BHA est requis.");
      return;
    }
    startTransition(async () => {
      try {
        if (editingBha) {
          await updateBha(editingBha.id, form);
        } else {
          const row = await createBha(form);
          setSelectedId(row.id);
        }
        setModalOpen(false);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function removeBha(id: string) {
    if (!confirm("Supprimer cette BHA et tous ses items ?")) return;
    startTransition(async () => {
      try {
        await deleteBha(id);
        if (selectedId === id) setSelectedId(null);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  async function exportPdf() {
    if (!selected) return;
    setExportingPdf(true);
    try {
      await generateBhaPdf(selected, selectedItems, drawingByFamille);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Échec de l'export PDF.");
    } finally {
      setExportingPdf(false);
    }
  }

  function addFromOutil(outilId: string) {
    if (!selectedId) return;
    startTransition(async () => {
      try {
        await addBhaItemFromOutil(selectedId, outilId);
        setQuery("");
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'ajout.");
      }
    });
  }

  function addFreeform() {
    if (!selectedId || !query.trim()) return;
    startTransition(async () => {
      try {
        await addBhaItemFreeform(selectedId, query.trim());
        setQuery("");
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'ajout.");
      }
    });
  }

  function moveItem(id: string, dir: -1 | 1) {
    const idx = selectedItems.findIndex((it) => it.id === id);
    const swapIdx = idx + dir;
    if (idx === -1 || swapIdx < 0 || swapIdx >= selectedItems.length) return;
    const a = selectedItems[idx];
    const b = selectedItems[swapIdx];
    startTransition(async () => {
      try {
        await Promise.all([updateBhaItem(a.id, { ordre: b.ordre }), updateBhaItem(b.id, { ordre: a.ordre })]);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec du déplacement.");
      }
    });
  }

  function patchItem(id: string, data: Partial<BhaItem>) {
    startTransition(async () => {
      try {
        await updateBhaItem(id, data);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la mise à jour.");
      }
    });
  }

  function removeItem(id: string) {
    startTransition(async () => {
      try {
        await deleteBhaItem(id);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  const totalLongueur = selectedItems.reduce((sum, it) => sum + parseLongueur(it.longueur) * (it.quantite || 1), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[24px] font-semibold text-navy">BHA — Composition d&apos;assemblage</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setLibraryOpen(true)}
            className="rounded-lg border border-border px-4 py-2 text-[13.5px] font-semibold text-navy hover:bg-bg-sunken"
          >
            📚 Bibliothèque de dessins
          </button>
          <button
            onClick={openCreate}
            className="rounded-lg bg-blue px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-blue-dark"
          >
            + Nouvelle BHA
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="w-[240px] shrink-0 space-y-1.5">
          {bhas.length === 0 && <div className="text-[13px] text-text-muted">Aucune BHA créée.</div>}
          {bhas.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedId(b.id)}
              className={`block w-full rounded-lg border px-3 py-2 text-left text-[13px] ${
                selectedId === b.id ? "border-blue bg-blue/5 text-navy" : "border-border text-text-muted hover:bg-bg-sunken"
              }`}
            >
              <div className="font-semibold">{b.nom}</div>
              {(b.client || b.well) && (
                <div className="truncate text-[11px] text-text-muted">
                  {[b.client, b.well].filter(Boolean).join(" · ")}
                </div>
              )}
            </button>
          ))}
        </div>

        {selected ? (
          <div className="flex-1 space-y-4 rounded-[10px] border border-border bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-[18px] font-semibold text-navy">{selected.nom}</div>
                <div className="text-[12.5px] text-text-muted">
                  {[
                    selected.client && `Client : ${selected.client}`,
                    selected.well && `Puits : ${selected.well}`,
                    selected.job_no && `Job N° : ${selected.job_no}`,
                    selected.date && `Date : ${selected.date}`,
                  ]
                    .filter(Boolean)
                    .join("  ·  ") || "—"}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={exportingPdf || selectedItems.length === 0}
                  onClick={exportPdf}
                  className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-semibold text-navy hover:bg-bg-sunken disabled:opacity-50"
                >
                  {exportingPdf ? "Export…" : "📄 Exporter en PDF"}
                </button>
                <button
                  onClick={() => openEdit(selected)}
                  className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-semibold text-navy hover:bg-bg-sunken"
                >
                  Modifier
                </button>
                <button
                  onClick={() => removeBha(selected.id)}
                  className="rounded-lg border border-danger/30 px-3 py-1.5 text-[12.5px] font-semibold text-danger hover:bg-danger/5"
                >
                  Supprimer
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && suggestions.length === 0 && query.trim()) addFreeform();
                }}
                placeholder="Tapez un item du catalogue (ex : Taper Mill) pour l'ajouter à la pile…"
                className="w-full rounded-lg border border-border px-3 py-2.5 text-[14px] focus:border-blue focus:outline-none"
              />
              {suggestions.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-[260px] w-full overflow-y-auto rounded-lg border border-border bg-white shadow-xl">
                  {suggestions.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => addFromOutil(o.id)}
                      className="block w-full px-3 py-2 text-left text-[13px] hover:bg-bg-sunken"
                    >
                      <div className="font-medium">{o.designation}</div>
                      <div className="text-[11px] text-text-muted">
                        {[o.famille, o.diametre && `${o.diametre}" OD`, o.numero_serie && `S/N ${o.numero_serie}`]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={addFreeform}
                    className="block w-full border-t border-border px-3 py-2 text-left text-[12.5px] font-semibold text-blue hover:bg-bg-sunken"
                  >
                    + Ajouter « {query.trim()} » sans le lier au catalogue
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-text-muted">
                    {["#", "Dessin", "Désignation", "N° série", "OD", "ID", "Connexion", "Longueur", "Qté", "Torque", ""].map(
                      (h) => (
                        <th key={h} className="px-2 py-2 font-semibold">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((it, idx) => {
                    const drawing = it.famille ? drawingByFamille.get(it.famille) : undefined;
                    return (
                    <tr key={it.id} className="border-b border-border/60">
                      <td className="px-2 py-1.5 text-text-muted">{idx + 1}</td>
                      <td className="px-2 py-1.5">
                        {drawing ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={drawing} alt={it.designation} className="h-12 w-auto object-contain" />
                        ) : (
                          <div className="flex h-12 w-8 items-center justify-center rounded border border-dashed border-border text-[9px] text-text-muted">
                            —
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-1.5 font-medium text-navy">{it.designation}</td>
                      <EditableCell value={it.numero_serie} onChange={(v) => patchItem(it.id, { numero_serie: v })} />
                      <EditableCell value={it.od} onChange={(v) => patchItem(it.id, { od: v })} width={70} />
                      <EditableCell value={it.id_int} onChange={(v) => patchItem(it.id, { id_int: v })} width={70} />
                      <EditableCell value={it.connexion} onChange={(v) => patchItem(it.id, { connexion: v })} width={140} />
                      <EditableCell value={it.longueur} onChange={(v) => patchItem(it.id, { longueur: v })} width={80} />
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={it.quantite}
                          onChange={(e) => patchItem(it.id, { quantite: Number(e.target.value) || 1 })}
                          className="w-[50px] rounded border border-border px-1.5 py-1 text-[12.5px] focus:border-blue focus:outline-none"
                        />
                      </td>
                      <EditableCell value={it.torque} onChange={(v) => patchItem(it.id, { torque: v })} width={80} />
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          <button
                            disabled={idx === 0}
                            onClick={() => moveItem(it.id, -1)}
                            className="rounded px-1.5 py-0.5 text-text-muted hover:bg-bg-sunken disabled:opacity-30"
                            title="Monter"
                          >
                            ↑
                          </button>
                          <button
                            disabled={idx === selectedItems.length - 1}
                            onClick={() => moveItem(it.id, 1)}
                            className="rounded px-1.5 py-0.5 text-text-muted hover:bg-bg-sunken disabled:opacity-30"
                            title="Descendre"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => removeItem(it.id)}
                            className="rounded px-1.5 py-0.5 text-danger hover:bg-danger/5"
                            title="Retirer"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                  {selectedItems.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-2 py-6 text-center text-text-muted">
                        Aucun item — tapez un nom d&apos;outil ci-dessus pour commencer la pile.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedItems.length > 0 && (
              <div className="text-right text-[12.5px] font-semibold text-navy">
                Longueur totale (calculée) : {totalLongueur.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 rounded-[10px] border border-dashed border-border p-10 text-center text-[13px] text-text-muted">
            Sélectionne une BHA ou crées-en une nouvelle.
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editingBha ? "Modifier la BHA" : "Nouvelle BHA"} onClose={() => setModalOpen(false)}>
          <div className="space-y-3">
            <Field label="Nom" value={form.nom ?? ""} onChange={(v) => setForm({ ...form, nom: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Client" value={form.client ?? ""} onChange={(v) => setForm({ ...form, client: v })} />
              <Field label="Puits" value={form.well ?? ""} onChange={(v) => setForm({ ...form, well: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Job N°" value={form.job_no ?? ""} onChange={(v) => setForm({ ...form, job_no: v })} />
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Date</label>
                <input
                  type="date"
                  value={form.date ?? ""}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
                />
              </div>
            </div>
            <Field label="Notes" value={form.notes ?? ""} onChange={(v) => setForm({ ...form, notes: v })} textarea />
            <button
              disabled={isPending}
              onClick={submitBha}
              className="w-full rounded-lg bg-blue py-2.5 text-[14px] font-semibold text-white hover:bg-blue-dark disabled:opacity-50"
            >
              Enregistrer
            </button>
          </div>
        </Modal>
      )}

      {libraryOpen && (
        <DrawingLibraryManager
          familles={familles}
          outilDrawings={outilDrawings}
          library={library}
          onClose={() => setLibraryOpen(false)}
        />
      )}
    </div>
  );
}

function EditableCell({ value, onChange, width = 100 }: { value: string | null; onChange: (v: string) => void; width?: number }) {
  return (
    <td className="px-2 py-1.5">
      <input
        defaultValue={value ?? ""}
        onBlur={(e) => {
          if (e.target.value !== (value ?? "")) onChange(e.target.value);
        }}
        style={{ width }}
        className="rounded border border-border px-1.5 py-1 text-[12.5px] focus:border-blue focus:outline-none"
      />
    </td>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
        />
      )}
    </div>
  );
}
