import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { blockAtelierGlobal, blockOperateurGlobal } from "@/lib/auth";
import { Badge } from "@/components/Badge";
import { INDUSTRIES_AFFAIRE, PAYS_AFFAIRE, TYPES_ACTIVITE, TYPES_TRANSACTION } from "@/lib/company";
import { fmtDate, fmtEUR, fmtNum } from "@/lib/format";
import { KpiCard } from "@/components/KpiCard";
import { computeAffaireRentabilite } from "@/lib/rentabilite";
import type {
  Achat,
  Affaire,
  CatalogueHistorique,
  CatalogueOutil,
  Client,
  Devis,
  DevisLigne,
  ServiceTicket,
  ServiceTicketDay,
  ServiceTicketPersonnel,
  ServiceTicketTransport,
  ToolListItem,
  Workorder,
} from "@/lib/types";

export default async function DashboardPage() {
  await blockOperateurGlobal();
  await blockAtelierGlobal();
  const supabase = createClient();
  const [
    devisRes,
    lignesRes,
    outilsRes,
    historiqueRes,
    daysRes,
    transportRes,
    affairesRes,
    clientsRes,
    ticketsRes,
    personnelRes,
    itemsRes,
    achatsRes,
    workordersRes,
  ] = await Promise.all([
    supabase.from("devis").select("*"),
    supabase.from("devis_lignes").select("*"),
    supabase.from("catalogue_outils").select("*"),
    supabase.from("catalogue_outils_historique").select("*"),
    supabase.from("service_ticket_days").select("*"),
    supabase.from("service_ticket_transport").select("*"),
    supabase.from("affaires").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("*"),
    supabase.from("service_tickets").select("*"),
    supabase.from("service_ticket_personnel").select("*"),
    supabase.from("tool_list_items").select("*"),
    supabase.from("achats").select("*"),
    supabase.from("workorders").select("*"),
  ]);

  const devis = (devisRes.data ?? []) as Devis[];
  const lignes = (lignesRes.data ?? []) as DevisLigne[];
  const outils = (outilsRes.data ?? []) as CatalogueOutil[];
  const historique = (historiqueRes.data ?? []) as CatalogueHistorique[];
  const days = (daysRes.data ?? []) as ServiceTicketDay[];
  const workorders = (workordersRes.data ?? []) as Workorder[];
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
  const workordersByAffaire = new Map<string, Workorder[]>();
  for (const w of workorders) {
    if (!w.affaire_id) continue;
    const arr = workordersByAffaire.get(w.affaire_id) ?? [];
    arr.push(w);
    workordersByAffaire.set(w.affaire_id, arr);
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
          workorders: workordersByAffaire.get(a.id) ?? [],
        }),
      ];
    }),
  );

  const countByStatut = (statut: string) => devis.filter((d) => d.statut === statut).length;

  const devisAppelOffres = devis.filter((d) => d.appel_offres);
  const appelOffresAcceptes = devisAppelOffres.filter((d) => d.statut === "Accepté").length;
  const tauxReussiteAO =
    devisAppelOffres.length > 0 ? (appelOffresAcceptes / devisAppelOffres.length) * 100 : null;

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

  const caParIndustrie = INDUSTRIES_AFFAIRE.map((industrie) => ({
    industrie,
    ca: affaires.filter((a) => a.industrie === industrie).reduce((sum, a) => sum + (rentabiliteByAffaire.get(a.id)?.revenu ?? 0), 0),
  })).filter((r) => r.ca > 0);
  const caIndustrieTotal = caParIndustrie.reduce((sum, r) => sum + r.ca, 0);

  const caParPays = PAYS_AFFAIRE.map((pays) => ({
    pays,
    ca: affaires.filter((a) => a.pays === pays).reduce((sum, a) => sum + (rentabiliteByAffaire.get(a.id)?.revenu ?? 0), 0),
    nbAffaires: affaires.filter((a) => a.pays === pays).length,
  })).filter((r) => r.nbAffaires > 0);

  const caParClient = new Map<string, number>();
  for (const a of affaires) {
    if (!a.client_id) continue;
    const revenu = rentabiliteByAffaire.get(a.id)?.revenu ?? 0;
    caParClient.set(a.client_id, (caParClient.get(a.client_id) ?? 0) + revenu);
  }
  const topClients = Array.from(caParClient.entries())
    .map(([clientId, ca]) => ({ client: clientById.get(clientId), ca, nbAffaires: affaires.filter((a) => a.client_id === clientId).length }))
    .filter((r) => r.ca > 0 && r.client)
    .sort((a, b) => b.ca - a.ca)
    .slice(0, 10);

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

  const outilById = new Map(outils.map((o) => [o.id, o]));
  const sortiesChantierParOutil = new Map<string, number>();
  for (const h of historique) {
    if (h.nouveau_statut !== "Sur chantier") continue;
    sortiesChantierParOutil.set(h.outil_id, (sortiesChantierParOutil.get(h.outil_id) ?? 0) + 1);
  }
  const topOutilsSortis = Array.from(sortiesChantierParOutil.entries())
    .map(([outilId, nbSorties]) => ({ outil: outilById.get(outilId), nbSorties }))
    .filter((r) => r.outil)
    .sort((a, b) => b.nbSorties - a.nbSorties)
    .slice(0, 10);

  const joursOperation = days.filter((d) => d.code === "O").length;
  const joursStandBy = days.filter((d) => d.code === "S").length;

  const coutsTransport = transports.reduce((sum, t) => sum + (t.prix_unitaire || 0) * (t.quantite || 0), 0);

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide text-navy">Tableau de bord</div>
      <div className="mb-7 text-[13.5px] text-text-muted">Vue d&apos;ensemble de l&apos;activité</div>

      <Section title="Commercial" icon="📣" accent="border-blue">
        <SubHeading>Devis</SubHeading>
        <div className="mb-5 grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
          <KpiCard label="Devis en préparation" value={countByStatut("Brouillon")} />
          <KpiCard label="Devis envoyés" value={countByStatut("Envoyé")} />
          <KpiCard label="Devis acceptés" value={countByStatut("Accepté")} />
          <KpiCard label="Devis refusés" value={countByStatut("Refusé")} />
          <KpiCard label="Appels d'offres" value={devisAppelOffres.length} />
          <KpiCard label="Appels d'offres acceptés" value={appelOffresAcceptes} />
          <KpiCard label="Taux de réussite AO" value={tauxReussiteAO === null ? "—" : `${tauxReussiteAO.toFixed(1)} %`} />
        </div>

        <SubHeading>CA par activité</SubHeading>
        <div className="mb-5 grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
          {caParActivite.length === 0 && (
            <div className="col-span-4 text-[12.5px] text-text-muted max-[1100px]:col-span-2 max-[600px]:col-span-1">
              Aucune affaire avec un revenu calculé n&apos;a de type d&apos;activité renseigné.
            </div>
          )}
          {caParActivite.map((r) => (
            <KpiCard key={r.type} label={`CA ${r.type}`} value={fmtEUR(r.ca)} />
          ))}
        </div>

        <SubHeading>CA par type de transaction</SubHeading>
        <div className="mb-5 grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
          {caParTransaction.map((r) => (
            <KpiCard key={r.type} label={`CA ${r.type}`} value={fmtEUR(r.ca)} />
          ))}
        </div>

        <SubHeading>Répartition par pays</SubHeading>
        <div className="mb-5 grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
          {caParPays.length === 0 && (
            <div className="col-span-4 text-[12.5px] text-text-muted max-[1100px]:col-span-2 max-[600px]:col-span-1">
              Aucune affaire n&apos;a de pays renseigné.
            </div>
          )}
          {caParPays.map((r) => (
            <KpiCard key={r.pays} label={r.pays} value={fmtEUR(r.ca)} sub={`${r.nbAffaires} affaire(s)`} />
          ))}
        </div>

        <SubHeading>Répartition par industrie</SubHeading>
        <div className="grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
          {caParIndustrie.length === 0 && (
            <div className="col-span-4 text-[12.5px] text-text-muted max-[1100px]:col-span-2 max-[600px]:col-span-1">
              Aucune affaire avec un revenu calculé n&apos;a d&apos;industrie renseignée.
            </div>
          )}
          {caParIndustrie.map((r) => (
            <KpiCard
              key={r.industrie}
              label={r.industrie}
              value={fmtEUR(r.ca)}
              sub={caIndustrieTotal > 0 ? `${((r.ca / caIndustrieTotal) * 100).toFixed(1)} % du CA` : undefined}
            />
          ))}
        </div>
      </Section>

      <Section title="Rentabilité" icon="💰" accent="border-success">
        <SubHeading>Vue d&apos;ensemble</SubHeading>
        <div className="mb-5 grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
          <KpiCard label="Chantiers totaux" value={affaires.length} />
          <KpiCard label="Chantiers en cours" value={affairesEnCoursListe.length} />
          <KpiCard label="CA réalisé/prévisionnel HT" value={fmtEUR(caPrevisionnel)} sub="Service Ticket (location) + devis (vente)" />
        </div>

        <SubHeading>Rentabilité globale</SubHeading>
        <div className="mb-5 grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
          <KpiCard label="CA total" value={fmtEUR(caPrevisionnel)} />
          <KpiCard label="Charges totales" value={fmtEUR(chargesTotales)} sub="Achats + transport réel + personnel" />
          <KpiCard label="Bénéfices" value={fmtEUR(beneficeTotal)} />
          <KpiCard label="Marge globale" value={margeGlobalePct === null ? "—" : `${margeGlobalePct.toFixed(1)} %`} />
        </div>

        <SubHeading>Affaires les plus rentables</SubHeading>
        <div className="mb-5 overflow-x-auto rounded-[10px] border border-border bg-bg-card">
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

        <SubHeading>Top clients (CA)</SubHeading>
        <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
          <table className="w-full min-w-[600px] text-[13px]">
            <thead>
              <tr className="bg-bg-sunken">
                {["#", "Client", "Affaires", "CA réalisé/prévisionnel HT"].map((h) => (
                  <th key={h} className="border-b border-border px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topClients.map((r, i) => (
                <tr key={r.client!.id} className="hover:bg-bg-sunken/50">
                  <td className="border-b border-border/60 px-3 py-2 text-text-muted">{i + 1}</td>
                  <td className="border-b border-border/60 px-3 py-2 font-semibold text-navy">{r.client!.raison_sociale}</td>
                  <td className="border-b border-border/60 px-3 py-2">{r.nbAffaires}</td>
                  <td className="border-b border-border/60 px-3 py-2 font-mono font-semibold">{fmtEUR(r.ca)}</td>
                </tr>
              ))}
              {topClients.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-text-muted">
                    Aucun client avec un revenu calculé pour l&apos;instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Exploitation" icon="🔧" accent="border-warning">
        <SubHeading>Affaires en cours</SubHeading>
        <div className="mb-5 overflow-x-auto rounded-[10px] border border-border bg-bg-card">
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

        <SubHeading>Matériel</SubHeading>
        <div className="mb-5 grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
          <KpiCard label="Disponible" value={materielDispo} />
          <KpiCard label="Réservé / déployé" value={materielDeploye} />
          <KpiCard label="À rectifier / recharger / inspecter" value={materielMaintenance} />
          <KpiCard label="Taux d'utilisation" value={`${tauxUtilisation}%`} />
        </div>

        <SubHeading>Outils les plus sortis sur chantier</SubHeading>
        <div className="mb-5 overflow-x-auto rounded-[10px] border border-border bg-bg-card">
          <table className="w-full min-w-[600px] text-[13px]">
            <thead>
              <tr className="bg-bg-sunken">
                {["#", "Outil", "Type", "Nb sorties chantier", "Statut actuel"].map((h) => (
                  <th key={h} className="border-b border-border px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topOutilsSortis.map((r, i) => (
                <tr key={r.outil!.id} className="hover:bg-bg-sunken/50">
                  <td className="border-b border-border/60 px-3 py-2 text-text-muted">{i + 1}</td>
                  <td className="border-b border-border/60 px-3 py-2 font-semibold text-navy">{r.outil!.designation}</td>
                  <td className="border-b border-border/60 px-3 py-2">{r.outil!.famille || "—"}</td>
                  <td className="border-b border-border/60 px-3 py-2 font-mono font-semibold">{r.nbSorties}</td>
                  <td className="border-b border-border/60 px-3 py-2">
                    <Badge label={r.outil!.statut} />
                  </td>
                </tr>
              ))}
              {topOutilsSortis.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-text-muted">
                    Aucune sortie chantier enregistrée pour l&apos;instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <SubHeading>Journées facturées</SubHeading>
        <div className="mb-5 grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
          <KpiCard label="Jours Operation" value={fmtNum(joursOperation)} />
          <KpiCard label="Jours Stand By" value={fmtNum(joursStandBy)} />
        </div>

        <SubHeading>Transport</SubHeading>
        <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
          <KpiCard label="Coûts de transport" value={fmtEUR(coutsTransport)} sub="Cumul tickets de service" />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, icon, accent, children }: { title: string; icon: string; accent: string; children: ReactNode }) {
  return (
    <section className="mb-9">
      <div className={`mb-4 flex items-center gap-2 border-l-4 ${accent} pl-3`}>
        <span className="text-[19px] leading-none">{icon}</span>
        <h2 className="font-display text-[21px] font-semibold text-navy">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return <div className="mb-2 text-[12.5px] font-semibold uppercase tracking-wide text-text-muted">{children}</div>;
}
