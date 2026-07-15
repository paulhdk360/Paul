"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createOutil, deleteOutil, updateOutil } from "@/actions/catalogue";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { CATALOGUE_STATUTS } from "@/lib/company";
import { fmtDate, fmtEUR } from "@/lib/format";
import type { Affaire, CatalogueHistorique, CatalogueOutil } from "@/lib/types";

const EMPTY: Partial<CatalogueOutil> = {
  famille: "",
  designation: "",
  numero_article: "",
  diametre: "",
  connexion: "",
  poids_kg: null,
  dimensions: "",
  fiche_technique_url: "",
  prix_defaut: null,
  prix_stand_by: null,
  prix_operation: null,
  prix_uc: null,
  prix_lih: null,
  prix_inspection: null,
  prix_restocking: null,
  prix_serrage: null,
  statut: "En stock",
  affaire_reservee_id: null,
};

export function CatalogueManager({
  outils,
  affaires,
  historique,
}: {
  outils: CatalogueOutil[];
  affaires: Pick<Affaire, "id" | "reference">[];
  historique: CatalogueHistorique[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<CatalogueOutil | null>(null);
  const [form, setForm] = useState<Partial<CatalogueOutil>>(EMPTY);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<CatalogueOutil["statut"] | "Tous">("Tous");
  const [historiqueFor, setHistoriqueFor] = useState<CatalogueOutil | null>(null);

  const affaireById = new Map(affaires.map((a) => [a.id, a]));
  const filtered = outils.filter(
    (o) =>
      `${o.designation} ${o.famille ?? ""} ${o.numero_article ?? ""}`.toLowerCase().includes(search.toLowerCase()) &&
      (statutFilter === "Tous" || o.statut === statutFilter),
  );

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(o: CatalogueOutil) {
    setEditing(o);
    setForm(o);
    setOpen(true);
  }

  function submit() {
    if (!form.designation) {
      showToast("La désignation est requise.");
      return;
    }
    startTransition(async () => {
      try {
        if (editing) {
          await updateOutil(editing.id, form);
        } else {
          await createOutil(form);
        }
        setOpen(false);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Supprimer cet outil du catalogue ?")) return;
    startTransition(async () => {
      try {
        await deleteOutil(id);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide text-navy">Catalogue outils</div>
      <div className="mb-6 text-[13.5px] text-text-muted">{outils.length} référence(s) enregistrée(s)</div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une désignation, famille, référence…"
          className="w-full max-w-[380px] rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
        />
        <button
          onClick={openCreate}
          className="whitespace-nowrap rounded-lg bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-dark"
        >
          + Nouvel outil
        </button>
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          onClick={() => setStatutFilter("Tous")}
          className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
            statutFilter === "Tous" ? "border-navy bg-navy text-white" : "border-border text-text-muted hover:bg-bg-sunken"
          }`}
        >
          Tous ({outils.length})
        </button>
        {CATALOGUE_STATUTS.map((s) => {
          const count = outils.filter((o) => o.statut === s).length;
          if (count === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setStatutFilter(s)}
              className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
                statutFilter === s ? "border-navy bg-navy text-white" : "border-border text-text-muted hover:bg-bg-sunken"
              }`}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>
      <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
        <table className="w-full min-w-[1080px] text-[13.5px]">
          <thead>
            <tr className="bg-bg-sunken">
              {["Famille", "Désignation", "N° article", "Diamètre", "Connexion", "Poids", "Prix (forfait)", "Statut", "Réservé pour", ""].map(
                (h) => (
                  <th key={h} className="border-b border-border px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-text-muted">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-bg-sunken/50">
                <td className="border-b border-border/60 px-3 py-2.5">{o.famille || "—"}</td>
                <td className="border-b border-border/60 px-3 py-2.5 font-medium">{o.designation}</td>
                <td className="border-b border-border/60 px-3 py-2.5">{o.numero_article || "—"}</td>
                <td className="border-b border-border/60 px-3 py-2.5">{o.diametre || "—"}</td>
                <td className="border-b border-border/60 px-3 py-2.5">{o.connexion || "—"}</td>
                <td className="border-b border-border/60 px-3 py-2.5">{o.poids_kg ? `${o.poids_kg} kg` : "—"}</td>
                <td className="border-b border-border/60 px-3 py-2.5">{o.prix_defaut ? fmtEUR(o.prix_defaut) : "—"}</td>
                <td className="border-b border-border/60 px-3 py-2.5">
                  <Badge label={o.statut} />
                </td>
                <td className="border-b border-border/60 px-3 py-2.5">
                  {o.affaire_reservee_id ? affaireById.get(o.affaire_reservee_id)?.reference ?? "—" : "—"}
                </td>
                <td className="border-b border-border/60 px-3 py-2.5 text-right">
                  <button onClick={() => setHistoriqueFor(o)} className="mr-2 text-blue hover:underline">
                    Historique
                  </button>
                  <button onClick={() => openEdit(o)} className="mr-2 text-blue hover:underline">
                    Modifier
                  </button>
                  <button onClick={() => remove(o.id)} className="text-danger hover:underline">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="p-8 text-center text-text-muted">
                  Aucun outil trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? "Modifier l'outil" : "Nouvel outil"} onClose={() => setOpen(false)} wide>
          <div className="grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1">
            <Field label="Famille" value={form.famille ?? ""} onChange={(v) => setForm({ ...form, famille: v })} />
            <Field
              label="Désignation"
              value={form.designation ?? ""}
              onChange={(v) => setForm({ ...form, designation: v })}
            />
            <Field
              label="N° article"
              value={form.numero_article ?? ""}
              onChange={(v) => setForm({ ...form, numero_article: v })}
            />
            <Field label="Diamètre" value={form.diametre ?? ""} onChange={(v) => setForm({ ...form, diametre: v })} />
            <Field label="Connexion" value={form.connexion ?? ""} onChange={(v) => setForm({ ...form, connexion: v })} />
            <Field
              label="Dimensions"
              value={form.dimensions ?? ""}
              onChange={(v) => setForm({ ...form, dimensions: v })}
            />
            <Field
              label="Poids (kg)"
              value={form.poids_kg?.toString() ?? ""}
              onChange={(v) => setForm({ ...form, poids_kg: v ? Number(v) : null })}
              type="number"
            />
            <Field
              label="Fiche technique (URL)"
              value={form.fiche_technique_url ?? ""}
              onChange={(v) => setForm({ ...form, fiche_technique_url: v })}
            />
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Statut</label>
              <select
                value={form.statut ?? "En stock"}
                onChange={(e) => setForm({ ...form, statut: e.target.value as CatalogueOutil["statut"] })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              >
                {CATALOGUE_STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Réservé pour l&apos;affaire</label>
              <select
                value={form.affaire_reservee_id ?? ""}
                onChange={(e) => setForm({ ...form, affaire_reservee_id: e.target.value || null })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              >
                <option value="">—</option>
                {affaires.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.reference}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-border/60 p-3.5">
            <div className="mb-2.5 text-[12.5px] font-semibold text-text-muted">
              💶 Price list — pré-remplit automatiquement la ligne équipement d&apos;un devis quand cette référence est liée
            </div>
            <div className="grid grid-cols-4 gap-3 max-[700px]:grid-cols-2">
              <Field
                label="Stand-By €/j"
                value={form.prix_stand_by?.toString() ?? ""}
                onChange={(v) => setForm({ ...form, prix_stand_by: v ? Number(v) : null })}
                type="number"
              />
              <Field
                label="Operation €/j"
                value={form.prix_operation?.toString() ?? ""}
                onChange={(v) => setForm({ ...form, prix_operation: v ? Number(v) : null })}
                type="number"
              />
              <Field
                label="UC €/item"
                value={form.prix_uc?.toString() ?? ""}
                onChange={(v) => setForm({ ...form, prix_uc: v ? Number(v) : null })}
                type="number"
              />
              <Field
                label="LIH/DBR €/item"
                value={form.prix_lih?.toString() ?? ""}
                onChange={(v) => setForm({ ...form, prix_lih: v ? Number(v) : null })}
                type="number"
              />
              <Field
                label="Inspection €"
                value={form.prix_inspection?.toString() ?? ""}
                onChange={(v) => setForm({ ...form, prix_inspection: v ? Number(v) : null })}
                type="number"
              />
              <Field
                label="Restocking €"
                value={form.prix_restocking?.toString() ?? ""}
                onChange={(v) => setForm({ ...form, prix_restocking: v ? Number(v) : null })}
                type="number"
              />
              <Field
                label="Serrage €"
                value={form.prix_serrage?.toString() ?? ""}
                onChange={(v) => setForm({ ...form, prix_serrage: v ? Number(v) : null })}
                type="number"
              />
              <Field
                label="Forfait €"
                value={form.prix_defaut?.toString() ?? ""}
                onChange={(v) => setForm({ ...form, prix_defaut: v ? Number(v) : null })}
                type="number"
              />
            </div>
          </div>

          <p className="mt-3 text-[11.5px] text-text-muted">
            Le statut se met normalement à jour tout seul (lien depuis un devis/la Tool List, ajout d&apos;un n° de
            BL...). Le forcer ici manuellement laisse une trace dans l&apos;historique.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-lg border border-border px-4 py-2 text-[13.5px] font-semibold hover:bg-bg-sunken">
              Annuler
            </button>
            <button
              onClick={submit}
              disabled={isPending}
              className="rounded-lg bg-navy px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
            >
              Enregistrer
            </button>
          </div>
        </Modal>
      )}

      {historiqueFor && (
        <Modal title={`Historique — ${historiqueFor.designation}`} onClose={() => setHistoriqueFor(null)}>
          <div className="flex flex-col gap-2.5">
            {historique
              .filter((h) => h.outil_id === historiqueFor.id)
              .map((h) => (
                <div key={h.id} className="rounded-lg border border-border p-3 text-[12.5px]">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-navy">
                      {h.ancien_statut ? `${h.ancien_statut} → ${h.nouveau_statut}` : h.nouveau_statut}
                    </div>
                    <div className="text-[11px] text-text-muted">{fmtDate(h.created_at)}</div>
                  </div>
                  {h.affaire_id && (
                    <div className="mt-0.5 text-[11.5px] text-text-muted">
                      Affaire : {affaireById.get(h.affaire_id)?.reference ?? h.affaire_id}
                    </div>
                  )}
                  {h.note && <div className="mt-0.5 text-[11.5px] text-text-muted">{h.note}</div>}
                </div>
              ))}
            {historique.filter((h) => h.outil_id === historiqueFor.id).length === 0 && (
              <div className="p-6 text-center text-text-muted">Aucun historique pour cet outil.</div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
      />
    </div>
  );
}
