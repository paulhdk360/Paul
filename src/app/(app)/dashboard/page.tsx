import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { blockOperateurGlobal } from "@/lib/auth";
import { Badge } from "@/components/Badge";
import { TYPES_ACTIVITE, TYPES_TRANSACTION } from "@/lib/company";
import { computeDevisTotals } from "@/lib/devis";
import { fmtDate, fmtEUR, fmtNum } from "@/lib/format";
import { KpiCard } from "@/components/KpiCard";
import type { Affaire, CatalogueOutil, Client, Devis, DevisLigne, ServiceTicketDay, ServiceTicketTransport } from "@/lib/types";

export default async function DashboardPage() {
  await blockOperateurGlobal();
  const supabase = createClient();
  const [devisRes, lignesRes, outilsRes, daysRes, transportRes, affairesRes, clientsRes] = await Promise.all([
    supabase.from("devis").select("*"),
    supabase.from("devis_lignes").select("*"),
    supabase.from("catalogue_outils").select("*"),
    supabase.from("service_ticket_days").select("*"),
    supabase.from("service_ticket_transport").select("*"),
    supabase.from("affaires").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("*"),
  ]);

  const devis = (devisRes.data ?? []) as Devis[];
  const lignes = (lignesRes.data ?? []) as DevisLigne[];
  const outils = (outilsRes.data ?? []) as CatalogueOutil[];
  const days = (daysRes.data ?? []) as ServiceTicketDay[];
  const transports = (transportRes.data ?? []) as ServiceTicketTransport[];
  const affaires = (affairesRes.data ?? []) as Affaire[];
  const clients = (clientsRes.data ?? []) as Client[];
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const affaireById = new Map(affaires.map((a) => [a.id, a]));

  const lignesByDevis = new Map<string, DevisLigne[]>();
  for (const l of lignes) {
    const arr = lignesByDevis.get(l.devis_id) ?? [];
    arr.push(l);
    lignesByDevis.set(l.devis_id, arr);
  }

  const countByStatut = (statut: string) => devis.filter((d) => d.statut === statut).length;

  const devisFactures = devis.filter((d) => d.statut === "Accepté" || d.statut === "Envoyé");
  const caPrevisionnel = devisFactures.reduce((sum, d) => sum + computeDevisTotals(lignesByDevis.get(d.id) ?? [], d.tva).ht, 0);

  const caParActivite = TYPES_ACTIVITE.map((type) => ({
    type,
    ca: devisFactures
      .filter((d) => d.type_activite === type)
      .reduce((sum, d) => sum + computeDevisTotals(lignesByDevis.get(d.id) ?? [], d.tva).ht, 0),
  })).filter((r) => r.ca > 0);

  const caParTransaction = TYPES_TRANSACTION.map((type) => ({
    type,
    ca: devisFactures
      .filter((d) => affaireById.get(d.affaire_id)?.type_transaction === type)
      .reduce((sum, d) => sum + computeDevisTotals(lignesByDevis.get(d.id) ?? [], d.tva).ht, 0),
  }));

  const affairesEnCoursListe = affaires.filter((a) => a.statut === "En cours");

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
        <KpiCard label="CA prévisionnel HT" value={fmtEUR(caPrevisionnel)} sub="Devis envoyés + acceptés" />
        <KpiCard label="Coûts de transport" value={fmtEUR(coutsTransport)} sub="Cumul tickets de service" />
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

      <div className="mb-2 font-display text-[19px] font-semibold text-navy">CA par activité</div>
      <div className="mb-6 grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
        {caParActivite.length === 0 && (
          <div className="col-span-4 text-[12.5px] text-text-muted max-[1100px]:col-span-2 max-[600px]:col-span-1">
            Aucun devis envoyé/accepté n&apos;a de type d&apos;activité renseigné.
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
