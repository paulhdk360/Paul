"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { createEvent } from "@/lib/actions/events";
import { EVENT_TYPE_LABELS } from "@/lib/types";
import { SubmitButton } from "@/components/submit-button";

export function NewEventForm({ clubId, teams }: { clubId: string; teams: { id: string; name: string }[] }) {
  const [state, formAction] = useFormState(createEvent, undefined);
  const [type, setType] = useState("training");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="club_id" value={clubId} />

      <div>
        <label className="label" htmlFor="title">
          Titre
        </label>
        <input className="input" id="title" name="title" required autoFocus />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="type">
            Type
          </label>
          <select className="input" id="type" name="type" value={type} onChange={(e) => setType(e.target.value)}>
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="team_id">
            Équipe concernée
          </label>
          <select className="input" id="team_id" name="team_id">
            <option value="">Tout le club</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="start_at">
            Début
          </label>
          <input className="input" id="start_at" name="start_at" type="datetime-local" required />
        </div>
        <div>
          <label className="label" htmlFor="end_at">
            Fin
          </label>
          <input className="input" id="end_at" name="end_at" type="datetime-local" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="meeting_at">
          Heure de rendez-vous (si différente du début)
        </label>
        <input className="input" id="meeting_at" name="meeting_at" type="datetime-local" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="location">
            Lieu
          </label>
          <input className="input" id="location" name="location" />
        </div>
        <div>
          <label className="label" htmlFor="address">
            Adresse
          </label>
          <input className="input" id="address" name="address" />
        </div>
      </div>

      {type === "training" && (
        <div>
          <label className="label" htmlFor="objective">
            Objectif de la séance
          </label>
          <input className="input" id="objective" name="objective" />
        </div>
      )}

      <div>
        <label className="label" htmlFor="description">
          Description
        </label>
        <textarea className="input" id="description" name="description" rows={3} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SubmitButton pendingLabel="Création...">Créer l&apos;événement</SubmitButton>
    </form>
  );
}
