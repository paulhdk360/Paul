"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { createChantierFromDevis, createDevis, updateDevis } from "@/actions/devis";
import { ACTIVITE_DEFAULTS, DEVIS_STATUTS, type TypeActivite } from "@/lib/company";
import { computeDevisTotals, ligneTotal, newDevisLigne } from "@/lib/devis";
import { fmtEUR } from "@/lib/format";
import { generateDevisPDF } from "@/lib/pdf/generateDevisPdf";
import { Attachments } from "@/components/Attachments";
import { useToast } from "@/components/Toast";
import type { Attachment, Devis, DevisLigne } from "@/lib/supabase/types";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-[7px] border border-border bg-bg px-2.5 py-2 text-[13.5px] text-text-light focus:border-accent-bright focus:outline-none";

export function DevisForm({
  mode,
  initial,
  initialAttachments,
  previousStatut,
}: {
  mode: "new" | "edit";
  initial: Devis;
  initialAttachments: Attachment[];
  previousStatut: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState<Devis>(initial);
  const [isPending, startTransition] = useTransition();

  const totals = computeDevisTotals(form);

  function set<K extends keyof Devis>(key: K, value: Devis[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setLigne(id: string, field: keyof DevisLigne, value: string | number) {
    setForm((f) => ({
      ...f,
      lignes: f.lignes.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    }));
  }

  function addLigne() {
    setForm((f) => ({ ...f, lignes: [...f.lignes, newDevisLigne()] }));
  }

  function removeLigne(id: string) {
    setForm((f) => ({ ...f, lignes: f.lignes.filter((l) => l.id !== id) }));
  }

  function resetTextes() {
    const defaults = ACTIVITE_DEFAULTS[form.type_activite as TypeActivite] ?? ACTIVITE_DEFAULTS["Forage géothermique"];
    if (
      !confirm(
        `Remplacer les 3 textes ci-dessous par le texte-type de "${form.type_activite}" ? Vos modifications actuelles seront perdues.`,
      )
    )
      return;
    setForm((f) => ({
      ...f,
      objet_texte: defaults.objetTexte,
      prestations_incluses: defaults.prestationsIncluses,
      limites_exclusions: defaults.limitesExclusions,
    }));
  }

  function buildValues() {
    const { id, created_at, updated_at, chantier_genere_id, ...rest } = form;
    return rest as Record<string, unknown>;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (mode === "edit") {
          await updateDevis(form.id, buildValues());
        } else {
          await createDevis({ ...buildValues(), id: form.id });
        }
        if (form.statut === "Accepté" && previousStatut !== "Accepté" && !form.chantier_genere_id) {
          const veutCreer = confirm(
            'Ce devis vient d\'être marqué "Accepté".\n\nVoulez-vous créer automatiquement le chantier correspondant (client, adresse et montant pré-remplis), pour ensuite y affecter la foreuse et l\'équipe ?',
          );
          if (veutCreer) {
            const chantierId = await createChantierFromDevis(form.id);
            router.push(`/chantiers?open=${chantierId}`);
            return;
          }
        }
        router.push("/devis");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Échec de l'enregistrement du devis.");
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/devis"
          className="rounded-lg border border-border px-4 py-2 text-[13.5px] font-semibold hover:bg-bg-card"
        >
          ← Retour aux devis
        </Link>
      </div>
      <div className="font-display text-[30px] font-bold tracking-wide">
        {mode === "edit" ? "Modifier le devis" : "Nouveau devis"}
      </div>
      <div className="mb-6 text-[13.5px] text-text-muted">{form.reference}</div>

      <form onSubmit={handleSubmit} className="rounded-[10px] border border-border bg-bg-card p-5">
        <div className="form-subhead mb-2 mt-1 font-display text-[15px] font-semibold tracking-wide text-accent-bright">
          Informations générales
        </div>
        <Field label="Client">
          <input className={inputCls} value={form.client ?? ""} onChange={(e) => set("client", e.target.value)} />
        </Field>
        <Field label="Objet (résumé court)">
          <input
            className={inputCls}
            placeholder="Ex : Forage géothermique — 2 sondes"
            value={form.objet ?? ""}
            onChange={(e) => set("objet", e.target.value)}
          />
        </Field>
        <div className="mb-3.5 grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">
              Type d&apos;activité
            </label>
            <select
              className={inputCls}
              value={form.type_activite}
              onChange={(e) => set("type_activite", e.target.value)}
            >
              {Object.keys(ACTIVITE_DEFAULTS).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">Statut</label>
            <select className={inputCls} value={form.statut} onChange={(e) => set("statut", e.target.value as Devis["statut"])}>
              {DEVIS_STATUTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">TVA (%)</label>
            <input
              type="number"
              className={inputCls}
              value={form.tva}
              onChange={(e) => set("tva", Number(e.target.value) || 0)}
            />
          </div>
        </div>
        <div className="mb-3.5 grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">Créé le</label>
            <input
              type="date"
              className={inputCls}
              value={form.date_creation ?? ""}
              onChange={(e) => set("date_creation", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">Envoyé le</label>
            <input
              type="date"
              className={inputCls}
              value={form.date_envoi ?? ""}
              onChange={(e) => set("date_envoi", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">Relancé le</label>
            <input
              type="date"
              className={inputCls}
              value={form.date_relance ?? ""}
              onChange={(e) => set("date_relance", e.target.value)}
            />
          </div>
        </div>
        <Field label="Réponse reçue le">
          <input
            type="date"
            className={inputCls}
            value={form.date_reponse ?? ""}
            onChange={(e) => set("date_reponse", e.target.value)}
          />
        </Field>

        <div className="form-subhead mb-2 mt-4.5 border-t border-border pt-3 font-display text-[15px] font-semibold tracking-wide text-accent-bright">
          Client &amp; chantier
        </div>
        <Field label="Adresse de facturation">
          <input
            className={inputCls}
            value={form.client_adresse_facturation ?? ""}
            onChange={(e) => set("client_adresse_facturation", e.target.value)}
          />
        </Field>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">Contact chantier</label>
            <input
              className={inputCls}
              value={form.contact_chantier ?? ""}
              onChange={(e) => set("contact_chantier", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">Usage prévu</label>
            <input
              className={inputCls}
              value={form.usage_prevu ?? ""}
              onChange={(e) => set("usage_prevu", e.target.value)}
            />
          </div>
        </div>
        <Field label="Adresse du chantier">
          <input
            className={inputCls}
            value={form.adresse_chantier ?? ""}
            onChange={(e) => set("adresse_chantier", e.target.value)}
          />
        </Field>
        <Field label="Références cadastrales">
          <input
            className={inputCls}
            value={form.references_cadastrales ?? ""}
            onChange={(e) => set("references_cadastrales", e.target.value)}
          />
        </Field>

        <div className="form-subhead mb-2 mt-4.5 border-t border-border pt-3 font-display text-[15px] font-semibold tracking-wide text-accent-bright">
          Hypothèses techniques
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">Type d&apos;ouvrage</label>
            <input
              className={inputCls}
              value={form.type_ouvrage ?? ""}
              onChange={(e) => set("type_ouvrage", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">
              Profondeur prévisionnelle
            </label>
            <input
              className={inputCls}
              placeholder="Ex : 100m par sonde"
              value={form.profondeur_previsionnelle ?? ""}
              onChange={(e) => set("profondeur_previsionnelle", e.target.value)}
            />
          </div>
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">Diamètre de forage</label>
            <input
              className={inputCls}
              value={form.diametre_forage ?? ""}
              onChange={(e) => set("diametre_forage", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">Tubage prévu</label>
            <input
              className={inputCls}
              value={form.tubage_prevu ?? ""}
              onChange={(e) => set("tubage_prevu", e.target.value)}
            />
          </div>
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">Crépines</label>
            <input
              className={inputCls}
              value={form.crepines ?? ""}
              onChange={(e) => set("crepines", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">Massif filtrant</label>
            <input
              className={inputCls}
              value={form.massif_filtrant ?? ""}
              onChange={(e) => set("massif_filtrant", e.target.value)}
            />
          </div>
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">
              Cimentation annulaire
            </label>
            <input
              className={inputCls}
              value={form.cimentation_annulaire ?? ""}
              onChange={(e) => set("cimentation_annulaire", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">Essais prévus</label>
            <input
              className={inputCls}
              value={form.essais_prevus ?? ""}
              onChange={(e) => set("essais_prevus", e.target.value)}
            />
          </div>
        </div>

        <div className="form-subhead mb-2 mt-4.5 border-t border-border pt-3 font-display text-[15px] font-semibold tracking-wide text-accent-bright">
          Lignes de prestations
        </div>
        <div className="mb-3.5">
          <table className="mb-2 w-full border-collapse">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-text-muted">
                <th className="px-1.5 py-1.5">Désignation</th>
                <th className="w-[60px] px-1.5 py-1.5">Qté</th>
                <th className="w-[70px] px-1.5 py-1.5">Unité</th>
                <th className="w-[90px] px-1.5 py-1.5">PU (€)</th>
                <th className="w-[90px] px-1.5 py-1.5">Total</th>
                <th className="w-[28px]" />
              </tr>
            </thead>
            <tbody>
              {form.lignes.map((l) => (
                <tr key={l.id}>
                  <td className="px-1.5 py-1">
                    <input
                      className={inputCls}
                      placeholder="Ex : Forage sonde 100m"
                      value={l.designation}
                      onChange={(e) => setLigne(l.id, "designation", e.target.value)}
                    />
                  </td>
                  <td className="px-1.5 py-1">
                    <input
                      type="number"
                      className={inputCls}
                      value={l.quantite}
                      onChange={(e) => setLigne(l.id, "quantite", Number(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-1.5 py-1">
                    <input
                      className={inputCls}
                      value={l.unite}
                      onChange={(e) => setLigne(l.id, "unite", e.target.value)}
                    />
                  </td>
                  <td className="px-1.5 py-1">
                    <input
                      type="number"
                      className={inputCls}
                      value={l.prixUnitaire}
                      onChange={(e) => setLigne(l.id, "prixUnitaire", Number(e.target.value) || 0)}
                    />
                  </td>
                  <td className="whitespace-nowrap px-1.5 py-1 text-right font-mono text-[13px]">
                    {fmtEUR(ligneTotal(l))}
                  </td>
                  <td className="px-1.5 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeLigne(l.id)}
                      className="text-danger"
                      aria-label="Supprimer la ligne"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={addLigne}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-bg-card-hover"
          >
            + Ajouter une ligne
          </button>
          <div className="mt-2 flex justify-end">
            <table className="text-[13.5px]">
              <tbody>
                <tr>
                  <td className="py-0.5 pl-5 text-right text-text-muted">Total HT</td>
                  <td className="min-w-[100px] py-0.5 pl-5 text-right font-mono">{fmtEUR(totals.ht)}</td>
                </tr>
                <tr>
                  <td className="py-0.5 pl-5 text-right text-text-muted">TVA</td>
                  <td className="min-w-[100px] py-0.5 pl-5 text-right font-mono">{fmtEUR(totals.tva)}</td>
                </tr>
                <tr>
                  <td className="pt-1.5 pl-5 text-right text-[15px] font-bold text-accent-bright">Total TTC</td>
                  <td className="min-w-[100px] pt-1.5 pl-5 text-right font-mono text-[15px] font-bold text-accent-bright">
                    {fmtEUR(totals.ttc)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="form-subhead mb-2 mt-4.5 border-t border-border pt-3 font-display text-[15px] font-semibold tracking-wide text-accent-bright">
          Conditions commerciales
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">
              Acompte à la commande (%)
            </label>
            <input
              type="number"
              className={inputCls}
              value={form.acompte_pct}
              onChange={(e) => set("acompte_pct", Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">
              Validité du devis (jours)
            </label>
            <input
              type="number"
              className={inputCls}
              value={form.validite_jours}
              onChange={(e) => set("validite_jours", Number(e.target.value) || 30)}
            />
          </div>
        </div>

        <div className="form-subhead mb-2 mt-4.5 flex items-center gap-2.5 border-t border-border pt-3 font-display text-[15px] font-semibold tracking-wide text-accent-bright">
          Textes du devis (modifiables)
          <button
            type="button"
            onClick={resetTextes}
            className="rounded-lg border border-border px-3 py-1.5 font-sans text-xs font-semibold text-text-light hover:bg-bg-card-hover"
          >
            Insérer le texte-type de l&apos;activité
          </button>
        </div>
        <Field label="Objet du devis (paragraphe détaillé)">
          <textarea
            className={`${inputCls} min-h-[100px] resize-y`}
            value={form.objet_texte ?? ""}
            onChange={(e) => set("objet_texte", e.target.value)}
          />
        </Field>
        <Field label="Prestations incluses">
          <textarea
            className={`${inputCls} min-h-[100px] resize-y`}
            value={form.prestations_incluses ?? ""}
            onChange={(e) => set("prestations_incluses", e.target.value)}
          />
        </Field>
        <Field label="Limites de prestation et exclusions">
          <textarea
            className={`${inputCls} min-h-[100px] resize-y`}
            value={form.limites_exclusions ?? ""}
            onChange={(e) => set("limites_exclusions", e.target.value)}
          />
        </Field>

        <div className="form-subhead mb-2 mt-4.5 border-t border-border pt-3 font-display text-[15px] font-semibold tracking-wide text-accent-bright">
          Documents joints
        </div>
        <Attachments linkType="devis" linkId={form.id} initialFiles={initialAttachments} />

        <div className="mt-4.5 flex flex-wrap justify-end gap-2.5">
          <button
            type="button"
            onClick={() => generateDevisPDF(form)}
            className="rounded-lg border border-border px-4 py-2 text-[13.5px] font-semibold hover:bg-bg-card"
          >
            Générer le PDF
          </button>
          <Link
            href="/devis"
            className="rounded-lg border border-border px-4 py-2 text-[13.5px] font-semibold hover:bg-bg-card"
          >
            Annuler
          </Link>
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
  );
}
