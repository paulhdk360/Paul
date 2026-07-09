import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { blockAtelierGlobal, blockOperateurGlobal } from "@/lib/auth";
import { Badge } from "@/components/Badge";
import { TYPES_ACTIVITE, TYPES_TRANSACTION } from "@/lib/company";
import { fmtDate, fmtEUR, fmtNum } from "@/lib/format";
import { KpiCard } from "@/components/KpiCard";
import { computeAffaireRentabilite } from "@/lib/rentabilite";
import type {
  Achat,
  Affaire,
  CatalogueOutil,
  Client,
  Devis,
  DevisLigne,
  ServiceTicket,
  ServiceTicketDay,
  ServiceTicketPersonnel,
  ServiceTicketTransport,
  ToolListItem,
} from "@/lib/types";

export default async function DashboardPage() {
  await blockOperateurGlobal();
  await blockAtelierGlobal();
  const supabase = createClient();
  const [devisRes, lignesRes, outilsRes, daysRes, transportRes, affairesRes, clientsRes, ticketsRes, personnelRes, itemsRes, achatsRes] =
    await Promise.all([
      supabase.from("devis").select("*"),
      supabase.from("devis_lignes").select("*"),
      supabase.from("catalogue_outils").select("*"),
      supabase.from("service_ticket_days").select("*"),
      supabase.from("service_ticket_transport").select("*"),
      supabase.from("affaires").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("*"),
      supabase.from("service_tickets").select("*"),
      supabase.from("service_ticket_personnel").select("*"),
      supabase.from("tool_list_items").select("*"),
      supabase.from("achats").select("*"),
    ]);

  const devis = (devisRes.data ?? []) as Devis[];
  const lignes = (lignesRes.data ?? []) as DevisLigne[];
  const outils = (outilsRes.data ?? []) as CatalogueOutil[];
  const days = (daysRes.data ?? []) as ServiceTicketDay[];
  const transports = (transportRes.data ?? []) as ServiceTicketTransport[];
  const affaires = (affairesRes.data ?? []) as Affaire[];
  const clients = (clientsRes.data ?? []) as Client[];
  const tickets = (ticketsRes.data ?? []) as ServiceTicket[];
  const personnel = (personnelRes.data ?? []) as ServiceTicketPersonnel[];
  const items = (itemsRes.data ?? []) as ToolListItem[];
  const achats = (achatsRes.data ?? []) as Achat[];
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const lignesByDevis = new Map<string, DevisLigne[]>();
  for (const l of lignes) {
    const arr = lignesByDevis.get(l.devis_id) ?? [];
    arr.push(l);
    lignesByDevis.set(l.devis_id, arr);
  }
  const devisByAffaire = new Map<string, Devis[]>();
  for (const d of devis) {
    const arr = devisByAffaire.get(d.affaire_id) ?? [];
    arr.push(d);
    devisByAffaire.set(d.affaire_id, arr);
  }
  const ticketByAffaire = new Map(tickets.map((t) => [t.affaire_id, t]));
  const personnelByTicket = new Map<string, ServiceTicketPersonnel[]>();
  for (const p of personnel) {
    const arr = personnelByTicket.get(p.ticket_id) ?? [];
    arr.push(p);
    personnelByTicket.set(p.ticket_id, arr);
  }
  const transportByTicket = new Map<string, ServiceTicketTransport[]>();
  for (const t of transports) {
    const arr = transportByTicket.get(t.ticket_id) ?? [];
    arr.push(t);
    transportByTicket.set(t.ticket_id, arr);
  }
  const daysByTicket = new Map<string, ServiceTicketDay[]>();
  for (const d of days) {
    const arr = daysByTicket.get(d.ticket_id) ?? [];
    arr.push(d);
    daysByTicket.set(d.ticket_id, arr);
  }
  const equipementsByAffaire = new Map<string, ToolListItem[]>();
  for (const i of items) {
    const arr = equipementsByAffaire.get(i.affaire_id) ?? [];
    arr.push(i);
    equipementsByAffaire.set(i.affaire_id, arr);
  }
  const achatsByAffaire = new Map<string, Achat[]>();
  for (const a of achats) {
    if (!a.affaire_id) continue;
    const arr = achatsByAffaire.get(a.affaire_id) ?? [];
    arr.push(a);
    achatsByAffaire.set(a.affaire_id, arr);
  }

  // Revenue is realized per affaire — from the devis for a Vente affaire, or
  // from the Service Ticket's actual pointage for a Location affaire (a
  // rental quote never chiffres Stand-By/Operation, settled only from real
  // usage) — so every CA figure below is derived from this single per-affaire
  // computation rather than summing devis line totals directly.
  const rentabiliteByAffaire = new Map(
    affaires.map((a) => {
      const affaireDevis = devisByAffaire.get(a.id) ?? [];
      const ticket = ticketByAffaire.get(a.id) ?? null;
      return [
        a.id,
        computeAffaireRentabilite({
          affaire: a,
          devis: affaireDevis,
          lignes: affaireDevis.flatMap((d) => lignesByDevis.get(d.id) ?? []),
          ticket,
          personnel: ticket ? personnelByTicket.get(ticket.id) ?? [] : [],
          transport: ticket ? transportByTicket.get(ticket.id) ?? [] : [],
          equipements: equipementsByAffaire.get(a.id) ?? [],
          days: ticket ? daysByTicket.get(ticket.id) ?? [] : [],
          achats: achatsByAffaire.get(a.id) ?? [],
        }),
      ];
    }),
  );

  const countByStatut = (statut: string) => devis.filter((d) => d.statut === statut).length;

  const caPrevisionnel = affaires.reduce((sum, a) => sum + (rentabiliteByAffaire.get(a.id)?.revenu ?? 0), 0);

  const activiteOf = (a: Affaire) => {
    const affaireDevis = devisByAffaire.get(a.id) ?? [];
    const retenu = affaireDevis.find((d) => d.statut === "Accepté" || d.statut === "Envoyé") ?? affaireDevis[0];
    return retenu?.type_activite ?? null;
  };

  const caParActivite = TYPES_ACTIVITE.map((type) => ({
    type,
    ca: affaires.filter((a) => activiteOf(a) === type).reduce((sum, a) => sum + (rentabiliteByAffaire.get(a.id)?.revenu ?? 0), 0),
  })).filter((r) => r.ca > 0);

  const caParTransaction = TYPES_TRANSACTION.map((type) => ({
    type,
    ca: affaires.filter((a) => (a.type_transaction ?? "Location") === type).reduce((sum, a) => sum + (rentabiliteByAffaire.get(a.id)?.revenu ?? 0), 0),
  }));

  const affairesRentables = affaires
    .filter((a) => (rentabiliteByAffaire.get(a.id)?.revenu ?? 0) > 0)
    .sort((a, b) => (rentabiliteByAffaire.get(b.id)?.marge ?? 0) - (rentabiliteByAffaire.get(a.id)?.marge ?? 0))
    .slice(0, 5);

  const affairesEnCoursListe = affaires.filter((a) => a.statut === "En cours");

  const chargesTotales = affaires.reduce((sum, a) => sum + (rentabiliteByAffaire.get(a.id)?.chargesTotal ?? 0), 0);
  const beneficeTotal = caPrevisionnel - chargesTotales;
  const margeGlobalePct = caPrevisionnel > 0 ? (beneficeTotal / caPrevisionnel) * 100 : null;

  const materielDispo = outils.filter((o) => o.statut === "En stock").length;
  const materielDeploye = outils.filter((o) => ["Réservé", "Sur chantier", "En transit"].includes(o.statut)).length;
  const materielMaintenance = outils.filter((o) => ["À rectifier", "À recharger", "En attente d'inspection"].includes(o.statut)).length;
  const tauxUtilisation = outils.length ? Math.round((materielDeploye / outils.length) * 100) : 0;

  const joursOperation = days.filter((d) => d.code === "O").length;
  const joursStandBy = days.filter((d) => d.code === "S").length;

  const coutsTransport = transports.reduce((sum, t) => sum + (t.prix_unitaire || 0) * (t.quantite || 0), 0);

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide text-navy">Tableau de bord</div>
      <div className="mb-6 text-[13.5px] text-text-muted">Vue d&apos;ensemble de l&apos;activité</div>

      <div className="mb-6 grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
        <KpiCard label="Devis en préparation" value={countByStatut("Brouillon")} />
        <KpiCard label="Devis envoyés" value={countByStatut("Envoyé")} />
        <KpiCard label="Devis acceptés" value={countByStatut("Accepté")} />
        <KpiCard label="Devis refusés" value={countByStatut("Refusé")} />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
        <KpiCard label="Affaires en cours" value={affairesEnCoursListe.length} />
        <KpiCard label="CA réalisé/prévisionnel HT" value={fmtEUR(caPrevisionnel)} sub="Service Ticket (location) + devis (vente)" />
        <KpiCard label="Coûts de transport" value={fmtEUR(coutsTransport)} sub="Cumul tickets de service" />
      </div>

      <div className="mb-2 font-display text-[19px] font-semibold text-navy">Rentabilité globale</div>
      <div className="mb-6 grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
        <KpiCard label="CA total" value={fmtEUR(caPrevisionnel)} />
        <KpiCard label="Charges totales" value={fmtEUR(chargesTotales)} sub="Achats + transport réel + personnel" />
        <KpiCard label="Bénéfices" value={fmtEUR(beneficeTotal)} />
        <KpiCard label="Marge globale" value={margeGlobalePct === null ? "—" : `${margeGlobalePct.toFixed(1)} %`} />
      </div>

      <div className="mb-2 font-display text-[19px] font-semibold text-navy">Affaires en cours</div>
      <div className="mb-6 overflow-x-auto rounded-[10px] border border-border bg-bg-card">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead>
            <tr className="bg-bg-sunken">
              {["Référence", "Client", "Chantier", "Type", "Créée le", ""].map((h) => (
                <th key={h} className="border-b border-border px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {affairesEnCoursListe.map((a) => (
              <tr key={a.id} className="hover:bg-bg-sunken/50">
                <td className="border-b border-border/60 px-3 py-2 font-semibold text-navy">{a.reference}</td>
                <td className="border-b border-border/60 px-3 py-2">{clientById.get(a.client_id ?? "")?.raison_sociale ?? "—"}</td>
                <td className="border-b border-border/60 px-3 py-2">
                  {a.chantier || "—"}
                  {a.well_location ? ` · ${a.well_location}` : ""}
                </td>
                <td className="border-b border-border/60 px-3 py-2">
                  <Badge label={a.type_transaction ?? "Location"} tone={a.type_transaction === "Vente" ? "blue" : "neutral"} />
                </td>
                <td className="border-b border-border/60 px-3 py-2 text-text-muted">{fmtDate(a.created_at)}</td>
                <td className="border-b border-border/60 px-3 py-2 text-right">
                  <Link href={`/affaires/${a.id}`} className="text-blue hover:underline">
                    Ouvrir
                  </Link>
                </td>
              </tr>
            ))}
            {affairesEnCoursListe.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-text-muted">
                  Aucune affaire en cours.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mb-2 font-display text-[19px] font-semibold text-navy">Affaires les plus rentables</div>
      <div className="mb-6 overflow-x-auto rounded-[10px] border border-border bg-bg-card">
        <table className="w-full min-w-[820px] text-[13px]">
          <thead>
            <tr className="bg-bg-sunken">
              {["Référence", "Client", "Type", "Revenu", "Charges", "Marge", "Marge %", ""].map((h) => (
                <th key={h} className="border-b border-border px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {affairesRentables.map((a) => {
              const r = rentabiliteByAffaire.get(a.id)!;
              return (
                <tr key={a.id} className="hover:bg-bg-sunken/50">
                  <td className="border-b border-border/60 px-3 py-2 font-semibold text-navy">{a.reference}</td>
                  <td className="border-b border-border/60 px-3 py-2">{clientById.get(a.client_id ?? "")?.raison_sociale ?? "—"}</td>
                  <td className="border-b border-border/60 px-3 py-2">
                    <Badge label={a.type_transaction ?? "Location"} tone={a.type_transaction === "Vente" ? "blue" : "neutral"} />
                  </td>
                  <td className="border-b border-border/60 px-3 py-2 font-mono">{fmtEUR(r.revenu)}</td>
                  <td className="border-b border-border/60 px-3 py-2 font-mono">{fmtEUR(r.chargesTotal)}</td>
                  <td className="border-b border-border/60 px-3 py-2 font-mono font-semibold text-navy">{fmtEUR(r.marge)}</td>
                  <td className="border-b border-border/60 px-3 py-2 font-mono">{r.margePct === null ? "—" : `${r.margePct.toFixed(1)} %`}</td>
                  <td className="border-b border-border/60 px-3 py-2 text-right">
                    <Link href={`/affaires/${a.id}/rentabilite`} className="text-blue hover:underline">
                      Détail
                    </Link>
                  </td>
                </tr>
              );
            })}
            {affairesRentables.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-text-muted">
                  Aucune affaire avec un revenu calculé pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mb-2 font-display text-[19px] font-semibold text-navy">CA par activité</div>
      <div className="mb-6 grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
        {caParActivite.length === 0 && (
          <div className="col-span-4 text-[12.5px] text-text-muted max-[1100px]:col-span-2 max-[600px]:col-span-1">
            Aucune affaire avec un revenu calculé n&apos;a de type d&apos;activité renseigné.
          </div>
        )}
        {caParActivite.map((r) => (
          <KpiCard key={r.type} label={`CA ${r.type}`} value={fmtEUR(r.ca)} />
        ))}
      </div>

      <div className="mb-2 font-display text-[19px] font-semibold text-navy">CA par type de transaction</div>
      <div className="mb-6 grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
        {caParTransaction.map((r) => (
          <KpiCard key={r.type} label={`CA ${r.type}`} value={fmtEUR(r.ca)} />
        ))}
      </div>

      <div className="mb-2 font-display text-[19px] font-semibold text-navy">Matériel</div>
      <div className="mb-6 grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
        <KpiCard label="Disponible" value={materielDispo} />
        <KpiCard label="Réservé / déployé" value={materielDeploye} />
        <KpiCard label="À rectifier / recharger / inspecter" value={materielMaintenance} />
        <KpiCard label="Taux d'utilisation" value={`${tauxUtilisation}%`} />
      </div>

      <div className="mb-2 font-display text-[19px] font-semibold text-navy">Journées facturées</div>
      <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
        <KpiCard label="Jours Operation" value={fmtNum(joursOperation)} />
        <KpiCard label="Jours Stand By" value={fmtNum(joursStandBy)} />
      </div>
    </div>
  );
}
