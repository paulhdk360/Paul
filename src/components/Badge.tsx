import { STATUT_BADGE } from "@/lib/format";

export function Badge({ statut }: { statut: string | null | undefined }) {
  const cls = (statut && STATUT_BADGE[statut]) || "b-gray";
  return <span className={`badge ${cls}`}>{statut || "—"}</span>;
}
