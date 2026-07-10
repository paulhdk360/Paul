"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Workorder } from "@/lib/types";

export async function updateWorkorder(id: string, data: Partial<Workorder>) {
  const supabase = createClient();
  const { error } = await supabase
    .from("workorders")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/workorders");
}
