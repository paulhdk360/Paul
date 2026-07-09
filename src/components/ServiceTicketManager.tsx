"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  addPersonnel,
  addTransportLine,
  removePersonnel,
  removeTransportLine,
  setPointage,
  setPointageBulk,
  updatePersonnel,
  updateTicket,
  updateTransportLine,
} from "@/actions/serviceTicket";
import { updateToolListItem } from "@/actions/toolList";
import { notifyUser } from "@/actions/notifications";
import { CalendarGrid, nextPointageCode } from "@/components/CalendarGrid";
import { useToast } from "@/components/Toast";
import { POINTAGE_CODES, TRANSPORT_CODES } from "@/lib/company";
import { dateRange, firstOfCurrentMonth } from "@/lib/calendar";
import { fmtEUR } from "@/lib/format";
import { generateServiceTicketPdf } from "@/lib/pdf/serviceTicketPdf";
import { generateFillableServiceTicketPdf } from "@/lib/pdf/serviceTicketFillablePdf";
import { computeEquipementTotals, computePersonnelTotals, computeTransportTotal } from "@/lib/serviceTicketTotals";
import type {
  Affaire,
  BonLivraison,
  Client,
  PointageCode,
  Profile,
  ServiceTicket,
  ServiceTicketDay,
  ServiceTicketPersonnel,
  ServiceTicketTransport,
  ToolListItem,
  TransportCode,
} from "@/lib/types";

export function ServiceTicketManager({
  affaireId,
  affaire,
  client,
  ticket,
  personnel,
  transport,
  equipements,
  bls,
  days,
  profiles = [],
  currentUserId,
  variant,
}: {
  affaireId: string;
  affaire: Affaire;
  client: Client | null;
  ticket: ServiceTicket;
  personnel: ServiceTicketPersonnel[];
  transport: ServiceTicketTransport[];
  equipements: ToolListItem[];
  bls: BonLivraison[];
  days: ServiceTicketDay[];
  profiles?: Profile[];
  currentUserId?: string;
  variant: "interne" | "operateur";
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();
  // Both variants can point equipment/personnel usage and edit operational
  // fields — only pricing is gated, by showPrices, so an opérateur logging
  // their own MOB/S/O/DEMOB/FIN/LIH days never sees a euro figure.
  const showPrices = variant === "interne";
  const [notifyTo, setNotifyTo] = useState("");
  const otherProfiles = profiles.filter((p) => p.id !== currentUserId && p.role !== "operateur");

  function notify() {
    if (!notifyTo) {
      showToast("Choisissez un destinataire.");
      return;
    }
    startTransition(async () => {
      try {
        await notifyUser(
          notifyTo,
          `Service Ticket à vérifier — affaire ${affaire.reference}`,
          `/affaires/${affaireId}/service-ticket`,
        );
        showToast("Notification envoyée.");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'envoi de la notification.");
      }
    });
  }

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

  function handleBulk(entityType: "personnel" | "equipement", entityIds: string[], bulkDates: string[], code: PointageCode | null) {
    setPointageMap((prev) => {
      const copy = new Map(prev);
      for (const id of entityIds) {
        for (const d of bulkDates) {
          const key = `${id}:${d}`;
          if (code === null) copy.delete(key);
          else copy.set(key, code);
        }
      }
      return copy;
    });
    startTransition(async () => {
      try {
        await setPointageBulk(ticket.id, affaireId, entityType, entityIds, bulkDates, code);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'application groupée.");
      }
    });
  }

  function downloadPdf() {
    try {
      generateServiceTicketPdf({
        ticket,
        personnel,
        transport,
        equipements,
        bls,
        dates,
        pointage: pointageMap,
        affaire,
        client,
        variant,
      });
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Échec de la génération du PDF.");
    }
  }

  function downloadFillablePdf() {
    try {
      generateFillableServiceTicketPdf({
        ticket,
        personnel,
        equipements,
        transport,
        bls,
        dates,
        pointage: pointageMap,
        affaire,
        client,
      });
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Échec de la génération de la fiche à remplir.");
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        {showPrices ? (
          <div className="flex flex-1 flex-wrap items-end gap-2 rounded-lg border border-blue/30 bg-blue/5 p-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Notifier un collègue</label>
              <select
                value={notifyTo}
                onChange={(e) => setNotifyTo(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
              >
                <option value="">— Choisir —</option>
                {otherProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name ?? p.email}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={notify} className="rounded-lg bg-navy px-4 py-2 text-[13px] font-semibold text-white hover:bg-navy-dark">
              Notifier — Service Ticket à vérifier
            </button>
          </div>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <button onClick={downloadFillablePdf} className="rounded-lg border border-border px-3 py-2 text-[12.5px] font-semibold hover:bg-bg-sunken">
            Télécharger la fiche à remplir
          </button>
          <button onClick={downloadPdf} className="rounded-lg border border-border px-3 py-2 text-[12.5px] font-semibold hover:bg-bg-sunken">
            Télécharger le PDF
          </button>
        </div>
      </div>

      {showPrices && (
        <div className="mb-5 grid grid-cols-4 gap-3 rounded-[10px] border border-navy/20 bg-navy/5 p-4 max-[700px]:grid-cols-2">
          <TotalStat label="Personnel" value={personnelTotal} />
          <TotalStat label="Transport" value={transportTotal} />
          <TotalStat label="Location équipements" value={equipementTotal} />
          <TotalStat label="Total général HT" value={grandTotal} strong />
        </div>
      )}

      <div className="mb-5 grid grid-cols-3 gap-3 max-[700px]:grid-cols-1">
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Opérateur</label>
          <input
            defaultValue={ticket.operateur_nom ?? ""}
            onBlur={(e) => run(updateTicket(ticket.id, affaireId, { operateur_nom: e.target.value }))}
            className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Début de période</label>
          <input
            type="date"
            value={period.start ?? ""}
            onChange={(e) => savePeriod({ period_start: e.target.value || null })}
            className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Fin de période</label>
          <input
            type="date"
            value={period.end ?? ""}
            onChange={(e) => savePeriod({ period_end: e.target.value || null })}
            className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
          />
        </div>
      </div>

      {!showPrices && (
        <p className="mb-5 rounded-lg border border-blue/30 bg-blue/5 p-3 text-[12.5px] text-navy">
          Cliquez une case du calendrier pour faire défiler les codes de pointage : <b>MOB</b> → <b>S</b> (Stand By) →{" "}
          <b>O</b> (Operation) → <b>FOC</b> (Free Of Charge) → <b>DEMOB</b> → <b>FIN</b> → <b>LIH</b> (Lost In Hole) →
          case vide.
        </p>
      )}

      <Section title="A — Personnel">
        <div className="mb-2.5 overflow-x-auto rounded-[10px] border border-border bg-bg-card">
          <table className="w-full min-w-[560px] text-[12.5px]">
            <thead>
              <tr className="bg-bg-sunken">
                {["Nom", "Société", ...(showPrices ? ["Mob €", "Demob €", "Tarif/j €"] : []), ""].map((h) => (
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
                      onBlur={(e) => run(updatePersonnel(p.id, affaireId, { nom: e.target.value }))}
                      className="w-[150px] rounded border border-border px-1.5 py-1 text-[12px]"
                    />
                  </td>
                  <td className="border-b border-border/60 px-2.5 py-1.5">
                    <input
                      defaultValue={p.societe ?? ""}
                      onBlur={(e) => run(updatePersonnel(p.id, affaireId, { societe: e.target.value }))}
                      className="w-[90px] rounded border border-border px-1.5 py-1 text-[12px]"
                    />
                  </td>
                  {showPrices && (
                    <>
                      <PriceInput value={p.tarif_mob} onSave={(v) => run(updatePersonnel(p.id, affaireId, { tarif_mob: v }))} />
                      <PriceInput value={p.tarif_demob} onSave={(v) => run(updatePersonnel(p.id, affaireId, { tarif_demob: v }))} />
                      <PriceInput value={p.tarif_jour} onSave={(v) => run(updatePersonnel(p.id, affaireId, { tarif_jour: v }))} />
                    </>
                  )}
                  <td className="border-b border-border/60 px-2.5 py-1.5">
                    <button onClick={() => run(removePersonnel(p.id, affaireId))} className="text-danger hover:underline">
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={() => run(addPersonnel(ticket.id, affaireId, { nom: "Nouveau personnel", societe: "EDL" }))}
          className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-semibold hover:bg-bg-sunken"
        >
          + Personnel
        </button>
      </Section>

      <Section title="Pointage — Personnel">
        <PointageBulkTool
          rows={personnel.map((p) => ({ id: p.id, label: p.nom }))}
          dates={dates}
          onApply={(ids, d, code) => handleBulk("personnel", ids, d, code)}
          onJumpToFirstOfMonth={() => savePeriod({ period_start: firstOfCurrentMonth() })}
        />
        <CalendarGrid
          rows={personnel.map((p) => ({ id: p.id, label: p.nom }))}
          dates={dates}
          pointage={pointageMap}
          readOnly={false}
          onCellClick={(id, date, cur) => handleCell("personnel", id, date, cur)}
        />
      </Section>

      <Section title="B — Transport & prestations ponctuelles">
        <div className="mb-2.5 overflow-x-auto rounded-[10px] border border-border bg-bg-card">
          <table className="w-full min-w-[560px] text-[12.5px]">
            <thead>
              <tr className="bg-bg-sunken">
                {["Désignation", "Code", ...(showPrices ? ["Prix unit. €", "Coût réel €"] : []), "BL", "Qté", ...(showPrices ? ["Total €"] : []), ""].map(
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
                      onBlur={(e) => run(updateTransportLine(t.id, affaireId, { designation: e.target.value }))}
                      className="w-[200px] rounded border border-border px-1.5 py-1 text-[12px]"
                    />
                  </td>
                  <td className="border-b border-border/60 px-2.5 py-1.5">
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
                  </td>
                  {showPrices && <PriceInput value={t.prix_unitaire} onSave={(v) => run(updateTransportLine(t.id, affaireId, { prix_unitaire: v }))} />}
                  {showPrices && <PriceInput value={t.cout_reel} onSave={(v) => run(updateTransportLine(t.id, affaireId, { cout_reel: v }))} />}
                  <td className="border-b border-border/60 px-2.5 py-1.5">
                    <input
                      defaultValue={t.bl_reference ?? ""}
                      onBlur={(e) => run(updateTransportLine(t.id, affaireId, { bl_reference: e.target.value }))}
                      className="w-[80px] rounded border border-border px-1.5 py-1 text-[12px]"
                    />
                  </td>
                  <PriceInput value={t.quantite} onSave={(v) => run(updateTransportLine(t.id, affaireId, { quantite: v }))} />
                  {showPrices && (
                    <td className="border-b border-border/60 px-2.5 py-1.5 font-mono font-semibold text-navy">
                      {fmtEUR((t.prix_unitaire || 0) * (t.quantite || 0))}
                    </td>
                  )}
                  <td className="border-b border-border/60 px-2.5 py-1.5">
                    <button onClick={() => run(removeTransportLine(t.id, affaireId))} className="text-danger hover:underline">
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={() => run(addTransportLine(ticket.id, affaireId, { designation: "Transport", code: "Aller", quantite: 1 }))}
          className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-semibold hover:bg-bg-sunken"
        >
          + Ligne de transport
        </button>
        {showPrices && (
          <p className="mt-2 text-[11.5px] text-text-muted">
            « Prix unit. » est le prix facturé au client (avec marge) ; « Coût réel » est ce que le transport nous
            coûte réellement — utilisé uniquement pour le calcul de la rentabilité de l&apos;affaire.
          </p>
        )}
      </Section>

      <Section title={showPrices ? "C — Location d'équipements" : "Équipements"}>
        {showPrices && (
          <div className="mb-3 overflow-x-auto rounded-[10px] border border-border bg-bg-card">
            <table className="w-full min-w-[900px] text-[12.5px]">
              <thead>
                <tr className="bg-bg-sunken">
                  {["Équipement", "N° série", "S €/j", "O €/j", "UC €", "LIH €", "Inspection", "Restocking", "Serrage"].map((h) => (
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
                    <td className="border-b border-border/60 px-2.5 py-1.5 font-mono text-[11.5px] text-text-muted">{item.numero_serie ?? "—"}</td>
                    <PriceInput value={item.prix_stand_by} onSave={(v) => run(updateToolListItem(item.id, affaireId, { prix_stand_by: v }))} />
                    <PriceInput value={item.prix_operation} onSave={(v) => run(updateToolListItem(item.id, affaireId, { prix_operation: v }))} />
                    <PriceInput value={item.prix_uc} onSave={(v) => run(updateToolListItem(item.id, affaireId, { prix_uc: v }))} />
                    <PriceInput value={item.prix_lih} onSave={(v) => run(updateToolListItem(item.id, affaireId, { prix_lih: v }))} />
                    <PriceToggleCell
                      price={item.prix_inspection}
                      checked={item.inspection_facturee}
                      onPriceSave={(v) => run(updateToolListItem(item.id, affaireId, { prix_inspection: v }))}
                      onToggle={(checked) => run(updateToolListItem(item.id, affaireId, { inspection_facturee: checked }))}
                    />
                    <PriceToggleCell
                      price={item.prix_restocking}
                      checked={item.restocking_facture}
                      onPriceSave={(v) => run(updateToolListItem(item.id, affaireId, { prix_restocking: v }))}
                      onToggle={(checked) => run(updateToolListItem(item.id, affaireId, { restocking_facture: checked }))}
                    />
                    <PriceToggleCell
                      price={item.prix_serrage}
                      checked={item.serrage_facture}
                      onPriceSave={(v) => run(updateToolListItem(item.id, affaireId, { prix_serrage: v }))}
                      onToggle={(checked) => run(updateToolListItem(item.id, affaireId, { serrage_facture: checked }))}
                    />
                  </tr>
                ))}
                {equipements.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-3 text-center text-text-muted">
                      Aucun équipement dans la Tool List.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {showPrices && (
          <p className="mb-3 text-[11.5px] text-text-muted">
            L&apos;UC se déclenche automatiquement dès qu&apos;une journée <b>O</b> est pointée, facturée une seule
            fois (elle ne s&apos;applique jamais sur du Stand By seul). Une journée pointée <b>FOC</b> (Free Of
            Charge) n&apos;est jamais facturée, ni en Stand-By ni en Operation — elle ne compte pour rien dans les
            totaux ci-dessous. Le Lost In
            Hole se déclenche en pointant <b>LIH</b> sur le calendrier ci-dessous, ce qui arrête aussi le décompte des
            jours pour cet équipement. Inspection, Restocking et Serrage se cochent manuellement (prix + case à
            cocher dans la même colonne).
          </p>
        )}
        {!showPrices && (
          <div className="mb-3 overflow-x-auto rounded-[10px] border border-border bg-bg-card">
            <table className="w-full min-w-[640px] text-[12.5px]">
              <thead>
                <tr className="bg-bg-sunken">
                  {["Réf. article", "Désignation", "N° série", "N° BL"].map((h) => (
                    <th key={h} className="border-b border-border px-2.5 py-2 text-left text-[10.5px] font-semibold uppercase text-text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {equipements.map((item) => {
                  const bl = bls.find((b) => b.id === item.bl_id);
                  return (
                    <tr key={item.id}>
                      <td className="border-b border-border/60 px-2.5 py-1.5 font-mono text-[11.5px] text-text-muted">{item.reference_article ?? "—"}</td>
                      <td className="border-b border-border/60 px-2.5 py-1.5">{item.designation.split("\n")[0]}</td>
                      <td className="border-b border-border/60 px-2.5 py-1.5 font-mono text-[11.5px] text-text-muted">{item.numero_serie ?? "—"}</td>
                      <td className="border-b border-border/60 px-2.5 py-1.5">{bl?.numero_bl ?? "—"}</td>
                    </tr>
                  );
                })}
                {equipements.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-text-muted">
                      Aucun équipement dans la Tool List.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <PointageBulkTool
          rows={equipements.map((e) => ({ id: e.id, label: e.designation.split("\n")[0] }))}
          dates={dates}
          onApply={(ids, d, code) => handleBulk("equipement", ids, d, code)}
          onJumpToFirstOfMonth={() => savePeriod({ period_start: firstOfCurrentMonth() })}
        />
        <CalendarGrid
          rows={equipements.map((e) => {
            const bl = bls.find((b) => b.id === e.bl_id);
            return {
              id: e.id,
              label: e.designation.split("\n")[0],
              sublabel: e.numero_serie ?? undefined,
              secondary: bl?.numero_bl,
            };
          })}
          dates={dates}
          pointage={pointageMap}
          readOnly={false}
          secondaryColumnLabel="N° BL"
          onCellClick={(id, date, cur) => handleCell("equipement", id, date, cur)}
        />
      </Section>

      {showPrices && (
        <Section title="Total détaillé">
          <div className="mb-4 overflow-x-auto rounded-[10px] border border-border bg-bg-card">
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
                <tr className="bg-bg-sunken/40">
                  <td colSpan={5} className="px-2.5 py-1.5 text-right text-text-muted">
                    Sous-total Mob / Demob
                  </td>
                  <td className="px-2.5 py-1.5 font-mono text-text-dark">
                    {fmtEUR(personnelTotals.reduce((sum, r) => sum + r.montantMobDemob, 0))}
                  </td>
                </tr>
                <tr className="bg-bg-sunken/40">
                  <td colSpan={5} className="px-2.5 py-1.5 text-right text-text-muted">
                    Sous-total Jours Operation
                  </td>
                  <td className="px-2.5 py-1.5 font-mono text-text-dark">
                    {fmtEUR(personnelTotals.reduce((sum, r) => sum + r.montantJour, 0))}
                  </td>
                </tr>
                <tr className="bg-bg-sunken/60">
                  <td colSpan={5} className="px-2.5 py-1.5 text-right font-semibold text-text-muted">
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

// Prominent up-top summary of the same Personnel/Transport/Équipements sum
// detailed further down in "Total détaillé" — so the grand total is visible
// without scrolling past every pricing table first.
function TotalStat({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</div>
      <div className={`font-mono ${strong ? "text-[19px] font-bold text-navy" : "text-[16px] font-semibold text-text-dark"}`}>{fmtEUR(value)}</div>
    </div>
  );
}

// Select a range of dates (+ one or more rows) and apply one pointage code
// to every resulting cell at once — the alternative to clicking cell by cell.
function PointageBulkTool({
  rows,
  dates,
  onApply,
  onJumpToFirstOfMonth,
}: {
  rows: { id: string; label: string }[];
  dates: string[];
  onApply: (entityIds: string[], dates: string[], code: PointageCode | null) => void;
  onJumpToFirstOfMonth?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [start, setStart] = useState(dates[0] ?? "");
  const [end, setEnd] = useState(dates[dates.length - 1] ?? "");
  const [code, setCode] = useState<string>("MOB");

  const bulkDates = useMemo(() => (start && end ? dateRange(start, end) : []), [start, end]);

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))));
  }

  function apply() {
    if (selectedIds.size === 0 || bulkDates.length === 0) return;
    onApply(Array.from(selectedIds), bulkDates, code ? (code as PointageCode) : null);
  }

  if (rows.length === 0) return null;

  return (
    <div className="mb-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold ${open ? "bg-navy text-white" : "border border-border text-text-muted hover:bg-bg-sunken"}`}
      >
        📅 Pointer sur plusieurs dates
      </button>
      {onJumpToFirstOfMonth && (
        <button
          type="button"
          onClick={onJumpToFirstOfMonth}
          className="ml-2 rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-semibold text-blue hover:bg-bg-sunken"
        >
          1er du mois
        </button>
      )}
      {open && (
        <div className="mt-2.5 rounded-[10px] border border-border bg-bg-card p-3.5">
          <div className="mb-3 grid grid-cols-3 gap-3 max-[700px]:grid-cols-1">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-[11.5px] font-semibold text-text-muted">Du</label>
                <button
                  type="button"
                  onClick={() => setStart(firstOfCurrentMonth())}
                  className="text-[11px] font-semibold text-blue hover:underline"
                >
                  1er du mois
                </button>
              </div>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-[13px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-semibold text-text-muted">Au</label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-[13px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-semibold text-text-muted">Code</label>
              <select
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-[13px] focus:border-blue focus:outline-none"
              >
                <option value="">— Effacer —</option>
                {POINTAGE_CODES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11.5px] font-semibold text-text-muted">Lignes</span>
              <button onClick={toggleAll} className="text-[11px] font-semibold text-blue hover:underline">
                {selectedIds.size === rows.length ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {rows.map((r) => (
                <label
                  key={r.id}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium ${
                    selectedIds.has(r.id) ? "border-navy bg-navy/10 text-navy" : "border-border text-text-muted"
                  }`}
                >
                  <input type="checkbox" className="hidden" checked={selectedIds.has(r.id)} onChange={() => toggle(r.id)} />
                  {r.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-muted">
              {selectedIds.size} ligne(s) × {bulkDates.length} jour(s) = {selectedIds.size * bulkDates.length} case(s)
            </span>
            <button onClick={apply} className="rounded-lg bg-navy px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-navy-dark">
              Appliquer
            </button>
          </div>
        </div>
      )}
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

// Price + "facturé ?" checkbox combined into a single column, instead of
// two separate columns for the same charge (Inspection/Restocking/Serrage).
function PriceToggleCell({
  price,
  checked,
  onPriceSave,
  onToggle,
}: {
  price: number | null;
  checked: boolean;
  onPriceSave: (v: number) => void;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <td className="border-b border-border/60 px-2.5 py-1.5">
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          step="0.01"
          defaultValue={price ?? ""}
          onBlur={(e) => onPriceSave(e.target.value ? Number(e.target.value) : 0)}
          className="w-[60px] rounded border border-border px-1.5 py-1 text-[12px]"
        />
        <input type="checkbox" defaultChecked={checked} onChange={(e) => onToggle(e.target.checked)} title="Facturé" />
      </div>
    </td>
  );
}
