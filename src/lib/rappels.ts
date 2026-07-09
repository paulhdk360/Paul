import { RAPPEL_WINDOW_DAYS } from "@/lib/company";

export type RappelStatut = "ok" | "bientot" | "expire";

export function rappelStatut(dateStr: string | null | undefined, windowDays = RAPPEL_WINDOW_DAYS): RappelStatut | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "expire";
  if (diffDays <= windowDays) return "bientot";
  return "ok";
}
