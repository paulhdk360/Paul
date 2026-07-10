import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.clubs.length > 0) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="mb-1 text-xl font-semibold">Bienvenue {current.profile?.full_name} !</h1>
        <p className="mb-6 text-sm text-slate-500">
          Créez votre club pour commencer. Vous en serez l&apos;administrateur.
        </p>
        <OnboardingForm />
      </div>
    </div>
  );
}
