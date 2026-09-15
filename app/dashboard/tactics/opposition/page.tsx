import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { OppositionView } from "../opposition-view";

export default async function OppositionPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Opposition attaque / défense</h1>
        <p className="text-sm text-slate-500">
          Choisis un jeu d&apos;attaque et un jeu de défense prédéfinis pour visualiser comment ils se confrontent sur le
          terrain, animés simultanément.
        </p>
      </div>
      <OppositionView />
    </div>
  );
}
