"use client";

import { useState } from "react";
import { updatePlayer } from "@/lib/actions/players";
import { PLAYER_STATUS_LABELS } from "@/lib/types";

export function PlayerForm({
  player,
  teams,
  canEdit,
}: {
  player: any;
  teams: { id: string; name: string }[];
  canEdit: boolean;
}) {
  const [saving, setSaving] = useState(false);

  return (
    <form
      action={async (formData) => {
        setSaving(true);
        try {
          await updatePlayer(player.id, formData);
        } finally {
          setSaving(false);
        }
      }}
      className="space-y-4"
    >
      <fieldset disabled={!canEdit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="first_name">
              Prénom
            </label>
            <input className="input" id="first_name" name="first_name" defaultValue={player.first_name} required />
          </div>
          <div>
            <label className="label" htmlFor="last_name">
              Nom
            </label>
            <input className="input" id="last_name" name="last_name" defaultValue={player.last_name} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="birth_date">
              Date de naissance
            </label>
            <input className="input" id="birth_date" name="birth_date" type="date" defaultValue={player.birth_date ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="team_id">
              Équipe
            </label>
            <select className="input" id="team_id" name="team_id" defaultValue={player.team_id ?? ""}>
              <option value="">—</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="primary_position">
              Poste principal
            </label>
            <input className="input" id="primary_position" name="primary_position" defaultValue={player.primary_position ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="jersey_number">
              Numéro
            </label>
            <input
              className="input"
              id="jersey_number"
              name="jersey_number"
              type="number"
              min={0}
              max={99}
              defaultValue={player.jersey_number ?? ""}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="sport_status">
            Statut sportif
          </label>
          <select className="input" id="sport_status" name="sport_status" defaultValue={player.sport_status}>
            {Object.entries(PLAYER_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input className="input" id="email" name="email" type="email" defaultValue={player.email ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Téléphone
            </label>
            <input className="input" id="phone" name="phone" type="tel" defaultValue={player.phone ?? ""} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="emergency_contact_name">
              Contact d&apos;urgence
            </label>
            <input
              className="input"
              id="emergency_contact_name"
              name="emergency_contact_name"
              defaultValue={player.emergency_contact_name ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="emergency_contact_phone">
              Téléphone d&apos;urgence
            </label>
            <input
              className="input"
              id="emergency_contact_phone"
              name="emergency_contact_phone"
              type="tel"
              defaultValue={player.emergency_contact_phone ?? ""}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="notes">
            Notes internes
          </label>
          <textarea className="input" id="notes" name="notes" rows={3} defaultValue={player.notes ?? ""} />
        </div>
      </fieldset>

      {canEdit && (
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      )}
    </form>
  );
}
