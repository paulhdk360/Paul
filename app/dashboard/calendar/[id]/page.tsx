import { redirect, notFound } from "next/navigation";
import { sql } from "@/lib/db";
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

  const eventRows = await sql`
    select e.*, t.name as team_name
    from calendar_events e
    left join teams t on t.id = e.team_id
    where e.id = ${params.id} and e.club_id = ${activeClub.club_id}
    limit 1
  `;
  const event = eventRows[0] as any;

  if (!event) notFound();

  const players = event.team_id
    ? await sql`
        select id, first_name, last_name, jersey_number, user_id from players
        where club_id = ${activeClub.club_id} and team_id = ${event.team_id}
        order by last_name
      `
    : await sql`
        select id, first_name, last_name, jersey_number, user_id from players
        where club_id = ${activeClub.club_id}
        order by last_name
      `;

  const availabilities = await sql`
    select player_id, status, comment from availabilities where event_id = ${event.id}
  `;
  const attendances = await sql`
    select player_id, status, notes from attendances where event_id = ${event.id}
  `;

  const availabilityByPlayer = new Map((availabilities as any[]).map((a) => [a.player_id, a]));
  const attendanceByPlayer = new Map((attendances as any[]).map((a) => [a.player_id, a]));

  const canManage = STAFF_ROLES.includes(activeClub.role);
  const ownPlayer = (players as any[]).find((p) => p.user_id === current.user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{event.title}</h1>
        <p className="text-sm text-slate-500">
          {EVENT_TYPE_LABELS[event.type as keyof typeof EVENT_TYPE_LABELS]}
          {event.team_name ? ` · ${event.team_name}` : " · Tout le club"}
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
            players={players as any[]}
            availabilityByPlayer={Object.fromEntries(availabilityByPlayer)}
            attendanceByPlayer={Object.fromEntries(attendanceByPlayer)}
          />
        </div>
      )}
    </div>
  );
}
