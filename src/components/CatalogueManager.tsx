"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { bulkUpdateOutils, createOutil, deleteOutil, updateOutil } from "@/actions/catalogue";
import { Badge } from "@/components/Badge";
import { CatalogueImportModal } from "@/components/CatalogueImportModal";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { CATALOGUE_STATUTS } from "@/lib/company";
import { fmtDate, fmtEUR } from "@/lib/format";
import type { Affaire, CatalogueHistorique, CatalogueOutil } from "@/lib/types";

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
  serie: "",
  modele: "",
  max_catch_spiral: "",
  max_catch_basket: "",
  grapple: "",
  cutting_range_csg: "",
  connexion_top_sub: "",
  od_fn_top_sub: "",
  lg_fn_top_sub: "",
  lg_top_sub: "",
  diametre_duse: "",
  largeur: "",
  diametre_ouverture: "",
  csg_to_cut: "",
  rechargement: "",
  numero_set: "",
  stabilisee: "",
  profil: "",
  non_mag_steel: "",
  blade: "",
  od_blades: "",
  nombre_blade: "",
  longueur_rechargement_attaques: "",
  inclinaison_blade: "",
  nominal_catch_size: "",
  ca: "",
  duty_class: "",
  od_mandrel: "",
  reference_associee: "",
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

// Turns a diamètre string ("12-1/8", "3-3/4", "7", "3/4") into a sortable
// number — plain string sort would put "12-1/8" before "3-3/4" (lexical:
// '1' < '3'), which is exactly the ordering bug reported on the Economill
// list. Unparseable/empty values sort to the end rather than crashing.
function diametreValue(s: string | null | undefined): number {
  if (!s) return Infinity;
  const cleaned = s.trim().replace(/"/g, "");
  const [wholePart, fracPart] = cleaned.includes("-") ? cleaned.split("-") : [null, cleaned];
  let value = 0;
  if (wholePart) value += parseFloat(wholePart) || 0;
  if (fracPart) {
    if (fracPart.includes("/")) {
      const [num, den] = fracPart.split("/").map(Number);
      if (den) value += num / den;
    } else {
      value += parseFloat(fracPart) || 0;
    }
  }
  return Number.isFinite(value) ? value : Infinity;
}

// Which extra fields the edit form shows depends on the Type typed in — a
// Bumper Sub has nothing to do with a PDM's rotor/stator, so keeping every
// family's specific fields always visible just clutters the form. Matched
// by keyword against the Type field, but a group also stays visible if any
// of its fields already holds data (so existing imported records — e.g. an
// old row whose Type doesn't match a known keyword — never lose access to
// their own values).
const FAMILLE_SPECIFIC_FIELDS: { match: RegExp; keys: (keyof CatalogueOutil)[] }[] = [
  { match: /pdm|moteur/i, keys: ["numero_serie_stator", "numero_serie_rotor", "rotor_matiere", "lobes", "stage"] },
  { match: /economill|mill|surforage/i, keys: ["stabilisee", "rechargement", "profil"] },
  { match: /bumper/i, keys: ["stroke", "logan_assy_numero", "bowen_assy_numero"] },
  { match: /overshot/i, keys: ["serie", "modele", "bowen_assy_numero", "max_catch_spiral", "max_catch_basket", "grapple"] },
  {
    match: /pipe cutter|hydraulic cutter/i,
    keys: ["serie", "cutting_range_csg", "connexion_top_sub", "diametre_top_sub", "od_fn_top_sub", "lg_fn_top_sub", "lg_top_sub", "diametre_duse"],
  },
  {
    match: /set of cutters|set cutters/i,
    keys: ["serie", "modele", "largeur", "diametre_ouverture", "csg_to_cut", "rechargement", "numero_set"],
  },
  {
    match: /string stab/i,
    keys: ["modele", "non_mag_steel", "blade", "od_blades", "profil", "rechargement", "nombre_blade", "longueur_rechargement_attaques", "inclinaison_blade"],
  },
  {
    match: /spear|bull nose/i,
    keys: ["nominal_catch_size", "ca", "duty_class", "grapple", "od_mandrel", "modele", "reference_associee"],
  },
];

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

  // Per-field, not per-group: a field like bowen_assy_numero is shared by
  // both Bumper Sub and Overshot, so "any field in the group has data"
  // used to reveal the whole Overshot group (Série/Max catch/Grapple...)
  // on a Bumper Sub just because it had a Bowen Assy N° filled in. Falling
  // back per field instead keeps the legacy-data safety net (an old row
  // never loses access to a value it already holds) without leaking a
  // sibling family's unrelated fields in.
  const visibleSpecificFields = new Set<string>();
  const allSpecificKeys = new Set<string>();
  for (const group of FAMILLE_SPECIFIC_FIELDS) {
    for (const k of group.keys) allSpecificKeys.add(k);
    if (group.match.test(form.famille ?? "")) group.keys.forEach((k) => visibleSpecificFields.add(k));
  }
  for (const k of allSpecificKeys) {
    if ((form as Record<string, unknown>)[k]) visibleSpecificFields.add(k);
  }

  // Sous-menu : sélectionner une catégorie (ex. "Fraisage / Surforage")
  // révèle ses familles (ex. "Economill", "Junk Mill"...) pour filtrer plus
  // finement, sans avoir à connaître la famille exacte à l'avance.
  const categories = Array.from(new Set(outils.map((o) => o.categorie).filter((c): c is string => !!c))).sort();
  const famillesInCategorie =
    categorieFilter === "Tous"
      ? []
      : Array.from(new Set(outils.filter((o) => o.categorie === categorieFilter).map((o) => o.famille).filter((f): f is string => !!f))).sort();
  // Toutes les familles/types tous confondus — pour le filtre direct qui
  // ne demande pas de choisir une catégorie parente au préalable.
  const allFamilles = Array.from(new Set(outils.map((o) => o.famille).filter((f): f is string => !!f))).sort();

  const filtered = outils
    .filter(
      (o) =>
        `${o.designation} ${o.categorie ?? ""} ${o.famille ?? ""} ${o.numero_article ?? ""} ${o.numero_serie ?? ""} ${o.commentaire ?? ""}`.toLowerCase().includes(search.toLowerCase()) &&
        (statutFilter === "Tous" || o.statut === statutFilter) &&
        (categorieFilter === "Tous" || o.categorie === categorieFilter) &&
        (familleFilter === "Toutes" || o.famille === familleFilter),
    )
    .sort((a, b) => {
      const catCompare = (a.categorie ?? "").localeCompare(b.categorie ?? "");
      if (catCompare !== 0) return catCompare;
      const famCompare = (a.famille ?? "").localeCompare(b.famille ?? "");
      if (famCompare !== 0) return famCompare;
      const diamCompare = diametreValue(a.diametre) - diametreValue(b.diametre);
      if (diamCompare !== 0) return diamCompare;
      return a.designation.localeCompare(b.designation);
    });

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
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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
          <div className="pl-4">
            <select
              value={familleFilter}
              onChange={(e) => setFamilleFilter(e.target.value)}
              className="rounded-lg border border-border px-2.5 py-1 text-[12px] focus:border-blue focus:outline-none"
            >
              <option value="Toutes">{categorieFilter === "Tous" ? "Tous les types" : "Tous types"}</option>
              {(categorieFilter === "Tous" ? allFamilles : famillesInCategorie).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
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
            <div>
              <Field label="Type" value={form.famille ?? ""} onChange={(v) => setForm({ ...form, famille: v })} />
              <p className="mt-1 text-[11px] text-text-muted">Les champs spécifiques (Stator/Rotor, Stroke…) s&apos;affichent selon le Type saisi.</p>
            </div>
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
            {visibleSpecificFields.has("numero_serie_stator") && (
              <Field
                label="N° série Stator"
                value={form.numero_serie_stator ?? ""}
                onChange={(v) => setForm({ ...form, numero_serie_stator: v })}
              />
            )}
            {visibleSpecificFields.has("numero_serie_rotor") && (
              <Field
                label="N° série Rotor"
                value={form.numero_serie_rotor ?? ""}
                onChange={(v) => setForm({ ...form, numero_serie_rotor: v })}
              />
            )}
            {visibleSpecificFields.has("rotor_matiere") && (
              <Field label="Rotor (matière)" value={form.rotor_matiere ?? ""} onChange={(v) => setForm({ ...form, rotor_matiere: v })} />
            )}
            {visibleSpecificFields.has("lobes") && (
              <Field label="Lobes" value={form.lobes ?? ""} onChange={(v) => setForm({ ...form, lobes: v })} />
            )}
            {visibleSpecificFields.has("stage") && (
              <Field label="Stage" value={form.stage ?? ""} onChange={(v) => setForm({ ...form, stage: v })} />
            )}
            {visibleSpecificFields.has("stroke") && (
              <Field label="Stroke" value={form.stroke ?? ""} onChange={(v) => setForm({ ...form, stroke: v })} />
            )}
            {visibleSpecificFields.has("logan_assy_numero") && (
              <Field
                label="Logan Assy N°"
                value={form.logan_assy_numero ?? ""}
                onChange={(v) => setForm({ ...form, logan_assy_numero: v })}
              />
            )}
            {visibleSpecificFields.has("bowen_assy_numero") && (
              <Field
                label="Bowen Assy N°"
                value={form.bowen_assy_numero ?? ""}
                onChange={(v) => setForm({ ...form, bowen_assy_numero: v })}
              />
            )}
            {visibleSpecificFields.has("serie") && (
              <Field label="Série" value={form.serie ?? ""} onChange={(v) => setForm({ ...form, serie: v })} />
            )}
            {visibleSpecificFields.has("modele") && (
              <Field label="Type (modèle)" value={form.modele ?? ""} onChange={(v) => setForm({ ...form, modele: v })} />
            )}
            {visibleSpecificFields.has("non_mag_steel") && (
              <Field label="Non Mag / Steel" value={form.non_mag_steel ?? ""} onChange={(v) => setForm({ ...form, non_mag_steel: v })} />
            )}
            {visibleSpecificFields.has("blade") && (
              <Field label="Blade" value={form.blade ?? ""} onChange={(v) => setForm({ ...form, blade: v })} />
            )}
            {visibleSpecificFields.has("od_blades") && (
              <Field label="OD Blades" value={form.od_blades ?? ""} onChange={(v) => setForm({ ...form, od_blades: v })} />
            )}
            {visibleSpecificFields.has("nombre_blade") && (
              <Field label="Nombre blade" value={form.nombre_blade ?? ""} onChange={(v) => setForm({ ...form, nombre_blade: v })} />
            )}
            {visibleSpecificFields.has("longueur_rechargement_attaques") && (
              <Field
                label="Lg rechargement attaques"
                value={form.longueur_rechargement_attaques ?? ""}
                onChange={(v) => setForm({ ...form, longueur_rechargement_attaques: v })}
              />
            )}
            {visibleSpecificFields.has("inclinaison_blade") && (
              <Field
                label="Inclinaison blade°"
                value={form.inclinaison_blade ?? ""}
                onChange={(v) => setForm({ ...form, inclinaison_blade: v })}
              />
            )}
            {visibleSpecificFields.has("nominal_catch_size") && (
              <Field
                label="Nominal Catch Size"
                value={form.nominal_catch_size ?? ""}
                onChange={(v) => setForm({ ...form, nominal_catch_size: v })}
              />
            )}
            {visibleSpecificFields.has("ca") && (
              <Field label="CA" value={form.ca ?? ""} onChange={(v) => setForm({ ...form, ca: v })} />
            )}
            {visibleSpecificFields.has("duty_class") && (
              <Field label="Duty Class" value={form.duty_class ?? ""} onChange={(v) => setForm({ ...form, duty_class: v })} />
            )}
            {visibleSpecificFields.has("od_mandrel") && (
              <Field label="OD mandrel" value={form.od_mandrel ?? ""} onChange={(v) => setForm({ ...form, od_mandrel: v })} />
            )}
            {visibleSpecificFields.has("reference_associee") && (
              <Field
                label="Référence associée (monté sur)"
                value={form.reference_associee ?? ""}
                onChange={(v) => setForm({ ...form, reference_associee: v })}
              />
            )}
            {visibleSpecificFields.has("max_catch_spiral") && (
              <Field
                label="Max catch Spiral"
                value={form.max_catch_spiral ?? ""}
                onChange={(v) => setForm({ ...form, max_catch_spiral: v })}
              />
            )}
            {visibleSpecificFields.has("max_catch_basket") && (
              <Field
                label="Max catch Basket"
                value={form.max_catch_basket ?? ""}
                onChange={(v) => setForm({ ...form, max_catch_basket: v })}
              />
            )}
            {visibleSpecificFields.has("grapple") && (
              <Field label="Grapple" value={form.grapple ?? ""} onChange={(v) => setForm({ ...form, grapple: v })} />
            )}
            {visibleSpecificFields.has("cutting_range_csg") && (
              <Field
                label="Cutting range csg"
                value={form.cutting_range_csg ?? ""}
                onChange={(v) => setForm({ ...form, cutting_range_csg: v })}
              />
            )}
            {visibleSpecificFields.has("diametre_duse") && (
              <Field label="Diamètre duse" value={form.diametre_duse ?? ""} onChange={(v) => setForm({ ...form, diametre_duse: v })} />
            )}
            {visibleSpecificFields.has("numero_set") && (
              <Field label="N° de Set" value={form.numero_set ?? ""} onChange={(v) => setForm({ ...form, numero_set: v })} />
            )}
            {visibleSpecificFields.has("largeur") && (
              <Field label="Largeur" value={form.largeur ?? ""} onChange={(v) => setForm({ ...form, largeur: v })} />
            )}
            {visibleSpecificFields.has("diametre_ouverture") && (
              <Field
                label="Diamètre ouverture"
                value={form.diametre_ouverture ?? ""}
                onChange={(v) => setForm({ ...form, diametre_ouverture: v })}
              />
            )}
            {visibleSpecificFields.has("csg_to_cut") && (
              <Field label="Csg to cut" value={form.csg_to_cut ?? ""} onChange={(v) => setForm({ ...form, csg_to_cut: v })} />
            )}
            {visibleSpecificFields.has("rechargement") && (
              <Field label="Rechargement" value={form.rechargement ?? ""} onChange={(v) => setForm({ ...form, rechargement: v })} />
            )}
            <Field label="Diamètre (OD)" value={form.diametre ?? ""} onChange={(v) => setForm({ ...form, diametre: v })} />
            <Field
              label="Diamètre intérieur (ID)"
              value={form.diametre_interieur ?? ""}
              onChange={(v) => setForm({ ...form, diametre_interieur: v })}
            />
            {visibleSpecificFields.has("diametre_top_sub") && (
              <Field
                label="OD top sub"
                value={form.diametre_top_sub ?? ""}
                onChange={(v) => setForm({ ...form, diametre_top_sub: v })}
              />
            )}
            {visibleSpecificFields.has("diametre_interieur_top_sub") && (
              <Field
                label="ID top sub"
                value={form.diametre_interieur_top_sub ?? ""}
                onChange={(v) => setForm({ ...form, diametre_interieur_top_sub: v })}
              />
            )}
            {visibleSpecificFields.has("connexion_top_sub") && (
              <Field
                label="Conn top sub"
                value={form.connexion_top_sub ?? ""}
                onChange={(v) => setForm({ ...form, connexion_top_sub: v })}
              />
            )}
            {visibleSpecificFields.has("od_fn_top_sub") && (
              <Field label="OD FN top sub" value={form.od_fn_top_sub ?? ""} onChange={(v) => setForm({ ...form, od_fn_top_sub: v })} />
            )}
            {visibleSpecificFields.has("lg_fn_top_sub") && (
              <Field label="LG FN top sub" value={form.lg_fn_top_sub ?? ""} onChange={(v) => setForm({ ...form, lg_fn_top_sub: v })} />
            )}
            {visibleSpecificFields.has("lg_top_sub") && (
              <Field label="LG top sub" value={form.lg_top_sub ?? ""} onChange={(v) => setForm({ ...form, lg_top_sub: v })} />
            )}
            <Field label="Connexion (haut)" value={form.connexion ?? ""} onChange={(v) => setForm({ ...form, connexion: v })} />
            <Field
              label="Connexion (bas)"
              value={form.connexion_bas ?? ""}
              onChange={(v) => setForm({ ...form, connexion_bas: v })}
            />
            {visibleSpecificFields.has("tailles_lames") && (
              <Field
                label="Tailles lames"
                value={form.tailles_lames ?? ""}
                onChange={(v) => setForm({ ...form, tailles_lames: v })}
              />
            )}
            {visibleSpecificFields.has("stabilisee") && (
              <Field label="Stabilisée" value={form.stabilisee ?? ""} onChange={(v) => setForm({ ...form, stabilisee: v })} />
            )}
            {visibleSpecificFields.has("profil") && (
              <Field label="Profil" value={form.profil ?? ""} onChange={(v) => setForm({ ...form, profil: v })} />
            )}
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
          {(() => {
            const hFor = historique.filter((h) => h.outil_id === historiqueFor.id);
            const countTo = (statut: string) => hFor.filter((h) => h.nouveau_statut === statut).length;
            const nbAffaires = new Set(hFor.filter((h) => h.affaire_id).map((h) => h.affaire_id)).size;
            return (
              <div className="mb-4 grid grid-cols-4 gap-2.5 max-[560px]:grid-cols-2">
                <StatTile label="Sur chantier" value={countTo("Sur chantier")} />
                <StatTile label="Inspections" value={countTo("En attente d'inspection")} />
                <StatTile label="Réservations" value={countTo("Réservé")} />
                <StatTile label="Affaires distinctes" value={nbAffaires} />
              </div>
            );
          })()}
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

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-bg-sunken p-2.5 text-center">
      <div className="font-mono text-[18px] font-semibold text-navy">{value}</div>
      <div className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">{label}</div>
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
