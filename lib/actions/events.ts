"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EventType } from "@/lib/types";

export async function createEvent(_prevState: { error?: string } | undefined, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const clubId = String(formData.get("club_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "training") as EventType;
  const startAt = String(formData.get("start_at") ?? "");
  const endAt = String(formData.get("end_at") ?? "");
  const meetingAt = String(formData.get("meeting_at") ?? "");

  if (!title || !startAt) {
    return { error: "Le titre et la date de début sont obligatoires." };
  }

  const { data: event, error } = await supabase
    .from("calendar_events")
    .insert({
      club_id: clubId,
      team_id: String(formData.get("team_id") ?? "") || null,
      type,
      title,
      description: String(formData.get("description") ?? "") || null,
      location: String(formData.get("location") ?? "") || null,
      address: String(formData.get("address") ?? "") || null,
      start_at: new Date(startAt).toISOString(),
      end_at: endAt ? new Date(endAt).toISOString() : null,
      meeting_at: meetingAt ? new Date(meetingAt).toISOString() : null,
      created_by: user?.id,
    })
    .select("id")
    .single();

  if (error || !event) return { error: error?.message ?? "Erreur lors de la création." };

  if (type === "training") {
    await supabase.from("trainings").insert({
      event_id: event.id,
      objective: String(formData.get("objective") ?? "") || null,
    });
  }

  revalidatePath("/dashboard/calendar");
  redirect(`/dashboard/calendar/${event.id}`);
}
