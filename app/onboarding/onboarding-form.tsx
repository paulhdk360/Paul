"use client";

import { useFormState } from "react-dom";
import { createClub } from "@/lib/actions/clubs";
import { SubmitButton } from "@/components/submit-button";

export function OnboardingForm() {
  const [state, formAction] = useFormState(createClub, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">
          Nom du club
        </label>
        <input className="input" id="name" name="name" type="text" required autoFocus placeholder="Ex : Les Lions de Paris" />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SubmitButton className="btn w-full" pendingLabel="Création...">
        Créer le club
      </SubmitButton>
    </form>
  );
}
