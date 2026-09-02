"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getVideoUploadUrl, createVideoRecord } from "@/lib/actions/videos";

export function NewVideoForm({
  clubId,
  teams,
  events,
}: {
  clubId: string;
  teams: { id: string; name: string }[];
  events: { id: string; title: string; start_at: string }[];
}) {
  const [title, setTitle] = useState("");
  const [teamId, setTeamId] = useState("");
  const [eventId, setEventId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Sélectionnez un fichier vidéo.");
      return;
    }
    if (!title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }

    setError(null);
    setProgressLabel("Préparation de l'envoi...");

    const contentType = file.type || "video/mp4";
    const uploadResult = await getVideoUploadUrl(clubId, file.name, contentType);

    if ("error" in uploadResult) {
      setProgressLabel(null);
      setError(uploadResult.error);
      return;
    }

    setProgressLabel("Envoi de la vidéo...");

    const uploadResponse = await fetch(uploadResult.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": contentType },
    });

    if (!uploadResponse.ok) {
      setProgressLabel(null);
      setError("Échec de l'envoi vers le stockage (code " + uploadResponse.status + ").");
      return;
    }

    setProgressLabel("Enregistrement...");

    const result = await createVideoRecord({
      clubId,
      teamId: teamId || null,
      eventId: eventId || null,
      title: title.trim(),
      storageKey: uploadResult.key,
    });

    if ("error" in result) {
      setProgressLabel(null);
      setError(result.error);
      return;
    }

    router.push(`/dashboard/videos/${result.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="title">
          Titre
        </label>
        <input
          className="input"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex : Match vs Les Aigles - 14/09"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="team_id">
            Équipe
          </label>
          <select className="input" id="team_id" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">—</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="event_id">
            Événement lié
          </label>
          <select className="input" id="event_id" value={eventId} onChange={(e) => setEventId(e.target.value)}>
            <option value="">—</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} · {new Date(e.start_at).toLocaleDateString("fr-FR")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="file">
          Fichier vidéo
        </label>
        <input
          className="input"
          id="file"
          type="file"
          accept="video/*,.mp4,.mov,.m4v,.avi,.wmv,.mkv,.webm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
        />
        <p className="mt-1 text-xs text-slate-500">
          Formats courants (MP4, MOV, WebM). Si le sélecteur de fichiers grise ta vidéo, choisis "Tous les fichiers"
          dans la fenêtre d'import de ton ordinateur.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {progressLabel && <p className="text-sm text-slate-500">{progressLabel}</p>}

      <button className="btn" type="submit" disabled={!!progressLabel}>
        {progressLabel ?? "Envoyer"}
      </button>
    </form>
  );
}
