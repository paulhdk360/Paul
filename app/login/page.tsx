"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { signIn } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/submit-button";

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold">Football Team Manager</h1>
        <p className="mb-6 text-sm text-slate-500">Connectez-vous à votre club.</p>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input className="input" id="email" name="email" type="email" required autoFocus />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Mot de passe
            </label>
            <input className="input" id="password" name="password" type="password" required />
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <SubmitButton className="btn w-full" pendingLabel="Connexion...">
            Se connecter
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Pas encore de compte ?{" "}
          <Link className="font-medium text-pitch" href="/signup">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
