"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addCatalogueAccessoire, bulkUpdateOutils, createOutil, deleteOutil, removeCatalogueAccessoire, updateOutil } from "@/actions/catalogue";
import { Badge } from "@/components/Badge";
import { CatalogueImportModal } from "@/components/CatalogueImportModal";
import { Modal } from "@/components/Modal";
import { OutilPicker } from "@/components/OutilPicker";
import { useToast } from "@/components/Toast";
import { CATALOGUE_STATUTS } from "@/lib/company";
import { fmtDate, fmtEUR } from "@/lib/format";
import type { Affaire, CatalogueAccessoire, CatalogueHistorique, CatalogueOutil } from "@/lib/types";

const EMPTY: Partial<CatalogueOutil> = {
  categorie: "",
  famille: "",
  designation: "",
  numero_article: "",
  numero_serie: "",
  numero_serie_stator: "",
  numero_serie_rotor: "",
  lobes: "",
  stage: "",
  rotor_matiere: "",
  stroke: "",
  logan_assy_numero: "",
  bowen_assy_numero: "",
  diametre: "",
  diametre_interieur: "",
  diametre_top_sub: "",
  diametre_interieur_top_sub: "",
  connexion: "",
  connexion_bas: "",
  poids_kg: null,
  dimensions: "",
  tailles_lames: "",
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
  commentaire: "",
};

// Fields offered in the multi-select bulk-edit bar — the ones most likely
// to need setting the same way across a batch of tools at once (e.g.
// tagging a Famille on every Economill imported from a CSV).
const BULK_FIELDS: { key: "categorie" | "famille" | "statut" | "connexion" | "connexion_bas" | "diametre"; label: string }[] = [
  { key: "categorie", label: "Famille" },
  { key: "famille", label: "Type" },
  { key: "statut", label: "Statut" },
  { key: "connexion", label: "Connexion (haut)" },
  { key: "connexion_bas", label: "Connexion (bas)" },
  { key: "diametre", label: "Diamètre (OD)" },
];

export function CatalogueManager({
  outils,
  affaires,
  historique,
  accessoires,
}: {
  outils: CatalogueOutil[];
  affaires: Pick<Affaire, "id" | "reference">[];
  historique: CatalogueHistorique[];
  accessoires: CatalogueAccessoire[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<CatalogueOutil | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [form, setForm] = useState<Partial<CatalogueOutil>>(EMPTY);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<CatalogueOutil["statut"] | "Tous">("Tous");
  const [categorieFilter, setCategorieFilter] = useState<string>("Tous");
  const [familleFilter, setFamilleFilter] = useState<string>("Toutes");
  const [historiqueFor, setHistoriqueFor] = useState<CatalogueOutil | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkField, setBulkField] = useState<(typeof BULK_FIELDS)[number]["key"]>("categorie");
  const [bulkValue, setBulkValue] = useState("");

  const affaireById = new Map(affaires.map((a) => [a.id, a]));
  const outilById = new Map(outils.map((o) => [o.id, o]));

  // Sous-menu : sélectionner une catégorie (ex. "Fraisage / Surforage")
  // révèle ses familles (ex. "Economill", "Junk Mill"...) pour filtrer plus
  // finement, sans avoir à connaître la famille exacte à l'avance.
  const categories = Array.from(new Set(outils.map((o) => o.categorie).filter((c): c is string => !!c))).sort();
  const famillesInCategorie =
    categorieFilter === "Tous"
      ? []
      : Array.from(new Set(outils.filter((o) => o.categorie === categorieFilter).map((o) => o.famille).filter((f): f is string => !!f))).sort();

  const filtered = outils.filter(
    (o) =>
      `${o.designation} ${o.categorie ?? ""} ${o.famille ?? ""} ${o.numero_article ?? ""} ${o.numero_serie ?? ""} ${o.commentaire ?? ""}`.toLowerCase().includes(search.toLowerCase()) &&
      (statutFilter === "Tous" || o.statut === statutFilter) &&
      (categorieFilter === "Tous" || o.categorie === categorieFilter) &&
      (familleFilter === "Toutes" || o.famille === familleFilter),
  );

  function openCreate() {
    setEditing(null);
    setDuplicating(false);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(o: CatalogueOutil) {
    setEditing(o);
    setDuplicating(false);
    setForm(o);
    setOpen(true);
  }

  // Copies every field (designation, dimensions, full price list...) except
  // the reference/statut/réservation, which are specific to one physical
  // unit — for the common case of several identical tools that only differ
  // by N° article, this saves retyping the whole sheet each time.
  function openDuplicate(o: CatalogueOutil) {
    setEditing(null);
    setDuplicating(true);
    setForm({ ...o, id: undefined, numero_article: "", statut: "En stock", affaire_reservee_id: null });
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

  function addAccessoire(accessoireId: string | null) {
    if (!editing || !accessoireId) return;
    startTransition(async () => {
      try {
        await addCatalogueAccessoire(editing.id, accessoireId);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'ajout.");
      }
    });
  }

  function removeAccessoire(id: string) {
    startTransition(async () => {
      try {
        await removeCatalogueAccessoire(id);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  function toggleSelectMode() {
    setSelectMode((v) => !v);
    setSelected(new Set());
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === filtered.length ? new Set() : new Set(filtered.map((o) => o.id))));
  }

  function applyBulkEdit() {
    if (!selected.size || !bulkValue.trim()) return;
    startTransition(async () => {
      try {
        const count = await bulkUpdateOutils(Array.from(selected), { [bulkField]: bulkValue.trim() });
        showToast(`${count} outil(s) mis à jour.`);
        setSelected(new Set());
        setBulkValue("");
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la mise à jour groupée.");
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
        <button
          onClick={() => setImportOpen(true)}
          className="whitespace-nowrap rounded-lg border border-border px-4 py-2.5 text-[13.5px] font-semibold hover:bg-bg-sunken"
        >
          📥 Importer CSV
        </button>
        <button
          onClick={toggleSelectMode}
          className={`whitespace-nowrap rounded-lg border px-4 py-2.5 text-[13.5px] font-semibold ${
            selectMode ? "border-navy bg-navy text-white" : "border-border hover:bg-bg-sunken"
          }`}
        >
          ☑️ Mode sélectif
        </button>
      </div>
      {selectMode && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-navy/30 bg-navy/5 px-3.5 py-2.5">
          <span className="text-[12.5px] font-semibold text-navy">{selected.size} sélectionné(s)</span>
          <select
            value={bulkField}
            onChange={(e) => setBulkField(e.target.value as (typeof BULK_FIELDS)[number]["key"])}
            className="rounded border border-border px-2 py-1.5 text-[12.5px]"
          >
            {BULK_FIELDS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
          {bulkField === "statut" ? (
            <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} className="rounded border border-border px-2 py-1.5 text-[12.5px]">
              <option value="">— Choisir —</option>
              {CATALOGUE_STATUTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              placeholder="Nouvelle valeur…"
              list={bulkField === "categorie" ? "catalogue-categories" : undefined}
              className="rounded border border-border px-2 py-1.5 text-[12.5px]"
            />
          )}
          <button
            onClick={applyBulkEdit}
            disabled={!selected.size || !bulkValue.trim() || isPending}
            className="rounded-lg bg-navy px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
          >
            Appliquer à {selected.size} outil(s)
          </button>
          {selected.size > 0 && (
            <button onClick={() => setSelected(new Set())} className="text-[12.5px] text-text-muted hover:underline">
              Annuler la sélection
            </button>
          )}
        </div>
      )}
      {categories.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          <button
            onClick={() => {
              setCategorieFilter("Tous");
              setFamilleFilter("Toutes");
            }}
            className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
              categorieFilter === "Tous" ? "border-navy bg-navy text-white" : "border-border text-text-muted hover:bg-bg-sunken"
            }`}
          >
            Toutes familles
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCategorieFilter(c);
                setFamilleFilter("Toutes");
              }}
              className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
                categorieFilter === c ? "border-navy bg-navy text-white" : "border-border text-text-muted hover:bg-bg-sunken"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      {famillesInCategorie.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5 pl-4">
          <button
            onClick={() => setFamilleFilter("Toutes")}
            className={`rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold ${
              familleFilter === "Toutes" ? "border-blue bg-blue/10 text-blue" : "border-border text-text-muted hover:bg-bg-sunken"
            }`}
          >
            Tous types
          </button>
          {famillesInCategorie.map((f) => (
            <button
              key={f}
              onClick={() => setFamilleFilter(f)}
              className={`rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold ${
                familleFilter === f ? "border-blue bg-blue/10 text-blue" : "border-border text-text-muted hover:bg-bg-sunken"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}
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
              {selectMode && (
                <th className="border-b border-border px-3 py-2.5 text-left">
                  <input type="checkbox" checked={selected.size > 0 && selected.size === filtered.length} onChange={toggleSelectAll} />
                </th>
              )}
              {["Famille", "Type", "Désignation", "N° série", "Diamètre (OD)", "Diamètre int. (ID)", "Connexion", "Poids", "Prix (forfait)", "Statut", "Réservé pour", ""].map(
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
                {selectMode && (
                  <td className="border-b border-border/60 px-3 py-2.5">
                    <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelected(o.id)} />
                  </td>
                )}
                <td className="border-b border-border/60 px-3 py-2.5">{o.categorie || "—"}</td>
                <td className="border-b border-border/60 px-3 py-2.5">{o.famille || "—"}</td>
                <td className="border-b border-border/60 px-3 py-2.5 font-medium">{o.designation}</td>
                <td className="border-b border-border/60 px-3 py-2.5">{o.numero_serie || "—"}</td>
                <td className="border-b border-border/60 px-3 py-2.5">{o.diametre || "—"}</td>
                <td className="border-b border-border/60 px-3 py-2.5">{o.diametre_interieur || "—"}</td>
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
                  <button onClick={() => openDuplicate(o)} className="mr-2 text-blue hover:underline">
                    Dupliquer
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
                <td colSpan={selectMode ? 13 : 12} className="p-8 text-center text-text-muted">
                  Aucun outil trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? "Modifier l'outil" : duplicating ? "Dupliquer l'outil" : "Nouvel outil"} onClose={() => setOpen(false)} wide>
          <div className="grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1">
            <Field
              label="Famille"
              value={form.categorie ?? ""}
              onChange={(v) => setForm({ ...form, categorie: v })}
              list="catalogue-categories"
            />
            <datalist id="catalogue-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <Field label="Type" value={form.famille ?? ""} onChange={(v) => setForm({ ...form, famille: v })} />
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
            <Field
              label="N° de série"
              value={form.numero_serie ?? ""}
              onChange={(v) => setForm({ ...form, numero_serie: v })}
            />
            <Field
              label="N° série Stator"
              value={form.numero_serie_stator ?? ""}
              onChange={(v) => setForm({ ...form, numero_serie_stator: v })}
            />
            <Field
              label="N° série Rotor"
              value={form.numero_serie_rotor ?? ""}
              onChange={(v) => setForm({ ...form, numero_serie_rotor: v })}
            />
            <Field label="Rotor (matière)" value={form.rotor_matiere ?? ""} onChange={(v) => setForm({ ...form, rotor_matiere: v })} />
            <Field label="Lobes" value={form.lobes ?? ""} onChange={(v) => setForm({ ...form, lobes: v })} />
            <Field label="Stage" value={form.stage ?? ""} onChange={(v) => setForm({ ...form, stage: v })} />
            <Field label="Stroke" value={form.stroke ?? ""} onChange={(v) => setForm({ ...form, stroke: v })} />
            <Field
              label="Logan Assy N°"
              value={form.logan_assy_numero ?? ""}
              onChange={(v) => setForm({ ...form, logan_assy_numero: v })}
            />
            <Field
              label="Bowen Assy N°"
              value={form.bowen_assy_numero ?? ""}
              onChange={(v) => setForm({ ...form, bowen_assy_numero: v })}
            />
            <Field label="Diamètre (OD)" value={form.diametre ?? ""} onChange={(v) => setForm({ ...form, diametre: v })} />
            <Field
              label="Diamètre intérieur (ID)"
              value={form.diametre_interieur ?? ""}
              onChange={(v) => setForm({ ...form, diametre_interieur: v })}
            />
            <Field
              label="OD top sub"
              value={form.diametre_top_sub ?? ""}
              onChange={(v) => setForm({ ...form, diametre_top_sub: v })}
            />
            <Field
              label="ID top sub"
              value={form.diametre_interieur_top_sub ?? ""}
              onChange={(v) => setForm({ ...form, diametre_interieur_top_sub: v })}
            />
            <Field label="Connexion (haut)" value={form.connexion ?? ""} onChange={(v) => setForm({ ...form, connexion: v })} />
            <Field
              label="Connexion (bas)"
              value={form.connexion_bas ?? ""}
              onChange={(v) => setForm({ ...form, connexion_bas: v })}
            />
            <Field
              label="Tailles lames"
              value={form.tailles_lames ?? ""}
              onChange={(v) => setForm({ ...form, tailles_lames: v })}
            />
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

          {editing && (
            <div className="mt-4 rounded-lg border border-border/60 p-3.5">
              <div className="mb-2.5 text-[12.5px] font-semibold text-text-muted">
                🔗 Pièces associées — ajoutées automatiquement dans le devis et la Tool List dès que cette référence
                y est liée (ex. pour un Moteur : Rotor + Stator de la power section)
              </div>
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {accessoires
                  .filter((a) => a.outil_id === editing.id)
                  .map((a) => {
                    const acc = outilById.get(a.accessoire_id);
                    return (
                      <span
                        key={a.id}
                        className="flex items-center gap-1.5 rounded-full border border-border bg-bg-sunken px-2.5 py-1 text-[12px] text-text-dark"
                      >
                        {acc ? `${acc.designation}${acc.numero_article ? ` (${acc.numero_article})` : ""}` : "Référence supprimée"}
                        <button type="button" onClick={() => removeAccessoire(a.id)} className="text-danger hover:underline">
                          ✕
                        </button>
                      </span>
                    );
                  })}
                {accessoires.filter((a) => a.outil_id === editing.id).length === 0 && (
                  <span className="text-[12px] text-text-muted">Aucune pièce associée.</span>
                )}
              </div>
              <OutilPicker
                outils={outils.filter((o) => o.id !== editing.id && !accessoires.some((a) => a.outil_id === editing.id && a.accessoire_id === o.id))}
                value={null}
                onSelect={addAccessoire}
              />
            </div>
          )}

          <div className="mt-4">
            <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Commentaire</label>
            <textarea
              value={form.commentaire ?? ""}
              onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
              rows={2}
              placeholder="Remarques, particularités, rappels de préparation…"
              className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
            />
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

      {importOpen && <CatalogueImportModal onClose={() => setImportOpen(false)} />}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  list,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  list?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={list}
        className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
      />
    </div>
  );
}
