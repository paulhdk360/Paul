"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Message } from "@/lib/types";

export async function sendMessage(toUserId: string, message: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  const { data, error } = await supabase
    .from("messages")
    .insert({ from_user_id: user.id, to_user_id: toUserId, message })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/messages");
  return data as Message;
}

// Marks every unread message from one colleague as read once their thread
// is opened.
export async function markConversationRead(fromUserId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from("messages")
    .update({ lu: true })
    .eq("to_user_id", user.id)
    .eq("from_user_id", fromUserId)
    .eq("lu", false);
  if (error) throw new Error(error.message);
  revalidatePath("/messages");
  revalidatePath("/", "layout");
}
