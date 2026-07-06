import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/format";
import type { Chantier, Foreuse } from "@/lib/supabase/types";

function getWeekDates(): Date[] {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // lundi = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function PlanningPage() {
  const supabase = createClient();
  const [{ data: foreuses }, { data: chantiers }] = await Promise.all([
    supabase.from("foreuses").select("*").order("nom"),
    supabase.from("chantiers").select("*"),
  ]);

  const days = getWeekDates();
  const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide">Planning</div>
      <div className="mb-6 text-[13.5px] text-text-muted">
        Semaine du {fmtDate(toISO(days[0]))} au {fmtDate(toISO(days[6]))}
      </div>
      <div className="rounded-[10px] border border-border bg-bg-card p-5">
        {!foreuses?.length ? (
          <div className="p-10 text-center text-[13.5px] text-text-muted">
            Ajoutez des foreuses pour afficher le planning.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="p-2.5 text-left text-xs uppercase tracking-wide text-text-muted">Foreuse</th>
                  {days.map((d, i) => (
                    <th key={i} className="p-2.5 text-center text-xs uppercase tracking-wide text-text-muted">
                      {dayNames[i]}
                      <br />
                      <span className="font-normal opacity-70">{fmtDate(toISO(d))}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(foreuses as Foreuse[]).map((f) => (
                  <tr key={f.id}>
                    <td className="p-2 text-[13.5px] font-semibold">{f.nom}</td>
                    {days.map((d, i) => {
                      const iso = toISO(d);
                      const chantier = (chantiers as Chantier[] | null)?.find(
                        (c) =>
                          c.foreuse_id === f.id &&
                          c.statut !== "Terminé" &&
                          c.date_debut &&
                          c.date_fin &&
                          iso >= c.date_debut &&
                          iso <= c.date_fin,
                      );
                      let cls = "plan-cell free";
                      let label = "Disponible";
                      if (chantier) {
                        cls = "plan-cell busy";
                        label = chantier.nom;
                      } else if (f.statut === "Maintenance") {
                        cls = "plan-cell maint";
                        label = "Maintenance";
                      }
                      return (
                        <td key={i} className="p-2 text-center">
                          <div className={`${cls} rounded-lg px-1.5 py-2 text-[11.5px] font-semibold`}>{label}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
