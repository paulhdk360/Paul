"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bulkCreateOutils } from "@/actions/catalogue";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { parseCsv, parseFrenchNumber } from "@/lib/csv";
import type { CatalogueOutil } from "@/lib/types";

type FieldKey =
  | "designation"
  | "categorie"
  | "famille"
  | "numero_article"
  | "numero_serie"
  | "numero_serie_stator"
  | "numero_serie_rotor"
  | "diametre_interieur"
  | "diametre"
  | "diametre_interieur_top_sub"
  | "diametre_top_sub"
  | "connexion_bas"
  | "connexion"
  | "tailles_lames"
  | "lobes"
  | "stage"
  | "rotor_matiere"
  | "poids_kg"
  | "dimensions"
  | "prix_stand_by"
  | "prix_operation"
  | "prix_uc"
  | "prix_lih"
  | "prix_inspection"
  | "prix_restocking"
  | "prix_serrage"
  | "prix_defaut"
  | "commentaire";

interface FieldDef {
  key: FieldKey;
  label: string;
  type: "text" | "number";
  keywords: string[];
}

// Order matters for auto-mapping: each header is claimed by the first field
// (in this order) whose keywords match, so more specific fields — e.g.
// "diamètre intérieur" — must come before the generic "diamètre" they'd
// otherwise also match.
const FIELDS: FieldDef[] = [
  { key: "designation", label: "Désignation *", type: "text", keywords: ["designation", "nom", "libelle"] },
  { key: "categorie", label: "Famille", type: "text", keywords: ["categorie", "category"] },
  { key: "famille", label: "Type", type: "text", keywords: ["famille"] },
  { key: "numero_article", label: "N° article", type: "text", keywords: ["numero article", "n article", "reference", "code article"] },
  { key: "numero_serie", label: "N° de série", type: "text", keywords: ["numero de serie", "n serie", "s/n", " sn "] },
  { key: "numero_serie_stator", label: "N° série Stator", type: "text", keywords: ["sn stator", "numero serie stator"] },
  { key: "numero_serie_rotor", label: "N° série Rotor", type: "text", keywords: ["sn rotor", "numero serie rotor"] },
  { key: "lobes", label: "Lobes", type: "text", keywords: ["lobes", "lobe"] },
  { key: "stage", label: "Stage", type: "text", keywords: ["stage"] },
  { key: "rotor_matiere", label: "Rotor (matière)", type: "text", keywords: ["rotor"] },
  { key: "diametre_interieur_top_sub", label: "ID top sub", type: "text", keywords: ["id top sub", "top sub id"] },
  { key: "diametre_top_sub", label: "OD top sub", type: "text", keywords: ["od top sub", "top sub od"] },
  { key: "diametre_interieur", label: "Diamètre intérieur (ID)", type: "text", keywords: ["diametre interieur", "diam interieur", "diam int", "id"] },
  { key: "diametre", label: "Diamètre (OD)", type: "text", keywords: ["diametre", "od"] },
  { key: "connexion_bas", label: "Connexion (bas)", type: "text", keywords: ["conn down", "connexion down", "conn bas", "connexion bas"] },
  { key: "connexion", label: "Connexion (haut)", type: "text", keywords: ["conn up", "connexion up", "connexion", "connection", "conn"] },
  { key: "tailles_lames", label: "Tailles lames", type: "text", keywords: ["lames", "blade"] },
  { key: "poids_kg", label: "Poids (kg)", type: "number", keywords: ["poids", "weight"] },
  { key: "dimensions", label: "Dimensions", type: "text", keywords: ["dimensions"] },
  { key: "prix_stand_by", label: "Prix Stand-By €/j", type: "number", keywords: ["stand by", "standby", "stand-by"] },
  { key: "prix_operation", label: "Prix Operation €/j", type: "number", keywords: ["operation"] },
  { key: "prix_uc", label: "Prix UC €/item", type: "number", keywords: ["uc"] },
  { key: "prix_lih", label: "Prix LIH/DBR €/item", type: "number", keywords: ["lih", "dbr"] },
  { key: "prix_inspection", label: "Prix Inspection €", type: "number", keywords: ["inspection"] },
  { key: "prix_restocking", label: "Prix Restocking €", type: "number", keywords: ["restocking"] },
  { key: "prix_serrage", label: "Prix Serrage €", type: "number", keywords: ["serrage"] },
  { key: "prix_defaut", label: "Prix Forfait €", type: "number", keywords: ["forfait"] },
  { key: "commentaire", label: "Commentaire", type: "text", keywords: ["commentaire", "remarque", "note", "observation"] },
];

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function guessMapping(headers: string[]): Record<FieldKey, number | null> {
  const used = new Set<number>();
  const mapping = {} as Record<FieldKey, number | null>;
  for (const field of FIELDS) {
    const idx = headers.findIndex((h, i) => !used.has(i) && field.keywords.some((k) => normalize(h).includes(k)));
    mapping[field.key] = idx === -1 ? null : idx;
    if (idx !== -1) used.add(idx);
  }
  return mapping;
}

export function CatalogueImportModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [rows, setRows] = useState<string[][] | null>(null);
  const [mapping, setMapping] = useState<Record<FieldKey, number | null> | null>(null);
  const [importing, setImporting] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ""));
      if (parsed.length < 2) {
        showToast("Fichier vide ou illisible — vérifiez qu'il s'agit bien d'un CSV avec une ligne d'en-tête.");
        return;
      }
      setRows(parsed);
      setMapping(guessMapping(parsed[0]));
    };
    reader.readAsText(file, "UTF-8");
  }

  const headers = rows?.[0] ?? [];
  const dataRows = rows ? rows.slice(1) : [];
  const desigIdx = mapping?.designation ?? null;
  const validRows = desigIdx === null ? [] : dataRows.filter((r) => (r[desigIdx] ?? "").trim() !== "");
  const skippedCount = dataRows.length - validRows.length;

  function buildPayload(): Partial<CatalogueOutil>[] {
    if (!mapping || desigIdx === null) return [];
    return validRows.map((r) => {
      const payload: Partial<CatalogueOutil> = {};
      for (const field of FIELDS) {
        const idx = mapping[field.key];
        if (idx === null || idx === undefined) continue;
        const raw = (r[idx] ?? "").trim();
        if (!raw) continue;
        if (field.type === "number") {
          const n = parseFrenchNumber(raw);
          if (n !== null) (payload as Record<string, unknown>)[field.key] = n;
        } else {
          (payload as Record<string, unknown>)[field.key] = raw;
        }
      }
      return payload;
    });
  }

  async function doImport() {
    const payload = buildPayload();
    if (!payload.length) {
      showToast("Aucune ligne valide à importer — vérifiez que la colonne Désignation est bien mappée.");
      return;
    }
    setImporting(true);
    try {
      const count = await bulkCreateOutils(payload);
      showToast(`${count} référence(s) importée(s).`);
      router.refresh();
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Échec de l'import.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal title="Importer le catalogue depuis un CSV" onClose={onClose} wide>
      {!rows ? (
        <div className="flex flex-col gap-3.5">
          <p className="text-[13px] text-text-muted">
            Depuis Excel : <span className="font-semibold text-text-dark">Fichier → Enregistrer sous → CSV</span> (séparateur
            virgule ou point-virgule, les deux sont détectés automatiquement). La première ligne doit contenir les
            en-têtes de colonnes.
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px]"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 text-[12.5px] font-semibold text-text-muted">
              Correspondance des colonnes — {dataRows.length} ligne(s) détectée(s)
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-[560px]:grid-cols-1">
              {FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-2">
                  <label className="w-[190px] shrink-0 text-[12px] text-text-muted">{field.label}</label>
                  <select
                    value={mapping?.[field.key] ?? ""}
                    onChange={(e) =>
                      setMapping((prev) => ({ ...(prev as Record<FieldKey, number | null>), [field.key]: e.target.value === "" ? null : Number(e.target.value) }))
                    }
                    className="w-full rounded border border-border px-2 py-1.5 text-[12.5px]"
                  >
                    <option value="">— Ignorer —</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Colonne ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {desigIdx === null && (
            <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-[12.5px] text-danger">
              La colonne « Désignation » est obligatoire — sélectionnez-la ci-dessus pour continuer.
            </div>
          )}

          <div>
            <div className="mb-2 text-[12.5px] font-semibold text-text-muted">Aperçu (5 premières lignes valides)</div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-bg-sunken">
                    {FIELDS.filter((f) => mapping?.[f.key] !== null).map((f) => (
                      <th key={f.key} className="border-b border-border px-2 py-1.5 text-left font-semibold uppercase tracking-wide text-text-muted">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {validRows.slice(0, 5).map((r, ri) => (
                    <tr key={ri}>
                      {FIELDS.filter((f) => mapping?.[f.key] !== null).map((f) => (
                        <td key={f.key} className="border-b border-border/60 px-2 py-1">
                          {r[mapping![f.key] as number] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {validRows.length === 0 && (
                    <tr>
                      <td className="p-4 text-center text-text-muted">Aucune ligne valide.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-[12.5px] text-text-muted">
            {validRows.length} référence(s) seront importées.
            {skippedCount > 0 && ` ${skippedCount} ligne(s) ignorée(s) (désignation vide).`}
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-[13.5px] font-semibold hover:bg-bg-sunken">
              Annuler
            </button>
            <button
              onClick={doImport}
              disabled={importing || !validRows.length || desigIdx === null}
              className="rounded-lg bg-navy px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
            >
              {importing ? "Import en cours…" : `Importer ${validRows.length} référence(s)`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
