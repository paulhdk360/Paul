"use client";

import { useFormState, useFormStatus } from "react-dom";
import Image from "next/image";
import { signIn } from "@/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#06201B] transition-colors hover:bg-accent-bright disabled:opacity-60"
    >
      {pending ? "Connexion…" : "Se connecter"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState<{ error: string | null }, FormData>(signIn, { error: null });

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-bg-panel p-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src="/logo-bfe.png" alt="Béarn Forage Énergie" width={56} height={56} />
          <div>
            <div className="font-display text-lg font-bold tracking-wide">BÉARN FORAGE ÉNERGIE</div>
            <div className="text-xs font-semibold tracking-widest text-accent-bright">PILOTAGE</div>
          </div>
        </div>
        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-light outline-none focus:border-accent-bright"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">
              Mot de passe
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-light outline-none focus:border-accent-bright"
            />
          </div>
          {state?.error && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-[#FBE9E4]">
              {state.error}
            </div>
          )}
          <SubmitButton />
        </form>
        <p className="mt-6 text-center text-xs text-text-muted">
          Accès réservé aux comptes créés par un administrateur BFE.
        </p>
      </div>
    </div>
  );
}
