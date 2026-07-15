"use client";

import { useMemo, useState } from "react";
import { dateRange, distinctMonths, monthLabel } from "@/lib/calendar";
import { fmtEUR } from "@/lib/format";
import { computeEquipementTotals, computePersonnelTotals, computeTransportTotal } from "@/lib/serviceTicketTotals";
import type { Affaire, Client, PointageCode, ServiceTicket, ServiceTicketDay, ServiceTicketPersonnel, ServiceTicketTransport, ToolListItem } from "@/lib/types";

export function RecapFacturationManager({
  affaire,
  client,
  ticket,
  personnel,
  transport,
  equipements,
  days,
}: {
  affaire: Affaire;
  client: Client | null;
  ticket: ServiceTicket;
  personnel: ServiceTicketPersonnel[];
  transport: ServiceTicketTransport[];
  equipements: ToolListItem[];
  days: ServiceTicketDay[];
}) {
  const dates = useMemo(() => dateRange(ticket.period_start, ticket.period_end), [ticket.period_start, ticket.period_end]);
  const months = useMemo(() => distinctMonths(dates), [dates]);
  const todayMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(months.includes(todayMonth) ? todayMonth : months[0] ?? todayMonth);
  const [includeTransport, setIncludeTransport] = useState(false);

  const pointageMap = useMemo(() => new Map<string, PointageCode>(days.map((d) => [`${d.entity_id}:${d.date}`, d.code])), [days]);
  const monthDates = useMemo(() => dates.filter((d) => d.startsWith(selectedMonth)), [dates, selectedMonth]);

  const personnelTotals = useMemo(() => computePersonnelTotals(personnel, monthDates, pointageMap), [personnel, monthDates, pointageMap]);
  const equipementTotals = useMemo(() => computeEquipementTotals(equipements, monthDates, pointageMap), [equipements, monthDates, pointageMap]);
  const transportTotal = useMemo(() => computeTransportTotal(transport), [transport]);

  const personnelTotal = personnelTotals.reduce((sum, r) => sum + r.total, 0);
  const equipementTotal = equipementTotals.reduce((sum, r) => sum + r.total, 0);
  const grandTotal = personnelTotal + equipementTotal + (includeTransport ? transportTotal : 0);

  async function downloadPdf() {
    const { generateRecapFacturationPdf } = await import("@/lib/pdf/recapPdf");
    generateRecapFacturationPdf({
      affaire,
      client,
      ticket,
      monthKey: selectedMonth,
      personnelTotals,
      equipementTotals,
      transportTotal,
      includeTransport,
      personnelTotal,
      equipementTotal,
      grandTotal,
    });
  }

  if (months.length === 0) {
    return (
      <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center text-text-muted">
        Renseignez une période sur le Service Ticket pour générer un récap facturation.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-[13.5px] text-text-muted">
        Affaire <span className="font-semibold text-navy">N° {affaire.reference}</span>
        {client && <> — {client.raison_sociale}</>}
      </div>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Mois à facturer</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <button onClick={downloadPdf} className="rounded-lg border border-border px-4 py-2 text-[12.5px] font-semibold hover:bg-bg-sunken">
          Télécharger le récap PDF
        </button>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-3 rounded-[10px] border border-navy/20 bg-navy/5 p-4 max-[700px]:grid-cols-2">
        <Stat label="Personnel" value={personnelTotal} />
        <Stat label="Équipements" value={equipementTotal} />
        <Stat label="Transport (non inclus)" value={transportTotal} muted={!includeTransport} />
        <Stat label={`Total ${monthLabel(selectedMonth)}`} value={grandTotal} strong />
      </div>

      <label className="mb-5 flex items-center gap-2 text-[12.5px] text-text-muted">
        <input type="checkbox" checked={includeTransport} onChange={(e) => setIncludeTransport(e.target.checked)} />
        Inclure le transport & prestations ponctuelles (montant pour la période complète, non ventilé par mois) dans
        ce récap
      </label>

      <Section title={`Personnel — ${monthLabel(selectedMonth)}`}>
        <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
          <table className="w-full min-w-[520px] text-[12.5px]">
            <thead>
              <tr className="bg-bg-sunken">
                {["Personnel", "Jours MOB", "Jours DEMOB", "Jours S", "Jours O", "Total €"].map((h) => (
                  <th key={h} className="border-b border-border px-2.5 py-2 text-left text-[10.5px] font-semibold uppercase text-text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {personnelTotals.map((row) => (
                <tr key={row.personnel.id}>
                  <td className="border-b border-border/60 px-2.5 py-1.5">{row.personnel.nom}</td>
                  <td className="border-b border-border/60 px-2.5 py-1.5">{row.joursMob}</td>
                  <td className="border-b border-border/60 px-2.5 py-1.5">{row.joursDemob}</td>
                  <td className="border-b border-border/60 px-2.5 py-1.5">{row.joursS}</td>
                  <td className="border-b border-border/60 px-2.5 py-1.5">{row.joursO}</td>
                  <td className="border-b border-border/60 px-2.5 py-1.5 font-mono">{fmtEUR(row.total)}</td>
                </tr>
              ))}
              {personnelTotals.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-3 text-center text-text-muted">
                    Aucun personnel.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-bg-sunken/60">
                <td colSpan={5} className="px-2.5 py-1.5 text-right font-semibold text-text-muted">
                  Sous-total Personnel
                </td>
                <td className="px-2.5 py-1.5 font-mono font-semibold text-navy">{fmtEUR(personnelTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>

      <Section title={`Équipements — ${monthLabel(selectedMonth)}`}>
        <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
          <table className="w-full min-w-[920px] text-[12.5px]">
            <thead>
              <tr className="bg-bg-sunken">
                {["Équipement", "N° série", "J. Stand By", "J. Operation", "Stand By €", "Operation €", "Insp. €", "Restock. €", "Serrage €", "LIH €", "UC €", "Total €"].map(
                  (h) => (
                    <th key={h} className="border-b border-border px-2.5 py-2 text-left text-[10.5px] font-semibold uppercase text-text-muted">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {equipementTotals.map((row) => (
                <tr key={row.item.id}>
                  <td className="border-b border-border/60 px-2.5 py-1.5">{row.item.designation.split("\n")[0]}</td>
                  <td className="border-b border-border/60 px-2.5 py-1.5 font-mono text-[11.5px] text-text-muted">{row.item.numero_serie ?? "—"}</td>
                  <td className="border-b border-border/60 px-2.5 py-1.5">{row.joursStandBy}</td>
                  <td className="border-b border-border/60 px-2.5 py-1.5">{row.joursOperation}</td>
                  <td className="border-b border-border/60 px-2.5 py-1.5 font-mono">{fmtEUR(row.montantStandBy)}</td>
                  <td className="border-b border-border/60 px-2.5 py-1.5 font-mono">{fmtEUR(row.montantOperation)}</td>
                  <td className="border-b border-border/60 px-2.5 py-1.5 font-mono">{fmtEUR(row.inspection)}</td>
                  <td className="border-b border-border/60 px-2.5 py-1.5 font-mono">{fmtEUR(row.restocking)}</td>
                  <td className="border-b border-border/60 px-2.5 py-1.5 font-mono">{fmtEUR(row.serrage)}</td>
                  <td className="border-b border-border/60 px-2.5 py-1.5 font-mono">{fmtEUR(row.lih)}</td>
                  <td className="border-b border-border/60 px-2.5 py-1.5 font-mono">{fmtEUR(row.uc)}</td>
                  <td className="border-b border-border/60 px-2.5 py-1.5 font-mono font-semibold">{fmtEUR(row.total)}</td>
                </tr>
              ))}
              {equipementTotals.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-3 text-center text-text-muted">
                    Aucun équipement.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-bg-sunken/60">
                <td colSpan={11} className="px-2.5 py-1.5 text-right font-semibold text-text-muted">
                  Sous-total Équipements
                </td>
                <td className="px-2.5 py-1.5 font-mono font-semibold text-navy">{fmtEUR(equipementTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>

      <div className="flex justify-end">
        <div className="w-[280px] rounded-[10px] border border-border bg-bg-card p-4 text-[13.5px]">
          <div className="flex justify-between border-t border-border pt-1.5 font-semibold text-navy">
            <span>Total à envoyer — {monthLabel(selectedMonth)}</span>
            <span className="font-mono">{fmtEUR(grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <div className="mb-2.5 font-display text-[17px] font-semibold text-navy">{title}</div>
      {children}
    </div>
  );
}

function Stat({ label, value, strong, muted }: { label: string; value: number; strong?: boolean; muted?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</div>
      <div
        className={`font-mono ${
          strong ? "text-[19px] font-bold text-navy" : muted ? "text-[16px] font-semibold text-text-muted" : "text-[16px] font-semibold text-text-dark"
        }`}
      >
        {fmtEUR(value)}
      </div>
    </div>
  );
}
