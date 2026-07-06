import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/KpiCard";
import { Badge } from "@/components/Badge";
import { computeDevisTotals } from "@/lib/devis";
import { fmtEUR, fmtDate, fmtNum } from "@/lib/format";
import type { Chantier, Devis, Equipe, Facture, Foreuse } from "@/lib/supabase/types";

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const [chantiersRes, foreusesRes, equipesRes, devisRes, facturesRes] = await Promise.all([
    supabase.from("chantiers").select("*"),
    supabase.from("foreuses").select("*"),
    supabase.from("equipes").select("*"),
    supabase.from("devis").select("*"),
    supabase.from("factures").select("*"),
  ]);

  const chantiers = (chantiersRes.data ?? []) as Chantier[];
  const foreuses = (foreusesRes.data ?? []) as Foreuse[];
  const equipes = (equipesRes.data ?? []) as Equipe[];
  const devis = (devisRes.data ?? []) as Devis[];
  const factures = (facturesRes.data ?? []) as Facture[];

  const foreuseById = Object.fromEntries(foreuses.map((f) => [f.id, f.nom]));
  const equipeById = Object.fromEntries(equipes.map((e) => [e.id, e.nom]));

  const mKey = currentMonthKey();
  const caMois = factures
    .filter((f) => (f.date_emission || "").slice(0, 7) === mKey)
    .reduce((s, f) => s + (Number(f.montant) || 0), 0);

  const chantiersEnCours = chantiers.filter((c) => c.statut === "En cours");
  const totalForeuses = foreuses.length;
  const foreusesDispo = foreuses.filter((f) => f.statut === "Disponible").length;
  const foreusesEnService = foreuses.filter((f) => f.statut === "En service").length;
  const tauxOccupation = totalForeuses ? Math.round((foreusesEnService / totalForeuses) * 100) : 0;
  const devisEnAttente = devis.filter((d) => d.statut === "Envoyé" || d.statut === "Relancé");

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide">Tableau de bord</div>
      <div className="mb-6 text-[13.5px] text-text-muted">
        Vue d&apos;ensemble de l&apos;activité —{" "}
        {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
      </div>

      <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
        <KpiCard label="CA du mois" value={fmtEUR(caMois)} tone="accent" />
        <KpiCard
          label="Chantiers en cours"
          value={chantiersEnCours.length}
          sub={chantiersEnCours.length > 0 ? `sur ${chantiers.length} au total` : "aucun chantier actif"}
        />
        <KpiCard
          label="Foreuses disponibles"
          value={`${foreusesDispo} / ${totalForeuses}`}
          sub={`${foreusesEnService} en service`}
        />
        <KpiCard
          label="Taux d'occupation"
          value={`${tauxOccupation} %`}
          tone={tauxOccupation >= 80 ? "accent" : tauxOccupation >= 40 ? undefined : "warn"}
        />
        <KpiCard
          label="Devis en attente"
          value={devisEnAttente.length}
          sub={devisEnAttente.length > 0 ? "à relancer" : "aucun en attente"}
          tone={devisEnAttente.length > 3 ? "warn" : undefined}
        />
      </div>

      <div className="mb-5.5 rounded-[10px] border border-border bg-bg-card p-5">
        <h3 className="mb-3.5 font-display text-[19px] font-semibold">Chantiers en cours</h3>
        {chantiersEnCours.length === 0 ? (
          <div className="p-10 text-center text-[13.5px] text-text-muted">Aucun chantier en cours actuellement.</div>
        ) : (
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                {["Chantier", "Client", "Équipe", "Foreuse", "Avancement"].map((h) => (
                  <th
                    key={h}
                    className="border-b border-border px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chantiersEnCours.map((c) => {
                const pct = c.profondeur_prevue
                  ? Math.min(100, Math.round((c.profondeur_foree / c.profondeur_prevue) * 100))
                  : 0;
                return (
                  <tr key={c.id}>
                    <td className="border-b border-border/50 px-3 py-2.5">{c.nom}</td>
                    <td className="border-b border-border/50 px-3 py-2.5">{c.client}</td>
                    <td className="border-b border-border/50 px-3 py-2.5">
                      {c.equipe_id ? equipeById[c.equipe_id] ?? "—" : "—"}
                    </td>
                    <td className="border-b border-border/50 px-3 py-2.5">
                      {c.foreuse_id ? foreuseById[c.foreuse_id] ?? "—" : "—"}
                    </td>
                    <td className="border-b border-border/50 px-3 py-2.5 font-mono">
                      {pct} % ({fmtNum(c.profondeur_foree)} / {fmtNum(c.profondeur_prevue)} m)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-[10px] border border-border bg-bg-card p-5">
        <h3 className="mb-3.5 font-display text-[19px] font-semibold">Devis en attente de réponse</h3>
        {devisEnAttente.length === 0 ? (
          <div className="p-10 text-center text-[13.5px] text-text-muted">Aucun devis en attente.</div>
        ) : (
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                {["Client", "Objet", "Statut", "Montant TTC", "Envoyé le"].map((h) => (
                  <th
                    key={h}
                    className="border-b border-border px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devisEnAttente.map((d) => {
                const t = computeDevisTotals(d);
                return (
                  <tr key={d.id}>
                    <td className="border-b border-border/50 px-3 py-2.5">{d.client}</td>
                    <td className="border-b border-border/50 px-3 py-2.5">{d.objet}</td>
                    <td className="border-b border-border/50 px-3 py-2.5">
                      <Badge statut={d.statut} />
                    </td>
                    <td className="border-b border-border/50 px-3 py-2.5 font-mono">{fmtEUR(t.ttc)}</td>
                    <td className="border-b border-border/50 px-3 py-2.5 font-mono">{fmtDate(d.date_envoi)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
