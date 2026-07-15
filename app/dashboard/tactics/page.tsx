import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { RouteAnimator } from "./route-animator";

export default async function TacticsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Tactiques — prototype d&apos;animation</h1>
        <p className="text-sm text-slate-500">
          Décrivez la route d&apos;un joueur (distance + direction de coupe) et visualisez son déplacement animé
          sur le terrain. Prototype : rien n&apos;est encore sauvegardé en base.
        </p>
      </div>

      <RouteAnimator />
    </div>
  );
}
