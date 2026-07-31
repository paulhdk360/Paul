"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OutilDrawing } from "@/lib/types";

// Upsert on the unique famille column — assigning a new image to a
// famille that already has one replaces it, rather than creating a
// duplicate row, since a famille has at most one drawing.
export async function setOutilDrawing(famille: string, fichier: string): Promise<OutilDrawing> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("outil_drawings")
    .upsert({ famille, fichier }, { onConflict: "famille" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/bha");
  return data as OutilDrawing;
}

export async function clearOutilDrawing(famille: string) {
  const supabase = createClient();
  const { error } = await supabase.from("outil_drawings").delete().eq("famille", famille);
  if (error) throw new Error(error.message);
  revalidatePath("/bha");
}
