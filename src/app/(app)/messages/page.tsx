import { blockOperateurGlobal } from "@/lib/auth";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MessagesManager } from "@/components/MessagesManager";
import type { Message, Profile } from "@/lib/types";

export default async function MessagesPage({ searchParams }: { searchParams: { with?: string } }) {
  await blockOperateurGlobal();
  const { user } = await requireUser();
  const supabase = createClient();

  const [profilesRes, messagesRes] = await Promise.all([
    supabase.from("profiles").select("*").order("full_name", { ascending: true }),
    supabase.from("messages").select("*").or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`).order("created_at", { ascending: true }),
  ]);

  const colleagues = ((profilesRes.data ?? []) as Profile[]).filter((p) => p.id !== user.id && p.role !== "operateur");
  const messages = (messagesRes.data ?? []) as Message[];

  return (
    <MessagesManager
      colleagues={colleagues}
      messages={messages}
      currentUserId={user.id}
      initialColleagueId={searchParams.with ?? null}
    />
  );
}
