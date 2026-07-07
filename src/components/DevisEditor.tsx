"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createDevisLigne, deleteDevisLigne, updateDevis, updateDevisLigne } from "@/actions/devis";
import { generateToolListFromDevis } from "@/actions/toolList";
import { useToast } from "@/components/Toast";
import { DEVIS_STATUTS, LIGNE_TYPES } from "@/lib/company";
import { computeDevisTotals, computeLigneTotal } from "@/lib/devis";
import { generateDevisPdf } from "@/lib/pdf/devisPdf";
import { fmtEUR } from "@/lib/format";
import type { Affaire, Client, Devis, DevisLigne, LigneType } from "@/lib/types";

export function DevisEditor({
  affaire,
  client,
  devis,
  initialLignes,
}: {
  affaire: Affaire;
  client: Client | null;
  devis: Devis;
  initialLignes: DevisLigne[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [header, setHeader] = useState(devis);
  const [lignes, setLignes] = useState(initialLignes);
  const [genLog, setGenLog] = useState<string[] | null>(null);

  function saveHeader(patch: Partial<Devis>) {
    const next = { ...header, ...patch };
    setHeader(next);
    startTransition(async () => {
      try {
        await updateDevis(devis.id, affaire.id, patch);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function patchLigne(id: string, patch: Partial<DevisLigne>) {
    setLignes((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    startTransition(async () => {
      try {
        await updateDevisLigne(id, patch);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement de la ligne.");
      }
    });
  }

  function addLigne() {
    startTransition(async () => {
      try {
        const row = await createDevisLigne(devis.id, lignes.length);
        setLignes((prev) => [...prev, row]);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'ajout de la ligne.");
      }
    });
  }

  function removeLigne(id: string) {
    setLignes((prev) => prev.filter((l) => l.id !== id));
    startTransition(async () => {
      try {
        await deleteDevisLigne(id);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  function generateToolList() {
    startTransition(async () => {
      try {
        const log = await generateToolListFromDevis(devis.id, affaire.id);
        setGenLog(log.length ? log : ["Tool List déjà à jour."]);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la génération de la Tool List.");
      }
    });
  }

  const totals = computeDevisTotals(lignes, header.tva);

  return (
    <div>
      <div className="mb-5 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[500px]:grid-cols-1">
        <TextField label="Référence" value={header.reference} onBlurSave={(v) => saveHeader({ reference: v })} />
        <TextField label="Version" value={header.version} onBlurSave={(v) => saveHeader({ version: v })} />
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Statut</label>
          <select
            value={header.statut}
            onChange={(e) => saveHeader({ statut: e.target.value as Devis["statut"] })}
            className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
          >
            {DEVIS_STATUTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <TextField
          label="Validité (jours)"
          value={String(header.validite_jours)}
          type="number"
          onBlurSave={(v) => saveHeader({ validite_jours: Number(v) || 0 })}
        />
        <TextField label="Contact" value={header.contact ?? ""} onBlurSave={(v) => saveHeader({ contact: v })} />
        <TextField label="Établi par" value={header.established_by ?? ""} onBlurSave={(v) => saveHeader({ established_by: v })} />
        <TextField label="Incoterm" value={header.incoterm ?? ""} onBlurSave={(v) => saveHeader({ incoterm: v })} />
        <TextField
          label="Conditions de paiement"
          value={header.payment_terms ?? ""}
          onBlurSave={(v) => saveHeader({ payment_terms: v })}
        />
        <TextField
          label="TVA (%)"
          value={String(header.tva)}
          type="number"
          onBlurSave={(v) => saveHeader({ tva: Number(v) || 0 })}
        />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-[18px] font-semibold text-navy">Lignes du devis</div>
        <div className="flex gap-2">
          <button
            onClick={() => generateDevisPdf(header, lignes, affaire, client)}
            className="rounded-lg border border-border px-3 py-2 text-[12.5px] font-semibold hover:bg-bg-sunken"
          >
            Télécharger le PDF
          </button>
          <button
            onClick={generateToolList}
            disabled={isPending}
            className="rounded-lg bg-blue px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-navy disabled:opacity-60"
          >
            Générer / mettre à jour la Tool List
          </button>
          <button
            onClick={addLigne}
            disabled={isPending}
            className="rounded-lg bg-navy px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
          >
            + Ligne
          </button>
        </div>
      </div>

      {genLog && (
        <div className="mb-3 rounded-lg border border-blue/30 bg-blue/5 p-3 text-[12.5px] text-navy">
          {genLog.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
        <table className="w-full min-w-[1180px] text-[12.5px]">
          <thead>
            <tr className="bg-bg-sunken">
              {["Type", "Désignation", "Qté", "Stand-By €/j", "Operation €/j", "UC €/item", "LIH €/item", "Inspection €", "Restocking €", "Forfait €", "Total", ""].map(
                (h) => (
                  <th key={h} className="border-b border-border px-2.5 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => {
              return (
                <tr key={l.id} className="align-top hover:bg-bg-sunken/50">
                  <td className="border-b border-border/60 px-2.5 py-2">
                    <select
                      value={l.type}
                      onChange={(e) => patchLigne(l.id, { type: e.target.value as LigneType })}
                      className="w-[120px] rounded border border-border px-1.5 py-1 text-[12px]"
                    >
                      {LIGNE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border-b border-border/60 px-2.5 py-2">
                    <textarea
                      defaultValue={l.designation}
                      onBlur={(e) => patchLigne(l.id, { designation: e.target.value })}
                      rows={2}
                      className="w-[220px] rounded border border-border px-1.5 py-1 text-[12px]"
                    />
                  </td>
                  <NumCell value={l.quantite} onSave={(v) => patchLigne(l.id, { quantite: v })} />
                  <NumCell value={l.prix_stand_by} onSave={(v) => patchLigne(l.id, { prix_stand_by: v })} />
                  <NumCell value={l.prix_operation} onSave={(v) => patchLigne(l.id, { prix_operation: v })} />
                  <NumCell value={l.prix_uc} onSave={(v) => patchLigne(l.id, { prix_uc: v })} />
                  <NumCell value={l.prix_lih} onSave={(v) => patchLigne(l.id, { prix_lih: v })} />
                  <NumCell value={l.prix_inspection} onSave={(v) => patchLigne(l.id, { prix_inspection: v })} />
                  <NumCell value={l.prix_restocking} onSave={(v) => patchLigne(l.id, { prix_restocking: v })} />
                  <NumCell value={l.prix_forfait} onSave={(v) => patchLigne(l.id, { prix_forfait: v })} />
                  <td className="border-b border-border/60 px-2.5 py-2 font-mono font-semibold text-navy">
                    {fmtEUR(computeLigneTotal(l))}
                  </td>
                  <td className="border-b border-border/60 px-2.5 py-2">
                    <button onClick={() => removeLigne(l.id)} className="text-danger hover:underline">
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
            {lignes.length === 0 && (
              <tr>
                <td colSpan={12} className="p-8 text-center text-text-muted">
                  Aucune ligne. Cliquez sur « + Ligne » pour commencer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <div className="w-[260px] rounded-[10px] border border-border bg-bg-card p-4 text-[13.5px]">
          <div className="flex justify-between py-0.5">
            <span className="text-text-muted">Total HT</span>
            <span className="font-mono">{fmtEUR(totals.ht)}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-text-muted">TVA ({header.tva}%)</span>
            <span className="font-mono">{fmtEUR(totals.tva)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-border pt-1.5 font-semibold text-navy">
            <span>Total TTC</span>
            <span className="font-mono">{fmtEUR(totals.ttc)}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Remarques commerciales</label>
          <textarea
            defaultValue={header.remarques_commerciales ?? ""}
            onBlur={(e) => saveHeader({ remarques_commerciales: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-border px-3 py-2 text-[13px] focus:border-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Conditions particulières</label>
          <textarea
            defaultValue={header.conditions_particulieres ?? ""}
            onBlur={(e) => saveHeader({ conditions_particulieres: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-border px-3 py-2 text-[13px] focus:border-blue focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onBlurSave,
  type = "text",
}: {
  label: string;
  value: string;
  onBlurSave: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">{label}</label>
      <input
        type={type}
        defaultValue={value}
        onBlur={(e) => onBlurSave(e.target.value)}
        className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
      />
    </div>
  );
}

function NumCell({
  value,
  onSave,
  disabled,
}: {
  value: number | null;
  onSave: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <td className="border-b border-border/60 px-2.5 py-2">
      <input
        type="number"
        step="0.01"
        defaultValue={value ?? ""}
        disabled={disabled}
        onBlur={(e) => onSave(e.target.value ? Number(e.target.value) : 0)}
        className="w-[74px] rounded border border-border px-1.5 py-1 text-[12px] disabled:bg-bg-sunken disabled:text-text-muted"
      />
    </td>
  );
}
