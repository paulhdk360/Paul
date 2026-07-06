"use client";

import { useMemo, useState, useTransition } from "react";
import { createEntity, deleteEntity, updateEntity } from "@/actions/entities";
import { cleanupOrphanAttachments } from "@/actions/attachments";
import type { EntityConfig, FieldConfig } from "@/lib/entities";
import { fmtDate, fmtEUR, fmtNum } from "@/lib/format";
import { Badge } from "@/components/Badge";
import { useToast } from "@/components/Toast";
import { Attachments } from "@/components/Attachments";
import type { Attachment } from "@/lib/supabase/types";

export type Row = { id: string; [key: string]: any };
type RelatedOption = { id: string; nom: string };
type RelatedLists = Partial<Record<"foreuses" | "equipes" | "chantiers", RelatedOption[]>>;

const MONEY_KEYS = /montant|cout/i;
const SELECT_BADGE_FIELDS = new Set(["statut", "disponibilite"]);

function relatedLabel(related: RelatedLists, from: FieldConfig["optionsFrom"], id: unknown) {
  if (!from || !id) return "—";
  const list = related[from] ?? [];
  return list.find((o) => o.id === id)?.nom ?? "—";
}

function renderCell(field: FieldConfig, row: Row, related: RelatedLists) {
  const val = row[field.key];
  if (field.optionsFrom) return relatedLabel(related, field.optionsFrom, val);
  if (field.type === "select" && SELECT_BADGE_FIELDS.has(field.key)) {
    return <Badge statut={val as string} />;
  }
  if (field.type === "date") return <span className="font-mono">{fmtDate(val as string)}</span>;
  if (field.type === "number") {
    return (
      <span className="font-mono">
        {MONEY_KEYS.test(field.key) ? fmtEUR(val as number) : fmtNum(val as number)}
      </span>
    );
  }
  return <>{(val as string) || "—"}</>;
}

export function EntityManager({
  entityKey,
  config,
  rows,
  related,
  attachmentsByRow,
  initialOpenId,
}: {
  entityKey: string;
  config: EntityConfig;
  rows: Row[];
  related: RelatedLists;
  attachmentsByRow?: Record<string, Attachment[]>;
  initialOpenId?: string;
}) {
  const [editing, setEditing] = useState<Row | null>(
    initialOpenId ? rows.find((r) => r.id === initialOpenId) ?? null : null,
  );
  const [isNew, setIsNew] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const columns = useMemo(
    () => config.columns.map((c) => config.fields.find((f) => f.key === c)!).filter(Boolean),
    [config],
  );

  function openNew() {
    setEditing({ id: crypto.randomUUID() });
    setIsNew(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setIsNew(false);
  }

  function closeModal() {
    if (isNew && editing && config.attachments) {
      cleanupOrphanAttachments(entityKey as "chantiers" | "achats" | "maintenances", editing.id).catch(() => {});
    }
    setEditing(null);
    setIsNew(false);
  }

  function handleSubmit(formData: FormData) {
    const values: Record<string, unknown> = {};
    for (const field of config.fields) {
      const raw = formData.get(field.key);
      if (field.type === "number") {
        values[field.key] = raw === "" || raw === null ? 0 : Number(raw);
      } else if (field.optional && (raw === "" || raw === null)) {
        values[field.key] = null;
      } else {
        values[field.key] = raw ?? "";
      }
    }
    startTransition(async () => {
      try {
        if (editing && !isNew) {
          await updateEntity(config.table, editing.id, values);
        } else if (editing) {
          values.id = editing.id;
          await createEntity(config.table, values);
        }
        setEditing(null);
        setIsNew(false);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Supprimer cet élément ? Cette action est définitive.")) return;
    startTransition(async () => {
      try {
        await deleteEntity(config.table, id);
      } catch {
        showToast("Échec de la suppression.");
      }
    });
  }

  const modalRow = editing;

  return (
    <div>
      <div className="page-title font-display text-[30px] font-bold tracking-wide">{config.labelPlural}</div>
      <div className="mb-6 text-[13.5px] text-text-muted">{rows.length} élément(s) enregistré(s)</div>
      <div className="mb-4.5 flex flex-wrap items-center justify-between gap-2.5">
        <div />
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-[13.5px] font-semibold text-[#06201B] hover:bg-accent-bright"
        >
          + Ajouter {config.label.toLowerCase()}
        </button>
      </div>
      <div className="rounded-[10px] border border-border bg-bg-card p-5">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-[13.5px] text-text-muted">
            Aucune donnée pour le moment. Cliquez sur « Ajouter » pour commencer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className="border-b border-border px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-text-muted"
                    >
                      {c.label}
                    </th>
                  ))}
                  <th className="border-b border-border" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[.02]">
                    {columns.map((c) => (
                      <td key={c.key} className="border-b border-border/50 px-3 py-2.5">
                        {renderCell(c, row, related)}
                      </td>
                    ))}
                    <td className="border-b border-border/50 px-3 py-2.5">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openEdit(row)}
                          className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-bg-card-hover"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="rounded-lg border border-danger/40 px-2.5 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#060f0e]/65 backdrop-blur-[2px]"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="max-h-[86vh] w-[460px] max-w-[92vw] overflow-y-auto rounded-[14px] border border-border bg-bg-panel p-6">
            <h3 className="mb-4 font-display text-xl font-semibold">
              {isNew ? "Ajouter" : "Modifier"} — {config.label}
            </h3>
            <form
              action={handleSubmit}
              key={modalRow?.id ?? "new"}
            >
              {config.fields.map((field) => (
                <div key={field.key} className="mb-3.5">
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">
                    {field.label}
                  </label>
                  {field.type === "select" ? (
                    <select
                      name={field.key}
                      defaultValue={(modalRow?.[field.key] as string) ?? ""}
                      className="w-full rounded-[7px] border border-border bg-bg px-2.5 py-2 text-[13.5px] text-text-light focus:border-accent-bright focus:outline-none"
                    >
                      <option value="">—</option>
                      {(field.optionsFrom ? related[field.optionsFrom] ?? [] : (field.options ?? []).map((o) => ({ id: o, nom: o }))).map(
                        (opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.nom}
                          </option>
                        ),
                      )}
                    </select>
                  ) : (
                    <input
                      name={field.key}
                      type={field.type}
                      defaultValue={(modalRow?.[field.key] as string | number) ?? (field.type === "number" ? 0 : "")}
                      className="w-full rounded-[7px] border border-border bg-bg px-2.5 py-2 text-[13.5px] text-text-light focus:border-accent-bright focus:outline-none"
                    />
                  )}
                </div>
              ))}
              {config.attachments && modalRow && (
                <div className="mb-3.5">
                  <Attachments
                    linkType={entityKey as "chantiers" | "achats" | "maintenances"}
                    linkId={modalRow.id}
                    initialFiles={isNew ? [] : attachmentsByRow?.[modalRow.id] ?? []}
                  />
                </div>
              )}
              <div className="mt-4.5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-border px-4 py-2 text-[13.5px] font-semibold hover:bg-bg-card"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-accent px-4 py-2 text-[13.5px] font-semibold text-[#06201B] hover:bg-accent-bright disabled:opacity-60"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
