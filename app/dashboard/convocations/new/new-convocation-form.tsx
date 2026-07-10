"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { createConvocation } from "@/lib/actions/convocations";
import { SubmitButton } from "@/components/submit-button";

type EventOption = { id: string; title: string; start_at: string; team_id: string | null };
type PlayerOption = { id: string; first_name: string; last_name: string; team_id: string | null };

export function NewConvocationForm({
  clubId,
  events,
  players,
}: {
  clubId: string;
  events: EventOption[];
  players: PlayerOption[];
}) {
  const [state, formAction] = useFormState(createConvocation, undefined);
  const [eventId, setEventId] = useState(events[0]?.id ?? "");

  const selectedEvent = events.find((e) => e.id === eventId);
  const relevantPlayers = useMemo(
    () => players.filter((p) => !selectedEvent?.team_id || p.team_id === selectedEvent.team_id),
    [players, selectedEvent]
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="club_id" value={clubId} />

      <div>
        <label className="label" htmlFor="event_id">
          Événement
        </label>
        <select
          className="input"
          id="event_id"
          name="event_id"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          required
        >
          <option value="">—</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} · {new Date(e.start_at).toLocaleDateString("fr-FR")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="response_deadline">
          Date limite de réponse
        </label>
        <input className="input" id="response_deadline" name="response_deadline" type="datetime-local" />
      </div>

      <div>
        <label className="label" htmlFor="instructions">
          Instructions
        </label>
        <textarea className="input" id="instructions" name="instructions" rows={2} />
      </div>

      <div>
        <p className="label">Joueurs convoqués</p>
        <div className="max-h-60 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
          {relevantPlayers.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="player_ids" value={p.id} defaultChecked />
              {p.first_name} {p.last_name}
            </label>
          ))}
          {relevantPlayers.length === 0 && <p className="text-sm text-slate-500">Aucun joueur disponible.</p>}
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SubmitButton pendingLabel="Création...">Envoyer la convocation</SubmitButton>
    </form>
  );
}
