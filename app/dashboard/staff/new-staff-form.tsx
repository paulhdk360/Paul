"use client";

import { useFormState } from "react-dom";
import { createStaffMember } from "@/lib/actions/staff";
import { SubmitButton } from "@/components/submit-button";

export function NewStaffForm({ clubId }: { clubId: string }) {
  const [state, formAction] = useFormState(createStaffMember, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="club_id" value={clubId} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="first_name">
            Prénom
          </label>
          <input className="input" id="first_name" name="first_name" required />
        </div>
        <div>
          <label className="label" htmlFor="last_name">
            Nom
          </label>
          <input className="input" id="last_name" name="last_name" required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="role_title">
          Fonction
        </label>
        <input className="input" id="role_title" name="role_title" placeholder="Ex : Coordinateur offensif" />
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

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SubmitButton pendingLabel="Ajout...">Ajouter</SubmitButton>
    </form>
  );
}
