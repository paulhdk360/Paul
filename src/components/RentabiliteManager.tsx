"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateAffaire } from "@/actions/affaires";
import { Badge } from "@/components/Badge";
import { KpiCard } from "@/components/KpiCard";
import { useToast } from "@/components/Toast";
import { computeDevisTotals } from "@/lib/devis";
import { fmtDate, fmtEUR } from "@/lib/format";
import type { Achat, Affaire, Devis, DevisLigne, ServiceTicketTransport } from "@/lib/types";

export function RentabiliteManager({
  affaire,
  devis,
  lignes,
  transport,
  achats,
}: {
  affaire: Affaire;
  devis: Devis[];
  lignes: DevisLigne[];
  transport: ServiceTicketTransport[];
  achats: Achat[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [coutPersonnel, setCoutPersonnel] = useState(affaire.cout_personnel?.toString() ?? "");

  const lignesByDevis = new Map<string, DevisLigne[]>();
  for (const l of lignes) {
    const arr = lignesByDevis.get(l.devis_id) ?? [];
    arr.push(l);
    lignesByDevis.set(l.devis_id, arr);
  }

  const devisRetenus = devis.filter((d) => d.statut === "Accepté" || d.statut === "Envoyé");
  const revenu = devisRetenus.reduce((sum, d) => sum + computeDevisTotals(lignesByDevis.get(d.id) ?? [], d.tva).ht, 0);

  const achatsTotal = achats.reduce((sum, a) => sum + (a.montant || 0), 0);
  const transportCoutReel = transport.reduce((sum, t) => sum + (t.cout_reel || 0) * (t.quantite || 1), 0);
  const coutPersonnelValeur = affaire.cout_personnel || 0;

  const chargesTotal = achatsTotal + transportCoutReel + coutPersonnelValeur;
  const marge = revenu - chargesTotal;
  const margePct = revenu > 0 ? (marge / revenu) * 100 : null;

  function saveCoutPersonnel() {
    startTransition(async () => {
      try {
        await updateAffaire(affaire.id, { cout_personnel: coutPersonnel ? Number(coutPersonnel) : null });
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  return (
    <div>
      <div className="mb-2 font-display text-[19px] font-semibold text-navy">Rentabilité de l&apos;affaire</div>
      <p className="mb-5 text-[12.5px] text-text-muted">
        Le revenu est calculé à partir des devis envoyés/acceptés (même convention que le CA du tableau de bord). Les
        charges regroupent les achats liés à cette affaire, le coût réel du transport (hors marge) et le coût de
        personnel saisi manuellement ci-dessous.
      </p>

      <div className="mb-6 grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
        <KpiCard label="Revenu (devis)" value={fmtEUR(revenu)} sub="Devis envoyés + acceptés" />
        <KpiCard label="Achats liés" value={fmtEUR(achatsTotal)} sub={`${achats.length} achat(s)`} />
        <KpiCard label="Coût transport réel" value={fmtEUR(transportCoutReel)} sub="Hors marge" />
        <KpiCard label="Coût personnel" value={fmtEUR(coutPersonnelValeur)} sub="Saisie manuelle" />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
        <KpiCard label="Total charges" value={fmtEUR(chargesTotal)} />
        <KpiCard label="Marge" value={fmtEUR(marge)} />
        <KpiCard label="Marge %" value={margePct === null ? "—" : `${margePct.toFixed(1)} %`} />
      </div>

      <div className="mb-6 rounded-[10px] border border-border bg-bg-card p-5">
        <div className="mb-3 font-display text-[17px] font-semibold text-navy">Coût de personnel</div>
        <p className="mb-3 text-[12px] text-text-muted">
          Coût interne réel de notre personnel sur cette affaire (à distinguer du tarif facturé au client sur le
          Service Ticket) — saisie manuelle, aucune donnée de coût journalier n&apos;existe encore par employé.
        </p>
        <div className="flex items-end gap-2">
          <div className="w-[200px]">
            <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Coût personnel (€)</label>
            <input
              type="number"
              step="0.01"
              value={coutPersonnel}
              onChange={(e) => setCoutPersonnel(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
            />
          </div>
          <button
            onClick={saveCoutPersonnel}
            disabled={isPending}
            className="rounded-lg bg-navy px-4 py-2 text-[13px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
          >
            Enregistrer
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-[10px] border border-border bg-bg-card p-5">
        <div className="mb-3 font-display text-[17px] font-semibold text-navy">Achats liés ({achats.length})</div>
        {achats.length === 0 ? (
          <div className="text-[12.5px] text-text-muted">Aucun achat rattaché à cette affaire.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {achats.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-[12.5px]">
                <div>
                  <div className="font-semibold text-navy">{a.designation}</div>
                  <div className="text-text-muted">
                    {a.fournisseur || "Fournisseur non renseigné"} · {fmtDate(a.date_achat)}
                  </div>
                </div>
                <div className="font-semibold text-navy">{a.montant ? fmtEUR(a.montant) : "—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[10px] border border-border bg-bg-card p-5">
        <div className="mb-3 font-display text-[17px] font-semibold text-navy">Devis pris en compte</div>
        {devisRetenus.length === 0 ? (
          <div className="text-[12.5px] text-text-muted">
            Aucun devis envoyé ou accepté pour cette affaire — le revenu ci-dessus est donc à 0.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {devisRetenus.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-[12.5px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-navy">
                    {d.reference} ({d.version})
                  </span>
                  <Badge label={d.statut} />
                </div>
                <div className="font-semibold text-navy">{fmtEUR(computeDevisTotals(lignesByDevis.get(d.id) ?? [], d.tva).ht)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
