"use client";

import { useState } from "react";
import { recordAttendance } from "@/lib/actions/attendance";
import { ATTENDANCE_STATUS_LABELS, AVAILABILITY_STATUS_LABELS } from "@/lib/types";

type Player = { id: string; first_name: string; last_name: string; jersey_number: number | null };

export function AttendanceSheet({
  eventId,
  players,
  availabilityByPlayer,
  attendanceByPlayer,
}: {
  eventId: string;
  players: Player[];
  availabilityByPlayer: Record<string, { status: string; comment: string | null }>;
  attendanceByPlayer: Record<string, { status: string; notes: string | null }>;
}) {
  const [saving, setSaving] = useState(false);

  if (players.length === 0) {
    return <p className="text-sm text-slate-500">Aucun joueur concerné par cet événement.</p>;
  }

  return (
    <form
      action={async (formData) => {
        setSaving(true);
        try {
          await recordAttendance(eventId, formData);
        } finally {
          setSaving(false);
        }
      }}
      className="space-y-3"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="py-2 pr-4">Joueur</th>
            <th className="py-2 pr-4">Disponibilité déclarée</th>
            <th className="py-2 pr-4">Présence</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => {
            const availability = availabilityByPlayer[p.id];
            const attendance = attendanceByPlayer[p.id];
            return (
              <tr key={p.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-4">
                  <input type="hidden" name="player_id" value={p.id} />
                  {p.jersey_number != null ? `#${p.jersey_number} ` : ""}
                  {p.first_name} {p.last_name}
                </td>
                <td className="py-2 pr-4 text-slate-500">
                  {availability
                    ? AVAILABILITY_STATUS_LABELS[availability.status as keyof typeof AVAILABILITY_STATUS_LABELS]
                    : "—"}
                </td>
                <td className="py-2 pr-4">
                  <select
                    className="input"
                    name={`status_${p.id}`}
                    defaultValue={attendance?.status ?? "present"}
                  >
                    {Object.entries(ATTENDANCE_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button className="btn" type="submit" disabled={saving}>
        {saving ? "Enregistrement..." : "Enregistrer la feuille de présence"}
      </button>
    </form>
  );
}
