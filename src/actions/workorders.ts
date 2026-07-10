"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Workorder } from "@/lib/types";

// Manual entry point — Atelier doesn't always have to wait for a Pointage
// retour to open one (preventive maintenance, prep work ahead of a job that
// doesn't exist yet), unlike the ones auto-generated once a BL is fully
// treated (see maybeGenerateWorkordersForBl in actions/toolList.ts).
export async function createWorkorder(data: Partial<Workorder>) {
  const supabase = createClient();
  const { error } = await supabase.from("workorders").insert(data);
  if (error) throw new Error(error.message);
  revalidatePath("/workorders");
}

export async function updateWorkorder(id: string, data: Partial<Workorder>) {
  const supabase = createClient();
  const { error } = await supabase
    .from("workorders")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/workorders");
}
