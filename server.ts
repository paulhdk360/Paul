import { createClient } from "@/lib/supabase/server";
import { computeDevisTotals } from "@/lib/devis";
import { fmtEUR, fmtNum } from "@/lib/format";
import { BarChartSvg, BoreholeSvg, StatMini } from "@/components/StatsCharts";
import type { Achat, Chantier, Devis, Maintenance } from "@/lib/supabase/types";

export default async function StatsPage() {
  const supabase = createClient();
  const [chantiersRes, devisRes, achatsRes, maintenancesRes] = await Promise.all([
    supabase.from("chantiers").select("*"),
    supabase.from("devis").select("*"),
    supabase.from("achats").select("*"),
    supabase.from("maintenances").select("*"),
  ]);

  const chantiers = (chantiersRes.data ?? []) as Chantier[];
  const devis = (devisRes.data ?? []) as Devis[];
  const achats = (achatsRes.data ?? []) as Achat[];
  const maintenances = (maintenancesRes.data ?? []) as Maintenance[];

  const year = new Date().getFullYear();
  const chantiersAnnee = chantiers.filter((c) => (c.date_debut || "").slice(0, 4) === String(year));
  const metresForesAnnee = chantiersAnnee.reduce((s, c) => s + (Number(c.profondeur_foree) || 0), 0);
  const caSigne = devis.filter((d) => d.statut === "Accepté").reduce((s, d) => s + computeDevisTotals(d).ttc, 0);
  const chantiersTermines = chantiers.filter((c) => c.statut === "Terminé").length;
  const profondeurs = chantiers.map((c) => Number(c.profondeur_foree) || 0).filter((v) => v > 0);
  const profondeurMoyenne = profondeurs.length ? profondeurs.reduce((a, b) => a + b, 0) / profondeurs.length : 0;
  const montants = chantiers.map((c) => Number(c.montant_devis) || 0).filter((v) => v > 0);
  const coutMoyen = montants.length ? montants.reduce((a, b) => a + b, 0) / montants.length : 0;
  const marges = chantiers.filter((c) => c.montant_devis).map((c) => (Number(c.montant_devis) || 0) - (Number(c.cout_reel) || 0));
  const margeMoyenne = marges.length ? marges.reduce((a, b) => a + b, 0) / marges.length : 0;
  const achatsAnnee = achats
    .filter((a) => (a.date || "").slice(0, 4) === String(year))
    .reduce((s, a) => s + (Number(a.montant) || 0), 0);
  const coutMaintenanceAnnee = maintenances
    .filter((m) => (m.date || "").slice(0, 4) === String(year))
    .reduce((s, m) => s + (Number(m.cout) || 0), 0);

  const maxDepth = Math.max(600, Math.ceil(metresForesAnnee / 100) * 100 || 600);
  const fillPct = Math.min(100, Math.round((metresForesAnnee / maxDepth) * 100));

  const monthCounts = new Array(12).fill(0);
  chantiers.forEach((c) => {
    if (c.date_debut && c.date_debut.slice(0, 4) === String(year)) {
      const m = parseInt(c.date_debut.slice(5, 7), 10) - 1;
      if (m >= 0 && m < 12) monthCounts[m]++;
    }
  });
  const maxCount = Math.max(1, ...monthCounts);
  const monthLabels = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide">Statistiques</div>
      <div className="mb-6 text-[13.5px] text-text-muted">Indicateurs de performance — année {year}</div>
      <div className="grid grid-cols-[1.1fr_1fr] gap-5 max-[900px]:grid-cols-1">
        <div className="rounded-[10px] border border-border bg-bg-card p-5">
          <h3 className="mb-3.5 font-display text-[19px] font-semibold">Mètres forés cette année</h3>
          <div className="flex items-center justify-center gap-6.5 py-2.5">
            <BoreholeSvg fillPct={fillPct} />
            <div>
              <div className="font-mono text-[34px] font-semibold text-accent-bright">{fmtNum(metresForesAnnee)} m</div>
              <div className="mt-1 text-[11.5px] text-text-muted">sur une échelle de référence de {maxDepth} m</div>
            </div>
          </div>
          <div className="mt-3.5 grid grid-cols-2 gap-3">
            <StatMini label="CA signé (devis acceptés)" value={fmtEUR(caSigne)} />
            <StatMini label="Chantiers terminés" value={chantiersTermines} />
            <StatMini label="Profondeur moyenne" value={`${fmtNum(profondeurMoyenne)} m`} />
            <StatMini label="Coût moyen d'un forage" value={fmtEUR(coutMoyen)} />
            <StatMini label="Marge moyenne / chantier" value={fmtEUR(margeMoyenne)} />
            <StatMini label="Nombre de chantiers" value={chantiers.length} />
            <StatMini label="Achats sur l'année" value={fmtEUR(achatsAnnee)} />
            <StatMini label="Coût maintenance sur l'année" value={fmtEUR(coutMaintenanceAnnee)} />
          </div>
        </div>
        <div className="rounded-[10px] border border-border bg-bg-card p-5">
          <h3 className="mb-3.5 font-display text-[19px] font-semibold">Chantiers démarrés par mois ({year})</h3>
          <BarChartSvg counts={monthCounts} labels={monthLabels} maxCount={maxCount} />
        </div>
      </div>
    </div>
  );
}
