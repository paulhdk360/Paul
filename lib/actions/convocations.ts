"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ConvocationResponse } from "@/lib/types";

export async function createConvocation(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const clubId = String(formData.get("club_id") ?? "");
  const eventId = String(formData.get("event_id") ?? "");
  const playerIds = formData.getAll("player_ids") as string[];
  const deadline = String(formData.get("response_deadline") ?? "");

  if (!eventId) return { error: "Sélectionnez un événement." };
  if (playerIds.length === 0) return { error: "Sélectionnez au moins un joueur." };

  const { data: event } = await supabase
    .from("calendar_events")
    .select("team_id")
    .eq("id", eventId)
    .single();

  const { data: convocation, error } = await supabase
    .from("convocations")
    .insert({
      club_id: clubId,
      event_id: eventId,
      team_id: event?.team_id ?? null,
      instructions: String(formData.get("instructions") ?? "") || null,
      response_deadline: deadline ? new Date(deadline).toISOString() : null,
      created_by: user?.id,
    })
    .select("id")
    .single();

  if (error || !convocation) return { error: error?.message ?? "Erreur lors de la création." };

  const rows = playerIds.map((playerId) => ({
    convocation_id: convocation.id,
    player_id: playerId,
    status: "selected" as const,
    response: "pending" as const,
  }));

  const { error: rowsError } = await supabase.from("convocation_players").insert(rows);
  if (rowsError) return { error: rowsError.message };

  revalidatePath("/dashboard/convocations");
  redirect(`/dashboard/convocations/${convocation.id}`);
}

export async function respondToConvocation(
  convocationPlayerId: string,
  response: ConvocationResponse,
  comment: string
) {
  const supabase = createClient();

  const { error } = await supabase
    .from("convocation_players")
    .update({ response, response_comment: comment || null, responded_at: new Date().toISOString() })
    .eq("id", convocationPlayerId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/convocations");
}
