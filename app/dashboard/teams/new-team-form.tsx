"use client";

import { useFormState } from "react-dom";
import { createTeam } from "@/lib/actions/teams";
import { SubmitButton } from "@/components/submit-button";

export function NewTeamForm({ clubId }: { clubId: string }) {
  const [state, formAction] = useFormState(createTeam, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="club_id" value={clubId} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="name">
            Nom
          </label>
          <input className="input" id="name" name="name" required placeholder="Ex : U17" />
        </div>
        <div>
          <label className="label" htmlFor="category">
            Catégorie
          </label>
          <input className="input" id="category" name="category" placeholder="Ex : U17" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="level">
            Niveau
          </label>
          <input className="input" id="level" name="level" placeholder="Ex : Régional" />
        </div>
        <div>
          <label className="label" htmlFor="color">
            Couleur
          </label>
          <input className="input" id="color" name="color" type="color" defaultValue="#1c7a3e" />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SubmitButton pendingLabel="Création...">Créer l&apos;équipe</SubmitButton>
    </form>
  );
}
