import { createClient } from "@/lib/supabase/server";
import { blockAtelierGlobal, blockOperateurGlobal } from "@/lib/auth";
import { PlanningCalendar } from "@/components/PlanningCalendar";
import { monthDateRange } from "@/lib/calendar";
import type { Affaire, Employe, PlanningEntry, PlanningStatut } from "@/lib/types";

export default async function PlanningPage({ searchParams }: { searchParams: { month?: string } }) {
  await blockOperateurGlobal();
  await blockAtelierGlobal();
  const month = searchParams.month ?? new Date().toISOString().slice(0, 7);
  const dates = monthDateRange(month);

  const supabase = createClient();
  const [{ data: employes }, { data: statuts }, { data: entries }, { data: affaires }] = await Promise.all([
    supabase.from("employes").select("*").order("nom"),
    supabase.from("planning_statuts").select("*").order("categorie").order("ordre"),
    supabase.from("planning_entries").select("*").gte("date", dates[0]).lte("date", dates[dates.length - 1]),
    supabase.from("affaires").select("id, reference").order("reference"),
  ]);

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide text-navy">Planning RH</div>
      <div className="mb-6 text-[13.5px] text-text-muted">Disponibilité des collaborateurs — cliquez une case pour changer son statut</div>
      <PlanningCalendar
        month={month}
        employes={(employes ?? []) as Employe[]}
        statuts={(statuts ?? []) as PlanningStatut[]}
        entries={(entries ?? []) as PlanningEntry[]}
        affaires={(affaires ?? []) as Pick<Affaire, "id" | "reference">[]}
      />
    </div>
  );
}
