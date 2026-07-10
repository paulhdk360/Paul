"use client";

import { useFormState } from "react-dom";
import { createPlayer } from "@/lib/actions/players";
import { SubmitButton } from "@/components/submit-button";

export function NewPlayerForm({ clubId, teams }: { clubId: string; teams: { id: string; name: string }[] }) {
  const [state, formAction] = useFormState(createPlayer, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="club_id" value={clubId} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="first_name">
            Prénom
          </label>
          <input className="input" id="first_name" name="first_name" required autoFocus />
        </div>
        <div>
          <label className="label" htmlFor="last_name">
            Nom
          </label>
          <input className="input" id="last_name" name="last_name" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="birth_date">
            Date de naissance
          </label>
          <input className="input" id="birth_date" name="birth_date" type="date" />
        </div>
        <div>
          <label className="label" htmlFor="team_id">
            Équipe
          </label>
          <select className="input" id="team_id" name="team_id">
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
          <input className="input" id="primary_position" name="primary_position" placeholder="Ex : QB" />
        </div>
        <div>
          <label className="label" htmlFor="jersey_number">
            Numéro de maillot
          </label>
          <input className="input" id="jersey_number" name="jersey_number" type="number" min={0} max={99} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input className="input" id="email" name="email" type="email" />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Téléphone
          </label>
          <input className="input" id="phone" name="phone" type="tel" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="emergency_contact_name">
            Contact d&apos;urgence
          </label>
          <input className="input" id="emergency_contact_name" name="emergency_contact_name" />
        </div>
        <div>
          <label className="label" htmlFor="emergency_contact_phone">
            Téléphone d&apos;urgence
          </label>
          <input className="input" id="emergency_contact_phone" name="emergency_contact_phone" type="tel" />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SubmitButton pendingLabel="Création...">Créer le joueur</SubmitButton>
    </form>
  );
}
