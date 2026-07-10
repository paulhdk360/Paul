"use client";

import { useState } from "react";
import { updateClub } from "@/lib/actions/clubs";

export function ClubForm({ club, canEdit }: { club: any; canEdit: boolean }) {
  const [saving, setSaving] = useState(false);

  return (
    <form
      action={async (formData) => {
        setSaving(true);
        try {
          await updateClub(club.id, formData);
        } finally {
          setSaving(false);
        }
      }}
      className="space-y-4"
    >
      <div>
        <label className="label" htmlFor="name">
          Nom du club
        </label>
        <input className="input" id="name" name="name" defaultValue={club.name} disabled={!canEdit} required />
      </div>
      <div>
        <label className="label" htmlFor="address">
          Adresse
        </label>
        <input className="input" id="address" name="address" defaultValue={club.address ?? ""} disabled={!canEdit} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="phone">
            Téléphone
          </label>
          <input className="input" id="phone" name="phone" defaultValue={club.phone ?? ""} disabled={!canEdit} />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input className="input" id="email" name="email" defaultValue={club.email ?? ""} disabled={!canEdit} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="website">
            Site internet
          </label>
          <input className="input" id="website" name="website" defaultValue={club.website ?? ""} disabled={!canEdit} />
        </div>
        <div>
          <label className="label" htmlFor="primary_color">
            Couleur principale
          </label>
          <input
            className="input"
            id="primary_color"
            name="primary_color"
            type="color"
            defaultValue={club.primary_color ?? "#1c7a3e"}
            disabled={!canEdit}
          />
        </div>
      </div>

      {canEdit && (
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      )}
      {!canEdit && (
        <p className="text-sm text-slate-500">
          Seul un administrateur du club peut modifier ces informations.
        </p>
      )}
    </form>
  );
}
