import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { EVENT_TYPE_LABELS, STAFF_ROLES } from "@/lib/types";
import { AvailabilityPicker } from "./availability-picker";
import { AttendanceSheet } from "./attendance-sheet";

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const supabase = createClient();
  const { data: event } = await supabase
    .from("calendar_events")
    .select("*, teams(name)")
    .eq("id", params.id)
    .eq("club_id", activeClub.club_id)
    .single();

  if (!event) notFound();

  let playersQuery = supabase
    .from("players")
    .select("id, first_name, last_name, jersey_number, user_id")
    .eq("club_id", activeClub.club_id)
    .order("last_name");

  if (event.team_id) playersQuery = playersQuery.eq("team_id", event.team_id);
  const { data: players } = await playersQuery;

  const { data: availabilities } = await supabase
    .from("availabilities")
    .select("player_id, status, comment")
    .eq("event_id", event.id);

  const { data: attendances } = await supabase
    .from("attendances")
    .select("player_id, status, notes")
    .eq("event_id", event.id);

  const availabilityByPlayer = new Map((availabilities ?? []).map((a) => [a.player_id, a]));
  const attendanceByPlayer = new Map((attendances ?? []).map((a) => [a.player_id, a]));

  const canManage = STAFF_ROLES.includes(activeClub.role);
  const ownPlayer = players?.find((p) => p.user_id === current.user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{event.title}</h1>
        <p className="text-sm text-slate-500">
          {EVENT_TYPE_LABELS[event.type as keyof typeof EVENT_TYPE_LABELS]}
          {event.teams?.name ? ` · ${event.teams.name}` : " · Tout le club"}
        </p>
      </div>

      <div className="card space-y-1 text-sm">
        <p>
          <span className="font-medium">Début : </span>
          {new Date(event.start_at).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}
        </p>
        {event.end_at && (
          <p>
            <span className="font-medium">Fin : </span>
            {new Date(event.end_at).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}
          </p>
        )}
        {event.location && (
          <p>
            <span className="font-medium">Lieu : </span>
            {event.location}
          </p>
        )}
        {event.description && (
          <p>
            <span className="font-medium">Description : </span>
            {event.description}
          </p>
        )}
      </div>

      {ownPlayer && (
        <div className="card">
          <h2 className="mb-4 text-lg font-medium">Ma disponibilité</h2>
          <AvailabilityPicker
            eventId={event.id}
            playerId={ownPlayer.id}
            current={availabilityByPlayer.get(ownPlayer.id)}
          />
        </div>
      )}

      {canManage && (
        <div className="card">
          <h2 className="mb-4 text-lg font-medium">Feuille de présence</h2>
          <AttendanceSheet
            eventId={event.id}
            players={players ?? []}
            availabilityByPlayer={Object.fromEntries(availabilityByPlayer)}
            attendanceByPlayer={Object.fromEntries(attendanceByPlayer)}
          />
        </div>
      )}
    </div>
  );
}
