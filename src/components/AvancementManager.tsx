"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateAffaire } from "@/actions/affaires";
import { createSituation, deleteSituation } from "@/actions/avancement";
import { KpiCard } from "@/components/KpiCard";
import { useToast } from "@/components/Toast";
import { fmtDate, fmtEUR } from "@/lib/format";
import { generateFactureAvancementPdf } from "@/lib/pdf/factureAvancementPdf";
import type { Affaire, AvancementSituation, Client } from "@/lib/types";

const EMPTY = { date: new Date().toISOString().slice(0, 10), pourcentage: "", description: "" };

export function AvancementManager({ affaire, client, situations }: { affaire: Affaire; client: Client | null; situations: AvancementSituation[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [montantContrat, setMontantContrat] = useState(affaire.montant_contrat?.toString() ?? "");
  const [form, setForm] = useState(EMPTY);

  const sorted = [...situations].sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at));
  const pourcentageActuel = sorted.length ? sorted[sorted.length - 1].pourcentage : 0;
  const montantContratNum = affaire.montant_contrat ?? 0;
  const montantFacture = (montantContratNum * pourcentageActuel) / 100;
  const resteAFacturer = montantContratNum - montantFacture;

  function saveMontantContrat() {
    startTransition(async () => {
      try {
        await updateAffaire(affaire.id, { montant_contrat: montantContrat ? Number(montantContrat) : null });
        router.refresh();
        showToast("Montant du contrat enregistré.");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function submit() {
    if (!form.pourcentage) {
      showToast("Le pourcentage d'avancement est requis.");
      return;
    }
    startTransition(async () => {
      try {
        await createSituation(affaire.id, {
          date: form.date,
          pourcentage: Number(form.pourcentage),
          description: form.description || null,
        });
        setForm(EMPTY);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Supprimer cette situation d'avancement ?")) return;
    startTransition(async () => {
      try {
        await deleteSituation(id, affaire.id);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  function downloadFacture(situation: AvancementSituation, previousPourcentage: number) {
    if (!affaire.montant_contrat) {
      showToast("Renseigne d'abord le montant total du contrat.");
      return;
    }
    try {
      generateFactureAvancementPdf(situation, previousPourcentage, affaire, client);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Échec de la génération du PDF.");
    }
  }

  return (
    <div>
      <div className="mb-5 rounded-[10px] border border-border bg-bg-card p-5">
        <div className="mb-3 font-display text-[17px] font-semibold text-navy">Montant total du contrat</div>
        <p className="mb-3 text-[12.5px] text-text-muted">
          Sert de base au calcul des factures d&apos;avancement (montant de chaque situation = ce total × la variation
          de %). Corrigeable à tout moment.
        </p>
        <div className="flex items-end gap-2">
          <div className="w-[220px]">
            <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Montant HT (€)</label>
            <input
              type="number"
              step="0.01"
              value={montantContrat}
              onChange={(e) => setMontantContrat(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
            />
          </div>
          <button
            onClick={saveMontantContrat}
            disabled={isPending}
            className="rounded-lg bg-navy px-4 py-2 text-[13px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
          >
            Enregistrer
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4 max-[700px]:grid-cols-1">
        <KpiCard label="Avancement actuel" value={`${pourcentageActuel} %`} />
        <KpiCard label="Facturé à ce jour" value={fmtEUR(montantFacture)} />
        <KpiCard label="Reste à facturer" value={fmtEUR(resteAFacturer)} />
      </div>

      <div className="mb-5 rounded-[10px] border border-border bg-bg-card p-5">
        <div className="mb-3 font-display text-[17px] font-semibold text-navy">Nouvelle situation d&apos;avancement</div>
        <div className="grid grid-cols-3 gap-3 max-[700px]:grid-cols-1">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Avancement cumulé (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={form.pourcentage}
              onChange={(e) => setForm({ ...form, pourcentage: e.target.value })}
              className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
            />
          </div>
          <div className="col-span-3 max-[700px]:col-span-1">
            <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Description / travaux réalisés</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-border px-3 py-2 text-[13px] focus:border-blue focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={submit}
            disabled={isPending}
            className="rounded-lg bg-navy px-4 py-2 text-[13px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
          >
            + Ajouter la situation
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
        <table className="w-full min-w-[820px] text-[12.5px]">
          <thead>
            <tr className="bg-bg-sunken">
              {["Date", "Avancement", "Description", "Montant de la situation", "Cumul facturé", ""].map((h) => (
                <th key={h} className="border-b border-border px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => {
              const previousPourcentage = i > 0 ? sorted[i - 1].pourcentage : 0;
              const montantSituation = (montantContratNum * (s.pourcentage - previousPourcentage)) / 100;
              const montantCumule = (montantContratNum * s.pourcentage) / 100;
              return (
                <tr key={s.id} className="hover:bg-bg-sunken/50">
                  <td className="border-b border-border/60 px-3 py-2">{fmtDate(s.date)}</td>
                  <td className="border-b border-border/60 px-3 py-2 font-semibold text-navy">{s.pourcentage} %</td>
                  <td className="border-b border-border/60 px-3 py-2 text-text-muted">{s.description || "—"}</td>
                  <td className="border-b border-border/60 px-3 py-2 font-mono">{fmtEUR(montantSituation)}</td>
                  <td className="border-b border-border/60 px-3 py-2 font-mono font-semibold text-navy">{fmtEUR(montantCumule)}</td>
                  <td className="border-b border-border/60 px-3 py-2 text-right">
                    <button onClick={() => downloadFacture(s, previousPourcentage)} className="mr-2 text-blue hover:underline">
                      Facture PDF
                    </button>
                    <button onClick={() => remove(s.id)} className="text-danger hover:underline">
                      Supprimer
                    </button>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-muted">
                  Aucune situation d&apos;avancement enregistrée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
