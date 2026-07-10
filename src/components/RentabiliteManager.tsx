"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createAchat, deleteAchat } from "@/actions/achats";
import { updateAffaire } from "@/actions/affaires";
import { Badge } from "@/components/Badge";
import { KpiCard } from "@/components/KpiCard";
import { useToast } from "@/components/Toast";
import { dateRange } from "@/lib/calendar";
import { computeDevisTotals } from "@/lib/devis";
import { fmtDate, fmtEUR } from "@/lib/format";
import { computeAffaireRentabilite } from "@/lib/rentabilite";
import { computeEquipementTotals, computePersonnelTotals, computeTransportTotal } from "@/lib/serviceTicketTotals";
import type {
  Achat,
  Affaire,
  Devis,
  DevisLigne,
  PointageCode,
  ServiceTicket,
  ServiceTicketDay,
  ServiceTicketPersonnel,
  ServiceTicketTransport,
  ToolListItem,
} from "@/lib/types";

export function RentabiliteManager({
  affaire,
  devis,
  lignes,
  ticket,
  personnel,
  transport,
  equipements,
  days,
  achats,
}: {
  affaire: Affaire;
  devis: Devis[];
  lignes: DevisLigne[];
  ticket: ServiceTicket | null;
  personnel: ServiceTicketPersonnel[];
  transport: ServiceTicketTransport[];
  equipements: ToolListItem[];
  days: ServiceTicketDay[];
  achats: Achat[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [coutPersonnel, setCoutPersonnel] = useState(affaire.cout_personnel?.toString() ?? "");
  const [chargeDesignation, setChargeDesignation] = useState("");
  const [chargeMontant, setChargeMontant] = useState("");
  const [chargeDate, setChargeDate] = useState("");

  const result = useMemo(
    () => computeAffaireRentabilite({ affaire, devis, lignes, ticket, personnel, transport, equipements, days, achats }),
    [affaire, devis, lignes, ticket, personnel, transport, equipements, days, achats],
  );

  const lignesByDevis = new Map<string, DevisLigne[]>();
  for (const l of lignes) {
    const arr = lignesByDevis.get(l.devis_id) ?? [];
    arr.push(l);
    lignesByDevis.set(l.devis_id, arr);
  }
  const devisRetenus = devis.filter((d) => d.statut === "Accepté" || d.statut === "Envoyé");

  const dates = ticket ? dateRange(ticket.period_start, ticket.period_end) : [];
  const pointageMap = new Map<string, PointageCode>(days.map((d) => [`${d.entity_id}:${d.date}`, d.code]));
  const personnelTotal = ticket ? computePersonnelTotals(personnel, dates, pointageMap).reduce((s, r) => s + r.total, 0) : 0;
  const equipementTotal = ticket ? computeEquipementTotals(equipements, dates, pointageMap).reduce((s, r) => s + r.total, 0) : 0;
  const transportBille = computeTransportTotal(transport);

  const chargesOperateur = achats.filter((a) => a.categorie === "Opérateurs");
  const autresAchats = achats.filter((a) => a.categorie !== "Opérateurs");
  const chargesOperateurTotal = chargesOperateur.reduce((sum, a) => sum + (a.montant || 0), 0);

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

  function addChargeOperateur() {
    if (!chargeDesignation.trim() || !chargeMontant) {
      showToast("Désignation et montant requis.");
      return;
    }
    startTransition(async () => {
      try {
        await createAchat({
          designation: chargeDesignation.trim(),
          montant: Number(chargeMontant),
          date_achat: chargeDate || null,
          categorie: "Opérateurs",
          affaire_id: affaire.id,
        });
        setChargeDesignation("");
        setChargeMontant("");
        setChargeDate("");
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function removeCharge(id: string) {
    if (!confirm("Supprimer cette charge ?")) return;
    startTransition(async () => {
      try {
        await deleteAchat(id, affaire.id);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  return (
    <div>
      <div className="mb-2 font-display text-[19px] font-semibold text-navy">Rentabilité de l&apos;affaire</div>
      <p className="mb-5 text-[12.5px] text-text-muted">
        {result.isVente
          ? "Affaire de vente : le revenu vient des devis de vente envoyés/acceptés (Vente + Transport + Packaging)."
          : "Affaire de location : le revenu vient du pointage réel du Service Ticket (Personnel, Équipements, Transport), pas du devis — le devis de location ne chiffre pas le Stand-By/Operation, réglés uniquement à l'usage."}
      </p>

      {!result.isVente && !ticket && (
        <div className="mb-5 rounded-lg border border-warning/40 bg-warning/10 p-3 text-[12.5px] text-text-dark">
          Aucun Service Ticket pour cette affaire pour l&apos;instant — le revenu est donc à 0 en attendant le début
          du pointage.
        </div>
      )}

      <div className="mb-6 grid grid-cols-5 gap-4 max-[1200px]:grid-cols-3 max-[640px]:grid-cols-1">
        <KpiCard
          label={result.isVente ? "Revenu (devis vente)" : "Revenu réalisé (Service Ticket)"}
          value={fmtEUR(result.revenu)}
        />
        <KpiCard label="Achats liés" value={fmtEUR(result.achatsTotal)} sub={`${achats.length} achat(s)`} />
        <KpiCard label="Charges opérateur" value={fmtEUR(chargesOperateurTotal)} sub={`${chargesOperateur.length} charge(s) — saisie manuelle`} />
        <KpiCard label="Coût transport réel" value={fmtEUR(result.transportCoutReel)} sub="Hors marge" />
        <KpiCard label="Coût personnel" value={fmtEUR(result.coutPersonnel)} sub="Saisie manuelle" />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
        <KpiCard label="Total charges" value={fmtEUR(result.chargesTotal)} />
        <KpiCard label="Marge" value={fmtEUR(result.marge)} />
        <KpiCard label="Rentabilité (marge %)" value={result.margePct === null ? "—" : `${result.margePct.toFixed(1)} %`} />
      </div>

      {!result.isVente && ticket && (
        <div className="mb-6 rounded-[10px] border border-border bg-bg-card p-5">
          <div className="mb-3 font-display text-[17px] font-semibold text-navy">Détail du revenu (Service Ticket)</div>
          <div className="grid grid-cols-3 gap-4 max-[700px]:grid-cols-1">
            <KpiCard label="Personnel" value={fmtEUR(personnelTotal)} />
            <KpiCard label="Équipements" value={fmtEUR(equipementTotal)} />
            <KpiCard label="Transport facturé" value={fmtEUR(transportBille)} />
          </div>
        </div>
      )}

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
        <div className="mb-3 font-display text-[17px] font-semibold text-navy">Charges opérateur ({chargesOperateur.length})</div>
        <p className="mb-3 text-[12px] text-text-muted">
          Transport voiture, notes de frais, panier repas, etc. — frais réels engagés par l&apos;opérateur sur cette
          affaire, saisie manuelle (aucune source automatique n&apos;existe pour ces montants).
        </p>
        {chargesOperateur.length > 0 && (
          <div className="mb-3 flex flex-col gap-2">
            {chargesOperateur.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-[12.5px]">
                <div>
                  <div className="font-semibold text-navy">{a.designation}</div>
                  {a.date_achat && <div className="text-text-muted">{fmtDate(a.date_achat)}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-semibold text-navy">{a.montant ? fmtEUR(a.montant) : "—"}</div>
                  <button onClick={() => removeCharge(a.id)} className="text-danger hover:underline">
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 max-[700px]:flex-wrap">
          <div className="flex-1">
            <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Désignation</label>
            <input
              value={chargeDesignation}
              onChange={(e) => setChargeDesignation(e.target.value)}
              placeholder="Ex. Transport voiture — Jean Dupont"
              className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
            />
          </div>
          <div className="w-[130px]">
            <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Montant (€)</label>
            <input
              type="number"
              step="0.01"
              value={chargeMontant}
              onChange={(e) => setChargeMontant(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
            />
          </div>
          <div className="w-[150px]">
            <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Date</label>
            <input
              type="date"
              value={chargeDate}
              onChange={(e) => setChargeDate(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
            />
          </div>
          <button
            onClick={addChargeOperateur}
            disabled={isPending}
            className="rounded-lg bg-navy px-4 py-2 text-[13px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
          >
            + Ajouter
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-[10px] border border-border bg-bg-card p-5">
        <div className="mb-3 font-display text-[17px] font-semibold text-navy">Achats liés ({autresAchats.length})</div>
        {autresAchats.length === 0 ? (
          <div className="text-[12.5px] text-text-muted">Aucun achat rattaché à cette affaire.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {autresAchats.map((a) => (
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

      {result.isVente && (
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
      )}
    </div>
  );
}
