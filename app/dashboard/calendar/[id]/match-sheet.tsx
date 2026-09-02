"use client";

import { useState } from "react";
import { saveMatchInfo, saveMatchStats } from "@/lib/actions/matches";
import { STAT_FIELDS } from "@/lib/stats";

type Match = {
  opponent_name: string | null;
  is_home: boolean;
  team_score: number | null;
  opponent_score: number | null;
  notes: string | null;
};

type Player = { id: string; first_name: string; last_name: string };

export function MatchSheet({
  eventId,
  canManage,
  match,
  players,
  stats,
}: {
  eventId: string;
  canManage: boolean;
  match: Match;
  players: Player[];
  stats: Record<string, Record<string, number>>;
}) {
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingStats, setSavingStats] = useState(false);

  const scoreKnown = match.team_score != null && match.opponent_score != null;
  const result =
    scoreKnown && match.team_score! > match.opponent_score!
      ? "Victoire"
      : scoreKnown && match.team_score! < match.opponent_score!
        ? "Défaite"
        : scoreKnown
          ? "Match nul"
          : null;
  const resultColor =
    result === "Victoire" ? "bg-emerald-100 text-emerald-800" : result === "Défaite" ? "bg-red-100 text-red-800" : "bg-slate-200 text-slate-700";

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">🏆 Feuille de match</h2>
          {result && <span className={`badge ${resultColor}`}>{result}</span>}
        </div>

        {canManage ? (
          <form
            action={async (formData) => {
              setSavingInfo(true);
              try {
                await saveMatchInfo(eventId, formData);
              } finally {
                setSavingInfo(false);
              }
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="label text-xs">Adversaire</label>
                <input className="input" name="opponent_name" defaultValue={match.opponent_name ?? ""} />
              </div>
              <div>
                <label className="label text-xs">Score de l'équipe</label>
                <input className="input" name="team_score" type="number" min={0} defaultValue={match.team_score ?? ""} />
              </div>
              <div>
                <label className="label text-xs">Score adverse</label>
                <input
                  className="input"
                  name="opponent_score"
                  type="number"
                  min={0}
                  defaultValue={match.opponent_score ?? ""}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_home" defaultChecked={match.is_home} />
              Match à domicile
            </label>
            <div>
              <label className="label text-xs">Notes</label>
              <textarea className="input" name="notes" rows={2} defaultValue={match.notes ?? ""} />
            </div>
            <button className="btn" type="submit" disabled={savingInfo}>
              {savingInfo ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        ) : (
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Adversaire : </span>
              {match.opponent_name ?? "—"} ({match.is_home ? "domicile" : "extérieur"})
            </p>
            {scoreKnown && (
              <p>
                <span className="font-medium">Score : </span>
                {match.team_score} - {match.opponent_score}
              </p>
            )}
            {match.notes && (
              <p>
                <span className="font-medium">Notes : </span>
                {match.notes}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-medium">Statistiques joueurs</h2>
        {canManage ? (
          <form
            action={async (formData) => {
              setSavingStats(true);
              try {
                await saveMatchStats(eventId, formData);
              } finally {
                setSavingStats(false);
              }
            }}
            className="space-y-3"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="sticky left-0 bg-white py-2 pr-4">Joueur</th>
                    {STAT_FIELDS.map((f) => (
                      <th key={f.key} className="py-2 pr-2 text-xs">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0">
                      <td className="sticky left-0 bg-white py-2 pr-4 font-medium">
                        <input type="hidden" name="player_id" value={p.id} />
                        {p.first_name} {p.last_name}
                      </td>
                      {STAT_FIELDS.map((f) => (
                        <td key={f.key} className="py-2 pr-2">
                          <input
                            className="input w-16"
                            type="number"
                            min={0}
                            name={`${f.key}_${p.id}`}
                            defaultValue={stats[p.id]?.[f.key] ?? ""}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {players.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-500">Aucun joueur concerné par ce match.</p>
              )}
            </div>
            {players.length > 0 && (
              <button className="btn" type="submit" disabled={savingStats}>
                {savingStats ? "Enregistrement..." : "Enregistrer les statistiques"}
              </button>
            )}
          </form>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4">Joueur</th>
                  {STAT_FIELDS.map((f) => (
                    <th key={f.key} className="py-2 pr-2 text-xs">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players
                  .filter((p) => stats[p.id])
                  .map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-4 font-medium">
                        {p.first_name} {p.last_name}
                      </td>
                      {STAT_FIELDS.map((f) => (
                        <td key={f.key} className="py-2 pr-2">
                          {stats[p.id]?.[f.key] ?? "—"}
                        </td>
                      ))}
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
