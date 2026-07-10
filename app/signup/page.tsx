"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { signUp } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/submit-button";

export default function SignupPage() {
  const [state, formAction] = useFormState(signUp, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold">Créer un compte</h1>
        <p className="mb-6 text-sm text-slate-500">
          Vous pourrez ensuite créer votre club ou rejoindre un club existant.
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="full_name">
              Nom complet
            </label>
            <input className="input" id="full_name" name="full_name" type="text" required autoFocus />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input className="input" id="email" name="email" type="email" required />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Mot de passe
            </label>
            <input className="input" id="password" name="password" type="password" minLength={8} required />
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <SubmitButton className="btn w-full" pendingLabel="Création...">
            Créer mon compte
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Déjà un compte ?{" "}
          <Link className="font-medium text-pitch" href="/login">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
