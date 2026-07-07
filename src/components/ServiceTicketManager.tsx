"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  addPersonnel,
  addTransportLine,
  removePersonnel,
  removeTransportLine,
  setPointage,
  updatePersonnel,
  updateTicket,
  updateTransportLine,
} from "@/actions/serviceTicket";
import { updateToolListItem } from "@/actions/toolList";
import { CalendarGrid, nextPointageCode } from "@/components/CalendarGrid";
import { useToast } from "@/components/Toast";
import { TRANSPORT_CODES } from "@/lib/company";
import { dateRange } from "@/lib/calendar";
import { fmtEUR } from "@/lib/format";
import { computeEquipementTotals, computePersonnelTotals, computeTransportTotal } from "@/lib/serviceTicketTotals";
import type {
  BonLivraison,
  PointageCode,
  ServiceTicket,
  ServiceTicketDay,
  ServiceTicketPersonnel,
  ServiceTicketTransport,
  ToolListItem,
  TransportCode,
} from "@/lib/types";

export function ServiceTicketManager({
  affaireId,
  ticket,
  personnel,
  transport,
  equipements,
  bls,
  days,
  variant,
}: {
  affaireId: string;
  ticket: ServiceTicket;
  personnel: ServiceTicketPersonnel[];
  transport: ServiceTicketTransport[];
  equipements: ToolListItem[];
  bls: BonLivraison[];
  days: ServiceTicketDay[];
  variant: "interne" | "operateur";
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();
  const readOnly = variant === "operateur";
  const showPrices = variant === "interne";

  const [period, setPeriod] = useState({ start: ticket.period_start, end: ticket.period_end });
  const [pointageMap, setPointageMap] = useState<Map<string, PointageCode>>(
    () => new Map(days.map((d) => [`${d.entity_id}:${d.date}`, d.code])),
  );

  const dates = useMemo(() => dateRange(period.start, period.end), [period.start, period.end]);

  const personnelTotals = useMemo(
    () => computePersonnelTotals(personnel, dates, pointageMap),
    [personnel, dates, pointageMap],
  );
  const transportTotal = useMemo(() => computeTransportTotal(transport), [transport]);
  const equipementTotals = useMemo(
    () => computeEquipementTotals(equipements, dates, pointageMap),
    [equipements, dates, pointageMap],
  );
  const personnelTotal = personnelTotals.reduce((sum, r) => sum + r.total, 0);
  const equipementTotal = equipementTotals.reduce((sum, r) => sum + r.total, 0);
  const grandTotal = personnelTotal + transportTotal + equipementTotal;

  // Every mutation here comes from a server action; router.refresh() re-pulls
  // the server-rendered props (personnel/transport/equipements) so the
  // detailed totals below reflect the saved value immediately.
  function run(promise: Promise<unknown>, errorMsg = "Échec de l'enregistrement.") {
    startTransition(async () => {
      try {
        await promise;
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : errorMsg);
      }
    });
  }

  function savePeriod(patch: Partial<ServiceTicket>) {
    const next = {
      ...period,
      ...(patch.period_start !== undefined ? { start: patch.period_start } : {}),
      ...(patch.period_end !== undefined ? { end: patch.period_end } : {}),
    };
    setPeriod(next);
    run(updateTicket(ticket.id, affaireId, patch));
  }

  function handleCell(entityType: "personnel" | "equipement", entityId: string, date: string, current: PointageCode | null) {
    if (readOnly) return;
    const next = nextPointageCode(current);
    setPointageMap((prev) => {
      const copy = new Map(prev);
      const key = `${entityId}:${date}`;
      if (next === null) copy.delete(key);
      else copy.set(key, next);
      return copy;
    });
    startTransition(async () => {
      try {
        await setPointage(ticket.id, affaireId, entityType, entityId, date, next);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement du pointage.");
      }
    });
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-3 gap-3 max-[700px]:grid-cols-1">
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Opérateur</label>
          <input
            defaultValue={ticket.operateur_nom ?? ""}
            disabled={readOnly}
            onBlur={(e) => !readOnly && run(updateTicket(ticket.id, affaireId, { operateur_nom: e.target.value }))}
            className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none disabled:bg-bg-sunken"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Début de période</label>
          <input
            type="date"
            defaultValue={period.start ?? ""}
            disabled={readOnly}
            onBlur={(e) => !readOnly && savePeriod({ period_start: e.target.value || null })}
            className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none disabled:bg-bg-sunken"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Fin de période</label>
          <input
            type="date"
            defaultValue={period.end ?? ""}
            disabled={readOnly}
            onBlur={(e) => !readOnly && savePeriod({ period_end: e.target.value || null })}
            className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none disabled:bg-bg-sunken"
          />
        </div>
      </div>

      <Section title="A — Personnel">
        <div className="mb-2.5 overflow-x-auto rounded-[10px] border border-border bg-bg-card">
          <table className="w-full min-w-[560px] text-[12.5px]">
            <thead>
              <tr className="bg-bg-sunken">
                {["Nom", "Société", ...(showPrices ? ["Mob €", "Demob €", "Tarif/j €"] : []), ...(readOnly ? [] : [""])].map((h) => (
                  <th key={h} className="border-b border-border px-2.5 py-2 text-left text-[10.5px] font-semibold uppercase text-text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {personnel.map((p) => (
                <tr key={p.id}>
                  <td className="border-b border-border/60 px-2.5 py-1.5">
                    <input
                      defaultValue={p.nom}
                      disabled={readOnly}
                      onBlur={(e) => !readOnly && run(updatePersonnel(p.id, affaireId, { nom: e.target.value }))}
                      className="w-[150px] rounded border border-border px-1.5 py-1 text-[12px] disabled:border-transparent disabled:bg-transparent"
                    />
                  </td>
                  <td className="border-b border-border/60 px-2.5 py-1.5">
                    <input
                      defaultValue={p.societe ?? ""}
                      disabled={readOnly}
                      onBlur={(e) => !readOnly && run(updatePersonnel(p.id, affaireId, { societe: e.target.value }))}
                      className="w-[90px] rounded border border-border px-1.5 py-1 text-[12px] disabled:border-transparent disabled:bg-transparent"
                    />
                  </td>
                  {showPrices && (
                    <>
                      <PriceInput value={p.tarif_mob} onSave={(v) => run(updatePersonnel(p.id, affaireId, { tarif_mob: v }))} />
                      <PriceInput value={p.tarif_demob} onSave={(v) => run(updatePersonnel(p.id, affaireId, { tarif_demob: v }))} />
                      <PriceInput value={p.tarif_jour} onSave={(v) => run(updatePersonnel(p.id, affaireId, { tarif_jour: v }))} />
                    </>
                  )}
                  {!readOnly && (
                    <td className="border-b border-border/60 px-2.5 py-1.5">
                      <button onClick={() => run(removePersonnel(p.id, affaireId))} className="text-danger hover:underline">
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!readOnly && (
          <button
            onClick={() => run(addPersonnel(ticket.id, affaireId, { nom: "Nouveau personnel", societe: "EDL" }))}
            className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-semibold hover:bg-bg-sunken"
          >
            + Personnel
          </button>
        )}
      </Section>

      <Section title="Pointage — Personnel">
        <CalendarGrid
          rows={personnel.map((p) => ({ id: p.id, label: p.nom }))}
          dates={dates}
          pointage={pointageMap}
          readOnly={readOnly}
          onCellClick={(id, date, cur) => handleCell("personnel", id, date, cur)}
        />
      </Section>

      <Section title="B — Transport & prestations ponctuelles">
        <div className="mb-2.5 overflow-x-auto rounded-[10px] border border-border bg-bg-card">
          <table className="w-full min-w-[560px] text-[12.5px]">
            <thead>
              <tr className="bg-bg-sunken">
                {["Désignation", "Code", ...(showPrices ? ["Prix unit. €"] : []), "BL", "Qté", ...(showPrices ? ["Total €"] : []), ...(readOnly ? [] : [""])].map(
                  (h) => (
                    <th key={h} className="border-b border-border px-2.5 py-2 text-left text-[10.5px] font-semibold uppercase text-text-muted">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {transport.map((t) => (
                <tr key={t.id}>
                  <td className="border-b border-border/60 px-2.5 py-1.5">
                    <input
                      defaultValue={t.designation}
                      disabled={readOnly}
                      onBlur={(e) => !readOnly && run(updateTransportLine(t.id, affaireId, { designation: e.target.value }))}
                      className="w-[200px] rounded border border-border px-1.5 py-1 text-[12px] disabled:border-transparent disabled:bg-transparent"
                    />
                  </td>
                  <td className="border-b border-border/60 px-2.5 py-1.5">
                    {readOnly ? (
                      t.code
                    ) : (
                      <select
                        defaultValue={t.code}
                        onChange={(e) => run(updateTransportLine(t.id, affaireId, { code: e.target.value as TransportCode }))}
                        className="rounded border border-border px-1.5 py-1 text-[12px]"
                      >
                        {TRANSPORT_CODES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  {showPrices && <PriceInput value={t.prix_unitaire} onSave={(v) => run(updateTransportLine(t.id, affaireId, { prix_unitaire: v }))} />}
                  <td className="border-b border-border/60 px-2.5 py-1.5">
                    <input
                      defaultValue={t.bl_reference ?? ""}
                      disabled={readOnly}
                      onBlur={(e) => !readOnly && run(updateTransportLine(t.id, affaireId, { bl_reference: e.target.value }))}
                      className="w-[80px] rounded border border-border px-1.5 py-1 text-[12px] disabled:border-transparent disabled:bg-transparent"
                    />
                  </td>
                  {readOnly ? (
                    <td className="border-b border-border/60 px-2.5 py-1.5">{t.quantite}</td>
                  ) : (
                    <PriceInput value={t.quantite} onSave={(v) => run(updateTransportLine(t.id, affaireId, { quantite: v }))} />
                  )}
                  {showPrices && (
                    <td className="border-b border-border/60 px-2.5 py-1.5 font-mono font-semibold text-navy">
                      {fmtEUR((t.prix_unitaire || 0) * (t.quantite || 0))}
                    </td>
                  )}
                  {!readOnly && (
                    <td className="border-b border-border/60 px-2.5 py-1.5">
                      <button onClick={() => run(removeTransportLine(t.id, affaireId))} className="text-danger hover:underline">
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!readOnly && (
          <button
            onClick={() => run(addTransportLine(ticket.id, affaireId, { designation: "Transport", code: "Aller", quantite: 1 }))}
            className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-semibold hover:bg-bg-sunken"
          >
            + Ligne de transport
          </button>
        )}
      </Section>

      <Section title={showPrices ? "C — Location d'équipements" : "Équipements"}>
        {showPrices && (
          <div className="mb-3 overflow-x-auto rounded-[10px] border border-border bg-bg-card">
            <table className="w-full min-w-[760px] text-[12.5px]">
              <thead>
                <tr className="bg-bg-sunken">
                  {["Équipement", "S €/j", "O €/j", "UC €", "LIH €", "Insp. €", "Restock. €"].map((h) => (
                    <th key={h} className="border-b border-border px-2.5 py-2 text-left text-[10.5px] font-semibold uppercase text-text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {equipements.map((item) => (
                  <tr key={item.id}>
                    <td className="border-b border-border/60 px-2.5 py-1.5">{item.designation.split("\n")[0]}</td>
                    <PriceInput value={item.prix_stand_by} onSave={(v) => run(updateToolListItem(item.id, affaireId, { prix_stand_by: v }))} />
                    <PriceInput value={item.prix_operation} onSave={(v) => run(updateToolListItem(item.id, affaireId, { prix_operation: v }))} />
                    <PriceInput value={item.prix_uc} onSave={(v) => run(updateToolListItem(item.id, affaireId, { prix_uc: v }))} />
                    <PriceInput value={item.prix_lih} onSave={(v) => run(updateToolListItem(item.id, affaireId, { prix_lih: v }))} />
                    <PriceInput value={item.prix_inspection} onSave={(v) => run(updateToolListItem(item.id, affaireId, { prix_inspection: v }))} />
                    <PriceInput value={item.prix_restocking} onSave={(v) => run(updateToolListItem(item.id, affaireId, { prix_restocking: v }))} />
                  </tr>
                ))}
                {equipements.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-3 text-center text-text-muted">
                      Aucun équipement dans la Tool List.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <CalendarGrid
          rows={equipements.map((e) => {
            const bl = bls.find((b) => b.id === e.bl_id);
            const suffix = [e.numero_serie, bl ? `BL ${bl.numero_bl}` : null].filter(Boolean).join(" · ");
            return { id: e.id, label: `${e.designation.split("\n")[0]}${suffix ? ` · ${suffix}` : ""}` };
          })}
          dates={dates}
          pointage={pointageMap}
          readOnly={readOnly}
          onCellClick={(id, date, cur) => handleCell("equipement", id, date, cur)}
        />
      </Section>

      {showPrices && (
        <Section title="Total détaillé">
          <div className="mb-4 overflow-x-auto rounded-[10px] border border-border bg-bg-card">
            <table className="w-full min-w-[520px] text-[12.5px]">
              <thead>
                <tr className="bg-bg-sunken">
                  {["Personnel", "Jours S", "Jours O", "Total €"].map((h) => (
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
                    <td className="border-b border-border/60 px-2.5 py-1.5">{row.joursS}</td>
                    <td className="border-b border-border/60 px-2.5 py-1.5">{row.joursO}</td>
                    <td className="border-b border-border/60 px-2.5 py-1.5 font-mono">{fmtEUR(row.total)}</td>
                  </tr>
                ))}
                {personnelTotals.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-text-muted">
                      Aucun personnel.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-bg-sunken/60">
                  <td colSpan={3} className="px-2.5 py-1.5 text-right font-semibold text-text-muted">
                    Sous-total Personnel
                  </td>
                  <td className="px-2.5 py-1.5 font-mono font-semibold text-navy">{fmtEUR(personnelTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mb-4 overflow-x-auto rounded-[10px] border border-border bg-bg-card">
            <table className="w-full min-w-[420px] text-[12.5px]">
              <tfoot>
                <tr className="bg-bg-sunken/60">
                  <td className="px-2.5 py-1.5 text-right font-semibold text-text-muted">Sous-total Transport & prestations</td>
                  <td className="w-[110px] px-2.5 py-1.5 font-mono font-semibold text-navy">{fmtEUR(transportTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mb-4 overflow-x-auto rounded-[10px] border border-border bg-bg-card">
            <table className="w-full min-w-[560px] text-[12.5px]">
              <thead>
                <tr className="bg-bg-sunken">
                  {["Équipement", "Jours S", "Jours O", "Total €"].map((h) => (
                    <th key={h} className="border-b border-border px-2.5 py-2 text-left text-[10.5px] font-semibold uppercase text-text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {equipementTotals.map((row) => (
                  <tr key={row.item.id}>
                    <td className="border-b border-border/60 px-2.5 py-1.5">{row.item.designation.split("\n")[0]}</td>
                    <td className="border-b border-border/60 px-2.5 py-1.5">{row.joursS}</td>
                    <td className="border-b border-border/60 px-2.5 py-1.5">{row.joursO}</td>
                    <td className="border-b border-border/60 px-2.5 py-1.5 font-mono">{fmtEUR(row.total)}</td>
                  </tr>
                ))}
                {equipementTotals.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-text-muted">
                      Aucun équipement.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-bg-sunken/60">
                  <td colSpan={3} className="px-2.5 py-1.5 text-right font-semibold text-text-muted">
                    Sous-total Équipements
                  </td>
                  <td className="px-2.5 py-1.5 font-mono font-semibold text-navy">{fmtEUR(equipementTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-[260px] rounded-[10px] border border-border bg-bg-card p-4 text-[13.5px]">
              <div className="flex justify-between border-t border-border pt-1.5 font-semibold text-navy">
                <span>Total général HT</span>
                <span className="font-mono">{fmtEUR(grandTotal)}</span>
              </div>
            </div>
          </div>
        </Section>
      )}
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

function PriceInput({ value, onSave }: { value: number | null; onSave: (v: number) => void }) {
  return (
    <td className="border-b border-border/60 px-2.5 py-1.5">
      <input
        type="number"
        step="0.01"
        defaultValue={value ?? ""}
        onBlur={(e) => onSave(e.target.value ? Number(e.target.value) : 0)}
        className="w-[70px] rounded border border-border px-1.5 py-1 text-[12px]"
      />
    </td>
  );
}
