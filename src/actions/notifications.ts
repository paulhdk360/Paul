"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function notifyUser(recipientId: string, message: string, link?: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("notifications").insert({
    user_id: recipientId,
    message,
    link: link ?? null,
    created_by: user?.id ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function markNotificationRead(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("notifications").update({ lu: true }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from("notifications").update({ lu: true }).eq("user_id", user.id).eq("lu", false);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
