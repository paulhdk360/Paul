import { createClient } from "@/lib/supabase/server";
import { blockOperateurGlobal } from "@/lib/auth";
import { TYPES_ACTIVITE, TYPES_TRANSACTION } from "@/lib/company";
import { computeDevisTotals } from "@/lib/devis";
import { fmtEUR, fmtNum } from "@/lib/format";
import { KpiCard } from "@/components/KpiCard";
import type { CatalogueOutil, Devis, DevisLigne, ServiceTicketDay, ServiceTicketTransport } from "@/lib/types";

export default async function DashboardPage() {
  await blockOperateurGlobal();
  const supabase = createClient();
  const [devisRes, lignesRes, outilsRes, daysRes, transportRes, affairesRes] = await Promise.all([
    supabase.from("devis").select("*"),
    supabase.from("devis_lignes").select("*"),
    supabase.from("catalogue_outils").select("*"),
    supabase.from("service_ticket_days").select("*"),
    supabase.from("service_ticket_transport").select("*"),
    supabase.from("affaires").select("*"),
  ]);

  const devis = (devisRes.data ?? []) as Devis[];
  const lignes = (lignesRes.data ?? []) as DevisLigne[];
  const outils = (outilsRes.data ?? []) as CatalogueOutil[];
  const days = (daysRes.data ?? []) as ServiceTicketDay[];
  const transports = (transportRes.data ?? []) as ServiceTicketTransport[];
  const affaires = affairesRes.data ?? [];

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
      .filter((d) => d.type_transaction === type)
      .reduce((sum, d) => sum + computeDevisTotals(lignesByDevis.get(d.id) ?? [], d.tva).ht, 0),
  }));

  const materielDispo = outils.filter((o) => o.statut === "En stock").length;
  const materielDeploye = outils.filter((o) => ["Réservé", "Sur chantier", "En transit"].includes(o.statut)).length;
  const materielMaintenance = outils.filter((o) => ["À rectifier", "À recharger", "En attente d'inspection"].includes(o.statut)).length;
  const tauxUtilisation = outils.length ? Math.round((materielDeploye / outils.length) * 100) : 0;

  const joursOperation = days.filter((d) => d.code === "O").length;
  const joursStandBy = days.filter((d) => d.code === "S").length;

  const coutsTransport = transports.reduce((sum, t) => sum + (t.prix_unitaire || 0) * (t.quantite || 0), 0);

  const affairesEnCours = affaires.filter((a) => a.statut === "En cours").length;

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
        <KpiCard label="Affaires en cours" value={affairesEnCours} />
        <KpiCard label="CA prévisionnel HT" value={fmtEUR(caPrevisionnel)} sub="Devis envoyés + acceptés" />
        <KpiCard label="Coûts de transport" value={fmtEUR(coutsTransport)} sub="Cumul tickets de service" />
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
