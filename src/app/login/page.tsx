"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signIn } from "@/actions/auth";
import { Logo } from "@/components/Logo";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-navy px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
    >
      {pending ? "Connexion…" : "Se connecter"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[380px] rounded-[10px] border border-border bg-bg-panel p-7 shadow-sm">
        <div className="mb-7 flex justify-center">
          <Logo size={44} />
        </div>
        <div className="mb-5 text-center text-[13.5px] text-text-muted">
          Application de gestion des locations d&apos;outillage
        </div>
        <form action={formAction} className="flex flex-col gap-3.5">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[14px] focus:border-blue focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Mot de passe</label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[14px] focus:border-blue focus:outline-none"
            />
          </div>
          {state?.error && <div className="text-[13px] text-danger">{state.error}</div>}
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
